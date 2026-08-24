// SPDX-License-Identifier: MPL-2.0 · Copyright (c) Aurelian-Risk
// What a delivered document calls things.
//
// The application is worked in English; a document that goes to a German federal office is
// read in German. Both are true at once, so the taxonomy is not touched and the naming
// happens where the document is written: registerMarkdown takes a heading, column names and
// value names, and everything not named here keeps the taxonomy's own word.
//
// Three rules decided every entry below:
//
//  1. Where the method catalogue has the word, the document uses THAT word - Anforderung,
//     Geschäftsprozess, Informationsverbund, Zielobjektkategorie, Sicherheitsniveau,
//     Schutzbedarf, Umsetzungsstatus, Modalverb, Praktik, Ausnahme. A reader then meets the
//     same vocabulary here as in the publication, with nothing to translate back.
//  2. What the BSI publishes as a VALUE is already in the file as published - MUSS, SOLLTE,
//     KANN, normal-SdT, erhöht, ja, nein, the 39 target-object categories - so none of it
//     appears here. valueMd prints the stored value, not the English optionLabels.
//  3. Only this product's own vocabularies get a German reading, and only a reading: the
//     stored value stays exactly as it is. `treatment.ts` compares against "Accept",
//     "Avoid" and "Share", and `Study.sector` has to match `calibration.ts`; a translated
//     value runs into the wrong branch with no error at all.
//
// Free text is not here either. What the institution wrote, it wrote.

/** Registers, by type key. The heading a document gives a register. */
export const HEADING_DE: Record<string, string> = {
  business_asset: "Geschäftsprozesse und Informationen",
  supporting_asset: "Assets",
  requirement: "Anforderungen",
  praktik: "Praktiken",
  niveau_review: "Überprüfungen des Sicherheitsniveaus",
  security_measure: "Maßnahmen",
  exception: "Ausnahmen",
  nachverfolgung: "Nachverfolgungsrunden",
  feared_event: "Schadensereignisse",
  strategic_scenario: "Bedrohungsszenarien",
  operational_scenario: "Angriffsszenarien",
  leitlinie: "Leitlinie zur Informationssicherheit",
};

/** The first column of a register carries the record's name, under the type's own label. */
export const TITLE_DE: Record<string, string> = {
  business_asset: "Geschäftsprozess",
  supporting_asset: "Asset",
  requirement: "Anforderung",
  praktik: "Praktik",
  niveau_review: "Überprüfung",
  security_measure: "Maßnahme",
  exception: "Ausnahme",
  nachverfolgung: "Runde",
  feared_event: "Schadensereignis",
  strategic_scenario: "Bedrohungsszenario",
  operational_scenario: "Angriffsszenario",
  leitlinie: "Leitlinie",
};

/** Columns, by field key. Field keys are unique enough across the types used here that one
 *  table serves them all; where two types share a key they mean the same thing. */
export const LABEL_DE: Record<string, string> = {
  // shared
  name: "Bezeichnung",
  description: "Beschreibung",
  begruendung: "Begründung",
  verantwortlich: "Verantwortlich",
  status: "Status",
  // GC.7.1 - the classification, on the process or the information
  asset_type: "Art",
  criticality: "Bedeutung",
  protection_need: "Schutzbedarf",
  protection_rationale: "Begründung des Schutzbedarfs",
  // STM.1 / STM.2.1.3 - the domain and its objects
  externe_schnittstelle: "Externe Schnittstelle",
  supports: "Unterstützt",
  // the requirement, as the catalogue states it
  ref_id: "Kennung",
  praktik: "Praktik",
  modal_verb: "Modalverb",
  sec_level: "Sicherheitsniveau",
  target_object_categories: "Zielobjektkategorien",
  applies_to_asset: "Assets",
  applies_to_process: "Geschäftsprozesse",
  herkunft: "Herkunft",
  scope: "Im Anforderungspaket",
  // UMS - implementation and what is owed
  umsetzung: "Umsetzungsstatus",
  fortschritt: "Fortschritt",
  residual_risk: "Restrisiko bei Nichtumsetzung",
  prioritaet: "Priorität",
  priority: "Priorität",
  faellig: "Fällig",
  termin: "Umsetzung bis",
  measure_type: "Wirkklasse",
  // STM.3.1 - the security-level review
  requirement: "Anforderung",
  supporting_asset: "Asset",
  level_before: "Sicherheitsniveau vorher",
  level_after: "Sicherheitsniveau nachher",
  risk_considered: "Risikobetrachtung erfolgt",
  strategic_scenario: "Bedrohungsszenario",
  decided_on: "Entschieden am",
  // UMS.5 - the exception
  authorised_by: "Genehmigt durch",
  valid_until: "Gültig bis",
  // UMS.6 - the tracking round
  verfahren: "Verfahren",
  durchgefuehrt_am: "Durchgeführt am",
  soll: "Soll",
  ist: "Ist",
  kennzahl: "Kennzahlen",
  ursache: "Ursache der Abweichung",
  verbesserung: "Beschlossene Maßnahmen",
  planaenderung: "Änderung am Umsetzungsplan",
  kommuniziert_an: "Kommuniziert an",
  // GC.5 - the policy
  version: "Version",
  ziele: "Messbare Ziele",
  strategie: "Strategie",
  verpflichtung: "Verpflichtung der Leitung",
  dokument: "Dokument",
  freigegeben_durch: "Freigegeben durch",
  freigegeben_am: "Freigegeben am",
  // the practice
  kuerzel: "Kürzel",
  schwerpunkt: "Schwerpunkt",
  // the risk consideration
  business_asset: "Geschäftsprozess",
  impact: "Betroffenes Schutzziel",
  severity: "Schadenshöhe",
  risk_origin: "Risikoquelle",
  feared_event: "Schadensereignis",
  threats: "Elementare Gefährdungen",
  likelihood: "Eintrittswahrscheinlichkeit",
  gravity: "Schadensausmaß",
  difficulty: "Erforderlicher Aufwand",
  // the measure
  fulfills: "Erfüllt",
  covers: "Wirkt auf",
  protects: "Schützt",
};

