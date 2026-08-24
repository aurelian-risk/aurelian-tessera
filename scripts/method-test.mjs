// Measures this build against the BSI's method catalogue, requirement by requirement.
//
// `test:gspp` checks that the ANWENDERKATALOG arrives complete - the thousand requirements a
// user works to. This one checks the other catalogue: BSI-Methodik-Grundschutz++, the 95
// requirements that say how the method is to be run. Conformance to those is a claim this
// product makes in docs/method-conformance.md and in its checks, and a claim nobody
// re-measures is a claim that quietly ages.
//
// What it does NOT do is judge whether an answer is good - that is a reading, and it is
// written down in docs/method-conformance.md. What it does is refuse to let a requirement
// pass unmentioned: every MUSS of the method catalogue has to appear somewhere in this
// repository, or it is named here as unaddressed.
//
// Needs the network, like test:gspp. Run: npm run test:method
import { readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = "https://raw.githubusercontent.com/BSI-Bund/Stand-der-Technik-Bibliothek/main/"
  + "control_layer/Grundschutz%2B%2B/sources/catalogs/Methodik-Grundschutz%2B%2B/"
  + "BSI-Methodik-Grundschutz%2B%2B-catalog.json";

let pass = 0, fail = 0;
const ok = (name, cond, detail) => {
  if (cond) { pass++; console.log(`✓ ${name}`); }
  else { fail++; console.log(`✗ ${name}${detail ? ` — ${detail}` : ""}`); }
};

// ── the method catalogue, as published ──────────────────────────────────
const res = await fetch(SRC);
if (!res.ok) { console.error(`could not fetch the method catalogue: HTTP ${res.status}`); process.exit(2); }
const doc = JSON.parse(await res.text());
const cat = doc.catalog;

const controls = [];
const walk = (node) => {
  for (const c of node.controls ?? []) { controls.push(c); walk(c); }
  for (const g of node.groups ?? []) walk(g);
};
walk(cat);

const verbOf = (c) => {
  const st = (c.parts ?? []).find((p) => p.name === "statement");
  const p = (st?.props ?? []).find((x) => x.name === "modal_verb");
  if (p) return p.value;
  const prose = st?.prose ?? "";
  return /\bMUSS\b/.test(prose) ? "MUSS" : /\bSOLLTE\b/.test(prose) ? "SOLLTE" : /\bKANN\b/.test(prose) ? "KANN" : "";
};

console.log(`Method catalogue ${cat.metadata?.version ?? "?"} — ${controls.length} requirements\n`);
ok("the method catalogue is the one this product was measured against", controls.length === 95,
  `${controls.length} requirements, expected 95`);

const byVerb = {};
for (const c of controls) byVerb[verbOf(c)] = (byVerb[verbOf(c)] ?? 0) + 1;
console.log(`  MUSS ${byVerb.MUSS ?? 0} · SOLLTE ${byVerb.SOLLTE ?? 0} · KANN ${byVerb.KANN ?? 0}`
  + (byVerb[""] ? ` · no modal verb ${byVerb[""]}` : "") + "\n");

// ── what this repository says about them ────────────────────────────────
// Every place a decision about the method is recorded: the conformance document, the scope,
// the profile (checks carry the requirement they answer in a comment), and the roadmap.
const READ = [
  "docs/method-conformance.md", "docs/scope.md", "ROADMAP.md",
  "src/profile/gspp/taxonomy.ts", "src/profile/gspp/sample.ts", "src/profile/gspp/terms.ts",
];
let corpus = "";
for (const f of READ) {
  try { corpus += readFileSync(join(root, f), "utf8") + "\n"; } catch { /* absent is fine */ }
}
// The e2e drives this product and names the requirements it checks.
try { corpus += readFileSync(join(root, "scripts/e2e.mjs"), "utf8"); } catch { /* … */ }

/** An identifier is mentioned if it appears as itself and not merely as a prefix of a
 *  longer one: STM.2.1 must not be satisfied by a sentence that only names STM.2.1.4. */
const mentions = (id) => new RegExp(`${id.replace(/\./g, "\\.")}(?![\\d.])`).test(corpus);

const unaddressed = controls.filter((c) => !mentions(c.id));
const unaddressedMuss = unaddressed.filter((c) => verbOf(c) === "MUSS");

// A ratchet, not a pass mark. Every MUSS of the method catalogue is now named somewhere -
// which says the reading has been written down in docs/method-conformance.md, not that the
// product carries all of it: many are duties of the INSTITUTION rather than things software
// can hold, and "Errichtung und Aufrechterhaltung eines ISMS" is not a feature. What this
// asserts is that coverage does not fall: a requirement that was addressed must not quietly
// stop being addressed. The 13 still named nowhere are all SOLLTE.
const ADDRESSED_MUSS = 76;   // measured 2026-08-23 against catalogue 2026-08-20, all 76
const coveredMuss = (byVerb.MUSS ?? 0) - unaddressedMuss.length;
ok(`the MUSS requirements this product addresses do not decrease (${coveredMuss}/${byVerb.MUSS ?? 0})`,
  coveredMuss >= ADDRESSED_MUSS,
  `${coveredMuss} addressed, was ${ADDRESSED_MUSS} - which stopped being named?`);

if (unaddressed.length) {
  console.log(`\n  ${unaddressed.length} of ${controls.length} are named nowhere in this repository`
    + " - see docs/method-conformance.md for how far the reading has been written down:");
  for (const c of unaddressed) console.log(`    ${verbOf(c).padEnd(6)} ${c.id.padEnd(12)} ${c.title}`);
}

// ── the four risk triggers, in the publisher's words ────────────────────
// GC.7.2 and STM.4.1 are the entry to the risk consideration, and this product turns them
// into declared checks. If the publisher rewords them, the checks are the last thing to
// notice, so the sentence itself is asserted rather than a memory of it. The sentence that
// leaves the risk method open sits in GC.7.2, not in STM.4.1 - measured, having first
// looked in the wrong one.
const risk = controls.find((c) => c.id === "GC.7.2");
const riskProse = ((risk?.parts ?? []).map((p) => p.prose ?? "").join(" ") || "");
ok("GC.7.2 still leaves the risk method to the institution",
  /ISO\s?27005|ISO\s?31000|200-3/.test(riskProse),
  "the guidance no longer names ISO 27005 / ISO 31000 / BSI 200-3 - re-read it");

const gc71 = controls.find((c) => c.id === "GC.7.1");
const gc71Prose = ((gc71?.parts ?? []).map((p) => p.prose ?? "").join(" ") || "");
ok("GC.7.1 still knows two protection needs, not three",
  /„?normal(“|")?/.test(gc71Prose) && /hoch/.test(gc71Prose) && !/sehr\s+hoch/.test(gc71Prose),
  "a third level appeared, or the wording changed - the taxonomy declares two");

// ── STM.2.1.6: what an own requirement owes ─────────────────────────────
const own = controls.find((c) => c.id === "STM.2.1.6");
const ownProse = ((own?.parts ?? []).map((p) => p.prose ?? "").join(" ") || "");
ok("STM.2.1.6 still asks own requirements to name the protection goals",
  /Schutzziele/.test(ownProse) && /Vertraulichkeit/.test(ownProse) && /Integrität/.test(ownProse) && /Verfügbarkeit/.test(ownProse),
  "the guidance changed - the check requires confidentiality, integrity and availability");
ok("...and still says they are delivered to the BSI",
  /dem BSI zugestellt/.test(ownProse),
  "the delivery sentence is gone - the export is built for it");

console.log(`\n${pass + fail === 0 ? 0 : pass}/${pass + fail} method assertions passed · ${fail} failed`);
process.exit(fail ? 1 : 0);
