// SPDX-License-Identifier: MPL-2.0 · Copyright (c) Aurelian-Risk
// STM.2.1.6, the closing step: own requirements, delivered to the BSI.
//
// The publisher's own words, from BSI-Methodik-Grundschutz++: "Diese werden als fester
// Bestandteil in das Anforderungspaket integriert und dem BSI zugestellt." Writing a
// requirement yourself is not finished when it is in the package; it is finished when the
// office that publishes the catalogue has it, because the gap it fills is a gap in theirs.
//
// ONLY the requirements written because the catalogue reaches an asset with nothing, which
// is what STM.2.1.6 is about. NOT the ones taken on out of the institution's own compliance
// environment (STM.2.1.7): those are its contracts and its legal duties, .7 says nothing
// about delivering anything, and an export that quietly swept them up would send an
// institution's private obligations to a federal office. Measured in the method catalogue,
// not assumed: the sentence about delivery appears in .6 and in no other requirement.
//
// The writer is the reader backwards. `src/domain/oscal.ts` reads a control into a
// FrameworkItem, and the catalogue import writes each property into the field of the same
// name - the field keys ARE the OSCAL property names, which is why the import needs no
// mapping step. So the export needs none either: every declared field that carries a value
// and is not a relation goes back out under its own key. A field added to the taxonomy
// tomorrow is exported without this file being touched.
import type { EntityRecord, EntityTypeDef, Study, Taxonomy } from "../../domain/types";

/** The origin that means "written because the catalogue reaches this asset with nothing". */
const ASSET_GAP = "Own - asset not covered";

/** Fields the reader maps by position rather than by property name, so the writer has to
 *  put them back where they came from instead of into `props`. */
const STRUCTURAL = new Set(["name", "ref_id", "framework", "category", "description", "begruendung"]);

const text = (r: EntityRecord, key: string): string => {
  const v = r.values[key];
  return v == null ? "" : String(v).trim();
};

/** An identifier OSCAL accepts, from the one the institution gave the requirement. */
function controlId(r: EntityRecord, i: number): string {
  const given = text(r, "ref_id").replace(/\s+/g, "-").replace(/[^\w.-]/g, "");
  return given || `own-${String(i + 1).padStart(3, "0")}`;
}

function controlOf(type: EntityTypeDef, r: EntityRecord, i: number) {
  const id = controlId(r, i);
  const props: { name: string; value: string }[] = [];
  for (const f of type.fields) {
    if (f.type === "ref" || f.type === "multiref" || STRUCTURAL.has(f.key)) continue;
    const v = text(r, f.key);
    if (v) props.push({ name: f.key, value: v });
  }
  const parts: { id: string; name: string; prose: string }[] = [];
  const statement = text(r, "description");
  if (statement) parts.push({ id: `${id}_smt`, name: "statement", prose: statement });
  // The justification the method asks for - "nachvollziehbar zu begründen, warum die
  // Anforderungen aus dem GS++ nicht ausreichen" - is what the receiving office needs in
  // order to judge whether the gap is theirs. It travels as guidance, not as a property.
  const guidance = text(r, "begruendung");
  if (guidance) parts.push({ id: `${id}_gdn`, name: "guidance", prose: guidance });

  return {
    id,
    title: text(r, "name") || id,
    ...(props.length ? { props } : {}),
    ...(parts.length ? { parts } : {}),
  };
}

const uuid = (): string => {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  // A build without randomUUID still has to produce a well-formed document.
  return "00000000-0000-4000-8000-" + String(Date.now()).padStart(12, "0").slice(-12);
};

/** The delivery, or a sentence saying why there is nothing to deliver. */
export function ownRequirementsOscal(
  tax: Taxonomy, study: Study,
): { filename: string; text: string } | { nothing: string } {
  const type = tax.entityTypes.find((t) => t.key === "requirement");
  if (!type) return { nothing: "this taxonomy declares no requirements" };

  const own = study.entities.filter(
    (e) => e.type === "requirement" && text(e, "herkunft") === ASSET_GAP);
  if (!own.length) {
    return { nothing: "nothing to deliver yet - no requirement of your own for an asset the catalogue does not reach (STM.2.1.6)" };
  }

  const now = new Date().toISOString();
  const doc = {
    catalog: {
      uuid: uuid(),
      metadata: {
        title: `Eigene Anforderungen - ${study.name}`,
        "last-modified": now,
        version: now.slice(0, 10),
        "oscal-version": "1.1.3",
        remarks: "Requirements written by the institution for assets the Anwenderkatalog"
          + " Grundschutz++ reaches with no requirement of its own (STM.2.1.6). Each states"
          + " why the catalogue does not suffice, in its guidance.",
      },
      groups: [{
        id: "OWN",
        title: "Aufgrund anforderungsloser Assets (STM.2.1.6)",
        controls: own.map((r, i) => controlOf(type, r, i)),
      }],
    },
  };

  const slug = (study.name || "study").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return { filename: `${slug || "study"}-eigene-anforderungen.json`, text: JSON.stringify(doc, null, 2) + "\n" };
}
