// SPDX-License-Identifier: MPL-2.0 · Copyright (c) Aurelian-Risk
// The sample study in two languages, and what may NOT differ between them.
//
// The point of this check is the second half. A translation of DATA can do what a
// translation of interface text cannot: move a value the engine matches on. `treatment.ts`
// compares the stored decision against "Accept", `dimWhen` against "out of scope",
// `calibration.ts` matches `sector` literally against its own list. None of those fail
// loudly - an accepted risk simply moves down the matrix as though a measure had acted on
// it, and a sector nobody recognises yields no rate exception. So the two studies are
// built and compared field by field, and anything that is not a `text` or `textarea` field
// has to be identical.
//
// The publisher's text is the other half: the 1000 catalogue requirements and the measures
// that carry a `framework` are the BSI's, already German, and are not ours to rewrite.
//
//   npm run test:sample
import { pathToFileURL } from "node:url";

const MOD_S = process.env.MOD_S, MOD_T = process.env.MOD_T, MOD_I = process.env.MOD_I, MOD_D = process.env.MOD_D;
if (!MOD_S || !MOD_T || !MOD_I || !MOD_D) { console.error("set MOD_S=<sample.mjs> MOD_T=<taxonomy.mjs> MOD_I=<i18n.mjs> MOD_D=<sample.de.mjs>"); process.exit(2); }
const { makeSampleStudy } = await import(pathToFileURL(MOD_S).href);
const { DEFAULT_TAXONOMY: tax } = await import(pathToFileURL(MOD_T).href);
const i18n = await import(pathToFileURL(MOD_I).href);
const { SAMPLE_DE, STUDY_DE, LOG_DE, isOurs } = await import(pathToFileURL(MOD_D).href);
const { ownRequirementsOscal } = await import(pathToFileURL(process.env.MOD_X).href);

let pass = 0, fail = 0;
const ok = (name, cond, detail) => {
  if (cond) { pass++; console.log(`✓ ${name}`); }
  else { fail++; console.log(`✗ ${name}${detail ? ` — ${detail}` : ""}`); }
};

i18n.setLanguage("en");
const en = makeSampleStudy();
i18n.setLanguage("de");
const de = makeSampleStudy();
i18n.setLanguage("en");

const typeOf = (k) => tax.entityTypes.find((t) => t.key === k);
const isText = (typeKey, fieldKey) => {
  const f = typeOf(typeKey)?.fields.find((x) => x.key === fieldKey);
  return f?.type === "text" || f?.type === "textarea";
};
// Which records may be rewritten is READ FROM THE CODE, not written here a second time.
// It was written twice, and widening it here alone left the check green while the study
// went on carrying the English sentence: a rule stated twice is a rule that can disagree.
const ours = isOurs;

// A value outside its own vocabulary cannot be read by anything: no option list answers it,
// so it prints as stored wherever a reading is shown - which is how two measures carried a
// treatment's word, "In progress", into a German report in English.
{
  const bad = [];
  for (const e of en.entities) {
    const t = typeOf(e.type);
    for (const f of t?.fields ?? []) {
      if (f.type !== "enum" || !f.options?.length) continue;
      const v = e.values[f.key];
      const vals = Array.isArray(v) ? v : v == null || v === "" ? [] : [v];
      for (const x of vals) if (!f.options.includes(x)) bad.push(`${e.type}.${f.key} = ${JSON.stringify(x)}`);
    }
  }
  ok("every value the sample sets is one its field declares", bad.length === 0,
    `${bad.length}: ` + [...new Set(bad)].slice(0, 3).join(", "));
}

ok("both studies were built", en.entities.length > 0 && de.entities.length === en.entities.length,
  `${en.entities.length} vs ${de.entities.length}`);

// ── nothing but text moved ───────────────────────────────────────────────────
// Ids are generated per run, so records are lined up by position - the builder is
// deterministic in its order, which the next assertion establishes rather than assumes.
ok("the two runs produce the same records in the same order",
  en.entities.every((e, i) => de.entities[i]?.type === e.type),
  en.entities.findIndex((e, i) => de.entities[i]?.type !== e.type));

