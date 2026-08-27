// Does the published BSI ruleset actually land in this product's taxonomy?
//
// The engine has its own tests for reading OSCAL (test:oscal, test:corpus). This one
// asks the product question: take the BSI's catalogue as published, run it through
// catalogTargets() against the Grundschutz++ taxonomy, and check that the requirement
// records come out complete - not just title and identifier, but the security level,
// effort level and security objectives that the method needs in order to prioritise.
//
// A field renamed in the taxonomy silently stops receiving its property. That is exactly
// what this catches.
//
// Needs network; the catalogue is not stored in the repository. Run: npm run test:gspp
import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync, writeFileSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const cache = resolve(root, "node_modules/.cache/gspp");
mkdirSync(cache, { recursive: true });

const URL_CATALOG = "https://raw.githubusercontent.com/BSI-Bund/Stand-der-Technik-Bibliothek/main/control_layer/Grundschutz%2B%2B/Grundschutz%2B%2B-resolved_catalog.json";
const URL_MAP_ITGS = "https://raw.githubusercontent.com/BSI-Bund/Stand-der-Technik-Bibliothek/main/control_layer/Mappings/IT-GS2023-zu-GSpp/ITGS-to-GS%2B%2B-mapping_collection.json";

let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => { cond ? (pass++, console.log("✓", name)) : (fail++, console.log("✗", name, extra)); };

const file = resolve(cache, "gspp-catalog.json");
if (!existsSync(file) || readFileSync(file).length < 100000) {
  const res = await fetch(URL_CATALOG, { redirect: "follow" });
  if (!res.ok) { console.log("– catalogue unavailable (network or the BSI moved it)"); process.exit(0); }
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}

const entry = resolve(cache, "entry.ts");
writeFileSync(entry, `
export { parseOscalCatalog } from ${JSON.stringify(resolve(root, "src/domain/oscal"))};
export { catalogTargets } from ${JSON.stringify(resolve(root, "src/domain/catalog"))};
export { DEFAULT_TAXONOMY } from ${JSON.stringify(resolve(root, "src/profile"))};
export { GSPP_COMPONENTS } from ${JSON.stringify(resolve(root, "src/profile/gspp/components.generated"))};
export { planVocabularyUpdate } from ${JSON.stringify(resolve(root, "src/domain/vocabulary"))};
`);
execFileSync("npx", ["esbuild", entry, "--bundle", "--format=esm",
  `--outfile=${resolve(cache, "mod.mjs")}`, "--log-level=error"], { cwd: root });
const { parseOscalCatalog, catalogTargets, DEFAULT_TAXONOMY, GSPP_COMPONENTS, planVocabularyUpdate } =
  await import(pathToFileURL(resolve(cache, "mod.mjs")).href);

const fw = parseOscalCatalog(readFileSync(file, "utf8"), "Grundschutz++");
const target = catalogTargets(DEFAULT_TAXONOMY).find((t) => t.kind === "requirement");
ok("the taxonomy offers a requirement target at all", !!target);
if (!target) process.exit(1);

const records = fw.items.map((it) => target.toValues(fw, it));

ok("the whole ruleset becomes requirement records", records.length === 1000, `${records.length}`);
ok("every record has a title and an identifier",
  records.every((r) => String(r.name ?? "").trim() && String(r.ref_id ?? "").trim()));
ok("every record keeps its requirement text",
  records.every((r) => String(r.description ?? "").trim().length > 20),
  `${records.filter((r) => String(r.description ?? "").trim().length <= 20).length} without`);

// The properties the method depends on. Each is asserted separately: a rename in the
// taxonomy takes out exactly one of them, and the failure should say which.
const set = (r, k) => r[k] !== undefined && r[k] !== "" && r[k] !== null;
const filled = (k, rs = records) => rs.filter((r) => set(r, k)).length;
for (const k of ["modal_verb", "sec_level", "effort_level"]) {
  ok(`every record carries ${k}`, filled(k) === records.length, `${filled(k)}/${records.length} - is a field named "${k}" still declared?`);
}

