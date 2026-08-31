// SPDX-License-Identifier: MPL-2.0 · Copyright (c) Aurelian-Risk
// What this product is called in German, where German has its own word.
//
// The taxonomy stays English - keys, field keys, stored values AND labels. That is the
// engine's decision and the reason there is no migration: a stored value is data, and it
// is matched, exported and hashed. Only what is SHOWN passes through here.
//
// The rule is one sentence (src/domain/i18n.ts): look the key up in the table for the
// chosen language; find nothing, show what was authored. Two consequences shape this file:
//
//   · The published BSI vocabulary needs NO entry. `options` already hold the German the
//     BSI publishes - "hoch", "erhöht", "normal-SdT", the target-object categories - and a
//     German reader should see them exactly as published, because that is what an auditor
//     checks against. Nothing found, the published value shows. The ENGLISH readings, which
//     are this product's own gloss, belong in an en table instead.
//   · Not everything gets a German word. A type is renamed here only where the method has
//     an established term of its own - Anforderung, Zielobjekt, Maßnahme. Where the English
//     is a plain description and German would only be a translation of it, the entry is
//     still made, because a half-German register reads worse than either language; but the
//     wording then claims nothing about the publisher.
//
// The six workshops are the method's PROCESS STEPS, not its practices - see the note beside
// `groups` in taxonomy.ts. Three of the six coincide with a practice name the BSI publishes
// (UMS Umsetzung, PERF Monitoring-Evaluation, VRB Verbesserung) and those words are taken
// from there rather than invented; the other three are named after the step.
import type { Overlay } from "../../domain/i18n";
import { DEFAULT_TAXONOMY } from "./taxonomy";

