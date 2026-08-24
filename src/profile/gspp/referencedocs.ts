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
import { documentCredits, documentHtml, registerMarkdown } from "../../domain/clipboard";
import { DOC_DE, HEADING_DE, LABEL_DE, TITLE_DE, VALUE_DE } from "./exportterms";
import type { EntityRecord, Study, Taxonomy } from "../../domain/types";
import { shortVersion } from "../../domain/vocabulary";

/** When the publisher's library was last read for a Grundschutz++ certification scheme.
 *  ROADMAP.md §2 re-checks it at each `npm run sync`; the two say the same date or one of
 *  them is stale. */
const MEASURED = "2026-08-23";

type Part = {
  type: string;
  fields?: string[];
  /** Override the renderer's own choice. A paragraph field only survives as a card. */
  as?: "table" | "cards";
  /** Narrow the register to the records this part is about. */
  only?: (r: EntityRecord) => boolean;
  /** A sentence before the register, where the heading alone does not say which part it is. */
  lead?: string;
};
type Doc = { id: string; title: string; note: string; parts: Part[] };

/** The seven, in the publisher's order, each naming the registers it reads.
 *
 *  Written in German throughout, and not as a courtesy: this is what an institution hands to
 *  a German federal office, the titles are the names that office uses for them, and the
 *  vocabulary is the method catalogue's own. See exportterms.ts for which words and why. */