// The security objectives are stated for the organisational and technical practices and
// left off the six methodological ones (GC, STM, UMS, VRB, PERF, RISK) - those govern the
// ISMS process rather than acting on the confidentiality or integrity of a target object.
// Asserting the split rather than "all of them" is what makes this test say something.
const METHODOLOGY = ["GC", "STM", "UMS", "VRB", "PERF", "RISK"];
const practiceOf = (r) => String(r.ref_id ?? "").split(".")[0];
const method = records.filter((r) => METHODOLOGY.includes(practiceOf(r)));
const applied = records.filter((r) => !METHODOLOGY.includes(practiceOf(r)));
ok("the ruleset splits into 99 methodological and 901 applied requirements",
  method.length === 99 && applied.length === 901, `${method.length} / ${applied.length}`);
for (const k of ["confidentiality", "integrity", "availability"]) {
  ok(`every applied requirement carries ${k}`, filled(k, applied) === applied.length,
    `${filled(k, applied)}/${applied.length} - is a field named "${k}" still declared?`);
}
// ASST.5.1 is the single applied requirement the BSI states no authenticity value for.
ok("authenticity is stated for all applied requirements but one",
  filled("authenticity", applied) === applied.length - 1, `${filled("authenticity", applied)}/${applied.length}`);
ok("methodological requirements carry no security objectives",
  method.every((r) => !set(r, "confidentiality")), `${filled("confidentiality", method)} do`);
ok("most records name their elementary threats", filled("threats") > records.length * 0.5,
  `${filled("threats")}/${records.length}`);

// Coerced to the field's type rather than left as catalogue text.
ok("the effort level arrives as a number, not a string",
  records.every((r) => typeof r.effort_level === "number" && r.effort_level >= 0 && r.effort_level <= 5),
  JSON.stringify(records.find((r) => typeof r.effort_level !== "number")?.effort_level));
ok("the security objectives arrive as numbers 0-2",
  applied.every((r) => [0, 1, 2].includes(r.confidentiality)));

// Values must be inside the vocabularies the taxonomy declares, or the editor will show
// a value it cannot offer.
const type = target.type;
const optionsOf = (k) => type.fields.find((f) => f.key === k)?.options ?? [];
for (const k of ["modal_verb", "sec_level"]) {
  const opts = optionsOf(k);
  const bad = [...new Set(records.map((r) => r[k]).filter((v) => v && !opts.includes(v)))];
  ok(`every ${k} is one the taxonomy declares`, bad.length === 0, `not declared: ${bad.join(", ")}`);
}

// A UUID with no use here. Leaving it undeclared is how a property is meant to be ignored.
ok("an undeclared property is dropped rather than smuggled in",
  records.every((r) => !("alt-identifier" in r)));

const one = records.find((r) => r.ref_id === "BER.1.1");
ok("BER.1.1 is complete", !!one && one.modal_verb === "MUSS" && one.sec_level === "normal-SdT"
  && one.effort_level === 0 && String(one.description).includes("Berechtigung MUSS"),
  JSON.stringify(one && { modal_verb: one.modal_verb, sec_level: one.sec_level, effort_level: one.effort_level }));

// ── The practice, taken from the catalogue's own grouping ────────────────
// The practice is not a property of a requirement; it is the group the requirement sits
// in. The field declares "@groups", which is what makes it arrive at all.
ok("every record names the practice it belongs to", filled("praktik") === records.length,
  `${filled("praktik")}/${records.length} - does the praktik field still declare vocabulary: "@groups"?`);
const praktikOpts = optionsOf("praktik");
const badPraktik = [...new Set(records.map((r) => r.praktik).filter((v) => v && !praktikOpts.includes(v)))];
ok("every practice is one the taxonomy declares", badPraktik.length === 0, `not declared: ${badPraktik.join(", ")}`);
ok("the practice agrees with the identifier prefix",
  records.every((r) => String(r.praktik ?? "").split(" ")[0] === practiceOf(r)),
  JSON.stringify(records.find((r) => String(r.praktik ?? "").split(" ")[0] !== practiceOf(r))?.ref_id));

