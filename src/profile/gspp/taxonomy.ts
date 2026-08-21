// The Grundschutz++ taxonomy.
//
// The vocabularies below are the BSI's own, not paraphrased. Where a name here differs
// from the BSI's, that is a bug. They are also DATED: the lists carry the state of the
// catalogue named in VOCABULARY_SOURCE (below), and `npm run vocab:sync` re-derives them
// from the published file. A field that says where its values come from can be refreshed
// in a running installation as well, through the catalogue import.
//
// THREE RULES THIS FILE FOLLOWS
//
// 1. Entity KEYS are the engine's contract, not labels. quantModel.ts, killchain.ts,
//    catalog.ts and CanvasView.tsx look types up by key, so `supporting_asset` stays
//    `supporting_asset` and is merely labelled "Zielobjekt". Concepts the engine has no
//    key for get new ones: praktik, kennzahl, abweichung.
//
// 2. Field keys on `requirement` are the OSCAL PROPERTY NAMES the BSI catalogue uses -
//    modal_verb, effort_level, sec_level, confidentiality, integrity, availability,
//    authenticity, threats, documentation, result, action_word, tags. src/domain/catalog.ts
//    writes a property into the field of the same name, so importing the published
//    catalogue fills these without any mapping step. Renaming one of them silently drops
//    that column on import. `alt-identifier` is deliberately NOT declared: it is a UUID
//    with no use here, and leaving it undeclared is how a property gets ignored.
//
// 3. A field whose values belong to the BSI declares WHERE they come from (`vocabulary`):
//    a catalogue property name, or "@groups" for the catalogue's own top-level grouping,
//    which is what the practices are. That one declaration serves three things - the
//    option list can be refreshed from the source, an imported requirement gets the value
//    written into it, and vocab-sync can re-derive the lists below. A list without the
//    declaration is a copy that ages in silence.
import type { Taxonomy } from "../../domain/types";
import { EFFECT_CLASSES } from "../../domain/controls";
import { VOCABULARY } from "./vocabulary.generated";
import { CATEGORY_EN, PRACTICE_EN, VALUE_EN, labelsFor } from "./terms";

// The BSI's four published namespaces, re-derived by `npm run vocab:sync` and dated in
// vocabulary.generated.ts. Not typed out here: a hand-kept copy of someone else's list
// ages without anything failing.
const { praktiken: PRAKTIKEN, zielobjektkategorien: ZIELOBJEKTKATEGORIE,
  secLevel: SEC_LEVEL, modalVerb: MODAL_VERB } = VOCABULARY;

// GC.7.1: "Hierbei wird zwischen dem Schutzbedarf "normal" und "hoch" unterschieden." TWO
// levels, and they are set on the business process or the information - not per asset and
// not per security objective. An asset's level is carried by the requirement's sec_level
// ("Eine Klassifizierung des Schutzbedarfs der Zielobjekte erfolgt auf Anforderungsebene").
// The three-level scale is classic IT-Grundschutz; "sehr hoch" does not occur once in the
// 368 KB method catalogue. The values stay as the BSI writes them.
const SCHUTZBEDARF = ["normal", "hoch"];
// UMS.1.1: "Der Umsetzungsstatus einer Anforderung kann grundsätzlich nur "umgesetzt"
// ("ja") oder "nicht umgesetzt" ("nein") sein." Not a scale: "teilweise" is what the
// method replaces with a dependency rule - a requirement counts as met only when it and
// everything it depends on are met. An exception is recorded as an exception (UMS.5), not
// as a third status.
const UMSETZUNG = ["ja", "nein"];
// Risikobehandlung, the four options BSI 200-3 and ISO 27005 both name. These four VALUES
// are engine contract, not labels: treatment.ts derives the residual risk by comparing the
// stored value against "Accept", "Avoid" and "Share", and treats everything else as
// reduction. Translated values would put every accepted risk on the reduction path without
// an error - Akzeptanz would move the risk down the matrix as though measures acted on it.
const BEHANDLUNG = ["Reduce", "Accept", "Share", "Avoid"];

const SCALE = ["low", "moderate", "high", "critical"];
const LIKELIHOOD = ["low", "possible", "likely", "near-certain"];
const GRAVITY = ["negligible", "noticeable", "severe", "existential"];
const TREAT_STATUS = ["Proposed", "In progress", "Implemented", "Verified"];
const TACTICS = [
  "Reconnaissance", "Resource Development", "Initial Access", "Execution", "Persistence",
  "Privilege Escalation", "Defense Evasion", "Credential Access", "Discovery", "Lateral Movement",
  "Collection", "Command and Control", "Exfiltration", "Impact",
];

export const TAXONOMY_SCHEMA_VERSION = 2;

