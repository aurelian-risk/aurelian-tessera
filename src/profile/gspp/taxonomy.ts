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
// levels, and they are set on the business process or the information — not per asset and
// not per security objective. An asset's level is carried by the requirement's sec_level
// ("Eine Klassifizierung des Schutzbedarfs der Zielobjekte erfolgt auf Anforderungsebene").
// The three-level scale is classic IT-Grundschutz; "sehr hoch" does not occur once in the
// 368 KB method catalogue. The values stay as the BSI writes them.
const SCHUTZBEDARF = ["normal", "hoch"];
// UMS.1.1: "Der Umsetzungsstatus einer Anforderung kann grundsätzlich nur "umgesetzt"
// ("ja") oder "nicht umgesetzt" ("nein") sein." Not a scale: "teilweise" is what the
// method replaces with a dependency rule — a requirement counts as met only when it and
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
  // is set back rather than hidden — a register you cannot see cannot be extended.
  dimWhen: [
    { type: "requirement", field: "scope", values: ["out of scope", ""] },
    { type: "security_measure", field: "scope", values: ["not in use", ""] },
  ],
  // GC.7.2 and STM.4.1 name the points at which the method leaves the catalogue and enters
  // a risk consideration. Three of the four are states of a record, so they are checked
  // rather than remembered. The fourth — a security level lowered from erhöht to
  // normal-SdT — is a change rather than a state, and is visible in the change history.
  followUps: [
    {
      id: "gspp-high-need-unassessed",
      title: "Business processes rated hoch with no risk consideration",
      hint: "GC.7.2: a high protection need requires a dedicated risk consideration under the method the institution has chosen. Record a threat scenario that names this process, or lower the rating with a reason.",
      severity: "high",
      when: { type: "business_asset", field: "protection_need", values: ["hoch"] },
      require: { type: "feared_event", field: "business_asset" },
    },
    {
      id: "gspp-unimplemented-unexcepted",
      title: "Requirements not implemented and not excepted",
      hint: "UMS.5 and STM.4.1: a requirement left unimplemented is either an authorised exception with its reason, or a risk carried knowingly. Record the exception, or state the residual risk on the requirement.",
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
      hint: "STM.2.1.6: where the catalogue holds no requirement for an asset, write additional requirements for it — stated against the security objectives — and record why Grundschutz++ does not suffice. It is also one of the four triggers for a risk consideration (STM.4.1).",
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
      // are struck — one that names a category simply was not reached by any asset.
      id: "gspp-struck-without-reason",
      title: "Requirements struck from the package with no reason recorded",
      hint: "STM.2.1.5: a requirement the catalogue gives no target-object category is decided against the business processes, and one found not to apply is struck with a documented reason. Write the reason in the rationale, or bring it into scope.",
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
      hint: "STM.2.1.5: a requirement without a target-object category that is found relevant is assigned to the business processes it applies to and to a process owner. Name both.",
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
      hint: "UMS.3.1 and UMS.4.1: for every requirement not yet implemented, name who is to implement it and by when. Overrunning dates have to be acted on.",
      severity: "medium",
      type: "requirement",
      when: [{ field: "scope", values: ["in scope"] }, { field: "umsetzung", values: ["nein"] }],
      require: ["verantwortlich", "faellig"],
    },
    {
      // PERF.3.2: an audit that has been held is documented in a report — "nachvollziehbar,
      // vollständig und strukturiert", with the findings in it.
      id: "gspp-audit-without-report",
      title: "Audits held with no report",
      hint: "PERF.3.2: record how the audit was carried out and what it found — deviations, improvement potential, and what was found to be working.",
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
      hint: "PERF.3.1.1 and PERF.3.1.3: set the objective, the scope and the methods before the audit, and name a team competent and independent of the processes examined.",
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
      hint: "STM.2.1.6: for an asset the catalogue does not cover, record why Grundschutz++ does not suffice, which asset it is for, and which security objectives the requirement is stated against.",
      severity: "medium",
      type: "requirement",
      when: [{ field: "herkunft", values: ["Own — asset not covered"] }],
      require: ["begruendung", "applies_to_asset"],
    },
    {
      // STM.2.1.7: a requirement taken on out of the compliance environment names the
      // obligation it follows from, or it cannot be traced back to anything.
      id: "gspp-compliance-requirement-unsourced",
      title: "Compliance requirements with no obligation named",
      hint: "STM.2.1.7: name the statutory or contractual obligation the requirement follows from, and the business processes it applies to.",
      severity: "medium",
      type: "requirement",
      when: [{ field: "herkunft", values: ["Own — compliance obligation"] }],
      require: ["compliance_basis", "applies_to_process"],
    },
    {
      // STM.3.1 with STM.4.1: lowering a level from erhöht to normal-SdT is the fourth
      // trigger for a risk consideration, and the one that was not checked until now
      // because it is a change rather than a state. Recorded as a review, it is a state.
      id: "gspp-downgrade-unconsidered",
      title: "Security levels lowered without a risk consideration",
      hint: "STM.4.1: lowering a security level from erhöht to normal-SdT requires a risk consideration under the method the institution has chosen. Record it, and name the reason for the change.",
      severity: "high",
      type: "niveau_review",
      when: [{ field: "level_before", values: ["erhöht"] }, { field: "level_after", values: ["normal-SdT"] }],
      require: ["begruendung", "strategic_scenario"],
    },
  ],
  // UMS.1.1: "Eine Anforderung gilt nur dann als umgesetzt, wenn sie selbst sowie alle in
  // Abhängigkeit stehenden Anforderungen umgesetzt sind." The catalogue states those
  // dependencies itself — 67 `required` edges over 59 requirements — so the rule is
  // followed rather than asserted.
  dependsOn: {
    type: "requirement", field: "required", idField: "ref_id",
    statusField: "umsetzung", doneValue: "ja",
    title: "Requirements reported implemented while what they rest on is not",
    hint: "UMS.1.1: a requirement counts as implemented only when it and every requirement it depends on are implemented. The dependency is the catalogue's own, in the field \"Depends on\".",
    severity: "high",
  },
  groups: [
    // The five process steps of the method (Leitfaden 1.4), not the practice names: a
    // practitioner works a step, and each step is carried by one ISMS practice. Risk sits
    // where the method puts it — a branch out of the requirements analysis, entered on a
    // trigger, not a stage everyone passes through.
    { key: "gc", label: "Scope and Planning", description: "Step 1 — the institution's context, the scope, the roles, and the protection need of its business processes (practice GC)", color: "var(--gs-governance)" },
    { key: "stm", label: "Requirements Analysis", description: "Step 2 — the information domain, its assets, their target-object categories, and the requirement package that follows (practice STM)", color: "var(--gs-structure)" },
    { key: "risk", label: "Risk Consideration", description: "The branch out of step 2, entered on one of four triggers: a high protection need, a security level lowered, a requirement left unimplemented, or an asset the catalogue does not cover. GS++ prescribes no method here — this one models the attack chain", color: "var(--gs-risk)" },
    { key: "ums", label: "Implementation", description: "Step 3 — implementation status, measures, owners and dates (practice UMS)", color: "var(--gs-implementation)" },
    { key: "perf", label: "Monitoring", description: "Step 4 — metrics, audits and effectiveness (practice PERF)", color: "var(--gs-monitoring)" },
    { key: "vrb", label: "Improvement", description: "Step 5 — nonconformities and corrective action (practice VRB)", color: "var(--gs-improvement)" },
    // No "quant" group: the monetary loss expectation is a feature of Aurelian Lite.
    // GS++ leaves the risk method open (STM.4.1) and this product answers it
    // qualitatively — attack chain, coverage, treatment matrix. See QUANT_GROUP.
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
        // and in two steps. An asset does not carry one — its level is decided per
        // requirement (sec_level). "hoch" is also the first of the four triggers into a
        // risk consideration (GC.7.2).
        { key: "protection_need", label: "Protection need", type: "enum", options: SCHUTZBEDARF, optionLabels: labelsFor(SCHUTZBEDARF, VALUE_EN),
          help: "GC.7.1: normal or hoch, decided with the management and measured against what the process means for the institution's objectives. A high protection need requires a risk consideration (GC.7.2)." },
        { key: "protection_rationale", label: "Rationale for the protection need", type: "textarea" },
      ],
    },

    // ── Strukturmodellierung ──
    {
      key: "supporting_asset", label: "Asset", labelPlural: "Assets", group: "stm",
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "description", label: "Description", type: "textarea" },
        { key: "asset_type", label: "Target-object category", type: "enum", options: ZIELOBJEKTKATEGORIE,
          optionLabels: labelsFor(ZIELOBJEKTKATEGORIE, CATEGORY_EN), vocabulary: "target_object_categories" },
        { key: "supports", label: "Supports", type: "multiref", refType: "business_asset", relation: "supports" },
        // 3.4.2: "Bei manueller Zuordnung ist die Entscheidung nachvollziehbar zu
        // dokumentieren." The category decides which requirements reach this asset, so
        // why it was chosen is what an auditor asks for first.
        { key: "begruendung", label: "Rationale for the category", type: "textarea" },
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
        // institution's own — for assets the catalogue does not cover, and out of its
        // compliance obligations. Which of the three a requirement is decides what it has
        // to carry, and an auditor asks the question in exactly these terms.
        { key: "herkunft", label: "Origin", type: "enum", column: false,
          options: ["Grundschutz++", "Own — asset not covered", "Own — compliance obligation"],
          help: "STM.2.1.6/.7. Left as published for a requirement of the catalogue. An own requirement says why the catalogue does not suffice; one from a compliance obligation names the obligation." },
        { key: "compliance_basis", label: "Obligation it comes from", type: "text", column: false,
          help: "STM.2.1.7. The statutory or contractual obligation this requirement follows from." },
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
          help: "The target-object categories this requirement applies to, as the catalogue states them. This is what the requirement package of an asset is built from (STM.2.1.4). 636 of the 1000 carry it; the ISMS practices apply to the whole information domain and carry none." },
        { key: "effort_level", label: "Effort level (0–5)", type: "number", column: false },
        { key: "confidentiality", label: "Acts on confidentiality (0–2)", type: "number" , column: false },
        { key: "integrity", label: "Acts on integrity (0–2)", type: "number" , column: false },
        { key: "availability", label: "Acts on availability (0–2)", type: "number" , column: false },
        { key: "authenticity", label: "Acts on authenticity (0–2)", type: "number" , column: false },
        { key: "threats", label: "Elementary threats", type: "text" , column: false },
        // The catalogue's own edges between requirements. `required` is binding under
        // UMS.1.1 — implemented means this one and everything it rests on; `related` is
        // context. Both are carried by identifier, as the catalogue writes them.
        // The BSI's own mapping collections, carried with the ruleset. An institution
        // arriving from the 2023 compendium or from ISO 27001 reads here which of its
        // existing controls corresponds to this requirement, and how closely — equal-to,
        // subset-of, superset-of, intersects-with, equivalent-to. The correspondence is
        // the publisher's; nothing here derives one.
        { key: "itgs_2023", label: "IT-Grundschutz 2023", type: "text", column: false,
          help: "The requirements of the IT-Grundschutz-Kompendium 2023 that map to this one, with the relationship the BSI's mapping states. A migration takes the implementation status across on this basis rather than starting again." },
        { key: "iso_27001", label: "ISO/IEC 27001 Annex A", type: "text", column: false,
          help: "The Annex A controls that map to this requirement, with the relationship the BSI's mapping states." },
        { key: "required", label: "Depends on", type: "text", column: false,
          help: "UMS.1.1. The requirements this one depends on, as the catalogue states them. It counts as implemented only when they are implemented too." },
        { key: "related", label: "Related requirements", type: "text", column: false },
        { key: "documentation", label: "Evidence document", type: "text" , column: false },
        { key: "result", label: "Result", type: "text" , column: false },
        { key: "action_word", label: "Action word", type: "text" , column: false },
        { key: "tags", label: "Tags", type: "text" , column: false },
        { key: "umsetzung", label: "Implemented", type: "enum", options: UMSETZUNG, optionLabels: labelsFor(UMSETZUNG, VALUE_EN) },
        // STM.2.1.5: a requirement the catalogue gives no target-object category to is
        // judged against the business processes, given an owner, and struck with a reason
        // where it does not apply. 265 of the 1000 are in that position.
        // STM.5.1: selected requirements carry parameters the institution fills in —
        // a period, a role, a standard. 208 of the 1000 do. The catalogue states what is
        // open; what was chosen is recorded beside it, because setting a parameter is also
        // how the leading responsibility for a practice gets assigned.
        { key: "params", label: "Parameters left open", type: "text", column: false,
          vocabulary: "@params",
          help: "STM.5.1. What the catalogue leaves to the institution, as identifier and suggested wording. The suggestion already reads in the requirement text, in guillemets." },
        { key: "parameter_values", label: "Parameters as set", type: "textarea", column: false,
          help: "What this institution set, and by whose decision. A requirement whose parameters are unset is not yet a requirement of this institution." },
        // The whole ruleset is recorded; this says what is in play. The derivation sets it
        // where a category reached the requirement (STM.2.1.4) and states the route in the
        // rationale; everything else stays out until someone gives a reason (STM.2.1.5).
        // The order matters: the first option is "out", the second "in".
        { key: "scope", label: "In scope", type: "enum", options: ["out of scope", "in scope"], toggle: true,
          help: "STM.2.1.4 and STM.2.1.5. A requirement the modelling reaches is in scope and says through which asset and category. One the catalogue classifies nowhere stays out until it is judged against the business processes — and a requirement struck from the package carries the reason in its rationale." },
        // STM.2.1.4.2: "Ergebnis ist pro Asset ein vollständiger Satz an Anforderungen."
        // The consolidation keeps the reference to every asset a requirement reached, so
        // the package can be read from the asset's end as well as the requirement's. The
        // derivation writes this; it is not typed in.
        { key: "applies_to_asset", label: "Applies to assets", type: "multiref", refType: "supporting_asset", relation: "applies to", column: false,
          help: "STM.2.1.4. Which assets brought this requirement into the package, through their target-object category. Written by the derivation and refreshed when it runs again." },
        { key: "applies_to_process", label: "Applies to business processes", type: "multiref", refType: "business_asset", relation: "applies to", column: false,
          help: "STM.2.1.5. For a requirement the catalogue classifies nowhere: the business processes it was judged relevant for. Set by hand, with the owner and the rationale beside it." },
        { key: "verantwortlich", label: "Owner", type: "text" , column: false,
          help: "STM.2.1.5 for a requirement decided by judgement, UMS.3.1 for one still to be implemented: the person or role answerable, named unambiguously." },
        // UMS.2.2 · UMS.4.1: the plan side. Priority is decided on risk, dependencies and
        // resources; effort level 0 is the catalogue's own "required in any case" and is a
        // starting point for it, not a substitute.
        { key: "prioritaet", label: "Priority", type: "enum", options: ["1 — first", "2", "3", "4 — last"], column: false,
          help: "UMS.2.2. Set from the risk consideration, what this requirement depends on, and what resources are available. The catalogue's effort level says what it costs, not when it is due." },
        { key: "faellig", label: "Due", type: "text", column: false,
          help: "UMS.4.1. A realistic target date, taking scale, resources and dependencies into account. An overrun has to be acted on." },
        { key: "fortschritt", label: "Progress", type: "textarea", column: false,
          help: "UMS.6.1. Where the implementation stands, and what was decided at the last review." },
        { key: "description", label: "Requirement text and guidance", type: "textarea" },
        { key: "begruendung", label: "Rationale", type: "textarea" },
        // UMS.1.2: "das bestehende Restrisiko durch die nicht umgesetzten Anforderungen
        // festlegen." Stated per requirement so it can be consolidated for the management,
        // which is what the requirement asks for.
        { key: "residual_risk", label: "Residual risk if not implemented", type: "textarea",
          help: "UMS.1.2. What remains carried when this requirement is not met. Leaving a requirement unimplemented is also one of the four triggers for a risk consideration (STM.4.1)." },
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
        // STM.5.1: selected requirements carry parameters the institution fills in —
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
        { key: "justification", label: "Rationale", type: "textarea", help: "Measures are not listed again here: they already reduce this risk through the attack chain (a measure acts on an attack step), and the residual risk is derived from that." },
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
          help: "What the measure actually does — the effect model reads it from this. Preventive: stops the attacker at the step it covers. Detective: catches him and breaks the chain before the objective. Corrective: limits the damage once the attack has succeeded. Deterrent: fewer attempts are made. Avoidance: removes the exposure, so contact is made less often." },
        { key: "status", label: "Status", type: "enum", options: ["Implemented", "Planned", "Missing", "Recommended"] },
        // The published implementations are all recorded; this says which are in use here.
        // Same systematic as the requirements: present, set back, one press to bring in.
        { key: "scope", label: "In use", type: "enum", options: ["not in use", "in use"], toggle: true,
          help: "The BSI publishes what implements its requirements. All of it is recorded so it can be found; what this institution actually uses is switched on, and the rest stays visible for the day it becomes relevant." },
        { key: "priority", label: "Priority", type: "scale", scaleLabels: SCALE, column: false },
        { key: "implementation_level", label: "Roll-out", type: "scale", scaleLabels: ["none", "partial", "substantial", "full"], polarity: "positive" },
        // What the publisher says this component implements, by requirement identifier.
        // Read from the implementation layer rather than decided here.
        { key: "implements", label: "Implements requirements", type: "text", column: false,
          help: "The requirements this implementation answers, as the publisher states them. Filled from the BSI's component definitions; a measure of the institution's own is linked through 'Fulfils requirements' instead." },
        { key: "component_type", label: "Kind", type: "text", column: false },
        { key: "covers", label: "Acts on attack steps", type: "multiref", refType: "kill_chain_step", relation: "acts on" },
        { key: "protects", label: "Protects assets", type: "multiref", refType: "supporting_asset", relation: "protects" , column: false },
        { key: "fulfills", label: "Fulfils requirements", type: "multiref", refType: "requirement", relation: "fulfils" , column: false },
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
          help: "STM.3.1 allows the change to be made for a single asset rather than for the requirement everywhere." },
        { key: "level_before", label: "Level as published", type: "enum", options: SEC_LEVEL,
          optionLabels: labelsFor(SEC_LEVEL, VALUE_EN), vocabulary: "sec_level" },
        { key: "level_after", label: "Level in force", type: "enum", options: SEC_LEVEL,
          optionLabels: labelsFor(SEC_LEVEL, VALUE_EN), vocabulary: "sec_level" },
        { key: "begruendung", label: "Reason", type: "textarea",
          help: "STM.3.1. Why the initial classification does not fit the context of this institution." },
        { key: "risk_considered", label: "Risk consideration carried out", type: "enum", options: ["ja", "nein"],
          optionLabels: labelsFor(["ja", "nein"], VALUE_EN),
          help: "STM.4.1 names lowering a security level from erhöht to normal-SdT as one of the four triggers for a risk consideration." },
        { key: "strategic_scenario", label: "Risk considered", type: "ref", refType: "strategic_scenario", relation: "considered as", column: false },
        { key: "decided_on", label: "Decided on", type: "text", column: false },
      ],
    },

    {
      // UMS.5. The method knows two implementation states and no third: what would have
      // been "partly" or "not applicable" is an exception, and an exception is a decision
      // — authorised by someone (UMS.5.1) and written down with its reason (UMS.5.2).
      key: "exception", label: "Exception", labelPlural: "Exceptions", group: "ums",
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "requirement", label: "Requirement", type: "ref", refType: "requirement", relation: "excepts", required: true },
        { key: "supporting_asset", label: "Limited to asset", type: "ref", refType: "supporting_asset", relation: "applies to" , column: false },
        { key: "begruendung", label: "Reason", type: "textarea", required: true,
          help: "UMS.5.2: an exception is documented with its reason, so a decision that matters legally can be followed later." },
        { key: "authorised_by", label: "Authorised by", type: "text", required: true,
          help: "UMS.5.1: exceptions are authorised by the person or role competent to weigh the conflicting obligations." },
        { key: "decided_on", label: "Decided on", type: "text" , column: false },
        { key: "valid_until", label: "Valid until", type: "text" },
        { key: "risk_considered", label: "Risk consideration carried out", type: "enum", options: ["ja", "nein"],
          optionLabels: labelsFor(["ja", "nein"], VALUE_EN),
          help: "Not implementing a requirement is one of the four triggers for a risk consideration (STM.4.1)." },
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
          help: "PERF.3.1. Internal by the institution's own people, external by an independent third party, or held on an occasion — a security incident, for instance." },
        { key: "ziel", label: "Objective", type: "textarea",
          help: "PERF.3.1.1. What this audit is to establish: compliance with the requirements, the effectiveness of the measures, or weaknesses." },
        { key: "umfang", label: "Scope", type: "textarea",
          help: "PERF.3.1.4. What is examined, over which period, and in what depth — sites, departments, systems." },
        { key: "supporting_asset", label: "Assets examined", type: "multiref", refType: "supporting_asset", relation: "examines", column: false },
        { key: "requirement", label: "Requirements examined", type: "multiref", refType: "requirement", relation: "examines", column: false,
          help: "PERF.3.1.2. Planned by risk: the requirements where an audit is expected to be worth the most." },
        { key: "kriterien", label: "Criteria and methods", type: "textarea", column: false,
          help: "PERF.3.1.1. How evidence is gathered: interviews, document review, observation, technical analysis." },
        { key: "auditteam", label: "Audit team", type: "text",
          help: "PERF.3.1.3. Competent and independent of the processes examined." },
        { key: "unabhaengig", label: "Independence established", type: "enum", options: ["ja", "nein"],
          optionLabels: labelsFor(["ja", "nein"], VALUE_EN), column: false },
        { key: "geplant_fuer", label: "Planned for", type: "text" },
        { key: "durchgefuehrt_am", label: "Held on", type: "text", column: false },
        { key: "bericht", label: "Report", type: "textarea", column: false,
          help: "PERF.3.2. How the audit was carried out and what came of it — findings, deviations, improvement potential, and what was found to be working." },
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
          help: "PERF.4.1. Whether the intended security purpose is effectively met. Short, clear, focused on what matters." },
        { key: "audit", label: "Audits it rests on", type: "multiref", refType: "audit", relation: "draws on", column: false },
        { key: "folgemassnahmen", label: "Status of what the last review decided", type: "textarea", column: false,
          help: "PERF.4.1.1. Whether the actions decided last time were carried out and reached their objective." },
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
          help: "PERF.3.2 into VRB.2: a deviation an audit reported is followed up here, and the audit it came from stays named." },
        { key: "schwere", label: "Severity", type: "scale", scaleLabels: SCALE },
        { key: "status", label: "Status", type: "enum", options: ["Open", "In progress", "Resolved", "Accepted"] },
        { key: "korrektur", label: "Corrective action", type: "textarea" },
      ],
    },
  ],
};