// A reference holds an ID, and the ids are generated per run - comparing them raw reports
// every relation in the study as moved, which is the instrument and not the finding. Each
// id is therefore read as the POSITION of the record it names, which is comparable and
// still says whether a relation changed.
const posOf = (study) => new Map(study.entities.map((e, i) => [e.id, i]));
const enPos = posOf(en), dePos = posOf(de);
const norm = (v, pos) => Array.isArray(v) ? v.map((x) => pos.get(x) ?? x)
  : (typeof v === "string" && pos.has(v) ? pos.get(v) : v);

const moved = [];
en.entities.forEach((e, i) => {
  const d = de.entities[i];
  for (const k of new Set([...Object.keys(e.values), ...Object.keys(d.values)])) {
    const a = JSON.stringify(norm(e.values[k] ?? null, enPos));
    const b = JSON.stringify(norm(d.values[k] ?? null, dePos));
    if (a !== b && !isText(e.type, k)) moved.push(`${e.type}.${k}`);
  }
});
ok("no value outside a text field differs between the two languages",
  moved.length === 0, [...new Set(moved)].slice(0, 6).join(", "));

// The engine-matched values by name, so the assertion says what it is protecting even if
// the sample stops carrying one of them.
const CONTRACT = [["risk_treatment", "decision"], ["security_measure", "measure_type"],
  ["supporting_asset", "scope"], ["requirement", "scope"], ["requirement", "modal_verb"]];
const contractMoved = CONTRACT.filter(([t, f]) => {
  const a = en.entities.filter((e) => e.type === t).map((e) => e.values[f]).join("|");
  const b = de.entities.filter((e) => e.type === t).map((e) => e.values[f]).join("|");
  return a !== b;
});
ok("the values the engine matches on are untouched, by name",
  contractMoved.length === 0, contractMoved.map(([t, f]) => `${t}.${f}`).join(", "));

ok("the sector still reads as calibration.ts declares it",
  de.sector === en.sector, `${JSON.stringify(en.sector)} vs ${JSON.stringify(de.sector)}`);

// ── the publisher's text is untouched ────────────────────────────────────────
const published = [];
en.entities.forEach((e, i) => {
  if (ours(e)) return;
  const d = de.entities[i];
  for (const k of Object.keys(e.values)) {
    if (JSON.stringify(norm(e.values[k], enPos)) !== JSON.stringify(norm(d.values[k], dePos)))
      published.push(`${e.type}.${k}`);
  }
});
ok("nothing the BSI publishes was rewritten",
  published.length === 0, [...new Set(published)].slice(0, 6).join(", "));

// ── ...and the invented text HAS an entry ───────────────────────────────────
// The demand is an ENTRY, not a difference. A value that reads the same in both languages
// is real - a person's name, a date, a document number, a MITRE technique - and from the
// outside it is indistinguishable from one somebody forgot. Written out in the table it is
// a decision; missing from it, it is a gap. So the table is what is asked, and the count of
// entries that repeat is printed rather than judged.
const missing = [], repeats = [];
en.entities.forEach((e) => {
  if (!ours(e)) return;
  const words = SAMPLE_DE[`${e.type}/${e.values.name}`] ?? {};
  for (const k of Object.keys(e.values)) {
    if (!isText(e.type, k)) continue;
    const v = e.values[k];
    if (typeof v !== "string" || !v.trim()) continue;
    if (!(k in words)) missing.push(`${e.type}/${e.values.name}.${k}`);
    else if (words[k] === v) repeats.push(`${e.type}.${k}`);
  }
});
ok("every invented text has an entry in the German table",
  missing.length === 0, `${missing.length} left: ` + missing.slice(0, 4).join(", "));
console.log(`   ${repeats.length} entries read the same in both languages (names, dates, identifiers)`);