export const DEFAULT_TAXONOMY: Taxonomy = {
  schemaVersion: TAXONOMY_SCHEMA_VERSION,
  name: "Grundschutz++",
  description: "Information security to the BSI's Grundschutz++ method. The groups are the five process steps of the method; the vocabularies are the BSI's own.",
  // STM.2.1.4.1: the categories are a tree, and every parent up to the root joins an
  // asset's categories before its requirements are collected. Generated with the list
  // itself, so the two cannot drift apart.
  vocabularyHierarchy: { target_object_categories: VOCABULARY.parentCategory },
  // UMS.1.1 tracks implementation through the requirement's own status, and measures act
  // on the attack chain rather than on requirements. Against a package of several hundred,
  // "not fulfilled by any measure" would report the whole ruleset as a finding and say
  // nothing. The check is right for a curated framework of thirty controls; it is not
  // right for this method.
  checksOff: ["req-uncovered"],
  // A requirement examined and found not to apply is a decision of the study (STM.2.1.5);
  // the concept states what applies. The count left out is printed, so nothing is hidden.
  reportSkip: [
    { type: "requirement", field: "scope", values: ["out of scope"] },
    { type: "security_measure", field: "scope", values: ["not in use"] },
  ],
  // Present, not in play: the whole ruleset is in the study, and what no rule has reached
  // is set back rather than hidden - a register you cannot see cannot be extended.
  dimWhen: [
    { type: "requirement", field: "scope", values: ["out of scope", ""] },
    // A measure that acts on an attack step is in use by that very fact - the chain view
    // switches it on when it is put there. Letting it be switched off again while it still
    // sits on a step would leave the study saying two things at once, so the switch is
    // refused until the measure is taken off the chain.
    { type: "security_measure", field: "scope", values: ["not in use", ""], lockedWhile: ["covers"] },
  ],
  // GC.7.2 and STM.4.1 name the points at which the method leaves the catalogue and enters
  // a risk consideration. Three of the four are states of a record, so they are checked
  // rather than remembered. The fourth - a security level lowered from erhöht to
  // normal-SdT - is a change rather than a state, and is visible in the change history.
  followUps: [
    {
      id: "gspp-high-need-unassessed",
      title: "Business processes rated hoch with no risk consideration",
      hint: "A process rated hoch needs a risk consideration. Add a threat scenario that names it - or lower the rating and say why. (GC.7.2)",
      severity: "high",
      when: { type: "business_asset", field: "protection_need", values: ["hoch"] },
      require: { type: "feared_event", field: "business_asset" },
    },
    {
      id: "gspp-unimplemented-unexcepted",
      title: "Requirements not implemented and not excepted",
      hint: "A requirement you have not implemented needs either an approved exception or a stated residual risk. Add the exception, or write down what you are carrying. (UMS.5, STM.4.1)",
      severity: "medium",
      when: { type: "requirement", field: "umsetzung", values: ["nein"] },
      require: { type: "exception", field: "requirement" },
    },
    {
      // STM.2.1.6: "Zuerst erfolgt die Identifikation und Dokumentation von Assets, für die
      // es keine Anforderungen im Anforderungskatalog-GS++ gibt." Once the package is a
      // relation, that identification is a query rather than a memory. It is also the
      // fourth trigger for a risk consideration under STM.4.1.
      id: "gspp-asset-without-requirement",
      title: "Assets no requirement of the catalogue reaches",
      hint: "The catalogue has no requirement for this asset. Write your own, along the security objectives - confidentiality, integrity, availability - and say why Grundschutz++ does not cover it. This is also a case where the method wants a risk consideration. (STM.2.1.6, STM.4.1)",
      severity: "high",
      when: { type: "supporting_asset", field: "asset_type" },
      require: { type: "requirement", field: "applies_to_asset" },
    },
  ],
  // What the method requires a decision to carry. Each one names the requirement it comes
  // from; none of them judges the decision itself.
  mustState: [
    {
      // STM.2.1.5: "Für die vorliegenden Geschäftsprozesse nicht relevante Anforderungen
      // werden aus dem Anforderungspaket gestrichen, was mit einer Begründung zu
      // dokumentieren ist, um Nachvollziehbarkeit bei einem späteren Audit bzw.
      // Zertifizierung zu sichern." Only the requirements the catalogue classifies nowhere
      // are struck - one that names a category simply was not reached by any asset.
      id: "gspp-struck-without-reason",
      title: "Requirements struck from the package with no reason recorded",
      hint: "The catalogue does not say which objects this requirement is for, and you have left it out. Say in the rationale why it does not apply - or bring it in. (STM.2.1.5)",
      severity: "medium",
      type: "requirement",
      when: [{ field: "target_object_categories", empty: true }, { field: "scope", values: ["out of scope"] }],
      require: ["begruendung"],
      includeSetBack: true,
    },
    {
      // STM.2.1.5 again, the other half: a requirement judged relevant is assigned to the
      // business processes it applies to and to a process owner.
      id: "gspp-relevant-without-owner",
      title: "Requirements brought in by judgement with no process or owner",
      hint: "You brought this one in yourself, so it needs the business processes it applies to and someone who owns it. (STM.2.1.5)",
      severity: "medium",
      type: "requirement",
      when: [{ field: "target_object_categories", empty: true }, { field: "scope", values: ["in scope"] }],
      require: ["applies_to_process", "verantwortlich"],
    },
    {
      // UMS.3.1 and UMS.4.1: a requirement not yet implemented needs someone answerable
      // and a realistic date. Both are MUSS, both at effort level 0.
      id: "gspp-open-without-owner-or-date",
      title: "Open requirements with no one answerable or no date",
      hint: "Say who implements this, and by when. A date that slips has to be acted on. (UMS.3.1, UMS.4.1)",
      severity: "medium",
      type: "requirement",
      when: [{ field: "scope", values: ["in scope"] }, { field: "umsetzung", values: ["nein"] }],
      require: ["verantwortlich", "faellig"],
    },
    {
      // PERF.3.2: an audit that has been held is documented in a report - "nachvollziehbar,
      // vollständig und strukturiert", with the findings in it.
      id: "gspp-audit-without-report",
      title: "Audits held with no report",
      hint: "This audit has been held but has no report. Write how it was done and what came out - deviations, room for improvement, and what worked. (PERF.3.2)",
      severity: "medium",
      type: "audit",
      when: [{ field: "durchgefuehrt_am" }],
      require: ["bericht"],
    },
    {
      // PERF.3.1.1 and .1.3: an audit is planned before it is held, and its team is
      // independent of what it examines.
      id: "gspp-audit-unplanned",
      title: "Audits with no objective, scope or team",
      hint: "Set the objective, the scope and the methods before the audit, and name a team that does not work on what it examines. (PERF.3.1.1, PERF.3.1.3)",
      severity: "medium",
      type: "audit",
      when: [{ field: "name" }],
      require: ["ziel", "umfang", "auditteam"],
    },
    {
      // STM.2.1.6: "Daraufhin ist nachvollziehbar zu begründen, warum die Anforderungen
      // aus dem GS++ nicht ausreichen." A requirement of one's own that does not say that
      // is an addition nobody can defend at an audit.
      id: "gspp-own-requirement-unjustified",
      title: "Own requirements that do not say why the catalogue does not suffice",
      hint: "A requirement of your own has to say why the catalogue is not enough, and which asset it is for. (STM.2.1.6)",
      severity: "medium",
      type: "requirement",
      when: [{ field: "herkunft", values: ["Own - asset not covered"] }],
      require: ["begruendung", "applies_to_asset"],
    },
    {
      // STM.2.1.7: a requirement taken on out of the compliance environment names the
      // obligation it follows from, or it cannot be traced back to anything.
      id: "gspp-compliance-requirement-unsourced",
      title: "Compliance requirements with no obligation named",
      hint: "Name the law or the contract this requirement comes from, and the business processes it applies to. (STM.2.1.7)",
      severity: "medium",
      type: "requirement",
      when: [{ field: "herkunft", values: ["Own - compliance obligation"] }],
      require: ["compliance_basis", "applies_to_process"],
    },
    {
      // STM.3.1 with STM.4.1: lowering a level from erhöht to normal-SdT is the fourth
      // trigger for a risk consideration, and the one that was not checked until now
      // because it is a change rather than a state. Recorded as a review, it is a state.
      id: "gspp-downgrade-unconsidered",
      title: "Security levels lowered without a risk consideration",
      hint: "You lowered a level from erhöht to normal-SdT. That is one of the cases where the method wants a risk consideration: record it, and say why you lowered it. (STM.4.1)",
      severity: "high",
      type: "niveau_review",
      when: [{ field: "level_before", values: ["erhöht"] }, { field: "level_after", values: ["normal-SdT"] }],
      require: ["begruendung", "strategic_scenario"],
    },
  ],
  // UMS.1.1: "Eine Anforderung gilt nur dann als umgesetzt, wenn sie selbst sowie alle in
  // Abhängigkeit stehenden Anforderungen umgesetzt sind." The catalogue states those
  // dependencies itself - 67 `required` edges over 59 requirements - so the rule is
  // followed rather than asserted.
  dependsOn: {
    type: "requirement", field: "required", idField: "ref_id",
    statusField: "umsetzung", doneValue: "ja",
    title: "Requirements reported implemented while what they rest on is not",
    hint: "This one counts as implemented only once everything it rests on is. What it rests on is in \"Depends on\", and comes from the catalogue itself. (UMS.1.1)",
    severity: "high",
  },
  groups: [
    // The five process steps of the method (Leitfaden 1.4), not the practice names: a
    // practitioner works a step, and each step is carried by one ISMS practice. Risk sits
    // where the method puts it - a branch out of the requirements analysis, entered on a
    // trigger, not a stage everyone passes through.
    { key: "gc", label: "Scope and Planning", description: "Step 1 - the institution's context, the scope, the roles, and the protection need of its business processes (practice GC)", color: "var(--gs-governance)" },
    { key: "stm", label: "Requirements Analysis", description: "Step 2 - the information domain, its assets, their target-object categories, and the requirement package that follows (practice STM)", color: "var(--gs-structure)" },
    { key: "risk", label: "Risk Consideration", description: "The branch out of step 2, entered on one of four triggers: a high protection need, a security level lowered, a requirement left unimplemented, or an asset the catalogue does not cover", color: "var(--gs-risk)" },
    { key: "ums", label: "Implementation", description: "Step 3 - implementation status, measures, owners and dates (practice UMS)", color: "var(--gs-implementation)" },
    { key: "perf", label: "Monitoring", description: "Step 4 - metrics, audits and effectiveness (practice PERF)", color: "var(--gs-monitoring)" },
    { key: "vrb", label: "Improvement", description: "Step 5 - nonconformities and corrective action (practice VRB)", color: "var(--gs-improvement)" },
    // No "quant" group: the monetary loss expectation is a feature of Aurelian Lite.
    // GS++ leaves the risk method open (STM.4.1) and this product answers it
    // qualitatively - attack chain, coverage, treatment matrix. See QUANT_GROUP.
  ],
  entityTypes: [
    // ── Governance und Compliance ──
    {
      key: "business_asset", label: "Business process", labelPlural: "Business processes", group: "gc",
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "description", label: "Description", type: "textarea" },
        { key: "asset_type", label: "Kind", type: "enum", options: ["Process", "Information", "Statutory task", "Service"] },
        { key: "verantwortlich", label: "Owner", type: "text" },
        { key: "criticality", label: "Importance", type: "scale", scaleLabels: SCALE },
        // GC.7.1.2: the classification is made here, on the process or the information,
        // and in two steps. An asset does not carry one - its level is decided per
        // requirement (sec_level). "hoch" is also the first of the four triggers into a
        // risk consideration (GC.7.2).
        { key: "protection_need", label: "Protection need", type: "enum", options: SCHUTZBEDARF, optionLabels: labelsFor(SCHUTZBEDARF, VALUE_EN),
          help: "How badly this process would be hurt if its information lost confidentiality, integrity or availability. Two levels only, normal or hoch, decided with the management. Rating it hoch means a risk consideration follows. (GC.7.1, GC.7.2)" },
        { key: "protection_rationale", label: "Rationale for the protection need", type: "textarea" },
      ],
    },

    // ── Strukturmodellierung ──
    {
      key: "supporting_asset", label: "Asset", labelPlural: "Assets", group: "stm",
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "description", label: "Description", type: "textarea" },
        // The one decision that carries the whole modelling: everything else follows from
        // it mechanically, which is why the help says how.
        { key: "asset_type", label: "Target-object category", type: "enum", options: ZIELOBJEKTKATEGORIE,
          optionLabels: labelsFor(ZIELOBJEKTKATEGORIE, CATEGORY_EN), vocabulary: "target_object_categories",
          help: "What kind of thing this is, from the BSI's own list. Pick it by what the asset does, not by what it is built from. This one choice decides which requirements land on it - and the class you pick brings the classes above it with it: a dial-up line is an external network connection, which sits under networks, so it gets the requirements for both. (STM.2.1.3, STM.2.1.4.1)" },
        { key: "supports", label: "Supports", type: "multiref", refType: "business_asset", relation: "supports" },
        // 3.4.2: "Bei manueller Zuordnung ist die Entscheidung nachvollziehbar zu
        // dokumentieren." The category decides which requirements reach this asset, so
        // why it was chosen is what an auditor asks for first.
        { key: "begruendung", label: "Rationale for the category", type: "textarea",
          help: "Why this class and not another. Whoever checks the package reads this to see whether the choice holds. (Leitfaden 3.4.2)" },
      ],
    },
    {
      key: "feared_event", label: "Loss event", labelPlural: "Loss events", group: "stm",
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "description", label: "Description", type: "textarea" },
        { key: "business_asset", label: "Affects", type: "ref", refType: "business_asset", relation: "affects" },
        { key: "impact", label: "Security objective", type: "enum", options: ["Confidentiality", "Integrity", "Availability", "Authenticity"] },
        { key: "severity", label: "Severity", type: "scale", scaleLabels: GRAVITY },
      ],
    },
    {
      key: "praktik", label: "Practice", labelPlural: "Practices", group: "stm",
      fields: [
        { key: "name", label: "Practice", type: "text", required: true },
        { key: "kuerzel", label: "Abbreviation", type: "text" },
        { key: "schwerpunkt", label: "Focus", type: "enum", options: ["Methodical", "Organisational", "Technical"] },
        { key: "description", label: "Description", type: "textarea" },
      ],
    },
    {
      // Field keys from `praktik` down are the BSI catalogue's OSCAL property names, so an
      // imported catalogue fills them without a mapping step. See the header.
      key: "requirement", label: "Requirement", labelPlural: "Requirements", group: "stm",
      fields: [
        { key: "name", label: "Requirement", type: "text", required: true },
        { key: "ref_id", label: "Identifier", type: "text" },
        { key: "framework", label: "Ruleset", type: "text" , column: false },
        // STM.2.1.6 and STM.2.1.7: the package may be extended by requirements of the
        // institution's own - for assets the catalogue does not cover, and out of its
        // compliance obligations. Which of the three a requirement is decides what it has
        // to carry, and an auditor asks the question in exactly these terms.
        { key: "herkunft", label: "Origin", type: "enum", column: false,
          options: ["Grundschutz++", "Own - asset not covered", "Own - compliance obligation"],
          help: "Where this requirement comes from. Leave it empty for one out of the catalogue. One of your own has to say why the catalogue was not enough; one from a law or contract has to name it. (STM.2.1.6, STM.2.1.7)" },
        { key: "compliance_basis", label: "Obligation it comes from", type: "text", column: false,
          help: "The law or the contract this requirement comes from. (STM.2.1.7)" },
        { key: "category", label: "Section", type: "text" , column: false },
        { key: "praktik", label: "Practice", type: "enum", options: PRAKTIKEN, column: false,
          optionLabels: labelsFor(PRAKTIKEN, PRACTICE_EN), vocabulary: "@groups" },
        { key: "modal_verb", label: "Modal verb", type: "enum", options: MODAL_VERB, vocabulary: "modal_verb" },
        { key: "sec_level", label: "Security level", type: "enum", options: SEC_LEVEL,
          optionLabels: labelsFor(SEC_LEVEL, VALUE_EN), vocabulary: "sec_level" },
        // Declaring the same vocabulary as the asset's category is what lets the
        // requirement package be derived rather than assembled by hand (STM.2.1.4).
        { key: "target_object_categories", label: "Applies to target-object categories", type: "text", column: false,
          vocabulary: "target_object_categories",
          help: "The kinds of object this requirement is for, as the catalogue states them. This is what decides which of your assets it lands on. 636 of the 1000 have it; the ISMS practices have none, because they apply to everything. (STM.2.1.4)" },
        { key: "effort_level", label: "Effort level (0–5)", type: "number", column: false },
        { key: "confidentiality", label: "Acts on confidentiality (0–2)", type: "number" , column: false },
        { key: "integrity", label: "Acts on integrity (0–2)", type: "number" , column: false },
        { key: "availability", label: "Acts on availability (0–2)", type: "number" , column: false },
        { key: "authenticity", label: "Acts on authenticity (0–2)", type: "number" , column: false },
        { key: "threats", label: "Elementary threats", type: "text" , column: false },
        // The catalogue's own edges between requirements. `required` is binding under
        // UMS.1.1 - implemented means this one and everything it rests on; `related` is
        // context. Both are carried by identifier, as the catalogue writes them.
        // The BSI's own mapping collections, carried with the ruleset. An institution
        // arriving from the 2023 compendium or from ISO 27001 reads here which of its
        // existing controls corresponds to this requirement, and how closely - equal-to,
        // subset-of, superset-of, intersects-with, equivalent-to. The correspondence is
        // the publisher's; nothing here derives one.
        { key: "itgs_2023", label: "IT-Grundschutz 2023", type: "text", column: false,
          help: "What this matches in the IT-Grundschutz compendium 2023, and how closely - the BSI's own mapping. If you have already done the old requirement, this is where you see it." },
        { key: "iso_27001", label: "ISO/IEC 27001 Annex A", type: "text", column: false,
          help: "What this matches in ISO/IEC 27001 Annex A, and how closely. Again the BSI's own mapping." },
        { key: "required", label: "Depends on", type: "text", column: false,
          help: "The requirements this one rests on, named by the catalogue. It only counts as implemented once they are. (UMS.1.1)" },
        { key: "related", label: "Related requirements", type: "text", column: false },
        { key: "documentation", label: "Evidence document", type: "text" , column: false },
        { key: "result", label: "Result", type: "text" , column: false },
        { key: "action_word", label: "Action word", type: "text" , column: false },
        { key: "tags", label: "Tags", type: "text" , column: false },
        { key: "umsetzung", label: "Implemented", type: "enum", options: UMSETZUNG, optionLabels: labelsFor(UMSETZUNG, VALUE_EN) },
        // STM.2.1.5: a requirement the catalogue gives no target-object category to is
        // judged against the business processes, given an owner, and struck with a reason
        // where it does not apply. 265 of the 1000 are in that position.
        // STM.5.1: selected requirements carry parameters the institution fills in -
        // a period, a role, a standard. 208 of the 1000 do. The catalogue states what is
        // open; what was chosen is recorded beside it, because setting a parameter is also
        // how the leading responsibility for a practice gets assigned.
        { key: "params", label: "Parameters left open", type: "text", column: false,
          vocabulary: "@params",
          help: "What the catalogue leaves for you to fill in - a period, a role, a standard. The suggested wording already reads in the requirement text, in «guillemets». (STM.5.1)" },
        { key: "parameter_values", label: "Parameters as set", type: "textarea", column: false,
          help: "What you set, and who decided it. Until the parameters are set, the requirement is not yet yours." },
        // The whole ruleset is recorded; this says what is in play. The derivation sets it
        // where a category reached the requirement (STM.2.1.4) and states the route in the
        // rationale; everything else stays out until someone gives a reason (STM.2.1.5).
        // The order matters: the first option is "out", the second "in".
        { key: "scope", label: "In scope", type: "enum", options: ["out of scope", "in scope"], toggle: true,
          help: "Whether this requirement is part of your package. The derivation switches it on for everything your assets pull in, and the rationale says which asset did it. The rest stays off until you decide it applies - and if you decide it does not, write why. (STM.2.1.4, STM.2.1.5)" },
        // STM.2.1.4.2: "Ergebnis ist pro Asset ein vollständiger Satz an Anforderungen."
        // The consolidation keeps the reference to every asset a requirement reached, so
        // the package can be read from the asset's end as well as the requirement's. The
        // derivation writes this; it is not typed in.
        // A column, not a hidden field: "which asset put this here" is the question the
        // register is read with. Empty means the requirement reached the whole information
        // domain rather than an object - the 95 ISMS practices under STM.2.1.1 - or that it
        // was brought in by judgement, where the business process carries it instead.
        { key: "applies_to_asset", label: "Applies to assets", type: "multiref", refType: "supporting_asset", relation: "applies to",
          help: "Which of your assets pulled this requirement in, through its class. The derivation fills this in; run it again after adding an asset and it updates. Empty means the requirement applies to everything - the ISMS practices - or that you brought it in by hand for a business process. (STM.2.1.4)" },
        { key: "applies_to_process", label: "Applies to business processes", type: "multiref", refType: "business_asset", relation: "applies to", column: false,
          help: "For a requirement the catalogue does not classify: which business processes you judged it relevant for. Add the owner and the reason beside it. (STM.2.1.5)" },
        { key: "verantwortlich", label: "Owner", type: "text" , column: false,
          help: "Who is answerable - a person or a role, named so there is no doubt who is meant. (STM.2.1.5, UMS.3.1)" },
        // UMS.2.2 · UMS.4.1: the plan side. Priority is decided on risk, dependencies and
        // resources; effort level 0 is the catalogue's own "required in any case" and is a
        // starting point for it, not a substitute.
        { key: "prioritaet", label: "Priority", type: "enum", options: ["1 - first", "2", "3", "4 - last"], column: false,
          help: "When this should be done, next to everything else. Decide it from the risk, from what it waits on, and from the people you have. The catalogue's effort level says what it costs, not when it is due. (UMS.2.2)" },
        { key: "faellig", label: "Due", type: "text", column: false,
          help: "A date you can actually keep, given the size of the job, the people, and what it waits on. If it slips, that has to be acted on. (UMS.4.1)" },
        { key: "fortschritt", label: "Progress", type: "textarea", column: false,
          help: "Where it stands, and what was decided the last time it was looked at. (UMS.6.1)" },
        { key: "description", label: "Requirement text and guidance", type: "textarea" },
        { key: "begruendung", label: "Rationale", type: "textarea" },
        // UMS.1.2: "das bestehende Restrisiko durch die nicht umgesetzten Anforderungen
        // festlegen." Stated per requirement so it can be consolidated for the management,
        // which is what the requirement asks for.
        { key: "residual_risk", label: "Residual risk if not implemented", type: "textarea",
          help: "What you are carrying if this stays unimplemented. Leaving a requirement open is also a case where the method wants a risk consideration. (UMS.1.2, STM.4.1)" },
      ],
    },

    // ── Risikomanagement (BSI 200-3), Kettenform des Motors ──
    {
      key: "risk_origin", label: "Risk source", labelPlural: "Risk sources", group: "risk",
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "description", label: "Description", type: "textarea" },
        { key: "category", label: "Category", type: "enum", options: ["Cybercriminals", "State actor", "Hacktivist", "Insider", "Competitor", "Terrorist", "Opportunist"] },
        { key: "motivation", label: "Motivation", type: "text" , column: false },
        { key: "capability", label: "Capability", type: "scale", scaleLabels: SCALE },
        { key: "resources", label: "Resources", type: "scale", scaleLabels: SCALE , column: false },
        { key: "activity", label: "Activity", type: "scale", scaleLabels: SCALE , column: false },
        // STM.5.1: selected requirements carry parameters the institution fills in -
        // a period, a role, a standard. 208 of the 1000 do. The catalogue states what is
        // open; what was chosen is recorded beside it, because setting a parameter is also
        // how the leading responsibility for a practice gets assigned.
        { key: "params", label: "Parameters left open", type: "text", column: false,
          vocabulary: "@params",
          help: "STM.5.1. What the catalogue leaves to the institution, as identifier and suggested wording. The suggestion already reads in the requirement text, in guillemets." },
        { key: "parameter_values", label: "Parameters as set", type: "textarea", column: false,
          help: "What this institution set, and by whose decision. A requirement whose parameters are unset is not yet a requirement of this institution." },
        { key: "relevance", label: "Relevance", type: "scale", scaleLabels: SCALE },
      ],
    },
    {
      key: "strategic_scenario", label: "Threat scenario", labelPlural: "Threat scenarios", group: "risk",
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "description", label: "Description", type: "textarea" },
        { key: "risk_origin", label: "Risk source", type: "ref", refType: "risk_origin", relation: "originates from" },
        { key: "feared_event", label: "Loss event", type: "ref", refType: "feared_event", relation: "leads to" , column: false },
        { key: "threats", label: "Elementary threats", type: "text" , column: false },
        { key: "likelihood", label: "Likelihood", type: "scale", scaleLabels: LIKELIHOOD },
        { key: "gravity", label: "Impact", type: "scale", scaleLabels: GRAVITY },
      ],
    },
    {
      key: "operational_scenario", label: "Attack scenario", labelPlural: "Attack scenarios", group: "risk",
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "description", label: "Description", type: "textarea" },
        { key: "strategic_scenario", label: "Threat scenario", type: "ref", refType: "strategic_scenario", relation: "realises" },
        { key: "likelihood", label: "Likelihood", type: "scale", scaleLabels: LIKELIHOOD },
        { key: "difficulty", label: "Skill required", type: "scale", scaleLabels: SCALE },
      ],
    },
    {
      key: "kill_chain_step", label: "Attack step", labelPlural: "Attack steps", group: "risk",
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "description", label: "Description", type: "textarea" },
        { key: "operational_scenario", label: "Attack scenario", type: "ref", refType: "operational_scenario", relation: "belongs to" , column: false },
        { key: "step_order", label: "Step", type: "number" },
        { key: "tactic", label: "Tactic", type: "enum", options: TACTICS },
        { key: "technique", label: "Technique", type: "text" , column: false },
        { key: "targets_asset", label: "Asset attacked", type: "ref", refType: "supporting_asset", relation: "attacks" },
        { key: "predecessors", label: "Preceded by", type: "multiref", refType: "kill_chain_step", relation: "requires" , column: false },
      ],
    },

    {
      // The engine derives the residual risk from this type; leaving it out costs the
      // whole treatment and quantification side.
      key: "risk_treatment", label: "Risk treatment", labelPlural: "Risk treatments", group: "risk",
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "strategic_scenario", label: "Threat scenario treated", type: "ref", refType: "strategic_scenario", relation: "treats", required: true },
        { key: "decision", label: "Decision", type: "enum", options: BEHANDLUNG },
        { key: "owner", label: "Owner", type: "text" , column: false },
        { key: "deadline", label: "Due", type: "text" , column: false },
        { key: "status", label: "Status", type: "enum", options: TREAT_STATUS },
        { key: "justification", label: "Rationale", type: "textarea", help: "You do not list measures here. A measure acts on an attack step, and the residual risk follows from that." },
      ],
    },

    // ── Umsetzung ──
    {
      // measure_type, implementation_level, covers, protects and fulfills are read by
      // name in quantModel.ts, controls.ts and lint.ts. German labels, engine keys.
      key: "security_measure", label: "Measure", labelPlural: "Measures", group: "ums",
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "description", label: "Description", type: "textarea" },
        { key: "measure_type", label: "Effect class", type: "enum", options: [...EFFECT_CLASSES],
          help: "What the measure actually does. Preventive stops the attacker at the step it covers. Detective catches him, so the chain can be broken before he reaches his goal. Corrective limits the damage once it has happened. Deterrent means fewer attempts are made at all. Avoidance removes the exposure, so there is less to attack." },
        { key: "status", label: "Status", type: "enum", options: ["Implemented", "Planned", "Missing", "Recommended"] },
        // The published implementations are all recorded; this says which are in use here.
        // Same systematic as the requirements: present, set back, one press to bring in.
        { key: "scope", label: "In use", type: "enum", options: ["not in use", "in use"], toggle: true,
          help: "The BSI publishes what implements its requirements, and all of it is here so you can find it. Switch on what you actually use; the rest stays visible for the day it becomes relevant." },
        { key: "priority", label: "Priority", type: "scale", scaleLabels: SCALE, column: false },
        { key: "implementation_level", label: "Roll-out", type: "scale", scaleLabels: ["none", "partial", "substantial", "full"], polarity: "positive" },
        // Where the measure comes from. A control taken out of a publisher's library says
        // whose it is and under which name, exactly as a requirement does; one of the
        // institution's own leaves both empty.
        { key: "framework", label: "Source catalogue", type: "text", column: false,
          help: "Which library this came from. Empty for a measure of your own." },
        { key: "ref_id", label: "Name as published", type: "text", column: false },
        { key: "category", label: "Kind as published", type: "text", column: false },
        // What the publisher says this component implements, by requirement identifier.
        // Read from the implementation layer rather than decided here.
        { key: "implements", label: "Implements requirements", type: "text", column: false,
          help: "The requirements this implementation answers, as the publisher names them. Comes from the BSI's component definitions. For a measure of your own, use \"Fulfils requirements\" instead." },
        { key: "component_type", label: "Kind", type: "text", column: false },
        { key: "covers", label: "Acts on attack steps", type: "multiref", refType: "kill_chain_step", relation: "acts on" },
        { key: "protects", label: "Protects assets", type: "multiref", refType: "supporting_asset", relation: "protects" , column: false },
        // Declaring where the identifiers come from is what turns the published mapping
        // into a relation: the import resolves "implements" onto the requirement records.
        { key: "fulfills", label: "Fulfils requirements", type: "multiref", refType: "requirement", relation: "fulfils", vocabulary: "implements" , column: false },
        { key: "verantwortlich", label: "Owner", type: "text" , column: false },
        { key: "termin", label: "Implement by", type: "text" , column: false },
      ],
    },

    {
      // STM.3.1: "In diesem Teilschritt der Anforderungsanalyse wird die initiale
      // Einstellung des Sicherheitsniveaus überprüft und bei Bedarf, auch bei einzelnen
      // Assets, geändert." The catalogue's own level stays on the requirement, untouched,
      // because an auditor compares it against what the BSI published; what this
      // institution decided instead is a record of its own, with the reason beside it.
      key: "niveau_review", label: "Security-level review", labelPlural: "Security-level reviews", group: "stm",
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "requirement", label: "Requirement", type: "ref", refType: "requirement", relation: "reviews", required: true },
        { key: "supporting_asset", label: "Limited to asset", type: "ref", refType: "supporting_asset", relation: "applies to", column: false,
          help: "You can change the level for one asset only, instead of for the requirement everywhere. (STM.3.1)" },
        { key: "level_before", label: "Level as published", type: "enum", options: SEC_LEVEL,
          optionLabels: labelsFor(SEC_LEVEL, VALUE_EN), vocabulary: "sec_level" },
        { key: "level_after", label: "Level in force", type: "enum", options: SEC_LEVEL,
          optionLabels: labelsFor(SEC_LEVEL, VALUE_EN), vocabulary: "sec_level" },
        { key: "begruendung", label: "Reason", type: "textarea",
          help: "Why the level the catalogue set does not fit here. (STM.3.1)" },
        { key: "risk_considered", label: "Risk consideration carried out", type: "enum", options: ["ja", "nein"],
          optionLabels: labelsFor(["ja", "nein"], VALUE_EN),
          help: "Lowering a level from erhöht to normal-SdT is one of the cases where the method wants a risk consideration. (STM.4.1)" },
        { key: "strategic_scenario", label: "Risk considered", type: "ref", refType: "strategic_scenario", relation: "considered as", column: false },
        { key: "decided_on", label: "Decided on", type: "text", column: false },
      ],
    },

    {
      // UMS.5. The method knows two implementation states and no third: what would have
      // been "partly" or "not applicable" is an exception, and an exception is a decision
      // - authorised by someone (UMS.5.1) and written down with its reason (UMS.5.2).
      key: "exception", label: "Exception", labelPlural: "Exceptions", group: "ums",
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "requirement", label: "Requirement", type: "ref", refType: "requirement", relation: "excepts", required: true },
        { key: "supporting_asset", label: "Limited to asset", type: "ref", refType: "supporting_asset", relation: "applies to" , column: false },
        { key: "begruendung", label: "Reason", type: "textarea", required: true,
          help: "Why the requirement is not implemented. Someone will read this later to understand a decision that may carry legal weight. (UMS.5.2)" },
        { key: "authorised_by", label: "Authorised by", type: "text", required: true,
          help: "Who approved it - someone senior enough to weigh the obligations against each other. (UMS.5.1)" },
        { key: "decided_on", label: "Decided on", type: "text" , column: false },
        { key: "valid_until", label: "Valid until", type: "text" },
        { key: "risk_considered", label: "Risk consideration carried out", type: "enum", options: ["ja", "nein"],
          optionLabels: labelsFor(["ja", "nein"], VALUE_EN),
          help: "Not implementing a requirement is one of the cases where the method wants a risk consideration. (STM.4.1)" },
        { key: "strategic_scenario", label: "Risk considered", type: "ref", refType: "strategic_scenario", relation: "considered as" , column: false },
      ],
    },

    // ── Monitoring-Evaluation ──
    {
      key: "kennzahl", label: "Metric", labelPlural: "Metrics", group: "perf",
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "description", label: "What it measures", type: "textarea" },
        { key: "praktik", label: "Practice", type: "enum", options: PRAKTIKEN,
          optionLabels: labelsFor(PRAKTIKEN, PRACTICE_EN), vocabulary: "@groups" },
        { key: "zielwert", label: "Target", type: "number" },
        { key: "istwert", label: "Actual", type: "number" },
        { key: "einheit", label: "Unit", type: "text" },
      ],
    },

    {
      // PERF.3. An audit is planned before it is held: objectives, scope, criteria,
      // methods and an independent team (PERF.3.1.1–.1.4), and it ends in a report that
      // says how it was carried out and what was found (PERF.3.2).
      key: "audit", label: "Audit", labelPlural: "Audits", group: "perf",
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "audit_type", label: "Kind", type: "enum",
          options: ["Internal", "External", "Surveillance", "Repeat", "Special"],
          help: "Internal by your own people, external by an independent third party, or held because something happened - an incident, say. (PERF.3.1)" },
        { key: "ziel", label: "Objective", type: "textarea",
          help: "What this audit is meant to establish: whether the requirements are met, whether the measures work, or where the weak points are. (PERF.3.1.1)" },
        { key: "umfang", label: "Scope", type: "textarea",
          help: "What gets examined, over what period and how deeply - which sites, departments, systems. (PERF.3.1.4)" },
        { key: "supporting_asset", label: "Assets examined", type: "multiref", refType: "supporting_asset", relation: "examines", column: false },
        { key: "requirement", label: "Requirements examined", type: "multiref", refType: "requirement", relation: "examines", column: false,
          help: "Plan by risk: the requirements where looking is likely to be worth the most. (PERF.3.1.2)" },
        { key: "kriterien", label: "Criteria and methods", type: "textarea", column: false,
          help: "How you gather evidence: interviews, reading documents, watching the process, technical checks. (PERF.3.1.1)" },
        { key: "auditteam", label: "Audit team", type: "text",
          help: "Who audits. They have to know the subject and must not work on what they examine. (PERF.3.1.3)" },
        { key: "unabhaengig", label: "Independence established", type: "enum", options: ["ja", "nein"],
          optionLabels: labelsFor(["ja", "nein"], VALUE_EN), column: false },
        { key: "geplant_fuer", label: "Planned for", type: "text" },
        { key: "durchgefuehrt_am", label: "Held on", type: "text", column: false },
        { key: "bericht", label: "Report", type: "textarea", column: false,
          help: "How the audit was done and what came out - findings, deviations, room for improvement, and what worked. (PERF.3.2)" },
      ],
    },

    {
      // PERF.4. The management report: whether the ISMS is suitable, adequate and
      // effective, short enough to be read, and carrying the status of what the last
      // review decided (PERF.4.1.1).
      key: "managementbericht", label: "Management report", labelPlural: "Management reports", group: "perf",
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "zeitraum", label: "Period", type: "text" },
        { key: "anlass", label: "Occasion", type: "enum", options: ["Scheduled", "On occasion"], column: false },
        { key: "eignung", label: "Suitability, adequacy and effectiveness", type: "textarea",
          help: "Whether the security you set out to achieve is actually being achieved. Keep it short: this is what the management reads. (PERF.4.1)" },
        { key: "audit", label: "Audits it rests on", type: "multiref", refType: "audit", relation: "draws on", column: false },
        { key: "folgemassnahmen", label: "Status of what the last review decided", type: "textarea", column: false,
          help: "What became of the decisions from the last review - done, and did they work? (PERF.4.1.1)" },
        { key: "entscheidungen", label: "Decisions and resources", type: "textarea", column: false },
        { key: "vorgelegt_am", label: "Submitted on", type: "text", column: false },
      ],
    },

    // ── Verbesserung ──
    {
      key: "abweichung", label: "Nonconformity", labelPlural: "Nonconformities", group: "vrb",
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "description", label: "Finding", type: "textarea" },
        { key: "requirement", label: "Requirement affected", type: "ref", refType: "requirement", relation: "affects" },
        { key: "audit", label: "Found by", type: "ref", refType: "audit", relation: "found by", column: false,
          help: "The audit that found this, so the finding can be traced back to it. (PERF.3.2, VRB.2)" },
        { key: "schwere", label: "Severity", type: "scale", scaleLabels: SCALE },
        { key: "status", label: "Status", type: "enum", options: ["Open", "In progress", "Resolved", "Accepted"] },
        { key: "korrektur", label: "Corrective action", type: "textarea" },
      ],
    },
  ],
};