const DE: Overlay = {
  // ── the registers ──────────────────────────────────────────────────────────
  "type.business_asset.label": "Geschäftsprozess",
  "type.business_asset.plural": "Geschäftsprozesse",
  // Zielobjekt is the method's own word: it is what a requirement reaches, and what a
  // target-object category classifies. "Asset" is the English stand-in for it.
  "type.supporting_asset.label": "Zielobjekt",
  "type.supporting_asset.plural": "Zielobjekte",
  "type.feared_event.label": "Schadensereignis",
  "type.feared_event.plural": "Schadensereignisse",
  // The catalogue's own top-level grouping; the value list is published (@groups).
  "type.praktik.label": "Praktik",
  "type.praktik.plural": "Praktiken",
  "type.requirement.label": "Anforderung",
  "type.requirement.plural": "Anforderungen",
  "type.risk_origin.label": "Risikoquelle",
  "type.risk_origin.plural": "Risikoquellen",
  "type.strategic_scenario.label": "Bedrohungsszenario",
  "type.strategic_scenario.plural": "Bedrohungsszenarien",
  "type.operational_scenario.label": "Angriffsszenario",
  "type.operational_scenario.plural": "Angriffsszenarien",
  "type.kill_chain_step.label": "Angriffsschritt",
  "type.kill_chain_step.plural": "Angriffsschritte",
  "type.risk_treatment.label": "Risikobehandlung",
  "type.risk_treatment.plural": "Risikobehandlungen",
  "type.security_measure.label": "Maßnahme",
  "type.security_measure.plural": "Maßnahmen",
  "type.niveau_review.label": "Sicherheitsniveau-Überprüfung",
  "type.niveau_review.plural": "Sicherheitsniveau-Überprüfungen",
  "type.exception.label": "Ausnahme",
  "type.exception.plural": "Ausnahmen",
  "type.nachverfolgung.label": "Nachverfolgung",
  "type.nachverfolgung.plural": "Nachverfolgungen",
  "type.kennzahl.label": "Kennzahl",
  "type.kennzahl.plural": "Kennzahlen",
  "type.paket_review.label": "Paketprüfung",
  "type.paket_review.plural": "Paketprüfungen",
  "type.audit.label": "Audit",
  "type.audit.plural": "Audits",
  "type.managementbericht.label": "Managementbericht",
  "type.managementbericht.plural": "Managementberichte",
  "type.partei.label": "Interessierte Partei",
  "type.partei.plural": "Interessierte Parteien",
  "type.leitlinie.label": "Leitlinie",
  "type.leitlinie.plural": "Leitlinie und Strategie",
  "type.rolle.label": "Rolle",
  "type.rolle.plural": "Rollen und Verantwortlichkeiten",
  "type.verfahren.label": "Verfahren",
  "type.verfahren.plural": "Verfahren und Regelungen",
  "type.abweichung.label": "Abweichung",
  "type.abweichung.plural": "Abweichungen",
  "type.verbesserung.label": "Korrektur- und Verbesserungsmaßnahme",
  "type.verbesserung.plural": "Korrektur- und Verbesserungsmaßnahmen",

  // ── what a value is called, never what it IS ───────────────────────────────
  //
  // A stored value is data: dimWhen and reportSkip match on it, treatment.ts derives the
  // residual risk from "Accept", "Avoid" and "Share", an export carries it and a seal
  // hashes it. None of that is touched here. These entries say only how a value is READ.
  "field.business_asset.asset_type.options": ["Prozess", "Information", "Gesetzliche Aufgabe", "Dienstleistung"],
  "field.feared_event.impact.options": ["Vertraulichkeit", "Integrität", "Verfügbarkeit", "Authentizität"],
  "field.praktik.schwerpunkt.options": ["Methodisch", "Organisatorisch", "Technisch"],
  "field.risk_origin.category.options": ["Cyberkriminelle", "Staatlicher Akteur", "Hacktivist",
    "Innentäter", "Wettbewerber", "Terrorist", "Gelegenheitstäter"],
  "field.kill_chain_step.tactic.options": ["Aufklärung", "Ressourcenaufbau", "Erstzugriff",
    "Ausführung", "Persistenz", "Rechteausweitung", "Verteidigungsumgehung", "Zugangsdaten",
    "Erkundung", "Laterale Bewegung", "Sammlung", "Steuerung", "Abfluss", "Wirkung"],
  // The four decisions of BSI 200-3 and ISO 27005. The stored words are engine contract -
  // treatment.ts compares against them - so only the reading changes.
  "field.risk_treatment.decision.options": ["Reduzieren", "Akzeptieren", "Teilen", "Vermeiden"],
  "field.risk_treatment.status.options": ["Vorgeschlagen", "In Bearbeitung", "Umgesetzt", "Geprüft"],
  "field.security_measure.measure_type.options": ["Präventiv", "Detektierend", "Korrigierend",
    "Abschreckend", "Vermeidend"],
  "field.security_measure.status.options": ["Umgesetzt", "Geplant", "Fehlt", "Empfohlen"],
  "field.paket_review.neumodellierung.options": ["Nein", "Ja - das Paket wurde neu abgeleitet"],
  "field.audit.audit_type.options": ["Intern", "Extern", "Überwachung", "Wiederholung", "Sonderprüfung"],
  "field.managementbericht.anlass.options": ["Turnusmäßig", "Anlassbezogen"],
  "field.partei.art.options": ["Extern", "Intern"],
  "field.leitlinie.status.options": ["Entwurf", "In Kraft"],
  "field.rolle.art.options": ["Informationssicherheitsbeauftragte", "Rolle", "Gremium",
    "Schnittstelle zu einer anderen Disziplin"],
  "field.rolle.vorspracherecht.options": ["Ja", "Nein"],
  "field.rolle.status.options": ["Nicht eingerichtet", "Eingerichtet"],
  "field.verfahren.status.options": ["Nicht verankert", "In Kraft"],
  "field.abweichung.status.options": ["Offen", "In Bearbeitung", "Behoben", "Akzeptiert"],
  "field.abweichung.wiederauftreten.options": ["Ja", "Nein"],
  "field.abweichung.isms_anpassung.options": ["Ja", "Nein"],
  "field.verbesserung.art.options": ["Korrektur", "Verbesserung"],
  "field.verbesserung.status.options": ["Geplant", "In Bearbeitung", "Erledigt", "Verworfen"],
  "field.verbesserung.wirksamkeit.options": ["Wirksam", "Teilweise wirksam", "Nicht wirksam"],
  // requirement.modal_verb is MUSS / SOLLTE / KANN and stays untouched: the BSI defines
  // those against DIN 820-2, and they are how a requirement is cited.


  // ── the values a toggle and a few other lists carry ────────────────────────
  //
  // These enums carry no optionLabels, so the STORED value showed through: a German page
  // read "out of scope". The values themselves do not move - treatment.ts and dimWhen
  // compare against them.
  //
  // `scope` is shared by eight types under one pair of values and takes the shared key.
  // security_measure declares the same field key with DIFFERENT values ("in use"), so it
  // gets its own - a shared entry would have put "im Geltungsbereich" on a measure.
  "field.scope.options": ["außerhalb", "im Geltungsbereich"],
  "field.security_measure.scope.options": ["nicht im Einsatz", "im Einsatz"],
  "field.prioritaet.options": ["1 - zuerst", "2", "3", "4 - zuletzt"],
  "field.requirement.herkunft.options": ["Grundschutz++", "Eigen - Zielobjekt nicht abgedeckt",
    "Eigen - Compliance-Pflicht"],
  // modal_verb is left as it stands: MUSS/SOLLTE/KANN is how a requirement is cited, and
  // the BSI defines the three against DIN 820-2.

  // ── what a field is called ─────────────────────────────────────────────────
  //
  // 234 entries for 249 declarations: 137 field keys carry one label across every type
  // that declares them and take the shared key, 18 carry more than one and get a key
  // per type. Which of the two a key needs is not a matter of taste - `status` reads
  // "Status", "In force" and "Established" on three different types, and one shared
  // entry would put the same word on all three.
  "field.abgestimmt_mit.label": "Abgestimmt mit",
  "field.ableitung.label": "Folgen für das ISMS",
  "field.abweichung.label": "Behebt Abweichung",
  "field.action_word.label": "Aktionswort",
  "field.activity.label": "Aktivität",
  "field.anforderung.label": "Verankert Anforderung",
  "field.anlass.label": "Anlass",
  "field.anpassungen.label": "Vorgenommene Anpassungen",
  "field.applies_to_asset.label": "Gilt für Zielobjekte",
  "field.applies_to_process.label": "Gilt für Geschäftsprozesse",
  "field.art.label": "Art",
  "field.audit_type.label": "Art",
  "field.auditteam.label": "Auditteam",
  "field.aufgaben.label": "Aufgaben",
  "field.authenticity.label": "Wirkt auf Authentizität (0–2)",
  "field.authorised_by.label": "Freigegeben von",
  "field.availability.label": "Wirkt auf Verfügbarkeit (0–2)",
  "field.bedarf.label": "Anforderungen und Erwartungen",
  "field.befugnisse.label": "Befugnisse",
  "field.bericht.label": "Bericht",
  "field.betrachtet.label": "Was berücksichtigt wurde",
  "field.business_asset.label": "Betrifft",
  "field.capability.label": "Fähigkeiten",
  "field.compliance_basis.label": "Zugrunde liegende Verpflichtung",
  "field.component_type.label": "Art",
  "field.confidentiality.label": "Wirkt auf Vertraulichkeit (0–2)",
  "field.covers.label": "Wirkt auf Angriffsschritte",
  "field.criticality.label": "Bedeutung",
  "field.deadline.label": "Fällig",
  "field.decided_on.label": "Entschieden am",
  "field.decision.label": "Entscheidung",
  "field.difficulty.label": "Erforderliche Fähigkeiten",
  "field.documentation.label": "Nachweisdokument",
  "field.dokument.label": "Dokumentiert in",
  "field.durchgefuehrt_am.label": "Durchgeführt am",
  "field.effort_level.label": "Aufwandsstufe (0–5)",
  "field.eignung.label": "Eignung, Angemessenheit und Wirksamkeit",
  "field.eignung_massnahmen.label": "Ob die Maßnahmen noch zu den Zielen passen",
  "field.einheit.label": "Einheit",
  "field.entscheidungen.label": "Beschlüsse und Ressourcen",
  "field.erfolge_probleme.label": "Erfolge und Probleme",
  "field.ergebnis.label": "Was die Auswertung ergab",
  "field.externe_schnittstelle.label": "Externe Schnittstelle",
  "field.feared_event.label": "Schadensereignis",
  "field.folgemassnahmen.label": "Stand der letzten Bewertungsbeschlüsse",
  "field.fortschritt.label": "Fortschritt",
  "field.freigegeben_durch.label": "Freigegeben von",
  "field.fulfills.label": "Erfüllt Anforderungen",
  "field.geplant_fuer.label": "Geplant für",
  "field.gravity.label": "Auswirkung",
  "field.herkunft.label": "Herkunft",
  "field.impact.label": "Sicherheitsziel",
  "field.implementation_level.label": "Umsetzungsstand",
  "field.implements.label": "Setzt Anforderungen um",
  "field.integrity.label": "Wirkt auf Integrität (0–2)",
  "field.interessenkonflikt.label": "Interessenkonflikte",
  "field.isms_anpassung.label": "ISMS ist anzupassen",
  "field.iso_27001.label": "ISO/IEC 27001 Anhang A",
  "field.ist.label": "Umgesetzt",
  "field.istwert.label": "Istwert",
  "field.itgs_2023.label": "IT-Grundschutz 2023",
  "field.justification.label": "Begründung",
  "field.kennzahl.label": "Ausgewertete Kennzahlen",
  "field.kriterien.label": "Kriterien und Verfahren",
  "field.kuerzel.label": "Kürzel",
  "field.letzte_pruefung.label": "Zuletzt geprüft",
  "field.level_after.label": "Geltende Stufe",
  "field.level_before.label": "Stufe wie veröffentlicht",
  "field.likelihood.label": "Eintrittswahrscheinlichkeit",
  "field.massnahmenvorschlaege.label": "Vorschläge, priorisiert, mit ihrem Aufwand",
  "field.measure_type.label": "Wirkklasse",
  "field.modal_verb.label": "Modalverb",
  "field.motivation.label": "Motivation",
  "field.neumodellierung.label": "In die Modellierung geführt",
  "field.operational_scenario.label": "Angriffsszenario",
  "field.owner.label": "Verantwortlich",
  "field.parameter_values.label": "Belegte Parameter",
  "field.params.label": "Offene Parameter",
  "field.planaenderung.label": "Änderungen am Plan",
  "field.planstatus.label": "Stand des Umsetzungsplans",
  "field.praktik.label": "Praktik",
  "field.predecessors.label": "Vorgänger",
  "field.prioritaet.label": "Priorität",
  "field.priority.label": "Priorität",
  "field.protection_need.label": "Schutzbedarf",
  "field.protection_rationale.label": "Begründung des Schutzbedarfs",
  "field.protects.label": "Schützt Zielobjekte",
  "field.qualifikation.label": "Erforderliche Qualifikation",
  "field.rahmenbedingungen.label": "Veränderte Rahmenbedingungen",
  "field.related.label": "Verwandte Anforderungen",
  "field.relevance.label": "Relevanz",
  "field.relevanz.label": "Relevanz",
  "field.required.label": "Hängt ab von",

  // ── engine words this method has its own name for ─────────────────────────────
  // The engine keeps "Report" in German too, because that is what its own product's
  // analysts read. This method's word is Bericht, and the product table is registered
  // after the engine's, so this wins for the key without touching theirs.
  "ui.study.report": "Bericht",
  "product.documentTitle": "Sicherheitskonzept nach Grundschutz++",
  "product.tagline": "BSI-Grundschutz umgesetzt",
  "ui.nav.timeline": "Änderungslauf",

  // ── how a reference reads in a sentence ────────────────────────────────────────
  // `fieldRelation` falls back to the field's own label, so an untranslated relation does
  // not show as missing - it shows as the English word inside a German sentence, on the
  // graph edge and in the record panel. All 31 the taxonomy declares are here.
  "field.supporting_asset.supports.relation": "trägt",
  "field.feared_event.business_asset.relation": "betrifft",
  "field.requirement.applies_to_asset.relation": "gilt für",
  "field.requirement.applies_to_process.relation": "gilt für",
  "field.strategic_scenario.risk_origin.relation": "geht aus von",
  "field.strategic_scenario.feared_event.relation": "führt zu",
  "field.operational_scenario.strategic_scenario.relation": "verwirklicht",
  "field.kill_chain_step.operational_scenario.relation": "gehört zu",
  "field.kill_chain_step.targets_asset.relation": "greift an",
  "field.kill_chain_step.predecessors.relation": "setzt voraus",
  "field.risk_treatment.strategic_scenario.relation": "behandelt",
  "field.security_measure.covers.relation": "wirkt auf",
  "field.security_measure.protects.relation": "schützt",
  "field.security_measure.fulfills.relation": "erfüllt",
  "field.niveau_review.requirement.relation": "überprüft",
  "field.niveau_review.supporting_asset.relation": "gilt für",
  "field.niveau_review.strategic_scenario.relation": "betrachtet als",
  "field.exception.requirement.relation": "nimmt aus",
  "field.exception.supporting_asset.relation": "gilt für",
  "field.exception.strategic_scenario.relation": "betrachtet als",
  "field.nachverfolgung.verfahren.relation": "läuft unter",
  "field.nachverfolgung.kennzahl.relation": "liest",
  "field.nachverfolgung.verbesserung.relation": "entscheidet",
  "field.paket_review.verfahren.relation": "läuft unter",
  "field.audit.supporting_asset.relation": "prüft",
  "field.audit.requirement.relation": "prüft",
  "field.managementbericht.audit.relation": "stützt sich auf",
  "field.leitlinie.ziele.relation": "setzt",
  "field.abweichung.requirement.relation": "betrifft",
  "field.abweichung.audit.relation": "gefunden durch",
  "field.verbesserung.abweichung.relation": "beantwortet",

  // The one check whose words this profile writes rather than the engine: `dependsOn`
  // declares its title and hint in the taxonomy, so no engine table can answer them.
  "check.dependency-unmet.title": "Als umgesetzt gemeldete Anforderungen, deren Grundlage es nicht ist",
  "check.dependency-unmet.hint": "Sie gilt erst dann als umgesetzt, wenn alles umgesetzt ist, worauf sie aufsetzt. Worauf sie aufsetzt, steht in „Hängt ab von\" und kommt aus dem Katalog selbst. (UMS.1.1)",
  "field.residual_risk.label": "Restrisiko bei Nichtumsetzung",
  "field.resources.label": "Ressourcen",
  "field.ressourcen.label": "Zugewiesene Ressourcen",
  "field.result.label": "Ergebnis",
  "field.risk_considered.label": "Risiko betrachtet",
  "field.risk_origin.label": "Risikoquelle",
  "field.rueckmeldungen.label": "Rückmeldungen der interessierten Parteien",
  "field.schwere.label": "Schwere",
  "field.schwerpunkt.label": "Schwerpunkt",
  "field.sec_level.label": "Sicherheitsniveau",
  "field.severity.label": "Schwere",
  "field.soll.label": "Frist verstrichen",
  "field.stellvertreter.label": "Vertretung",
  "field.step_order.label": "Schritt",
  "field.strategie.label": "Strategie",
  "field.supports.label": "Unterstützt",
  "field.tactic.label": "Taktik",
  "field.tags.label": "Schlagwörter",
  "field.target_object_categories.label": "Gilt für Zielobjektkategorien",
  "field.targets_asset.label": "Angegriffenes Zielobjekt",
  "field.technique.label": "Technik",
  "field.termin.label": "Umzusetzen bis",
  "field.threats.label": "Elementare Gefährdungen",
  "field.traeger.label": "Durchgeführt von",
  "field.umfang.label": "Geltungsbereich",
  "field.umsetzung.label": "Umgesetzt",
  "field.unabhaengig.label": "Unabhängigkeit festgestellt",
  "field.unterstellt.label": "Berichtet an",
  "field.valid_until.label": "Gültig bis",
  "field.verbesserung.label": "Beschlossene Maßnahmen",
  "field.verbesserungen_bericht.label": "Abgeleitete Verbesserungen",
  "field.verfahren.label": "Läuft unter",
  "field.verpflichtung.label": "Verpflichtung der Leitung",
  "field.version.label": "Version",
  "field.vorgelegt_am.label": "Vorgelegt am",
  "field.vorspracherecht.label": "Unmittelbares Vortragsrecht",
  "field.vorteile_nachteile.label": "Vor- und Nachteile",
  "field.wiederauftreten.label": "Kann wiederkehren",
  "field.wirksamkeit.label": "Wirksamkeit geprüft",
  "field.wirksamkeit_ergebnis.label": "Was die Prüfung ergab",
  "field.zeitraum.label": "Zeitraum",
  "field.ziel.label": "Ziel",
  "field.ziele.label": "Messbare Ziele",
  "field.zielwert.label": "Zielwert",

  // The eighteen that mean something different depending on where they stand.
  // business_asset
  "field.business_asset.name.label": "Name",
  // supporting_asset
  "field.supporting_asset.name.label": "Name",
  // feared_event
  "field.feared_event.name.label": "Name",
  // praktik
  "field.praktik.name.label": "Praktik",
  // requirement
  "field.requirement.name.label": "Anforderung",
  // risk_origin
  "field.risk_origin.name.label": "Name",
  // strategic_scenario
  "field.strategic_scenario.name.label": "Name",
  // operational_scenario
  "field.operational_scenario.name.label": "Name",
  // kill_chain_step
  "field.kill_chain_step.name.label": "Name",
  // risk_treatment
  "field.risk_treatment.name.label": "Name",
  // security_measure
  "field.security_measure.name.label": "Name",
  // niveau_review
  "field.niveau_review.name.label": "Name",
  // exception
  "field.exception.name.label": "Name",
  // nachverfolgung
  "field.nachverfolgung.name.label": "Name",
  // kennzahl
  "field.kennzahl.name.label": "Name",
  // paket_review
  "field.paket_review.name.label": "Name",
  // audit
  "field.audit.name.label": "Name",
  // managementbericht
  "field.managementbericht.name.label": "Name",
  // partei
  "field.partei.name.label": "Name",
  // leitlinie
  "field.leitlinie.name.label": "Name",
  // rolle
  "field.rolle.name.label": "Name",
  // verfahren
  "field.verfahren.name.label": "Name",
  // abweichung
  "field.abweichung.name.label": "Name",
  // verbesserung
  "field.verbesserung.name.label": "Name",
  // business_asset
  "field.business_asset.description.label": "Beschreibung",
  // supporting_asset
  "field.supporting_asset.description.label": "Beschreibung",
  // feared_event
  "field.feared_event.description.label": "Beschreibung",
  // praktik
  "field.praktik.description.label": "Beschreibung",
  // requirement
  "field.requirement.description.label": "Anforderungstext und Umsetzungshinweise",
  // risk_origin
  "field.risk_origin.description.label": "Beschreibung",
  // strategic_scenario
  "field.strategic_scenario.description.label": "Beschreibung",
  // operational_scenario
  "field.operational_scenario.description.label": "Beschreibung",
  // kill_chain_step
  "field.kill_chain_step.description.label": "Beschreibung",
  // security_measure
  "field.security_measure.description.label": "Beschreibung",
  // kennzahl
  "field.kennzahl.description.label": "Was sie misst",
  // verfahren
  "field.verfahren.description.label": "Was das Verfahren vorsieht",
  // abweichung
  "field.abweichung.description.label": "Feststellung",
  // verbesserung
  "field.verbesserung.description.label": "Was getan wird",
  // business_asset
  "field.business_asset.asset_type.label": "Art",
  // supporting_asset
  "field.supporting_asset.asset_type.label": "Zielobjektkategorie",
  // business_asset
  "field.business_asset.verantwortlich.label": "Verantwortlich",
  // requirement
  "field.requirement.verantwortlich.label": "Verantwortlich",
  // security_measure
  "field.security_measure.verantwortlich.label": "Verantwortlich",
  // nachverfolgung
  "field.nachverfolgung.verantwortlich.label": "Verantwortlich",
  // paket_review
  "field.paket_review.verantwortlich.label": "Verantwortlich",
  // partei
  "field.partei.verantwortlich.label": "Kontakt",
  // verfahren
  "field.verfahren.verantwortlich.label": "Verantwortlich",
  // verbesserung
  "field.verbesserung.verantwortlich.label": "Verantwortlich",
  // supporting_asset
  "field.supporting_asset.begruendung.label": "Begründung der Kategorie",
  // requirement
  "field.requirement.begruendung.label": "Begründung",
  // niveau_review
  "field.niveau_review.begruendung.label": "Begründung",
  // exception
  "field.exception.begruendung.label": "Begründung",
  // supporting_asset
  "field.supporting_asset.scope.label": "Im Geltungsbereich",
  // feared_event
  "field.feared_event.scope.label": "Im Geltungsbereich",
  // requirement
  "field.requirement.scope.label": "Im Geltungsbereich",
  // risk_origin
  "field.risk_origin.scope.label": "Im Geltungsbereich",
  // strategic_scenario
  "field.strategic_scenario.scope.label": "Im Geltungsbereich",
  // operational_scenario
  "field.operational_scenario.scope.label": "Im Geltungsbereich",
  // kill_chain_step
  "field.kill_chain_step.scope.label": "Im Geltungsbereich",
  // risk_treatment
  "field.risk_treatment.scope.label": "Im Geltungsbereich",
  // security_measure
  "field.security_measure.scope.label": "Im Einsatz",
  // requirement
  "field.requirement.ref_id.label": "Kennung",
  // security_measure
  "field.security_measure.ref_id.label": "Bezeichnung wie veröffentlicht",
  // requirement
  "field.requirement.framework.label": "Regelwerk",
  // security_measure
  "field.security_measure.framework.label": "Quellkatalog",
  // requirement
  "field.requirement.category.label": "Abschnitt",
  // risk_origin
  "field.risk_origin.category.label": "Kategorie",
  // security_measure
  "field.security_measure.category.label": "Art wie veröffentlicht",
  // requirement
  "field.requirement.faellig.label": "Fällig",
  // paket_review
  "field.paket_review.faellig.label": "Fällig am",
  // verbesserung
  "field.verbesserung.faellig.label": "Fällig",
  // operational_scenario
  "field.operational_scenario.strategic_scenario.label": "Bedrohungsszenario",
  // risk_treatment
  "field.risk_treatment.strategic_scenario.label": "Behandeltes Bedrohungsszenario",
  // niveau_review
  "field.niveau_review.strategic_scenario.label": "Betrachtetes Risiko",
  // exception
  "field.exception.strategic_scenario.label": "Betrachtetes Risiko",
  // risk_treatment
  "field.risk_treatment.status.label": "Status",
  // security_measure
  "field.security_measure.status.label": "Status",
  // leitlinie
  "field.leitlinie.status.label": "In Kraft",
  // rolle
  "field.rolle.status.label": "Eingerichtet",
  // verfahren
  "field.verfahren.status.label": "In Kraft",
  // abweichung
  "field.abweichung.status.label": "Status",
  // verbesserung
  "field.verbesserung.status.label": "Status",
  // niveau_review
  "field.niveau_review.requirement.label": "Anforderung",
  // exception
  "field.exception.requirement.label": "Anforderung",
  // audit
  "field.audit.requirement.label": "Geprüfte Anforderungen",
  // abweichung
  "field.abweichung.requirement.label": "Betroffene Anforderung",
  // niveau_review
  "field.niveau_review.supporting_asset.label": "Beschränkt auf Zielobjekt",
  // exception
  "field.exception.supporting_asset.label": "Beschränkt auf Zielobjekt",
  // audit
  "field.audit.supporting_asset.label": "Geprüfte Zielobjekte",
  // nachverfolgung
  "field.nachverfolgung.ursache.label": "Warum sie abweichen",
  // abweichung
  "field.abweichung.ursache.label": "Ursache",
  // nachverfolgung
  "field.nachverfolgung.kommuniziert_an.label": "Kommuniziert an",
  // managementbericht
  "field.managementbericht.kommuniziert_an.label": "Ergebnisse kommuniziert an",
  "field.managementbericht.audit.label": "Zugrunde liegende Audits",
  // abweichung
  "field.abweichung.audit.label": "Festgestellt durch",
  // leitlinie
  "field.leitlinie.freigegeben_am.label": "Freigegeben am",
  // verfahren
  "field.verfahren.freigegeben_am.label": "Genehmigt am",

  // ── the help under a field ─────────────────────────────────────────────────
  //
  // 111 texts. 74 field keys carry one help across every type that declares them and take
  // the shared key; the rest differ and get one per type - `scope` reads the same on seven
  // types, and something else on the requirement and on the measure.
  //
  // The BSI's identifiers stay as they stand: (STM.2.1.4) is a citation, not a word.
  // So do the level names - normal, hoch, erhöht, normal-SdT - which are values.
  "field.protection_need.help": "Wie schwer dieser Prozess getroffen wäre, wenn seine Informationen Vertraulichkeit, Integrität oder Verfügbarkeit verlören. Nur zwei Stufen, normal oder hoch, mit der Leitung entschieden. Hoch bedeutet, dass eine Risikobetrachtung folgt. (GC.7.1, GC.7.2)",
  "field.asset_type.help": "Um was für ein Ding es sich handelt, aus der Liste der BSI. Nach dem, was das Zielobjekt tut, nicht nach dem, woraus es gebaut ist. Diese eine Wahl entscheidet, welche Anforderungen darauf landen - und die gewählte Klasse bringt die Klassen darüber mit: eine Wählverbindung ist eine externe Netzverbindung, die unter Netze fällt, also gelten die Anforderungen beider. (STM.2.1.3, STM.2.1.4.1)",
  "field.externe_schnittstelle.help": "Welcher Prozess außerhalb des Informationsverbunds ihn über dieses Zielobjekt erreicht, wer diesen Prozess betreibt und was dabei übergeht. Leer heißt: dieses Zielobjekt liegt nicht an der Grenze. (STM.1.2)",
  "field.herkunft.help": "Woher diese Anforderung stammt. Leer für eine aus dem Katalog. Eine eigene muss sagen, warum der Katalog nicht gereicht hat; eine aus Gesetz oder Vertrag muss ihn nennen. (STM.2.1.6, STM.2.1.7)",
  "field.compliance_basis.help": "Das Gesetz oder der Vertrag, aus dem diese Anforderung kommt. (STM.2.1.7)",
  "field.target_object_categories.help": "Die Zielobjektarten, für die diese Anforderung gilt, wie der Katalog sie angibt. Das entscheidet, auf welchen Ihrer Zielobjekte sie landet. 636 der 1000 haben sie; die ISMS-Praktiken haben keine, weil sie für alles gelten. (STM.2.1.4)",
  "field.itgs_2023.help": "Was dem im IT-Grundschutz-Kompendium 2023 entspricht und wie genau - die Zuordnung der BSI selbst. Wer die alte Anforderung schon erfüllt hat, sieht es hier.",
  "field.iso_27001.help": "Was dem in ISO/IEC 27001 Anhang A entspricht und wie genau. Wieder die Zuordnung der BSI selbst.",
  "field.required.help": "Die Anforderungen, auf denen diese aufsetzt, benannt vom Katalog. Sie gilt erst als umgesetzt, wenn jene es sind. (UMS.1.1)",
  "field.applies_to_asset.help": "Welches Ihrer Zielobjekte diese Anforderung über seine Klasse hereingezogen hat. Die Ableitung trägt das ein; nach einem neuen Zielobjekt erneut ausführen, dann aktualisiert es sich. Leer heißt: die Anforderung gilt für alles - die ISMS-Praktiken - oder Sie haben sie für einen Geschäftsprozess von Hand hereingenommen. (STM.2.1.4)",
  "field.applies_to_process.help": "Für eine Anforderung, die der Katalog nicht klassifiziert: für welche Geschäftsprozesse Sie sie als einschlägig beurteilt haben. Verantwortlichkeit und Begründung daneben. (STM.2.1.5)",
  "field.verantwortlich.help": "Wer einstehen muss - eine Person oder eine Rolle, so benannt, dass kein Zweifel bleibt, wer gemeint ist. (STM.2.1.5, UMS.3.1)",
  "field.fortschritt.help": "Wo es steht und was beim letzten Hinsehen entschieden wurde. (UMS.6.1)",
  "field.residual_risk.help": "Was Sie tragen, wenn das offen bleibt. Eine offen gelassene Anforderung ist auch einer der Fälle, in denen die Methode eine Risikobetrachtung verlangt. (UMS.1.2, STM.4.1)",
  "field.justification.help": "Hier werden keine Maßnahmen aufgezählt. Eine Maßnahme wirkt auf einen Angriffsschritt, und das Restrisiko folgt daraus.",
  "field.measure_type.help": "Was die Maßnahme tatsächlich tut. Präventiv hält den Angreifer an dem Schritt auf, den sie abdeckt. Detektiv erkennt ihn, sodass die Kette unterbrochen werden kann, bevor er sein Ziel erreicht. Korrektiv begrenzt den Schaden, wenn er eingetreten ist. Abschreckend bewirkt, dass weniger Versuche unternommen werden. Vermeidend entfernt die Angriffsfläche, sodass weniger anzugreifen ist.",
  "field.framework.help": "Aus welcher Bibliothek das stammt. Leer für eine eigene Maßnahme.",
  "field.implements.help": "Die Anforderungen, die diese Umsetzung beantwortet, wie der Herausgeber sie benennt. Stammt aus den Bausteindefinitionen der BSI. Für eine eigene Maßnahme stattdessen „Erfüllt Anforderungen“ benutzen.",
  "field.supporting_asset.help": "Sie können die Stufe für ein einzelnes Zielobjekt ändern, statt für die Anforderung überall. (STM.3.1)",
  "field.authorised_by.help": "Wer es freigegeben hat - jemand hoch genug, um die Pflichten gegeneinander abzuwägen. (UMS.5.1)",
  "field.soll.help": "Wie viele Maßnahmen der Plan zu diesem Datum umgesetzt hatte. Der Vergleich, den die Methode verlangt, geht gegen den Plan, nicht gegen die Gesamtzahl. (UMS.6.1)",
  "field.ist.help": "Wie viele zu diesem Datum tatsächlich umgesetzt waren. Festgehalten statt gezählt, weil eine Runde sagt, was damals galt, und das Register weiterläuft.",
  "field.kennzahl.help": "Welche Kennzahlen diese Runde ausgewertet hat. Die Zahlen bleiben bei der Kennzahl - hier steht, welche angesehen wurden. (UMS.6.1)",
  "field.verbesserung.help": "Die Korrekturen, die diese Runde angestoßen hat. Sie stehen im Verbesserungsregister mit Verantwortlichkeit, Datum und Wirksamkeitsprüfung. (UMS.6.1)",
  "field.planaenderung.help": "Was diese Runde geändert hat: Termine, Ressourcen, Prioritäten, aufgenommene oder gestrichene Maßnahmen, übernommene Erkenntnisse aus der Wirksamkeitsprüfung. (UMS.6.2)",
  "field.betrachtet.help": "Die Methode nennt vier: veränderte Geschäftsprozesse, neue IT-Komponenten, organisatorische Änderungen und äußere Einflüsse - neue Regulierung, ein verändertes Bedrohungsbild. (PERF.1.3)",
  "field.ergebnis.help": "Ob das Paket noch zum Informationsverbund passt, und wo nicht.",
  "field.anpassungen.help": "Was daraufhin an der Auswahl der Anforderungen geändert wurde. (PERF.1.3)",
  "field.neumodellierung.help": "Eine wesentliche Anpassung durchläuft den Zyklus der Strukturmodellierung erneut. Festzuhalten, welche Auswertungen das ausgelöst haben, macht die Geschichte des Pakets lesbar. (PERF.1.3)",
  "field.abgestimmt_mit.help": "Die Bereiche, mit denen die Auswertung abgestimmt wurde. Die Methode verlangt es, damit jede einschlägige Sicht darin vorkommt und nicht nur die des ISMS. (PERF.1.3)",
  "field.audit_type.help": "Intern durch eigene Leute, extern durch einen unabhängigen Dritten, oder anlassbezogen, weil etwas vorgefallen ist - ein Vorfall etwa. (PERF.3.1)",
  "field.ziel.help": "Was dieses Audit feststellen soll: ob die Anforderungen erfüllt sind, ob die Maßnahmen wirken, oder wo die Schwachstellen liegen. (PERF.3.1.1)",
  "field.umfang.help": "Was geprüft wird, über welchen Zeitraum und wie tief - welche Standorte, Abteilungen, Systeme. (PERF.3.1.4)",
  "field.requirement.help": "Nach Risiko planen: die Anforderungen, bei denen das Hinsehen am meisten bringen dürfte. (PERF.3.1.2)",
  "field.kriterien.help": "Wie Sie Nachweise erheben: Gespräche, Dokumente lesen, den Ablauf beobachten, technische Prüfungen. (PERF.3.1.1)",
  "field.auditteam.help": "Wer auditiert. Es muss den Gegenstand kennen und darf nicht an dem arbeiten, was es prüft. (PERF.3.1.3)",
  "field.bericht.help": "Wie das Audit durchgeführt wurde und was herauskam - Feststellungen, Abweichungen, Verbesserungspotenzial, und was funktioniert hat. (PERF.3.2)",
  "field.eignung.help": "Ob die Sicherheit, die Sie erreichen wollten, tatsächlich erreicht wird. Kurz halten: das liest die Leitung. (PERF.4.1)",
  "field.folgemassnahmen.help": "Was aus den Beschlüssen der letzten Bewertung geworden ist - erledigt, und haben sie gewirkt? (PERF.4.1.1)",
  "field.rahmenbedingungen.help": "Was sich seit der letzten Bewertung um das ISMS herum geändert hat und was das für es bedeutet - rechtlich, organisatorisch, technisch oder wirtschaftlich. Eine Änderung, die bis in die Risikobetrachtung oder das Anforderungspaket reicht, gehört hierher. (PERF.4.1.2)",
  "field.erfolge_probleme.help": "Was funktioniert hat und was nicht, im Sicherheitsprozess selbst - Maßnahmen, die gegriffen haben, erreichte Ziele, bestandene Audits, und dagegen die Vorfälle und was sie gekostet haben. (PERF.4.1.3)",
  "field.eignung_massnahmen.help": "Jedes Ziel gegen die Maßnahmen, die es erreichen sollen, und der Nachweis, dass sie es tun - Auditergebnisse, Vorfallanalysen, Tests. Wo nicht, sagen Sie, ob die Maßnahme geändert, ergänzt oder ersetzt wird. (PERF.4.1.5)",
  "field.rueckmeldungen.help": "Rückmeldungen zur Sicherheit von Kunden, Geschäftspartnern, Beschäftigten oder der Öffentlichkeit, und was daraus wurde. Befragungen, Beschwerden, Supportanfragen und öffentliche Bewertungen zählen alle; verlangt ist die Bewertung, nicht das Sammeln. (PERF.4.1.6)",
  "field.planstatus.help": "Wie weit die Maßnahmen gekommen sind und welches Risiko das tatsächlich gesenkt hat. Der Fortschritt des Plans steht je Anforderung; dies ist die Lesart darüber, die die Leitung sieht. (PERF.4.1.7)",
  "field.verbesserungen_bericht.help": "Was aufgrund einer Bewertung verbessert wurde: ob es durchgeführt wurde, wie es ins ISMS eingegangen ist - dokumentiert, in der Risikobetrachtung, in einem Verfahren verankert - und ob es die beabsichtigte Wirkung hatte. (PERF.4.1.8)",
  "field.massnahmenvorschlaege.help": "Was die Bewertung vorschlägt, in Reihenfolge, jeder mit einer belastbaren Schätzung dessen, was die Durchführung kostet. Ein Vorschlag ohne Schätzung ist ein Wunsch, über den die Leitung nicht entscheiden kann. (PERF.4.1.9)",
  "field.bedarf.help": "Was diese Partei von der Informationssicherheit braucht und was sie von ihr erwartet. Darum geht es in der Anforderung, nicht um den Namen. (GC.4.1, GC.4.2)",
  "field.relevanz.help": "Wie viel Gewicht die Forderungen dieser Partei haben, beurteilt statt angenommen - der Leitfaden verlangt, Relevanz und Priorität zu bewerten, bevor daraus etwas folgt.",
  "field.ableitung.help": "Die Anforderung, das Ziel oder die Maßnahme, die aus der Erwartung dieser Partei entstanden ist. Eine Analyse, aus der nichts folgt, war keine.",
  "field.ziele.help": "Die Ziele, die diese Leitlinie setzt, als die Kennzahlen, die sie messen. Die Methode verlangt sie konkret und messbar, und ihr eigenes Beispiel ist eine Kennzahl. (GC.5.1)",
  "field.strategie.help": "Wie die Institution diese Ziele erreichen will - der Gesamtansatz und die Grundsätze, mit der Leitung abgestimmt. (GC.5.1.1)",
  "field.verpflichtung.help": "Dass die Leitung die Gesamtverantwortung übernimmt, die Ziele bestätigt und überwacht und das ISMS fördert. In der Leitlinie wird das festgehalten. (GC.5.1.2)",
  "field.freigegeben_durch.help": "Wer in der Leitung sie in Kraft gesetzt hat. Die Methode verlangt, die Freigabe selbst zu dokumentieren. (GC.5.1.4)",
  "field.traeger.help": "Die Person oder die Organisationseinheit, die sie innehat. Eine Rolle, die niemand innehat, ist eine Rolle im Organigramm. (GC.9.1.1)",
  "field.stellvertreter.help": "Wer handelt, wenn der Träger es nicht kann. Die Methode verlangt das für jede einschlägige Rolle - eine Organisation, die stillsteht, wenn eine Person fehlt, war nie durchgängig. (GC.9.1.1.2)",
  "field.aufgaben.help": "Was diese Rolle tut, genau genug, dass ein anderer feststellen könnte, ob es getan wurde. (GC.9.1.1)",
  "field.befugnisse.help": "Was sie entscheiden und was sie verlangen darf. Aufgaben ohne Befugnis sind ein Wunsch. (GC.9.1.1)",
  "field.qualifikation.help": "Die Kenntnisse und Fähigkeiten, die der Träger braucht. Die Methode verlangt das je Träger, nicht je Organisation. (GC.9.1.1.4)",
  "field.unterstellt.help": "Wo sie in der Linie steht. Die Informationssicherheitsbeauftragten sind der Leitung unmittelbar unterstellt - das steht so in der Anforderung, und es ist der Teil, der am häufigsten stillschweigend verloren geht. (GC.9.1.1.1)",
  "field.vorspracherecht.help": "Ob diese Rolle ohne Zwischeninstanz zur Leitung sprechen kann. Leer heißt: niemand hat es geregelt. (GC.9.1.1.2 / GC.9.1.1.1.2)",
  "field.ressourcen.help": "Zeit, Budget und Personal. Verlangt ist nicht, dass die Rolle besteht, sondern dass sie handeln kann. (GC.9.1.1.1.1)",
  "field.interessenkonflikt.help": "Mit welchen Rollen diese nicht in einer Hand liegen darf - vor allem eine ausführende Rolle und die Rolle, die sie prüft oder freigibt. (GC.9.1.1.3)",
  "field.praktik.help": "Zu welcher der fünf ISMS-Praktiken dieses Verfahren gehört. Die Methode verlangt Verfahren in GC, UMS, VRB und PERF.",
  "field.anforderung.help": "Die Methodenanforderung, die dieses Verfahren beantwortet, mit ihrer Kennung - UMS.6.1, VRB.1.1, PERF.3.1. Mehrere, wenn es mehrere abdeckt.",
  "field.description.help": "Die Schritte darin, genau genug, dass jemand, der das Dokument nicht gelesen hat, feststellen kann, ob es befolgt wurde.",
  "field.dokument.help": "Wo es steht - das Dokument, seine Kennung, seine Version. Ein Verfahren, auf das niemand zeigen kann, ist eines, dem niemand folgen kann. (GC.11.1)",
  "field.freigegeben_am.help": "Wann es in Kraft gesetzt wurde, und damit, wer dahintersteht. (GC.1.2)",
  "field.letzte_pruefung.help": "Wann es zuletzt gegen das gelesen wurde, was die Institution tatsächlich tut. Ein Verfahren, das seit dem Verfassen niemand angesehen hat, ist ein Dokument, kein Verfahren.",
  "field.wiederauftreten.help": "Ob das nach heutigem Stand erneut geschehen kann. Leer heißt: niemand hat es geprüft - die Methode verlangt die Prüfung, Schweigen ist also keine Antwort. (VRB.2.1)",
  "field.isms_anpassung.help": "Ob deswegen das Managementsystem selbst geändert werden muss, nicht nur der Einzelfall. (VRB.2.2)",
  "field.abweichung.help": "Die Abweichung, deren Ursache dies beseitigt. Eine Korrektur ohne Abweichung ist entweder eine Verbesserung oder eine Handlung, die niemand zurückverfolgen kann. (VRB.4.1)",
  "field.vorteile_nachteile.help": "Was das bringt und was es kostet, gegeneinander abgewogen. Die Methode verlangt die Abwägung, nicht nur die Entscheidung. (VRB.3.1, VRB.4.2)",
  "field.wirksamkeit.help": "Was eine Prüfung im Nachhinein ergeben hat. Leer heißt: nicht geprüft, was die Methode für eine als erledigt gemeldete Handlung nicht zulässt. (VRB.6.1)",
  "field.wirksamkeit_ergebnis.help": "Wie die Wirksamkeit geprüft wurde und was sie ergab - der Nachweis hinter dem Urteil daneben. (VRB.6.1, VRB.6.2)",

  // The same field key, a different text depending on where it stands.
  // supporting_asset
  "field.supporting_asset.begruendung.help": "Warum diese Klasse und keine andere. Wer das Paket prüft, liest hier nach, ob die Wahl trägt. (Leitfaden 3.4.2)",
  // niveau_review
  "field.niveau_review.begruendung.help": "Warum die Stufe, die der Katalog gesetzt hat, hier nicht passt. (STM.3.1)",
  // exception
  "field.exception.begruendung.help": "Warum die Anforderung nicht umgesetzt wird. Das liest später jemand, um eine Entscheidung nachzuvollziehen, die rechtlich Gewicht haben kann. (UMS.5.2)",
  // supporting_asset
  "field.supporting_asset.scope.help": "Ob dieser Eintrag zum untersuchten Geltungsbereich gehört. Außerhalb bleibt der Eintrag mitsamt seiner Bewertung erhalten und fällt aus jeder Zählung, jeder Grafik und jeder Kennzahl heraus.",
  // feared_event
  "field.feared_event.scope.help": "Ob dieser Eintrag zum untersuchten Geltungsbereich gehört. Außerhalb bleibt der Eintrag mitsamt seiner Bewertung erhalten und fällt aus jeder Zählung, jeder Grafik und jeder Kennzahl heraus.",
  // requirement
  "field.requirement.scope.help": "Ob diese Anforderung zu Ihrem Paket gehört. Die Ableitung schaltet ein, was Ihre Zielobjekte hereinziehen, und die Begründung nennt das Zielobjekt, das es getan hat. Der Rest bleibt aus, bis Sie entscheiden, dass er gilt - und wenn Sie entscheiden, dass er nicht gilt, schreiben Sie warum. (STM.2.1.4, STM.2.1.5)",
  // risk_origin
  "field.risk_origin.scope.help": "Ob dieser Eintrag zum untersuchten Geltungsbereich gehört. Außerhalb bleibt der Eintrag mitsamt seiner Bewertung erhalten und fällt aus jeder Zählung, jeder Grafik und jeder Kennzahl heraus.",
  // strategic_scenario
  "field.strategic_scenario.scope.help": "Ob dieser Eintrag zum untersuchten Geltungsbereich gehört. Außerhalb bleibt der Eintrag mitsamt seiner Bewertung erhalten und fällt aus jeder Zählung, jeder Grafik und jeder Kennzahl heraus.",
  // operational_scenario
  "field.operational_scenario.scope.help": "Ob dieser Eintrag zum untersuchten Geltungsbereich gehört. Außerhalb bleibt der Eintrag mitsamt seiner Bewertung erhalten und fällt aus jeder Zählung, jeder Grafik und jeder Kennzahl heraus.",
  // kill_chain_step
  "field.kill_chain_step.scope.help": "Ob dieser Eintrag zum untersuchten Geltungsbereich gehört. Außerhalb bleibt der Eintrag mitsamt seiner Bewertung erhalten und fällt aus jeder Zählung, jeder Grafik und jeder Kennzahl heraus.",
  // risk_treatment
  "field.risk_treatment.scope.help": "Ob dieser Eintrag zum untersuchten Geltungsbereich gehört. Außerhalb bleibt der Eintrag mitsamt seiner Bewertung erhalten und fällt aus jeder Zählung, jeder Grafik und jeder Kennzahl heraus.",
  // security_measure
  "field.security_measure.scope.help": "Die BSI veröffentlicht, was ihre Anforderungen umsetzt, und es steht vollständig hier, damit es auffindbar ist. Schalten Sie ein, was Sie tatsächlich einsetzen; der Rest bleibt sichtbar für den Tag, an dem er relevant wird.",
  // requirement
  "field.requirement.params.help": "Was der Katalog Ihnen zum Ausfüllen lässt - eine Frist, eine Rolle, ein Standard. Der Formulierungsvorschlag steht bereits im Anforderungstext, in «Guillemets». (STM.5.1)",
  // risk_origin
  "field.risk_origin.params.help": "STM.5.1. Was der Katalog der Institution überlässt, als Kennung und Formulierungsvorschlag. Der Vorschlag steht bereits im Anforderungstext, in Guillemets.",
  // requirement
  "field.requirement.parameter_values.help": "Was Sie festgelegt haben und wer es entschieden hat. Solange die Parameter offen sind, ist die Anforderung noch nicht die Ihre.",
  // risk_origin
  "field.risk_origin.parameter_values.help": "Was diese Institution festgelegt hat und durch wessen Entscheidung. Eine Anforderung mit offenen Parametern ist noch keine Anforderung dieser Institution.",
  // requirement
  "field.requirement.prioritaet.help": "Wann das dran ist, neben allem anderen. Zu entscheiden aus dem Risiko, aus dem, worauf es wartet, und aus den Leuten, die Sie haben. Die Aufwandsstufe des Katalogs sagt, was es kostet, nicht wann es fällig ist. (UMS.2.2)",
  // verbesserung
  "field.verbesserung.prioritaet.help": "Wo das neben den anderen steht. Die Methode verlangt es für Korrekturen wie für Verbesserungen. (VRB.5.1)",
  // requirement
  "field.requirement.faellig.help": "Ein Datum, das sich halten lässt, gemessen am Umfang der Arbeit, an den Leuten und daran, worauf sie wartet. Wenn es verstreicht, muss darauf reagiert werden. (UMS.4.1)",
  // paket_review
  "field.paket_review.faellig.help": "Wann diese Auswertung fällig ist - in der Regel ein Jahr nach der letzten, und den Abstand setzt die Institution nach Größe und Tiefe selbst. Verstrichen und nicht durchgeführt ist eine Feststellung. (PERF.1.3)",
  // niveau_review
  "field.niveau_review.risk_considered.help": "Eine Stufe von erhöht auf normal-SdT zu senken ist einer der Fälle, in denen die Methode eine Risikobetrachtung verlangt. (STM.4.1)",
  // exception
  "field.exception.risk_considered.help": "Eine Anforderung nicht umzusetzen ist einer der Fälle, in denen die Methode eine Risikobetrachtung verlangt. (STM.4.1)",
  // nachverfolgung
  "field.nachverfolgung.verfahren.help": "Das verankerte Verfahren, dem diese Runde folgt. UMS.6.1 verlangt das Verfahren; eine Runde außerhalb davon ist ein Bericht, kein Prozess.",
  // paket_review
  "field.paket_review.verfahren.help": "Das verankerte Verfahren zum Messen und Bewerten des ISMS. (PERF.1.1)",
  // nachverfolgung
  "field.nachverfolgung.durchgefuehrt_am.help": "Wann diese Runde tatsächlich gelaufen ist. Für eine noch geplante leer lassen - eine terminierte, noch nicht durchgeführte Runde ist der ehrliche Zustand.",
  // paket_review
  "field.paket_review.durchgefuehrt_am.help": "Wann das Paket tatsächlich erneut gelesen wurde. Für eine noch geplante leer lassen.",
  // nachverfolgung
  "field.nachverfolgung.ursache.help": "Was die Analyse hinter der Lücke zwischen fällig und umgesetzt gefunden hat. Die Methode fragt nach der Ursache, nicht nach der Feststellung, dass es eine Lücke gibt. (UMS.6.1)",
  // abweichung
  "field.abweichung.ursache.help": "Was das ermöglicht hat, nicht was passiert ist. Eine Korrektur, die das Symptom beseitigt, lässt die Ursache stehen. (VRB.2.1, VRB.4.1)",
  // nachverfolgung
  "field.nachverfolgung.kommuniziert_an.help": "Wem das Ergebnis mitgeteilt wurde. Eine Runde, deren Zahlen bei dem geblieben sind, der sie zusammengetragen hat, hat nichts verändert. (UMS.6.1)",
  // managementbericht
  "field.managementbericht.kommuniziert_an.help": "Welchen interessierten Parteien mitgeteilt wurde, was das Audit ergeben hat. Verlangt ist die Unterrichtung, und ein Audit, dessen Ergebnis beim Auditor geblieben ist, hat nichts verändert. (PERF.3.2.2)",
  "field.managementbericht.audit.help": "Die Audits, die diese Bewertung liest. Jedes trägt seinen eigenen Bericht, deshalb genügt es, sie hier zu benennen, wie PERF.4.1.4 es verlangt - die Abweichungen, das Verbesserungspotenzial und die bereits erfolgten Korrekturen stehen im Audit und werden hier nicht wiederholt. (PERF.4.1.4)",
  // abweichung
  "field.abweichung.audit.help": "Das Audit, das dies festgestellt hat, damit die Feststellung darauf zurückgeführt werden kann. (PERF.3.2, VRB.2)",
  // partei
  "field.partei.art.help": "Extern: Gesetzgeber, Aufsichtsbehörden, Kunden, Dienstleister, die Öffentlichkeit. Intern: die Leitung, die Informationssicherheitsbeauftragten, der Datenschutzbeauftragte, Beschäftigte, Führungskräfte, der Betriebsrat. (GC.4.1, GC.4.2)",
  // rolle
  "field.rolle.art.help": "Die Methode verlangt Rollen, Verantwortlichkeiten und Gremien (GC.9.1) und dass die Schnittstellen zu Datenschutz, physischer Sicherheit, Geheimschutz und Arbeitsschutz mit ihnen verankert werden.",
  // verbesserung
  "field.verbesserung.art.help": "Eine Korrektur beseitigt die Ursache eines Fehlers (VRB.4.1). Eine Verbesserung greift ein Potenzial auf, zu dem niemand gezwungen war (VRB.4.2, VRB.3.1).",
  // rolle
  "field.rolle.status.help": "Einschalten, sobald die Rolle besetzt und in Kraft ist. Die noch offenen ausgeschaltet festzuhalten, macht die Lücke sichtbar.",
  // verfahren
  "field.verfahren.status.help": "Einschalten, sobald das Verfahren schriftlich vorliegt und in Kraft ist. Die noch offenen ausgeschaltet festzuhalten, macht die Lücke sichtbar.",

  // ── the words on a scale ───────────────────────────────────────────────────
  //
  // Fourteen fields, five distinct lists, and no field key carries two of them - so the
  // SHARED key is enough here, and it has the advantage that it is found at the call sites
  // which do not hand over the type (the heatmap, the change history, the factor trace).
  // Where a key did carry two lists, this would have to be type-specific, as the value
  // readings above are: five types declare a `status` and no two mean the same by it.
  "field.criticality.scale": ["gering", "mittel", "hoch", "kritisch"],
  "field.capability.scale": ["gering", "mittel", "hoch", "kritisch"],
  "field.resources.scale": ["gering", "mittel", "hoch", "kritisch"],
  "field.activity.scale": ["gering", "mittel", "hoch", "kritisch"],
  "field.relevance.scale": ["gering", "mittel", "hoch", "kritisch"],
  "field.difficulty.scale": ["gering", "mittel", "hoch", "kritisch"],
  "field.priority.scale": ["gering", "mittel", "hoch", "kritisch"],
  "field.relevanz.scale": ["gering", "mittel", "hoch", "kritisch"],
  "field.schwere.scale": ["gering", "mittel", "hoch", "kritisch"],
  "field.severity.scale": ["vernachlässigbar", "spürbar", "schwer", "existenzbedrohend"],
  "field.gravity.scale": ["vernachlässigbar", "spürbar", "schwer", "existenzbedrohend"],
  "field.likelihood.scale": ["gering", "möglich", "wahrscheinlich", "nahezu sicher"],
  "field.implementation_level.scale": ["keine", "teilweise", "weitgehend", "vollständig"],

  // ── the checks this profile declares ───────────────────────────────────────
  //
  // Thirty-two of them, and they are this product's own: they read the method and say what
  // a study still owes it. The twenty-one that lint.ts declares are NOT here - those are the
  // engine's text and are answered from its own table, or both products would translate the
  // same sentences twice and drift apart at the first correction.
  //
  // The requirement identifiers stay as they are printed. They are what a reader looks up.
  "check.gspp-high-need-unassessed.title": "Geschäftsprozesse mit Schutzbedarf hoch ohne Risikobetrachtung",
  "check.gspp-high-need-unassessed.hint": "Ein Prozess mit Schutzbedarf hoch verlangt eine Risikobetrachtung. "
    + "Ergänzen Sie ein Bedrohungsszenario, das ihn benennt - oder senken Sie den Schutzbedarf und schreiben Sie auf, warum. (GC.7.2)",
  "check.gspp-unimplemented-unexcepted.title": "Nicht umgesetzte Anforderungen ohne Ausnahme",
  "check.gspp-unimplemented-unexcepted.hint": "Eine Anforderung, die Sie nicht umgesetzt haben, braucht entweder "
    + "eine genehmigte Ausnahme oder ein festgehaltenes Restrisiko. Legen Sie die Ausnahme an, oder schreiben Sie auf, was Sie tragen. (UMS.5, STM.4.1)",
  "check.gspp-nonconformity-uncorrected.title": "Abweichungen in Bearbeitung ohne Maßnahme dagegen",
  "check.gspp-nonconformity-uncorrected.hint": "Erfassen Sie die Korrekturmaßnahme, die die Ursache beseitigt, "
    + "und geben Sie ihr eine Priorität und eine verantwortliche Person. (VRB.4.1, VRB.5.1)",
  "check.gspp-asset-without-requirement.title": "Zielobjekte, die keine Anforderung des Katalogs erreicht",
  "check.gspp-asset-without-requirement.hint": "Der Katalog führt keine Anforderung für dieses Zielobjekt. "
    + "Formulieren Sie eine eigene entlang der Sicherheitsziele - Vertraulichkeit, Integrität, Verfügbarkeit - und schreiben Sie auf, "
    + "warum Grundschutz++ es nicht abdeckt. Das ist zugleich ein Fall, in dem die Methode eine Risikobetrachtung will. (STM.2.1.6, STM.4.1)",
  "check.gspp-package-review-overdue.title": "Fällige Paketprüfungen, die nicht gehalten wurden",
  "check.gspp-package-review-overdue.hint": "Der Termin, zu dem diese Prüfung geschuldet war, ist vorbei. "
    + "Halten Sie sie und halten Sie fest, was sie ergeben hat, oder verlegen Sie den Termin und schreiben Sie auf, warum. (PERF.1.3)",
  "check.gspp-package-review-unrecorded.title": "Gehaltene Paketprüfungen ohne Ergebnis oder abgestimmte Bereiche",
  "check.gspp-package-review-unrecorded.hint": "Halten Sie fest, was die Prüfung ergeben hat und mit wem sie abgestimmt wurde. "
    + "Die Methode verlangt jede relevante Sicht darin, nicht nur die des ISMS. (PERF.1.3)",
  "check.gspp-package-review-adjusted-unmodelled.title": "Paketprüfungen, die die Auswahl angepasst haben, ohne die Modellierung zu nennen",
  "check.gspp-package-review-adjusted-unmodelled.hint": "Halten Sie fest, ob die Anpassung die Modellierung erneut vorgenommen hat. "
    + "Eine wesentliche tut das, und genau das macht die Geschichte des Pakets lesbar. (PERF.1.3)",
  "check.gspp-tracking-without-comparison.title": "Nachverfolgungen ohne Soll und Ist",
  "check.gspp-tracking-without-comparison.hint": "Halten Sie fest, wie viele Maßnahmen der Plan zu diesem Termin "
    + "umgesetzt hatte und wie viele es waren. Der Vergleich ist der Zweck der Nachverfolgung. (UMS.6.1)",
  "check.gspp-tracking-uncommunicated.title": "Nachverfolgungen, die niemandem mitgeteilt wurden",
  "check.gspp-tracking-uncommunicated.hint": "Benennen Sie, wem das Ergebnis mitgeteilt wurde. Eine Runde, deren "
    + "Zahlen bei der erfassenden Person geblieben sind, hat nichts verändert. (UMS.6.1)",
  "check.gspp-tracking-unanchored.title": "Nachverfolgungen außerhalb jedes Verfahrens",
  "check.gspp-tracking-unanchored.hint": "Weisen Sie die Runde dem Verfahren zu, unter dem sie läuft. UMS.6.1 "
    + "verlangt ein verankertes Verfahren; eine Runde ohne eines ist ein Bericht. (UMS.6.1)",
  "check.gspp-tracking-cause-without-plan-change.title": "Nachverfolgungen mit erkannter Ursache, aber unverändertem Plan",
  "check.gspp-tracking-cause-without-plan-change.hint": "Halten Sie fest, was für den Plan folgte - Termine, Mittel, "
    + "Prioritäten, aufgenommene oder gestrichene Maßnahmen. Oder halten Sie fest, dass er so bleibt, und warum. (UMS.6.2)",
  "check.gspp-struck-without-reason.title": "Aus dem Paket gestrichene Anforderungen ohne festgehaltenen Grund",
  "check.gspp-struck-without-reason.hint": "Der Katalog nennt für diese Anforderung keine Zielobjektkategorie, und "
    + "Sie haben sie herausgenommen. Schreiben Sie in die Begründung, warum sie nicht zutrifft - oder nehmen Sie sie auf. (STM.2.1.5)",
  "check.gspp-relevant-without-owner.title": "Nach Einschätzung aufgenommene Anforderungen ohne Prozess oder Verantwortung",
  "check.gspp-relevant-without-owner.hint": "Diese haben Sie selbst aufgenommen, also braucht sie die Geschäftsprozesse, "
    + "für die sie gilt, und eine verantwortliche Person. (STM.2.1.5)",
  "check.gspp-open-without-owner-or-date.title": "Offene Anforderungen ohne Verantwortliche oder ohne Termin",
  "check.gspp-open-without-owner-or-date.hint": "Halten Sie fest, wer das umsetzt und bis wann. Ein Termin, der "
    + "verstreicht, muss aufgegriffen werden. (UMS.3.1, UMS.4.1)",
  "check.gspp-audit-without-report.title": "Gehaltene Audits ohne Bericht",
  "check.gspp-audit-without-report.hint": "Dieses Audit wurde durchgeführt, hat aber keinen Bericht. Halten Sie fest, "
    + "wie vorgegangen wurde und was herauskam - Abweichungen, Verbesserungspotenzial und was getragen hat. (PERF.3.2)",
  "check.gspp-audit-unplanned.title": "Audits ohne Ziel, Umfang oder Team",
  "check.gspp-audit-unplanned.hint": "Legen Sie Ziel, Umfang und Methoden vor dem Audit fest und benennen Sie ein "
    + "Team, das nicht an dem arbeitet, was es prüft. (PERF.3.1.1, PERF.3.1.3)",
  "check.gspp-own-requirement-unjustified.title": "Eigene Anforderungen ohne Begründung, warum der Katalog nicht genügt",
  "check.gspp-own-requirement-unjustified.hint": "Eine eigene Anforderung muss sagen, warum der Katalog nicht ausreicht, "
    + "für welches Zielobjekt sie gilt und auf welche Schutzziele sie wirkt - Vertraulichkeit, Integrität, Verfügbarkeit. (STM.2.1.6)",
  "check.gspp-compliance-requirement-unsourced.title": "Compliance-Anforderungen ohne benannte Verpflichtung",
  "check.gspp-compliance-requirement-unsourced.hint": "Benennen Sie das Gesetz oder den Vertrag, aus dem diese "
    + "Anforderung stammt, und die Geschäftsprozesse, für die sie gilt. (STM.2.1.7)",
  "check.gspp-audit-not-communicated.title": "Durchgeführte Audits, deren Ergebnisse niemandem mitgeteilt wurden",
  "check.gspp-audit-not-communicated.hint": "Halten Sie fest, welche Interessierten worüber informiert wurden. Die "
    + "Anforderung ist, sie zu informieren. (PERF.3.2.2)",
  "check.gspp-report-without-proposals.title": "Managementberichte ohne priorisierte Vorschläge",
  "check.gspp-report-without-proposals.hint": "Halten Sie fest, was die Bewertung vorschlägt, in welcher Reihenfolge, "
    + "und was die Umsetzung jeweils voraussichtlich kostet. Ein Vorschlag ohne Abschätzung ist nichts, worüber eine Leitung entscheiden kann. (PERF.4.1.9)",
  "check.gspp-policy-unauthorised.title": "In Kraft gesetzte Leitlinie ohne dokumentierte Freigabe",
  "check.gspp-policy-unauthorised.hint": "Halten Sie fest, wer aus der Leitung sie in Kraft gesetzt hat und wann. Die "
    + "Methode verlangt, dass die Freigabe selbst dokumentiert ist, nicht nur, dass sie stattgefunden hat. (GC.5.1.4)",
  "check.gspp-policy-without-substance.title": "Leitlinie ohne Ziele, Strategie oder Verpflichtung",
  "check.gspp-policy-without-substance.hint": "Benennen Sie die messbaren Ziele, die sie setzt, wie die Institution "
    + "sie erreichen will, und worauf sich die Leitung verpflichtet. (GC.5.1, GC.5.1.1, GC.5.1.2)",
  "check.gspp-party-unanalysed.title": "Interessierte Parteien ohne Anforderungen oder Gewichtung",
  "check.gspp-party-unanalysed.hint": "Halten Sie fest, was diese Partei von der Informationssicherheit erwartet und "
    + "welches Gewicht ihre Forderungen haben. Verlangt ist eine Analyse, keine Liste. (GC.4.1, GC.4.2)",
  "check.gspp-role-unassigned.title": "In Kraft gesetzte Rollen ohne Träger oder Befugnisse",
  "check.gspp-role-unassigned.hint": "Benennen Sie, wer sie innehat, worüber sie entscheiden darf und was ihr Träger "
    + "können muss. Eine Rolle mit nur einem Namen ist ein Kasten im Organigramm. (GC.9.1.1, GC.9.1.1.4)",
  "check.gspp-role-without-deputy.title": "In Kraft gesetzte Rollen ohne Vertretung",
  "check.gspp-role-without-deputy.hint": "Halten Sie fest, wer handelt, wenn der Träger es nicht kann. Die Methode "
    + "verlangt es für jede relevante Rolle, weil eine Organisation, die bei Abwesenheit einer Person stehenbleibt, nie durchgängig war. (GC.9.1.1.2)",
  "check.gspp-isb-without-standing.title": "Informationssicherheitsbeauftragte ohne die von der Methode verlangte Stellung",
  "check.gspp-isb-without-standing.hint": "Der ISB ist der Leitung unmittelbar verantwortlich, kann ohne Zwischenstufe "
    + "an sie berichten und verfügt über Mittel zum Handeln. Halten Sie alle drei fest. (GC.9.1.1.1, GC.9.1.1.1.1, GC.9.1.1.1.2)",
  "check.gspp-procedure-unanchored.title": "In Kraft gesetzte Verfahren ohne Grundlage",
  "check.gspp-procedure-unanchored.hint": "Halten Sie fest, wo das niedergeschrieben ist und wer es verantwortet. Ein "
    + "Verfahren, auf das man nicht zeigen kann, ist eine Absichtserklärung. (GC.11.1)",
  "check.gspp-procedure-unattributed.title": "Verfahren ohne die Anforderung, die sie beantworten",
  "check.gspp-procedure-unattributed.hint": "Benennen Sie die Anforderung der Methode, die dieses Verfahren verankert - "
    + "UMS.6.1, VRB.1.1, PERF.3.1. Ohne sie ist das Dokument nicht als Antwort auf etwas lesbar.",
  "check.gspp-nonconformity-uncaused.title": "Abweichungen ohne Ursache und ohne Wiederholungsbewertung",
  "check.gspp-nonconformity-uncaused.hint": "Halten Sie fest, was das ermöglicht hat und ob es unter den heutigen "
    + "Umständen erneut geschehen kann. Eine Korrektur, die das Symptom beseitigt, lässt die Ursache stehen. (VRB.2.1)",
  "check.gspp-improvement-unprioritised.title": "Korrektur- und Verbesserungsmaßnahmen ohne Priorität",
  "check.gspp-improvement-unprioritised.hint": "Halten Sie fest, wo diese neben den anderen steht. Die Methode verlangt "
    + "es für Korrekturen und Verbesserungen gleichermaßen. (VRB.5.1)",
  "check.gspp-improvement-untested.title": "Als erledigt gemeldete Maßnahmen ohne Wirksamkeitsprüfung",
  "check.gspp-improvement-untested.hint": "Diese wurde durchgeführt. Prüfen Sie, ob sie gewirkt hat, und halten Sie "
    + "fest, was die Prüfung ergeben hat - erledigt ist nicht dasselbe wie wirksam. (VRB.6.1)",
  "check.gspp-downgrade-unconsidered.title": "Ohne Risikobetrachtung gesenkte Sicherheitsniveaus",
  "check.gspp-downgrade-unconsidered.hint": "Sie haben ein Niveau von erhöht auf normal-SdT gesenkt. Das ist einer der "
    + "Fälle, in denen die Methode eine Risikobetrachtung will: halten Sie sie fest und schreiben Sie auf, warum Sie gesenkt haben. (STM.4.1)",

  // ── the six steps of the method ────────────────────────────────────────────
  "group.gc.label": "Rahmen und Planung",
  "group.gc.description": "Schritt 1 - der Kontext der Institution, der Geltungsbereich, "
    + "die Rollen und der Schutzbedarf ihrer Geschäftsprozesse (Praktik GC)",
  "group.stm.label": "Anforderungsanalyse",
  "group.stm.description": "Schritt 2 - der Informationsverbund, seine Zielobjekte, deren "
    + "Zielobjektkategorien und das daraus folgende Anforderungspaket (Praktik STM)",
  "group.risk.label": "Risikobetrachtung",
  "group.risk.description": "Der Zweig aus Schritt 2, betreten über einen von vier Anlässen: "
    + "ein hoher Schutzbedarf, ein gesenktes Sicherheitsniveau, eine nicht umgesetzte "
    + "Anforderung oder ein Zielobjekt, das der Katalog nicht abdeckt",
  // Umsetzung, Monitoring-Evaluation and Verbesserung are the practice names as the BSI
  // publishes them; the step wording follows them here rather than translating around them.
  "group.ums.label": "Umsetzung",
  "group.ums.description": "Schritt 3 - Umsetzungsstand, Maßnahmen, Verantwortliche und "
    + "Termine (Praktik UMS)",
  "group.perf.label": "Monitoring",
  "group.perf.description": "Schritt 4 - Kennzahlen, Audits und Wirksamkeit (Praktik PERF)",
  "group.vrb.label": "Verbesserung",
  "group.vrb.description": "Schritt 5 - Abweichungen und Korrekturmaßnahmen (Praktik VRB)",
};