// ── Which target objects a requirement applies to ────────────────────────
// This is the published half of the modelling step: the BSI states, per requirement, the
// object categories it applies to. Dropping it means deriving by hand what is already
// written down. The methodological practices carry none - they hold whatever the
// institution runs.
const withCats = records.filter((r) => set(r, "target_object_categories"));
ok("the target-object categories arrive with the requirements", withCats.length === 636,
  `${withCats.length}/1000 - is a field named "target_object_categories" still declared?`);
ok("...on applied requirements, not on the methodological ones",
  withCats.every((r) => !METHODOLOGY.includes(practiceOf(r))));
const declaredCats = DEFAULT_TAXONOMY.entityTypes.find((t) => t.key === "supporting_asset")
  ?.fields.find((f) => f.key === "asset_type")?.options ?? [];
const usedCats = [...new Set(withCats.flatMap((r) => String(r.target_object_categories).split(",").map((s) => s.trim())))];
ok("every category used is one the Zielobjekt field offers",
  usedCats.every((c) => declaredCats.includes(c)),
  `not offered: ${usedCats.filter((c) => !declaredCats.includes(c)).join(", ")}`);

// ── What a requirement depends on ────────────────────────────────────────
// UMS.1.1 makes the catalogue's own edges binding: a requirement counts as implemented
// only when it and everything it rests on are. The edges are stated as OSCAL links, which
// nothing reads unless the field is declared - so this is the check that they arrive.
const withDeps = records.filter((r) => set(r, "required"));
const depEdges = withDeps.flatMap((r) => String(r.required).split(",").map((s) => s.trim()).filter(Boolean));
ok("the dependencies between requirements arrive", withDeps.length === 59,
  `${withDeps.length} requirements with a dependency - is a field named "required" still declared?`);
ok("...with every edge the catalogue states", depEdges.length === 67, `${depEdges.length} edges`);
const ids = new Set(records.map((r) => String(r.ref_id)));
ok("...and every one of them names a requirement of this catalogue",
  depEdges.every((d) => ids.has(d)), `unresolved: ${depEdges.filter((d) => !ids.has(d)).join(", ")}`);
const relEdges = records.flatMap((r) => String(r.related ?? "").split(",").map((s) => s.trim()).filter(Boolean));
ok("...and the weaker relation is carried in a field of its own", relEdges.length === 210, `${relEdges.length} related edges`);
const gc21 = records.find((r) => r.ref_id === "GC.2.1");
ok("...not folded into the binding one", String(gc21?.related ?? "") === "GC.2.2" && !set(gc21, "required"),
  `related=${gc21?.related} required=${gc21?.required}`);
ok("GC.7.2 depends on the protection need being set, as published",
  String(records.find((r) => r.ref_id === "GC.7.2")?.required ?? "").split(",").map((x) => x.trim()).sort().join(",")
  === "GC.12.1,GC.7.1.2");

// ── Checking against the very catalogue this build was made from ─────────
// The right answer is "nothing to do". A field that declares where its values come from
// but holds no list of its own - a requirement's target-object categories, its open
// parameters - has nothing to refresh, and comparing against its absent options used to
// report every published value as new on every single check.
{
  const changes = planVocabularyUpdate(DEFAULT_TAXONOMY, fw, []);
  ok("checking against the catalogue this build carries reports nothing",
    changes.length === 0, changes.map((c) => `${c.fieldKey}: ${c.current.length} -> ${c.merged.length}`).join(", "));
}

