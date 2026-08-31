// SPDX-License-Identifier: MPL-2.0 · Copyright (c) Aurelian-Risk
// Does the German overlay name things this taxonomy actually has?
//
// The overlay is a table of keys, and a table of keys drifts silently: a type renamed in
// the taxonomy leaves an entry pointing at nothing, and the register goes back to English
// without anyone being told - the lookup rule is "find nothing, show what was authored",
// so a stale key is invisible by design. That is the whole reason to check it from outside.
//
// It runs WITHOUT the engine's helpers: it compares the table against the taxonomy, which
// is all it needs. When the helpers arrive, this keeps holding.
//
// It is the counterpart of scripts/words-test.mjs, which the engine owns: that one measures
// the ENGINE's table against the keys the interface declares, this one the PRODUCT's table
// against the taxonomy. Two tables, two questions, and the names were the same only because
// this file was written first and handed over.
//
//   npm run test:profilewords
import { pathToFileURL } from "node:url";

const MOD_T = process.env.MOD_T, MOD_W = process.env.MOD_W, MOD_E = process.env.MOD_E;
if (!MOD_T || !MOD_W) { console.error("set MOD_T=<taxonomy.mjs> MOD_W=<words.mjs>"); process.exit(2); }
const { DEFAULT_TAXONOMY: tax } = await import(pathToFileURL(MOD_T).href);
const { WORDS } = await import(pathToFileURL(MOD_W).href);
const WORDS_DE = WORDS.de;
// The engine's own table, to tell an overruled word from a repeated one.
const { ENGINE_WORDS } = await import(pathToFileURL(MOD_E).href);

let pass = 0, fail = 0;
const ok = (name, cond, detail) => {
  if (cond) { pass++; console.log(`✓ ${name}`); }
  else { fail++; console.log(`✗ ${name}${detail ? ` — ${detail}` : ""}`); }
};

const typeKeys = new Set(tax.entityTypes.map((t) => t.key));
const groupKeys = new Set((tax.groups ?? []).map((g) => g.key));
// The checks THIS PROFILE declares. The ones lint.ts declares are the engine's text and are
// answered from its own table; an entry for one of those here would be a second translation
// of the same sentence, drifting from the engine's at the first correction.
// dependsOn is a single declaration, not a list - hence the flatten rather than a spread.
const asList = (x) => (Array.isArray(x) ? x : x ? [x] : []);
const checkIds = new Set([tax.followUps, tax.mustState, tax.dependsOn]
  .flatMap(asList).map((c) => c.id).filter(Boolean));
const keys = Object.keys(WORDS_DE);
const anyFieldNamed = (fieldKey) =>
  tax.entityTypes.some((t) => t.fields.some((f) => f.key === fieldKey));
const fieldOf = (typeKey, fieldKey) =>
  tax.entityTypes.find((t) => t.key === typeKey)?.fields.find((f) => f.key === fieldKey);

ok("the overlay has entries at all", keys.length > 0, `${keys.length}`);

// ── every key points at something ────────────────────────────────────────────
const stale = keys.filter((k) => {
  const p = k.split(".");
  if (p[0] === "type") return !typeKeys.has(p[1]);
  if (p[0] === "group") return !groupKeys.has(p[1]);
  if (p[0] === "check") return !checkIds.has(p.slice(1, -1).join("."));
  if (p[0] === "field" && p.length === 4) return !fieldOf(p[1], p[2]);
  // The shared form names a field key without a type. It is stale when NO type declares
  // that key - a weaker statement than the type-specific form makes, and the most this key
  // can support: the point of sharing it is that it holds for every type that has the field.
  if (p[0] === "field" && p.length === 3) return !anyFieldNamed(p[1]);
  return false;                                   // field keys: not used yet
});
ok("no entry names a type, group or check this profile does not declare",
  stale.length === 0, stale.join(", "));