/** The tables this product brings, by language. German only: English needs none, because a
 *  key nothing answers shows what the taxonomy itself says, and the taxonomy is authored in
 *  English. The readings for the published BSI values move into an `en` table here when the
 *  call sites go through the helpers - they are this product's gloss, not the publisher's. */
/** The fields whose `options` ALREADY hold what the BSI publishes, and whose authored
 *  `optionLabels` give the English reading. A German reader must see the published value,
 *  so the German table answers with the values themselves - derived from the taxonomy, not
 *  retyped, which is why a list here can never be the wrong length. Without it the authored
 *  fallback wins and a German interface shows the English gloss of a German vocabulary. */
const PUBLISHED_AS_STORED: Overlay = Object.fromEntries(
  DEFAULT_TAXONOMY.entityTypes.flatMap((t) => t.fields
    .filter((f) => f.type === "enum" && f.optionLabels && f.options?.length)
    .map((f) => [`field.${t.key}.${f.key}.options`, f.options as string[]])),
);

export const WORDS: Record<string, Overlay> = {
  de: { ...PUBLISHED_AS_STORED, ...DE },
  // EMPTY, AND IT HAS TO BE HERE. resolveLanguage offers only the languages this product
  // names; without an entry, a browser asking for English is answered with the product
  // default, which is German - English would be unreachable in a product that is meant to
  // have both. Every key falls through to what the taxonomy says, and the taxonomy is
  // authored in English, so the table has nothing to hold. The readings for the published
  // BSI values join it when the option call sites go through the helper.
  en: {},
};