const DOCS: Doc[] = [
  {
    id: "A.0", title: "Leitlinie zur Informationssicherheit",
    note: "Die Leitlinie, ihre messbaren Ziele, die Strategie dahinter und die Autorisierung durch die Leitung, aus der das Dokument seine Verbindlichkeit bezieht (GC.5).",
    parts: [{ type: "leitlinie" }],
  },
  {
    id: "A.1", title: "Strukturanalyse",
    note: "Die Geschäftsprozesse und Informationen des Informationsverbunds und die Assets, die sie tragen, mit den Schnittstellen nach außen (STM.1, GC.7.1.1).",
    parts: [
      // Die Prozesse OHNE ihren Schutzbedarf: der ist A.2, und beide Dokumente sollen
      // einander nicht wiederholen.
      { type: "business_asset", fields: ["description", "asset_type", "verantwortlich", "criticality"] },
      { type: "supporting_asset" },
    ],
  },
  {
    id: "A.2", title: "Schutzbedarfsfeststellung",
    note: "Dieselben Prozesse, gelesen auf ihre Klassifizierung. Zwei Stufen, normal und hoch, festgelegt am Prozess und nicht am Zielobjekt (GC.7.1); das Niveau eines Zielobjekts trägt die Anforderung in ihrem Sicherheitsniveau.",
    parts: [{ type: "business_asset", fields: ["protection_need", "protection_rationale"] }],
  },
  {
    id: "A.3", title: "Modellierung",
    note: "Welche Anforderung welches Zielobjekt erreicht hat, und nach welcher Regel (STM.2.1). Die Praktiken sind die oberste Gliederung des Anwenderkatalogs selbst.",
    parts: [
      { type: "praktik" },
      // Nicht die Praktik: eine Kennung beginnt mit ihrem Kürzel, eine Spalte voller
      // Praktiknamen wiederholt also die Spalte daneben und ist die breiteste der Zeile.
      { type: "requirement", fields: ["ref_id", "modal_verb", "sec_level", "target_object_categories", "applies_to_asset"] },
    ],
  },
  {
    id: "A.4", title: "Ergebnis des Grundschutz-Checks",
    note: "Der Umsetzungsstatus je Anforderung - ja oder nein, und ja erst, wenn auch alles Abhängige umgesetzt ist (UMS.1.1) - mit dem Restrisiko aus dem, was nicht umgesetzt ist (UMS.1.2), und jedem nachträglich überprüften Sicherheitsniveau (STM.3.1).",
    parts: [
      { type: "requirement", fields: ["ref_id", "modal_verb", "umsetzung", "verantwortlich", "prioritaet", "faellig"] },
      // UMS.1.2 ist ein Satz je Anforderung, und ein Satz ist keine Spalte. Gedruckt werden
      // nur die, die einen tragen - die Handvoll, die die Statustabelle offenlässt.
      { type: "requirement", fields: ["ref_id", "residual_risk"], as: "cards",
        only: (r) => String(r.values.residual_risk ?? "").trim() !== "",
        lead: "Das Restrisiko, das die Institution einstweilen trägt, soweit eines benannt wurde (`UMS.1.2`)." },
      { type: "niveau_review" },
    ],
  },
  {
    id: "A.5", title: "Risikoanalyse",
    note: "Betreten über die vier Auslöser aus GC.7.2 / STM.4.1, nicht von jedem durchlaufen. Grundschutz++ schreibt keine Risikomethode vor; diese modelliert die Angriffskette und verortet das Risiko vor und nach der Behandlung.",
    parts: [
      { type: "feared_event" },
      { type: "strategic_scenario" },
      { type: "operational_scenario" },
    ],
  },
  {
    id: "A.6", title: "Realisierungsplan",
    note: "Was gegen das Nichtumgesetzte unternommen wird, mit Priorität, Verantwortlichkeit und Termin (UMS.2.2 / 3.1 / 4.1), was stattdessen als Ausnahme genehmigt wurde (UMS.5), und die Runden, die es nachverfolgt haben (UMS.6).",
    parts: [
      { type: "security_measure", fields: ["description", "measure_type", "status", "priority", "verantwortlich", "termin"] },
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
  const declared = (p: Part) => tax.entityTypes.some((t) => t.key === p.type);
  if (!DOCS.flatMap((d) => d.parts).some(declared)) {
    return { nothing: "this taxonomy declares none of the seven registers" };
  }

  // Resolved once per part, not per type: two parts may read the same register through
  // different fields, and one of them may narrow it.
  const byType = new Map<string, EntityRecord[]>();
  const items = new Map<Part, EntityRecord[]>();
  for (const p of DOCS.flatMap((d) => d.parts)) {
    if (!declared(p)) continue;
    if (!byType.has(p.type)) byType.set(p.type, inPlay(tax, study, p.type));
    const all = byType.get(p.type)!;
    items.set(p, p.only ? all.filter(p.only) : all);
  }
  const total = [...byType.values()].reduce((n, rs) => n + rs.length, 0);
  if (total === 0) return { nothing: "nothing to deliver yet - this study holds no records in any of the seven documents" };

  const L: string[] = [];
  L.push(`# Referenzdokumente`);
  L.push(`## ${study.name}`);
  L.push("");
  L.push(`Das BSI hat für Grundschutz++ kein Zertifizierungsschema veröffentlicht (Bibliothek gelesen am ${MEASURED}). Dieser Satz folgt dem veröffentlichten Satz der klassischen IT-Grundschutz-Zertifizierung, ISO 27001 auf Basis von IT-Grundschutz, gefüllt aus dieser Studie.`);
  L.push("");

  const head: string[] = ["| | |", "|---|---|"];
  if (study.organization) head.push(`| ${DOC_DE.institution} | ${study.organization} |`);
  if (study.scope) head.push(`| ${DOC_DE.domain} | ${study.scope} |`);
  head.push(`| ${DOC_DE.method} | ${tax.name} |`);
  if (tax.vocabularySource) {
    head.push(`| ${DOC_DE.ruleset} | ${tax.vocabularySource.name}${tax.vocabularySource.version ? `, ${DOC_DE.version(shortVersion(tax.vocabularySource.version))}` : ""} |`);
  }
  head.push(`| ${DOC_DE.generated} | ${new Date().toISOString().slice(0, 10)} |`);
  const log = study.log ?? [];
  if (log.length) {
    head.push(`| ${DOC_DE.changeRecord} | ${DOC_DE.entries(log.length, String(log[log.length - 1]?.ts ?? "").slice(0, 10))} |`);
  }
  L.push(head.join("\n"));
  L.push("");

  L.push(`## ${DOC_DE.contents}\n`);
  for (const d of DOCS) {
    const n = [...new Set(d.parts.filter(declared).map((p) => p.type))]
      .reduce((s, k) => s + (byType.get(k)?.length ?? 0), 0);
    L.push(`- **${d.id} ${d.title}** - ${DOC_DE.records(n)}`);
  }
  L.push("");

  for (const d of DOCS) {
    L.push("---\n");
    L.push(`## ${d.id} ${d.title}\n`);
    L.push(`_${d.note}_\n`);
    for (const p of d.parts) {
      const rs = items.get(p);
      if (!rs || !rs.length) continue;
      if (p.lead) L.push(`${p.lead}\n`);
      L.push(registerMarkdown(tax, study, p.type, {
        level: 3, fields: p.fields, items: rs, as: p.as,
        heading: HEADING_DE[p.type],
        labels: { ...LABEL_DE, name: TITLE_DE[p.type] ?? LABEL_DE.name },
        values: VALUE_DE,
      }));
    }
  }

  L.push("---\n");
  // The set quotes the BSI's ruleset throughout, so it carries the notice the licence asks
  // for - the same one the report ends with, written in one place and in this document's
  // language, because a licence has to be readable by whoever receives it.
  L.push(...documentCredits(DOC_DE.credits));

  const slug = study.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "study";
  return { filename: `${slug}-referenzdokumente.md`, text: L.join("\n").trim() + "\n" };
}

/** The same set as a page, set the way the report is: read in the browser, printed from
 *  there. Markdown is the file to keep; this is the one an auditor is handed. */
export function referenceDocumentsHtml(
  tax: Taxonomy, study: Study,
): { filename: string; text: string } | { nothing: string } {
  const md = referenceDocuments(tax, study);
  if ("nothing" in md) return md;
  return {
    filename: md.filename.replace(/\.md$/, ".html"),
    text: documentHtml(md.text, `Referenzdokumente - ${study.name}`, { lang: "de" }),
  };
}
