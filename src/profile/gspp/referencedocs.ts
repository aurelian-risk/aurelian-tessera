// SPDX-License-Identifier: MPL-2.0 · Copyright (c) Aurelian-Risk
// The reference documents, A.0-A.6, filled from this study.
//
// Grundschutz++ defines no such set. Measured in the method catalogue: "Referenzdokument"
// occurs 0 times, "Zertifikat" 0 times, "Prüfschema" 0 times; "Zertifizierung" occurs
// twice and both times in passing (STM.2.1.5 wants a justification recorded "um
// Nachvollziehbarkeit bei einem späteren Audit bzw. Zertifizierung zu sichern", PERF.3.1
// names external audits "z. B. für Zertifizierungen"). Neither says what is submitted.
//
// So the set here is the published one of the CLASSIC certification - ISO 27001 on the
// basis of IT-Grundschutz - and the document says so in its first sentence. Inventing
// seven documents and putting them out under Grundschutz++ names would state something the
// BSI has not; taking a set the BSI did publish, naming it as that set, states nothing.
//
// What is missing is the packaging, not the content: all seven documents have their
// registers in this taxonomy, and A.1 and A.2 are the same register read twice - the
// objects, then their protection need - which is what registerMarkdown's `fields` is for.
//
// The security concept stays what the report writes. This is a second shape of the same
// content, offered from the same menu, for a reader who expects those seven names.
import { documentCredits, registerMarkdown } from "../../domain/clipboard";
import type { EntityRecord, Study, Taxonomy } from "../../domain/types";
import { shortVersion } from "../../domain/vocabulary";

/** When the publisher's library was last read for a Grundschutz++ certification scheme.
 *  ROADMAP.md §2 re-checks it at each `npm run sync`; the two say the same date or one of
 *  them is stale. */
const MEASURED = "2026-08-23";

type Part = { type: string; fields?: string[] };
type Doc = { id: string; title: string; english: string; note: string; parts: Part[] };

/** The seven, in the publisher's order, each naming the registers it reads.
 *
 *  The titles are the BSI's own and stay as published, with the English reading beside
 *  them - the way the BSI itself writes "Vertraulichkeit (Confidentiality)" where it wants
 *  both. A translated document name is not the document an auditor asked for. */
const DOCS: Doc[] = [
  {
    id: "A.0", title: "Leitlinie zur Informationssicherheit", english: "Information security policy",
    note: "The policy, its objectives, the strategy behind it, and the management authorisation it draws its force from (GC.5).",
    parts: [{ type: "leitlinie" }],
  },
  {
    id: "A.1", title: "Strukturanalyse", english: "Structure analysis",
    note: "The business processes and the assets that carry them, with the interfaces out of the information domain (STM.1, GC.7.1.1).",
    parts: [
      // The processes WITHOUT their protection need: that is A.2, and printing it here
      // would make the two documents restate each other.
      { type: "business_asset", fields: ["description", "asset_type", "verantwortlich", "criticality"] },
      { type: "supporting_asset" },
    ],
  },
  {
    id: "A.2", title: "Schutzbedarfsfeststellung", english: "Protection-need assessment",
    note: "The same processes, read for their classification. Two levels, normal and hoch, decided on the process rather than on the object (GC.7.1); an object's level is carried by the requirement's sec_level.",
    parts: [{ type: "business_asset", fields: ["protection_need", "protection_rationale"] }],
  },
  {
    id: "A.3", title: "Modellierung", english: "Modelling",
    note: "Which requirements reached which object, and by which rule (STM.2.1). The practices are the catalogue's own top-level grouping.",
    parts: [
      { type: "praktik" },
      { type: "requirement", fields: ["ref_id", "praktik", "modal_verb", "sec_level", "target_object_categories", "applies_to_process", "applies_to_asset", "herkunft", "scope", "begruendung"] },
    ],
  },
  {
    id: "A.4", title: "Ergebnis des Grundschutz-Checks", english: "Result of the Grundschutz check",
    note: "The implementation status per requirement - ja or nein, and only ja when everything it depends on is (UMS.1.1) - with the residual risk of what is not implemented (UMS.1.2) and any security level reviewed after the fact (STM.3.1).",
    parts: [
      { type: "requirement", fields: ["ref_id", "modal_verb", "umsetzung", "fortschritt", "residual_risk", "verantwortlich", "prioritaet", "faellig"] },
      { type: "niveau_review" },
    ],
  },
  {
    id: "A.5", title: "Risikoanalyse", english: "Risk analysis",
    note: "Entered on the four triggers of GC.7.2 / STM.4.1, not walked by everyone. Grundschutz++ prescribes no risk method; this one models the attack chain and places the risk before and after treatment.",
    parts: [
      { type: "feared_event" },
      { type: "strategic_scenario" },
      { type: "operational_scenario" },
    ],
  },
  {
    id: "A.6", title: "Realisierungsplan", english: "Implementation plan",
    note: "What is to be done about what is not implemented, with priority, owner and date (UMS.2.2 / 3.1 / 4.1), what was authorised as an exception instead (UMS.5), and the rounds that tracked it (UMS.6).",
    parts: [
      { type: "security_measure", fields: ["description", "measure_type", "status", "priority", "fulfills", "covers", "verantwortlich", "termin"] },
      { type: "exception" },
      { type: "nachverfolgung" },
    ],
  },
];