// `ui.` is in the scheme because a product is MEANT to be able to overrule an engine word:
// applyProductLanguage registers the engine's table first and this one after it, so the
// later registration wins per key. This method calls the report a Bericht and the change
// log an Änderungslauf, and those are its words, not the engine's.
const shape = keys.filter((k) => !/^(product\.(tagline|documentTitle)|ui\.[a-z]+\.[a-zA-Z0-9_.-]+|type\.[a-z_0-9]+\.(label|plural)|group\.[a-z]+\.(label|description)|check\.[a-z0-9-]+\.(title|hint)|field\.[a-z_0-9]+(\.[a-z_0-9]+)?\.(label|help|relation|options|scale))$/.test(k));
ok("every key follows the agreed scheme", shape.length === 0, shape.join(", "));

// An override that says what the engine already says is dead weight that reads as a
// decision. Every `ui.` key here has to differ from the engine's word for it.
const engineDe = ENGINE_WORDS.de ?? {};
const sameAsEngine = keys.filter((k) => k.startsWith("ui.") && engineDe[k] === WORDS_DE[k]);
ok("an engine word is overruled only where this method says something else",
  sameAsEngine.length === 0, sameAsEngine.join(", "));

// ── and everything shown has a word ──────────────────────────────────────────
// The other direction, which is the one a reader notices: a type added to the taxonomy and
// forgotten here shows its English label in an otherwise German register.
const missingType = [...typeKeys].flatMap((k) =>
  ["label", "plural"].filter((s) => !WORDS_DE[`type.${k}.${s}`]).map((s) => `type.${k}.${s}`));
ok("every register is named in German, singular and plural",
  missingType.length === 0, missingType.join(", "));

const missingGroup = [...groupKeys].flatMap((k) =>
  ["label", "description"].filter((s) => !WORDS_DE[`group.${k}.${s}`]).map((s) => `group.${k}.${s}`));
ok("every step of the method is named, with its lede", missingGroup.length === 0, missingGroup.join(", "));

const missingCheck = [...checkIds].flatMap((id) =>
  ["title", "hint"].filter((s) => !WORDS_DE[`check.${id}.${s}`]).map((s) => `check.${id}.${s}`));
ok("every check this profile declares is worded in German, title and hint",
  missingCheck.length === 0, missingCheck.join(", "));

// Every field a reader meets has a word - under its own type's key, or under the shared one.
const missingField = tax.entityTypes.flatMap((t) => t.fields
  .filter((f) => !WORDS_DE[`field.${t.key}.${f.key}.label`] && !WORDS_DE[`field.${f.key}.label`])
  .map((f) => `${t.key}.${f.key}`));
ok("every field is named in German, under its type or shared",
  missingField.length === 0, missingField.join(", "));

// The same for the word a REFERENCE reads with - "applies to", "acts on". `fieldRelation`
// falls back to the field's own label, so a missing one does not read as missing: it reads
// as an English word inside a German sentence, on every graph edge and in every record
// panel that names the relation. All 31 were absent when this rule was written.
const missingRelation = tax.entityTypes.flatMap((t) => t.fields
  .filter((f) => f.relation && !WORDS_DE[`field.${t.key}.${f.key}.relation`] && !WORDS_DE[`field.${f.key}.relation`])
  .map((f) => `${t.key}.${f.key}`));
ok("every declared relation has a German word", missingRelation.length === 0, missingRelation.join(", "));

// A help text is optional on a field, so the rule is narrower than for a label: a field
// that HAS one has to have a German one, under its type's key or the shared one.
const missingHelp = tax.entityTypes.flatMap((t) => t.fields
  .filter((f) => f.help && !WORDS_DE[`field.${t.key}.${f.key}.help`] && !WORDS_DE[`field.${f.key}.help`])
  .map((f) => `${t.key}.${f.key}`));
ok("every field that carries a help carries a German one",
  missingHelp.length === 0, missingHelp.slice(0, 4).join(", "));

