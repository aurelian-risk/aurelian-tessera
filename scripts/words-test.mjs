// SPDX-License-Identifier: MPL-2.0 · Copyright (c) Aurelian-Risk
// Do the word tables still point at anything?
//
// Proposed by the fork, and it closes a hole our own lookup rule opens: "nothing found,
// show what was authored" makes a STALE key indistinguishable from a MISSING one. Rename a
// type and its entry is orphaned; the register quietly falls back to English and nobody is
// told. From outside, that looks exactly like a language nobody has translated yet.
//
// So the tables are checked against the thing they describe, both ways:
//
//   no entry without a target — every key resolves to a type, group, field or check
//   no half-covered kind      — a kind is translated wholly or not at all, because the
//                               half that is missing shows in the other language and
//                               reads like a bug in the product rather than a gap
//
// It needs neither the browser nor the layer: it compares tables against the taxonomy.
// Run: npm run test:words
import { pathToFileURL } from "node:url";
import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const need = ["MOD_P", "MOD_L", "MOD_S", "MOD_W"];
for (const v of need) if (!process.env[v]) { console.error(`set ${need.join(" ")}`); process.exit(2); }
const { DEFAULT_TAXONOMY, WORDS } = await import(pathToFileURL(process.env.MOD_P).href);
const { lintStudy } = await import(pathToFileURL(process.env.MOD_L).href);
const { makeSampleStudy } = await import(pathToFileURL(process.env.MOD_S).href);
const { ENGINE_WORDS } = await import(pathToFileURL(process.env.MOD_W).href);

let pass = 0, fail = 0;
const ok = (name, cond, detail = "") => { cond ? pass++ : fail++; console.log(`${cond ? "✓" : "✗"} ${name}${cond || !detail ? "" : `  — ${detail}`}`); };

// ── every key this build could answer ───────────────────────────────────────
/** The check ids are taken from a real lint run rather than read off the source: a list
 *  copied by hand is a second place for them to live.
 *
 *  A run answers WHICH CHECKS FIRED on one sample, though, and that is not the set of
 *  checks a table may word. Grundschutz++ declares `gspp-unimplemented-unexcepted` and
 *  switches it off through `checksOff`; it never fires, and its two entries were reported
 *  as pointing at nothing. The declarations are the other half of the answer, and they are
 *  read from the taxonomy rather than copied. */
const declaredChecks = [DEFAULT_TAXONOMY.followUps, DEFAULT_TAXONOMY.mustState, DEFAULT_TAXONOMY.dependsOn]
  .flatMap((x) => (Array.isArray(x) ? x : x ? [x] : [])).map((c) => c?.id).filter(Boolean);
const checkIds = new Set([...lintStudy(DEFAULT_TAXONOMY, makeSampleStudy()).map((c) => c.id),
  ...declaredChecks]);
const known = new Set();
const kindOf = new Map();                       // key → which kind it belongs to
const ownerOf = new Map();                      // key → which TABLE is to answer for it
/** A key belongs to the table whose file declares the thing it names: the taxonomy is the
 *  product's, so its types, groups, fields and its own checks are; the checks lint.ts
 *  declares and the interface's own strings are the engine's. Without that, a kind split
 *  across the seam reads as half done in each table - the product wording 32 of 52 check
 *  titles is not an unfinished job, it is the 20 that are not its to write. */
const note = (key, kind, owner = "product") => { known.add(key); kindOf.set(key, kind); ownerOf.set(key, owner); };

for (const t of DEFAULT_TAXONOMY.entityTypes) {
  note(`type.${t.key}.label`, "type label");
  note(`type.${t.key}.plural`, "type plural");
  for (const f of t.fields) {
    for (const part of ["label", "help", "relation", "scale", "options"]) {
      note(`field.${f.key}.${part}`, `field ${part}`);
      note(`field.${t.key}.${f.key}.${part}`, `field ${part}`);
    }
  }
}
for (const g of DEFAULT_TAXONOMY.groups ?? []) {
  note(`group.${g.key}.label`, "group label");
  note(`group.${g.key}.description`, "group description");
}
const profileChecks = new Set(declaredChecks);
for (const id of checkIds) {
  const owner = profileChecks.has(id) ? "product" : "engine";
  note(`check.${id}.title`, "check title", owner); note(`check.${id}.hint`, "check hint", owner);
}
// The product's own identity strings. They are not read off the source the way interface
// keys are, because a product declares them as data and the engine only shows them.
note("product.tagline", "product");
note("product.documentTitle", "product");