/** Values, by field key then by stored value. Only this product's own vocabularies: what the
 *  BSI publishes is already in the file the way the BSI writes it. */
export const VALUE_DE: Record<string, Record<string, string>> = {
  asset_type: {
    Process: "Prozess", Information: "Information",
    "Statutory task": "Gesetzliche Aufgabe", Service: "Dienstleistung",
  },
  herkunft: {
    "Grundschutz++": "Grundschutz++",
    "Own - asset not covered": "Eigene - Asset vom Katalog nicht erfasst",
    "Own - compliance obligation": "Eigene - aus Compliance-Pflicht",
  },
  scope: { "in scope": "enthalten", "out of scope": "gestrichen" },
  schwerpunkt: { Methodical: "Methodisch", Organisational: "Organisatorisch", Technical: "Technisch" },
  measure_type: {
    Preventive: "Vorbeugend", Detective: "Aufdeckend", Corrective: "Korrigierend",
    Deterrent: "Abschreckend", Avoidance: "Vermeidend",
  },
  status: {
    // the measure
    Implemented: "Umgesetzt", Planned: "Geplant", Missing: "Fehlt", Recommended: "Empfohlen",
    // the policy
    Draft: "Entwurf", "In force": "In Kraft",
  },
  impact: {
    Confidentiality: "Vertraulichkeit", Integrity: "Integrität",
    Availability: "Verfügbarkeit", Authenticity: "Authentizität",
  },
  prioritaet: { "1 - first": "1 - zuerst", "2": "2", "3": "3", "4 - last": "4 - zuletzt" },
};

/** The scales. A scale renders through its own labels rather than as a stored string, so the
 *  reading is by label and the same four words serve every scale that uses them. */
const SCALE_DE: Record<string, string> = {
  low: "gering", moderate: "mittel", high: "hoch", critical: "kritisch",
  possible: "möglich", likely: "wahrscheinlich", "near-certain": "nahezu sicher",
  negligible: "vernachlässigbar", noticeable: "spürbar", severe: "schwer",
  existential: "existenzbedrohend",
};
for (const k of ["criticality", "severity", "likelihood", "gravity", "difficulty", "priority"]) {
  VALUE_DE[k] = { ...SCALE_DE, ...(VALUE_DE[k] ?? {}) };
}

/** The document's own words - everything the tool writes rather than reads. */
export const DOC_DE = {
  contents: "Inhalt",
  institution: "Institution",
  domain: "Informationsverbund",
  method: "Methodik",
  ruleset: "Regelwerk",
  generated: "Erstellt",
  changeRecord: "Änderungsnachweis",
  entries: (n: number, last: string) => `${n} ${n === 1 ? "Eintrag" : "Einträge"}, zuletzt ${last}`,
  records: (n: number) => `${n} ${n === 1 ? "Datensatz" : "Datensätze"}`,
  version: (v: string) => `Version ${v}`,
  credits: {
    heading: "Quellen und Lizenzbedingungen",
    content: "Inhalt", holder: "Rechteinhaber", licence: "Lizenz", changes: "Änderungen",
    none: "keine",
    generated: (name: string, tagline: string) => `Erstellt mit ${name} - ${tagline}, offline.`,
  },
};