// THE TRAP IN SHARING A KEY. A shared entry is right only while every type that declares
// that field calls it the same thing. Add a type that declares an existing key under a new
// label - `status` reading "Established" on one type and "In force" on another - and the
// shared entry quietly puts one word on both, with nothing to see: the key resolves, so the
// fallback never runs and no assertion above notices.
const sharedButDiffers = Object.keys(WORDS_DE).filter((k) => {
  const p = k.split(".");
  if (p[0] !== "field" || p.length !== 3) return false;
  // The same holds one level down for a VOCABULARY: `scope` reads "out of scope" on eight
  // types and "not in use" on the ninth, both two values long, so a shared entry would put
  // "im Geltungsbereich" on a measure and the length rule would not notice.
  const read = { label: (f) => f.label ?? "", options: (f) => (f.options ?? []).join("|"),
    scale: (f) => (f.scaleLabels ?? []).join("|") }[p[2]];
  if (!read) return false;
  // A type that differs is covered if it carries an entry of its OWN - that is what the
  // scoped key is for. Only a type that differs and has nothing scoped is reading a word
  // written for something else.
  const declaring = tax.entityTypes.flatMap((t) => t.fields.filter((f) => f.key === p[1]).map((f) => [t, f]));
  const readings = new Set(declaring.map(([, f]) => read(f)));
  if (readings.size <= 1) return false;
  return declaring.some(([t, f]) => !(`field.${t.key}.${p[1]}.${p[2]}` in WORDS_DE)
    && read(f) !== read(declaring[0][1]));
});
ok("a shared entry is shared only where every type declares the same thing",
  sharedButDiffers.length === 0, sharedButDiffers.join(", "));

// ── the words themselves ─────────────────────────────────────────────────────
const untranslated = Object.entries(WORDS_DE).filter(([k, v]) => {
  const t = tax.entityTypes.find((x) => `type.${x.key}.label` === k);
  const g = (tax.groups ?? []).find((x) => `group.${x.key}.label` === k);
  return (t && v === t.label) || (g && v === g.label);
});
// Two entries are the same word in both languages, and both on purpose: "Audit" is the
// German word as well, and the PERF step is named after the practice the BSI publishes as
// "Monitoring-Evaluation". Anything else that repeats the English is an entry someone
// started and did not finish - which the fallback would hide, because a key that resolves
// to the English is indistinguishable from a key that is missing.
const SAME_IN_BOTH = new Set(["type.audit.label", "group.perf.label"]);
ok("an entry that repeats the English is one of the two that should",
  untranslated.every(([k]) => SAME_IN_BOTH.has(k)),
  untranslated.map(([k]) => k).join(", "));

// THE LENGTH RULE, which is the one that fails silently. A list whose length does not match
// the field it names is REJECTED rather than shifted by one - the safe direction, but from
// the outside it looks exactly like a missing entry, and the interface goes back to the
// authored words with nothing said. Adding one option to an enum is enough to do it.
const wrongLength = keys.filter((k) => {
  const p = k.split(".");
  if (p[0] !== "field" || (p.length !== 3 && p.length !== 4)) return false;
  // A shared key has to be as long as EVERY field of that name, so any one of them answers
  // for the length - and two of them disagreeing is itself a reason not to share the key.
  const f = p.length === 4 ? fieldOf(p[1], p[2])
    : tax.entityTypes.flatMap((t) => t.fields).find((x) => x.key === p[1]);
  // The role is the LAST segment, not the fourth: a shared key has three. Reading p[3] here
  // left every scale entry unchecked while the assertion reported green - the failure this
  // rule exists to catch, made by the rule itself.
  const part = p[p.length - 1];
  const want = part === "options" ? f?.options?.length : part === "scale" ? (f?.scaleLabels?.length ?? 4) : null;
  return want != null && Array.isArray(WORDS_DE[k]) && WORDS_DE[k].length !== want;
});
ok("every value list is as long as the field it names, or it is silently dropped",
  wrongLength.length === 0,
  wrongLength.map((k) => `${k}: ${WORDS_DE[k].length} entries`).join(", "));

const empty = Object.entries(WORDS_DE).filter(([, v]) => typeof v === "string" && !v.trim());
ok("no entry is blank, which would show as a missing word rather than fall back",
  empty.length === 0, empty.map(([k]) => k).join(", "));

console.log(`\n${pass}/${pass + fail} overlay assertions passed · ${fail} failed`);
process.exit(fail ? 1 : 0);