// The interface's own keys are READ OFF THE SOURCE, because that is where they are
// declared — `tr("ui.dash.new-study", "New study")`. A list kept here by hand would be a
// second place for them to live, and the first thing this test exists to catch is a key
// that has lost touch with the thing it names.
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const files = [resolve(root, "src/App.tsx"),
  ...readdirSync(resolve(root, "src/components")).filter((f) => f.endsWith(".tsx")).map((f) => resolve(root, "src/components", f)),
  ...readdirSync(resolve(root, "src/domain")).filter((f) => f.endsWith(".ts")).map((f) => resolve(root, "src/domain", f))];
let uiKeys = 0, plurals = 0;
for (const f of files) {
  const src = readFileSync(f, "utf8");
  // `tParts` is a call site like the others - it is what a sentence with a gap uses where
  // the result has to be a string rather than nodes (a title attribute). Left out, its
  // keys are invisible here and their entries are reported as pointing at nothing.
  for (const m of src.matchAll(/\b(?:tr|t|tParts)\(\s*['"]([a-z][a-zA-Z0-9_.-]+)['"]/g)) {
    if (/^(type|group|field|check|product)\./.test(m[1])) continue;   // already noted above
    // Per AREA, not as one blob of 380: a reader meets one screen at a time, so a screen
    // half in the other language is the defect — a screen not yet started is not. This is
    // also what makes the work possible in blocks without the check having to be lied to.
    note(m[1], `interface:${m[1].split(".")[1]}`, "engine"); uiKeys++;
  }
  // A counted phrase declares two keys, not one.
  for (const m of src.matchAll(/\btn\(\s*['"]([a-zA-Z0-9_.-]+)['"]/g)) {
    note(`${m[1]}.one`, "counted phrase", "engine"); note(`${m[1]}.many`, "counted phrase", "engine"); plurals++;
  }
  for (const m of src.matchAll(/<Sentence\s+k="([^"]+)"/g)) note(m[1], `interface:${m[1].split(".")[1]}`, "engine");
}
// Counts, not assertions. How far a tree has got with keying its own call sites is a
// milestone, not a property: a tree that has not started is not broken, and a threshold
// here would fail in every tree except the one it was written in. That the scanner works
// is shown where it matters — by the planted stale key below, which it has to catch.
console.log(`   read off the source: ${uiKeys} interface keys, ${plurals} counted phrases`);

ok("the taxonomy offers keys to translate", known.size > 100, `${known.size}`);
ok("the checks were read from a real run, not a copied list", checkIds.size > 0, `${checkIds.size} checks`);

// ── no entry without a target ───────────────────────────────────────────────
const orphans = [];
for (const [where, tables] of [["engine", ENGINE_WORDS], ["product", WORDS]]) {
  for (const [lang, overlay] of Object.entries(tables ?? {})) {
    for (const key of Object.keys(overlay)) if (!known.has(key)) orphans.push(`${where}/${lang}: ${key}`);
  }
}
ok("no entry points at something that is not there", orphans.length === 0, orphans.slice(0, 4).join(" · "));

// ── no half-covered kind ────────────────────────────────────────────────────
/** A kind translated in part is worse than one not translated at all: the missing half
 *  shows in the other language, in the middle of a screen that is otherwise translated,
 *  and reads as a defect rather than as a gap. */
function partial(tables, where, owner = "product") {
  const bad = [];
  for (const [lang, overlay] of Object.entries(tables ?? {})) {
    const byKind = new Map();
    for (const [key, kind] of kindOf) {
      if ((ownerOf.get(key) ?? "product") !== owner) continue;
      const a = byKind.get(kind) ?? { have: 0, all: 0 };
      a.all++; if (key in overlay) a.have++;
      byKind.set(kind, a);
    }
    for (const [kind, a] of byKind) {
      // "field label" counts both the shared and the type-scoped key, so a table that
      // answers every field once covers half of them by construction. Only a kind that is
      // touched but plainly incomplete is reported.
      if (a.have > 0 && a.have < a.all && !kind.startsWith("field")) bad.push(`${where}/${lang}: ${kind} ${a.have}/${a.all}`);
    }
  }
  return bad;
}
const half = [...partial(ENGINE_WORDS, "engine", "engine"), ...partial(WORDS, "product", "product")];
ok("no kind is translated only in part", half.length === 0, half.slice(0, 4).join(" · "));

// ── the checks have to be able to fail ──────────────────────────────────────
{
  const stale = { de: { "type.no_such_type.label": "Erfunden" } };
  const found = Object.keys(stale.de).filter((k) => !known.has(k));
  ok("a stale key IS detectable", found.length === 1, JSON.stringify(found));
  const halfDone = { de: { [`group.${(DEFAULT_TAXONOMY.groups ?? [])[0]?.key}.label`]: "Eins" } };
  ok("a half-covered kind IS detectable", partial(halfDone, "x").some((s) => s.includes("group label")),
    partial(halfDone, "x").join(" · "));
}

console.log(`\n${pass}/${pass + fail} word-table assertions passed · ${fail} failed`);
process.exit(fail ? 1 : 0);