// A record the table names that the study does not carry is an entry pointing at nothing -
// invisible under the apply rule, which simply skips it.
const orphans = Object.keys(SAMPLE_DE).filter((k) =>
  !en.entities.some((e) => ours(e) && `${e.type}/${e.values.name}` === k));
ok("no entry in the table names a record the sample does not have",
  orphans.length === 0, orphans.slice(0, 3).join(", "));

// A table with an entry for everything is not a study that carries it. Both were true of
// the entry above and the German study still read English, because the rule the CODE
// applies was a second copy of the rule this file checks against.
const notApplied = [];
en.entities.forEach((e, i) => {
  const words = SAMPLE_DE[`${e.type}/${e.values.name}`];
  if (!words) return;
  for (const [k, v] of Object.entries(words)) {
    if (!isText(e.type, k) || v === e.values[k]) continue;      // an entry that repeats is not a change
    if (de.entities[i].values[k] !== v) notApplied.push(`${e.type}/${e.values.name}.${k}`);
  }
});
ok("every entry that says something different reaches the German study",
  notApplied.length === 0, `${notApplied.length}: ` + notApplied.slice(0, 3).join(", "));

ok("the study's own text is German too",
  de.name !== en.name && de.scope !== en.scope, `${de.name}`);

// ── the log, which is sealed over the values ─────────────────────────────────
// A comment translated after the seal would break the chain rather than translate it, so
// the order matters and this is where it is established.
const enUpd = en.log.filter((l) => l.kind === "update"), deUpd = de.log.filter((l) => l.kind === "update");
ok("the log carries the same edits in both languages", enUpd.length === deUpd.length,
  `${enUpd.length} vs ${deUpd.length}`);
ok("every edit comment is German", enUpd.length > 0 && enUpd.every((l, i) => deUpd[i].comment !== l.comment),
  enUpd.filter((l, i) => deUpd[i]?.comment === l.comment).map((l) => l.comment?.slice(0, 40)).join(" · "));

// The history has to agree with the record: where an edit's `to` was the value the record
// ended up with, that has to hold in German as well, or the reader sees a change into a
// text that is not there.
const drifted = [];
deUpd.forEach((l, i) => {
  for (const c of l.changes ?? []) {
    if (!isText(l.entityType, c.field)) continue;
    const enRec = en.entities.find((e) => e.id === enUpd[i].entity);
    const deRec = de.entities.find((e) => e.id === l.entity);
    if (!enRec || !deRec) continue;
    if (enUpd[i].changes?.find((x) => x.field === c.field)?.to === enRec.values[c.field]
      && c.to !== deRec.values[c.field]) drifted.push(`${l.entityType}.${c.field}`);
  }
});
ok("an edit that ended in the record's current text still does in German",
  drifted.length === 0, drifted.join(", "));

// ── and the seal still holds ─────────────────────────────────────────────────
const sealed = de.log.filter((l) => l.hash).length;
ok("the German study's log is sealed like the English one",
  sealed === en.log.filter((l) => l.hash).length && sealed > 0, `${sealed}`);

// ── what the export is called ────────────────────────────────────────────────
// A file name is the one place a study's title reaches the file system, and everything
// outside a-z0-9 used to become a hyphen: "Netzführung" was delivered as "netzf-hrung".
{
  const withGap = (study) => {
    const r = study.entities.find((e) => e.type === "requirement" && String(e.values.herkunft ?? "").startsWith("Own"));
    if (r) r.values.herkunft = "Own - asset not covered";
    return study;
  };
  const enFile = ownRequirementsOscal(tax, withGap(en))?.filename ?? "";
  const deFile = ownRequirementsOscal(tax, withGap(de))?.filename ?? "";
  ok("the German study's delivery keeps its letters in the file name",
    /netzfuehrung/.test(deFile), deFile);
  ok("...and an ASCII name is unchanged by that folding",
    /riverbend-municipal-utilities-grid-control-example/.test(enFile), enFile);
}

console.log(`\n${pass}/${pass + fail} sample assertions passed · ${fail} failed`);
process.exit(fail ? 1 : 0);