// ── The migration path, as the BSI publishes it ──────────────────────────
// An institution arriving from the 2023 compendium has a body of work behind it. The BSI
// states the correspondence itself; the only thing that can go wrong on our side is the
// join, so this is the check that the mapping's target identifiers are this catalogue's.
{
  const mapFile = resolve(cache, "map-itgs.json");
  if (!existsSync(mapFile) || readFileSync(mapFile).length < 100000) {
    const res = await fetch(URL_MAP_ITGS, { redirect: "follow" });
    if (res.ok) writeFileSync(mapFile, Buffer.from(await res.arrayBuffer()));
  }
  if (existsSync(mapFile)) {
    const mc = JSON.parse(readFileSync(mapFile, "utf8"))["mapping-collection"];
    const entries = (mc?.mappings ?? []).flatMap((m) => m.maps ?? []);
    ok("the mapping from the 2023 compendium is readable", entries.length > 1000, `${entries.length} entries`);
    const rels = new Set(entries.map((e) => e.relationship).filter(Boolean));
    ok("...and states how close each correspondence is, not merely that there is one",
      rels.has("equal-to") && rels.has("subset-of") && rels.size >= 4, [...rels].join(", "));
    const targets = [...new Set(entries.flatMap((e) => (e.targets ?? []).map((t) => t["id-ref"])).filter(Boolean))];
    const known = new Set(records.map((r) => String(r.ref_id)));
    // The collection maps onto TWO catalogues - the Kernel, which is what a user works
    // to, and the method catalogue. A handful of its targets are therefore requirements
    // this catalogue does not carry. That is the publisher's structure, not a bad join:
    // what would be a bad join is the share falling away.
    const unresolved = targets.filter((t) => !known.has(t));
    ok("the mapping's targets are this catalogue's requirements, bar the methodological ones",
      unresolved.length <= 20 && targets.length - unresolved.length >= 300,
      `${targets.length - unresolved.length} of ${targets.length} resolve; open: ${unresolved.slice(0, 4).join(", ")}`);
    ok("...and it reaches a substantial part of the ruleset",
      targets.length > 250 && targets.length < 1000, `${targets.length} of ${records.length}`);
  }
}