/** The records of one type that belong in a delivered document.
 *
 *  `reportSkip` is the taxonomy's statement that a record was decided against - a
 *  requirement put out of scope, a measure taken out of use. It is honoured here for the
 *  same reason the report honours it: a document handed to an auditor should carry what
 *  the institution works to, not what it struck. */
function inPlay(tax: Taxonomy, study: Study, typeKey: string): EntityRecord[] {
  const skip = (tax.reportSkip ?? []).filter((r) => r.type === typeKey);
  return study.entities.filter((e) => {
    if (e.type !== typeKey) return false;
    return !skip.some((r) => r.values.includes(String(e.values[r.field] ?? "")));
  });
}

export function referenceDocuments(
  tax: Taxonomy, study: Study,
): { filename: string; text: string } | { nothing: string } {
  const parts = DOCS.flatMap((d) => d.parts);
  const present = parts.filter((p) => tax.entityTypes.some((t) => t.key === p.type));
  if (!present.length) return { nothing: "this taxonomy declares none of the seven registers" };

  const records = new Map<string, EntityRecord[]>();
  let total = 0;
  for (const p of present) {
    if (!records.has(p.type)) {
      const rs = inPlay(tax, study, p.type);
      records.set(p.type, rs);
      total += rs.length;
    }
  }
  if (total === 0) return { nothing: "nothing to deliver yet - this study holds no records in any of the seven documents" };

  const L: string[] = [];
  L.push(`# ${study.name} - Referenzdokumente (Reference documents)`);
  L.push("");
  L.push(`The BSI has published no certification scheme for Grundschutz++ (library read ${MEASURED}). This set is the one published for the classic IT-Grundschutz certification, ISO 27001 on the basis of IT-Grundschutz, filled from this study.`);
  L.push("");

  const head: string[] = ["| | |", "|---|---|"];
  if (study.organization) head.push(`| Institution | ${study.organization} |`);
  if (study.scope) head.push(`| Information domain | ${study.scope} |`);
  head.push(`| Method | ${tax.name} |`);
  if (tax.vocabularySource) {
    head.push(`| Ruleset | ${tax.vocabularySource.name}${tax.vocabularySource.version ? `, version ${shortVersion(tax.vocabularySource.version)}` : ""} |`);
  }
  head.push(`| Generated | ${new Date().toISOString().slice(0, 10)} |`);
  const log = study.log ?? [];
  if (log.length) head.push(`| Change record | ${log.length} entries, last ${String(log[log.length - 1]?.ts ?? "").slice(0, 10)} |`);
  L.push(head.join("\n"));
  L.push("");

  L.push("## Contents\n");
  for (const d of DOCS) {
    const n = d.parts.reduce((s, p) => s + (records.get(p.type)?.length ?? 0), 0);
    L.push(`- **${d.id} ${d.title}** (${d.english}) - ${n} record${n === 1 ? "" : "s"}`);
  }
  L.push("");

  for (const d of DOCS) {
    L.push("---\n");
    L.push(`## ${d.id} ${d.title} (${d.english})\n`);
    L.push(`_${d.note}_\n`);
    for (const p of d.parts) {
      const items = records.get(p.type);
      if (!items) continue;
      L.push(registerMarkdown(tax, study, p.type, { level: 3, fields: p.fields, items }));
    }
  }

  L.push("---\n");
  // The set quotes the BSI's ruleset throughout, so it carries the notice the licence asks
  // for - the same one the report ends with, written in one place.
  L.push(...documentCredits());

  const slug = study.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "study";
  return { filename: `${slug}-referenzdokumente.md`, text: L.join("\n").trim() + "\n" };
}
