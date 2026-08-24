// STM.2.1.6: the delivery of own requirements, and the claim that the writer is the reader
// backwards.
//
// That claim is the whole design - the field keys are the OSCAL property names, so neither
// direction needs a mapping table - and a claim like that is worth nothing unasserted. So
// this exports, reads the result back with the engine's own OSCAL reader, and compares.
//
// It also asserts the one thing the export must NOT do: carry the requirements taken on out
// of the institution's compliance environment (STM.2.1.7). Those are its contracts and its
// legal duties; .7 says nothing about delivering them, and a federal office is not their
// audience.
//
// No network. Run: npm run test:export
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const mod = (v) => pathToFileURL(resolve(process.cwd(), v)).href;
const { ownRequirementsOscal } = await import(mod(process.env.MOD_X));
const { parseOscalCatalog } = await import(mod(process.env.MOD_O));
const { DEFAULT_TAXONOMY } = await import(mod(process.env.MOD_T));

let pass = 0, fail = 0;
const ok = (name, cond, detail) => {
  if (cond) { pass++; console.log(`✓ ${name}`); }
  else { fail++; console.log(`✗ ${name}${detail ? ` — ${detail}` : ""}`); }
};

const req = (id, values) => ({ id, type: "requirement", values });

const study = {
  id: "s1", name: "Riverbend Municipal Utilities",
  entities: [
    req("a", {
      name: "Telemetry gateway logs are retained for 180 days",
      ref_id: "OWN.1", herkunft: "Own - asset not covered",
      description: "The gateway MUSS retain its logs for 180 days.",
      begruendung: "The catalogue has no requirement for a telemetry gateway of this kind.",
      modal_verb: "MUSS", sec_level: "erhöht", effort_level: 2,
      confidentiality: 0, integrity: 2, availability: 1,
      umsetzung: "nein", scope: "in scope",
      applies_to_asset: ["asset-1"],
    }),
    req("b", {
      name: "Retention follows the utilities regulation",
      ref_id: "OWN.2", herkunft: "Own - compliance obligation",
      description: "Kept for the regulator.", compliance_basis: "§ 11 EnWG",
    }),
    req("c", { name: "From the catalogue", ref_id: "ARCH.1.1", framework: "Anwenderkatalog Grundschutz++" }),
  ],
};

// ── nothing to deliver says so, rather than writing an empty document ──
const empty = ownRequirementsOscal(DEFAULT_TAXONOMY, { id: "s0", name: "Empty", entities: [] });
ok("an export with nothing behind it returns a reason, not a file",
  !!empty.nothing && /STM\.2\.1\.6/.test(empty.nothing), JSON.stringify(empty).slice(0, 90));

// ── the delivery ──
const out = ownRequirementsOscal(DEFAULT_TAXONOMY, study);
ok("own requirements produce a file", !!out.filename && !!out.text, JSON.stringify(out).slice(0, 80));
ok("...named after the study", /riverbend-municipal-utilities/.test(out.filename ?? ""), out.filename);

const doc = JSON.parse(out.text);
ok("it is an OSCAL catalog", !!doc.catalog && !!doc.catalog.uuid && doc.catalog.metadata["oscal-version"] === "1.1.3");
ok("...naming the requirement it answers", /STM\.2\.1\.6/.test(doc.catalog.metadata.remarks ?? ""));

const controls = doc.catalog.groups.flatMap((g) => g.controls ?? []);
ok("it carries the requirement written for an asset gap", controls.some((c) => c.id === "OWN.1"));
ok("it does NOT carry the compliance obligation (STM.2.1.7 names no delivery)",
  !controls.some((c) => c.id === "OWN.2"), controls.map((c) => c.id).join(", "));
ok("...and nothing from the catalogue itself", !controls.some((c) => c.id === "ARCH.1.1"));
ok("one control, no more", controls.length === 1, `${controls.length}`);

// ── the writer is the reader backwards ──
const back = parseOscalCatalog(out.text, "delivery");
const item = back.items.find((i) => i.ref_id === "OWN.1");
ok("the engine's own reader reads the delivery back", !!item);
ok("...with the title intact", item?.title === study.entities[0].values.name, item?.title);
ok("...with the requirement text as the statement",
  (item?.description ?? "").includes("180 days"), (item?.description ?? "").slice(0, 60));
ok("...with the justification carried as guidance",
  (item?.description ?? "").includes("no requirement for a telemetry gateway"));

const props = item?.props ?? {};
ok("...and every declared field back under its own key",
  props.modal_verb === "MUSS" && props.sec_level === "erhöht" && props.effort_level === "2",
  JSON.stringify(props).slice(0, 120));
ok("...including the protection goals STM.2.1.6 asks for",
  props.confidentiality === "0" && props.integrity === "2" && props.availability === "1",
  JSON.stringify({ c: props.confidentiality, i: props.integrity, a: props.availability }));
ok("relations are not written as properties, they are not the receiver's business",
  props.applies_to_asset === undefined && props.herkunft !== undefined,
  JSON.stringify(Object.keys(props)));

console.log(`\n${pass}/${pass + fail} export assertions passed · ${fail} failed`);
process.exit(fail ? 1 : 0);