// ── What the BSI publishes as implementing its requirements ──────────────
// Six component definitions, discovered from the repository rather than listed here, and
// what they say is carried as a relation: the identifiers they name are the catalogue's.
{
  const mt = catalogTargets(DEFAULT_TAXONOMY).find((t) => t.kind === "measure");
  ok("the measure side of the taxonomy is offered", !!mt);
  if (mt) {
    const vals = GSPP_COMPONENTS.items.map((it) => mt.toValues(GSPP_COMPONENTS, it));
    ok("every published implementation says which library it came from",
      vals.every((v) => v.framework === GSPP_COMPONENTS.name), String(vals[0]?.framework));
    ok("...and under which name", vals.every((v) => String(v.ref_id ?? "").trim() !== ""));
    ok("...without repeating that in the description",
      vals.every((v) => !/\(Grundschutz\+\+ implementations/.test(String(v.description ?? ""))));
    const withNotes = vals.filter((v) => /What it does for each requirement:/.test(String(v.description ?? "")));
    ok("what it does for each requirement is listed, one to a line", withNotes.length >= 20, `${withNotes.length} of ${vals.length}`);
    // One reference in the published components resolves to nothing in this catalogue, so
    // it keeps its identifier - rewriting it would name a requirement that is not there.
    const stillUuid = vals.filter((v) => /_[0-9a-f]{8}-[0-9a-f]{4}/.test(String(v.description ?? "")));
    ok("...naming the requirement as the catalogue does, bar the one that resolves to nothing",
      stillUuid.length <= 1, `${stillUuid.length} components still name a UUID`);
  }
}

// ── The vocabulary baked into this build against the published one ───────// ── The vocabulary baked into this build against the published one ───────
// The lists in vocabulary.generated.ts were derived from the BSI's namespace files by
// `npm run vocab:sync`. This is the check that they still match the ruleset as published:
// a build whose vocabulary has drifted offers values the catalogue no longer uses, or
// fails to offer ones it does, and nothing else would say so.
const groupLabels = [...new Set(fw.items.map((it) => String(it.section ?? "").split(" / ")[0]).filter(Boolean))]
  .filter((g) => !/^EXMP\b/.test(g));
ok("the practices this build offers are the ones the catalogue is organised by",
  groupLabels.length === praktikOpts.length && groupLabels.every((g) => praktikOpts.includes(g)),
  `catalogue ${groupLabels.length}, taxonomy ${praktikOpts.length}: ${groupLabels.filter((g) => !praktikOpts.includes(g)).join(", ")}`);
ok("the target-object categories this build offers cover everything the catalogue applies",
  usedCats.every((c) => declaredCats.includes(c)) && declaredCats.length === 39,
  `taxonomy ${declaredCats.length}, used ${usedCats.length}`);
for (const [k, field] of [["modal_verb", "modal_verb"], ["sec_level", "sec_level"]]) {
  const used = [...new Set(records.map((r) => r[k]).filter(Boolean))];
  ok(`the ${k} values this build offers are the ones in use`,
    used.every((v) => optionsOf(field).includes(v)) && optionsOf(field).length === used.length,
    `taxonomy ${optionsOf(field).join("/")}, catalogue ${used.join("/")}`);
}

// ── What implements a requirement ────────────────────────────────────────
// The BSI publishes component definitions beside the catalogue: what a named thing
// implements, referenced by the control's UUID rather than by its readable identifier.
// That UUID is the join key - which is why alt-identifier is carried after all.
{
  {
    const fw2 = GSPP_COMPONENTS;
    ok("the published implementations are in the build", fw2.items.length === 35, `${fw2.items.length} components`);
    const refs = fw2.items.flatMap((i) => (i.props?.implements ?? "").split(",").map((x) => x.trim()).filter(Boolean));
    // A count of what the publisher publishes, not of what this build does - so it is a
    // measurement with a date on it, and a change here means they moved rather than we broke.
    // 304 on 2026-08-20; 289 on 2026-08-26, when the component definitions were republished.
    // The resolution itself is the assertion below, and it held across the change.
    ok("the published implementations name 289 requirements between them", refs.length === 289, `${refs.length}`);
    const known = new Set(records.map((r) => r.ref_id));
    const unknown = [...new Set(refs.filter((r) => !known.has(r)))];
    ok("...and every one of them names a requirement of this catalogue", unknown.length === 0,
      `not in the catalogue: ${unknown.slice(0, 4).join(", ")}`);
    ok("the requirement's own identifier is kept, because it is the join key",
      records.every((r) => typeof r["alt-identifier"] === "undefined"),
      "the taxonomy declares no field for it, so it must not arrive on a record");
  }
}

// ── What the institution has to fill in ──────────────────────────────────
// STM.5.1: selected requirements carry blanks for the institution - a period, a role, a
// standard. Read as they stand, those blanks are OSCAL markup in the middle of a sentence.
{
  const withParams = records.filter((r) => set(r, "params"));
  ok("the parameters a requirement leaves open arrive with it", withParams.length === 208,
    `${withParams.length} - does a field declare vocabulary: "@params"?`);
  ok("no requirement text still carries the insert markup",
    records.every((r) => !/\{\{\s*insert/.test(String(r.description ?? ""))),
    JSON.stringify(records.find((r) => /\{\{/.test(String(r.description ?? "")))?.ref_id));
  ok("an open parameter reads as a suggestion inside the sentence",
    records.some((r) => /«/.test(String(r.description ?? ""))));
  const one = records.find((r) => r.ref_id === "UMS.1.1");
  ok("UMS.1.1 states the period it leaves open", String(one?.params ?? "").includes("regelmäßig"),
    JSON.stringify(one?.params));
}

// ── Reading language ─────────────────────────────────────────────────────
// The BSI publishes this ruleset in German only, so the values are German and stay that
// way. What the interface SHOWS is English, per option. A term arriving from a newer
// catalogue with no English wording shows in German - visible, not silently wrong - and
// this is where it is reported.
{
  const labelled = (typeKey, fieldKey) => {
    const f = DEFAULT_TAXONOMY.entityTypes.find((t) => t.key === typeKey)?.fields.find((x) => x.key === fieldKey);
    if (!f?.options) return { missing: ["field not found"], n: 0 };
    const missing = f.options.filter((o, i) => !f.optionLabels?.[i] || f.optionLabels[i] === o);
    return { missing, n: f.options.length };
  };
  // A term that is the same word in English is not an untranslated one.
  for (const [t, k, allowSame] of [["supporting_asset", "asset_type", ["Outsourcing"]], ["requirement", "praktik", []],
    ["requirement", "sec_level", []], ["business_asset", "protection_need", ["normal"]]]) {
    const { missing, n } = labelled(t, k);
    const open = missing.filter((m) => !allowSame.includes(m));
    ok(`every ${t}.${k} value reads in English (${n})`, open.length === 0, `untranslated: ${open.join(", ")}`);
  }
}

console.log(`\n${pass}/${pass + fail} Grundschutz++ catalogue assertions passed · ${fail} failed`);
process.exit(fail ? 1 : 0);
