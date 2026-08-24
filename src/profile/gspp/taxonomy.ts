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
import { VOCABULARY, VOCABULARY_SOURCE } from "./vocabulary.generated";
import { CATEGORY_EN, PRACTICE_EN, VALUE_EN, labelsFor } from "./terms";

/** The five ISMS practices, and the fifteen that are not.
 *
 *  STM.2.1.1 models GC, STM, UMS, VRB and PERF onto the whole information domain "ohne
 *  Auswahl" - they name no target object and no business process because the method says
 *  they apply to everything. A rule about requirements the catalogue classifies nowhere has
 *  to leave them out, or it fires on exactly the 95 the method exempted.
 *
 *  Derived from the published list rather than typed, so a catalogue that adds a practice
 *  carries it in. `when` takes no negation, hence the positive list. */
const ISMS_PRACTICES = ["GC", "STM", "UMS", "VRB", "PERF"];
const APPLIED_PRACTICES = VOCABULARY.praktiken.filter(
  (p) => !ISMS_PRACTICES.includes(p.split(" ")[0]));

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
  // Which publication these lists came from, and when it was read. The build has known it
  // since npm run sync wrote the file; it just never said so, and the panel that offers to
  // check for changes fell back to a sentence with no facts in it.
  vocabularySource: VOCABULARY_SOURCE,
  vocabularyHierarchy: { target_object_categories: VOCABULARY.parentCategory },
  // UMS.1.1 tracks implementation through the requirement's own status, and measures act
  // on the attack chain rather than on requirements. Against a package of several hundred,
  // "not fulfilled by any measure" would report the whole ruleset as a finding and say
  // nothing. The check is right for a curated framework of thirty controls; it is not
  // right for this method.
  // "gspp-unimplemented-unexcepted" is off, and this is the reason rather than a dislike of
  // the rule. UMS.5 is about what an institution decides NOT to do; the rule as it can be
  // written today fires on umsetzung = "nein", which is the normal content of a register -
  // 390 of 392 in the sample. It would be right if it could ask "and the due date has
  // passed", and `followUps.when` carries one field and a value list, so it cannot. The
  // condition is proposed upstream; until it exists the finding says nothing a reader can
  // act on. UMS.1.2, the residual risk stated per requirement, still stands as its own field.
  checksOff: ["req-uncovered", "gspp-unimplemented-unexcepted"],
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
    // A procedure the institution owes and has not written is present and dimmed, not
    // absent: recording what is still owed is the point of the register. A fresh record
    // carries no status yet, so empty reads the same way.
    { type: "verfahren", field: "status", values: ["Not anchored", ""] },
    { type: "rolle", field: "status", values: ["Not established", ""] },
    { type: "leitlinie", field: "status", values: ["Draft", ""] },
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
      // VRB.4.1: "angemessene Korrekturmaßnahmen zur Beseitigung der Ursachen von Fehlern
      // festlegen." A nonconformity being worked on with nothing pointing at it is a finding
      // that was written down and then left, which is the failure the whole practice exists
      // to prevent.
      id: "gspp-nonconformity-uncorrected",
      title: "Nonconformities being worked on with no action against them",
      hint: "Record the corrective action that removes the cause, and give it a priority and an owner. (VRB.4.1, VRB.5.1)",
      severity: "medium",
      when: { type: "abweichung", field: "status", values: ["Open", "In progress"] },
      require: { type: "verbesserung", field: "abweichung" },
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
    // PERF.1.3. The package is re-read at the institution's interval; the reading says what
    // it took in, what it found, and who it was agreed with, and it sets when the next one
    // is owed. The last rule is the one nothing else could ask: a date that has passed.
    {
      id: "gspp-package-review-overdue",
      title: "Package readings that were due and have not been held",
      hint: "The date this reading was owed has passed. Hold it and record what it found, or move the date and say why. (PERF.1.3)",
      severity: "medium",
      type: "paket_review",
      when: [{ field: "faellig", past: true }],
      require: ["durchgefuehrt_am"],
    },
    {
      id: "gspp-package-review-unrecorded",
      title: "Package readings held without a result or the areas they were agreed with",
      hint: "Say what the reading found and who it was agreed with. The method asks for every relevant perspective to be in it, not just the ISMS's own. (PERF.1.3)",
      severity: "medium",
      type: "paket_review",
      when: [{ field: "durchgefuehrt_am" }],
      require: ["ergebnis", "abgestimmt_mit"],
    },
    {
      id: "gspp-package-review-adjusted-unmodelled",
      title: "Package readings that adjusted the selection without saying whether it was derived again",
      hint: "Say whether the adjustment took the modelling again. A significant one does, and that is what makes the package's history readable. (PERF.1.3)",
      severity: "low",
      type: "paket_review",
      when: [{ field: "anpassungen" }],
      require: ["neumodellierung"],
    },

    // UMS.6.1 asks the tracking process to compare the target against the actual, to
    // analyse the cause where they part, and to communicate the result. A round that skips
    // one of the three is a status note.
    {
      id: "gspp-tracking-without-comparison",
      title: "Tracking rounds held without a target and an actual",
      hint: "Record how many measures the plan had implemented by this date and how many were. The comparison is what the round is for. (UMS.6.1)",
      severity: "medium",
      type: "nachverfolgung",
      when: [{ field: "durchgefuehrt_am" }],
      require: ["soll", "ist"],
    },
    {
      id: "gspp-tracking-uncommunicated",
      title: "Tracking rounds held that were told to nobody",
      hint: "Name who was told the result. A round whose figures stayed with whoever compiled them changed nothing. (UMS.6.1)",
      severity: "low",
      type: "nachverfolgung",
      when: [{ field: "durchgefuehrt_am" }],
      require: ["kommuniziert_an"],
    },
    {
      id: "gspp-tracking-unanchored",
      title: "Tracking rounds held outside any procedure",
      hint: "Point the round at the procedure it runs under. UMS.6.1 requires the procedure to be anchored, and a round outside one is a report. (UMS.6.1)",
      severity: "low",
      type: "nachverfolgung",
      when: [{ field: "durchgefuehrt_am" }],
      require: ["verfahren"],
    },
    // UMS.6.2: "ein Verfahren zur Fortschreibung des Umsetzungsplans". A round that found
    // a cause and left the plan as it was is where that requirement fails in practice.
    {
      id: "gspp-tracking-cause-without-plan-change",
      title: "Tracking rounds that found a cause and changed nothing in the plan",
      hint: "Say what followed for the plan - dates, resources, priorities, measures added or dropped. Or record that it stands as it is, and why. (UMS.6.2)",
      severity: "medium",
      type: "nachverfolgung",
      when: [{ field: "ursache" }],
      require: ["planaenderung"],
    },
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
      when: [{ field: "target_object_categories", empty: true }, { field: "scope", values: ["in scope"] },
             { field: "praktik", values: APPLIED_PRACTICES }],
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
      // ...once it is PLANNED. A term with no values reads as "holds anything", so a
      // priority set is the signal that this requirement has entered the plan. Asking all
      // 392 for an owner and a date on the first day answers nothing: it reports the
      // register's normal content as 389 findings and buries the four that point somewhere.
      when: [{ field: "scope", values: ["in scope"] }, { field: "umsetzung", values: ["nein"] },
             { field: "prioritaet" }],
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
      // STM.2.1.6, in the publisher's own words: "Daraufhin ist nachvollziehbar zu
      // begründen, warum die Anforderungen aus dem GS++ nicht ausreichen. Dann erfolgt
      // (ggfs.) die Erstellung von neuen Anforderungen IN BEZUG AUF DIE SCHUTZZIELE
      // (Vertraulichkeit, Integrität und Verfügbarkeit), für diese Assets."
      //
      // So an own requirement owes three things, not two: the justification, the asset it
      // is for, and which protection goals it acts on. The three the guidance names -
      // authenticity is not among them, and is not asked for here.
      id: "gspp-own-requirement-unjustified",
      title: "Own requirements that do not say why the catalogue does not suffice",
      hint: "A requirement of your own has to say why the catalogue is not enough, which asset it is for, and which protection goals it acts on - confidentiality, integrity, availability. (STM.2.1.6)",
      severity: "medium",
      type: "requirement",
      when: [{ field: "herkunft", values: ["Own - asset not covered"] }],
      require: ["begruendung", "applies_to_asset", "confidentiality", "integrity", "availability"],
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
      // PERF.3.2.2: "MUSS alle relevanten Stakeholder über die Auditergebnisse informieren."
      // An audit that has been held and reported, whose result stayed with the auditor,
      // changed nothing - and the requirement is about the telling, not the finding.
      id: "gspp-audit-not-communicated",
      title: "Audits carried out whose results nobody was told",
      hint: "Record which stakeholders were informed of what this audit found. The requirement is to inform them. (PERF.3.2.2)",
      severity: "medium",
      type: "audit",
      when: [{ field: "durchgefuehrt_am" }],
      require: ["kommuniziert_an"],
    },
    {
      // PERF.4.1.9: "priorisierte Maßnahmenvorschläge mit realistischen Abschätzungen zum
      // erwarteten Umsetzungsaufwand ... in einem Managementbericht dokumentieren." Both
      // halves are in the requirement: an order, and what each one costs.
      id: "gspp-report-without-proposals",
      title: "Management reports submitted with no prioritised proposals",
      hint: "Say what the review proposes, in order, and what carrying each out is expected to take. A proposal without an estimate is not something a management can decide on. (PERF.4.1.9)",
      severity: "medium",
      type: "managementbericht",
      when: [{ field: "vorgelegt_am" }],
      require: ["massnahmenvorschlaege"],
    },
    {
      // GC.5.1.4: "MUSS die festgelegte Sicherheitsleitlinie durch die Institutionsleitung
      // autorisieren", and the guidance is one sentence long - "Diese Autorisierung muss
      // dokumentiert werden." A policy in force that cannot say who authorised it and when
      // is the one document in the ISMS whose whole force comes from that signature.
      id: "gspp-policy-unauthorised",
      title: "A security policy in force with no documented authorisation",
      hint: "Record who in the management put this in force and when. The method requires the authorisation itself to be documented, not merely to have happened. (GC.5.1.4)",
      severity: "high",
      type: "leitlinie",
      when: [{ field: "status", values: ["In force"] }],
      require: ["freigegeben_durch", "freigegeben_am"],
    },
    {
      // GC.5.1, .1.1 and .1.2: measurable objectives, a strategy for reaching them, and the
      // commitment of the management. A policy without them is a statement of intent.
      id: "gspp-policy-without-substance",
      title: "A security policy with no objectives, strategy or commitment",
      hint: "Name the measurable objectives it sets, how the institution means to reach them, and what the management commits to. (GC.5.1, GC.5.1.1, GC.5.1.2)",
      severity: "medium",
      type: "leitlinie",
      when: [{ field: "status", values: ["In force"] }],
      require: ["ziele", "strategie", "verpflichtung"],
    },
    {
      // GC.4.1 / GC.4.2: what the party needs and expects, and what follows from it. A
      // register of names would answer neither.
      id: "gspp-party-unanalysed",
      title: "Interested parties recorded without their needs or their weight",
      hint: "Say what this party needs from information security and how much weight its demands carry. The requirement is an analysis, not a list. (GC.4.1, GC.4.2)",
      severity: "medium",
      type: "partei",
      when: [{ field: "name" }],
      require: ["bedarf", "relevanz"],
    },
    {
      // GC.9.1.1 and GC.9.1.1.4, per role: assigned to someone, with what it may do and
      // what its holder has to be able to do. A role with a name and nothing else is an
      // organisation chart, which is what the method is trying to prevent.
      id: "gspp-role-unassigned",
      title: "Roles in force that say nothing about who holds them or what they may do",
      hint: "Name who holds it, what it may decide, and what its holder has to be able to do. A role with only a name is a box in a diagram. (GC.9.1.1, GC.9.1.1.4)",
      severity: "medium",
      type: "rolle",
      when: [{ field: "status", values: ["Established"] }],
      require: ["traeger", "befugnisse", "qualifikation"],
    },
    {
      // GC.9.1.1.2: "Stellvertreterregelungen für ALLE relevanten Rollen und
      // Zuständigkeiten" - the word is all, and the reason is in the guidance: continuity
      // is only guaranteed where every relevant role has one.
      id: "gspp-role-without-deputy",
      title: "Roles in force with no deputy",
      hint: "Say who acts when the holder cannot. The method asks it of every relevant role, because an organisation that stops when one person is away was never continuous. (GC.9.1.1.2)",
      severity: "medium",
      type: "rolle",
      when: [{ field: "status", values: ["Established"] }],
      require: ["stellvertreter"],
    },
    {
      // GC.9.1.1.1 with .1.1 and .1.2: the information security officer is answerable to
      // the management directly, has a direct right of audience, and has resources. Three
      // requirements about one function, and the three most often lost when an ISB is
      // appointed on paper.
      id: "gspp-isb-without-standing",
      title: "An information security officer without the standing the method requires",
      hint: "The ISB is answerable to the management directly, can speak to it without anyone in between, and has resources to act with. Record all three. (GC.9.1.1.1, GC.9.1.1.1.1, GC.9.1.1.1.2)",
      severity: "high",
      type: "rolle",
      when: [{ field: "art", values: ["Information security officer"] }, { field: "status", values: ["Established"] }],
      require: ["unterstellt", "vorspracherecht", "ressourcen"],
    },
    {
      // A procedure in force that names neither a document nor an owner is an assertion
      // that one exists, which is precisely what an audit will not accept. GC.11.1 asks for
      // the documents of the ISMS to be governed; a procedure nobody can point at is not.
      id: "gspp-procedure-unanchored",
      title: "Procedures said to be in force with nothing behind them",
      hint: "Say where this is written down and who owns it. A procedure that cannot be pointed at is a statement, not a procedure. (GC.11.1)",
      severity: "medium",
      type: "verfahren",
      when: [{ field: "status", values: ["In force"] }],
      require: ["dokument", "verantwortlich"],
    },
    {
      // Which method requirement a procedure answers is what turns a shelf of documents
      // into an argument that the method is being followed.
      id: "gspp-procedure-unattributed",
      title: "Procedures that do not say which requirement they answer",
      hint: "Name the method requirement this procedure anchors - UMS.6.1, VRB.1.1, PERF.3.1. Without it the document cannot be read as an answer to anything.",
      severity: "low",
      type: "verfahren",
      when: [{ field: "status", values: ["In force"] }],
      require: ["anforderung"],
    },
    {
      // VRB.2.1: "eine Methode zur Überprüfung von Nicht-Konformitäten hinsichtlich Ursachen
      // und Wiederauftreten". A finding still being worked on that names neither is a finding
      // nobody has understood yet, and the correction hanging off it is a guess.
      id: "gspp-nonconformity-uncaused",
      title: "Nonconformities with no cause and no recurrence judgement",
      hint: "Say what let this happen, and whether it can happen again as things stand. A correction that removes the symptom leaves the cause. (VRB.2.1)",
      severity: "medium",
      type: "abweichung",
      when: [{ field: "status", values: ["Open", "In progress"] }],
      require: ["ursache", "wiederauftreten"],
    },
    {
      // VRB.5.1: "Verbesserung MUSS den Maßnahmen zur Korrektur und Verbesserung Prioritäten
      // zuweisen." Both kinds, in one sentence - which is why they are one register here.
      id: "gspp-improvement-unprioritised",
      title: "Corrective and improvement actions with no priority",
      hint: "Say where this stands next to the others. The method requires it of corrections and improvements alike. (VRB.5.1)",
      severity: "medium",
      type: "verbesserung",
      when: [{ field: "status", values: ["Planned", "In progress"] }],
      require: ["prioritaet"],
    },
    {
      // VRB.6.1: "die Wirksamkeit der umgesetzten Korrektur- und Verbesserungsmaßnahmen
      // testen". Done is a state of the work; effective is a statement about the world, and
      // only the second closes a nonconformity honestly.
      id: "gspp-improvement-untested",
      title: "Actions reported done whose effect was never tested",
      hint: "This was carried out. Test whether it worked and record what the test showed - done is not the same as worked. (VRB.6.1)",
      severity: "medium",
      type: "verbesserung",
      when: [{ field: "status", values: ["Done"] }],
      require: ["wirksamkeit"],
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
        // STM.1.2: "Schnittstellen des Informationsverbunds zu externen Prozessen
        // festlegen." An interface is not a kind of asset - it is a fact about one: this is
        // where something outside reaches in. Recording it on the asset keeps it beside the
        // requirements that land there, rather than in a second list that drifts.
        { key: "externe_schnittstelle", label: "External interface", type: "textarea", column: false,
          help: "Which process outside the information domain reaches it through this asset, who runs that process, and what crosses. Empty means this asset is not on the boundary. (STM.1.2)" },
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

    {
      // UMS.6. Two MUSS, and both are "verankere ein Verfahren" - the procedure register
      // holds those. What the guidance describes is the round the procedure runs: status
      // reporting at an interval, the target against the actual, the KPI readings, the
      // cause where they diverge, the corrections that follow, and the communication to
      // whoever is waiting on it (UMS.6.1). What the round then changes in the plan is the
      // second requirement (UMS.6.2), which is why that field sits on the round rather than
      // in a document of its own: a plan revision nobody can trace to a reading is a plan
      // revision nobody can question.
      //
      // A round points at metrics rather than restating their numbers - `kennzahl` carries
      // target and actual already, and its own change history is the time series.
      key: "nachverfolgung", label: "Tracking round", labelPlural: "Tracking rounds", group: "ums",
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "verfahren", label: "Runs under", type: "ref", refType: "verfahren", relation: "runs under",
          help: "The anchored procedure this round follows. UMS.6.1 requires the procedure; a round outside one is a report, not a process." },
        // Like an audit: empty means planned, filled means held. No second field saying
        // the same thing in words.
        { key: "durchgefuehrt_am", label: "Held on", type: "text",
          help: "When this round was actually run. Leave it empty for one that is still planned - a round on the calendar and not yet held is the honest state." },
        { key: "soll", label: "Due by now", type: "number",
          help: "How many measures the plan had implemented by this date. The comparison the method asks for is against the plan, not against the total. (UMS.6.1)" },
        { key: "ist", label: "Implemented", type: "number",
          help: "How many were actually implemented at this date. Recorded rather than counted, because a round says what was true then, and the register moves on." },
        { key: "kennzahl", label: "Metrics read", type: "multiref", refType: "kennzahl", relation: "reads", column: false,
          help: "Which metrics this round took a reading of. The numbers stay on the metric - here is which ones were looked at. (UMS.6.1)" },
        { key: "ursache", label: "Why they diverge", type: "textarea", column: false,
          help: "What the analysis found behind the gap between due and implemented. The method asks for the cause, not for the observation that there is one. (UMS.6.1)" },
        { key: "verbesserung", label: "Actions decided", type: "multiref", refType: "verbesserung", relation: "decides", column: false,
          help: "The corrections this round set in motion. They live in the improvement register with their owner, date and effectiveness test. (UMS.6.1)" },
        { key: "planaenderung", label: "What changed in the plan", type: "textarea", column: false,
          help: "What this round changed: dates, resources, priorities, measures added or dropped, findings from the effectiveness test taken up. (UMS.6.2)" },
        { key: "kommuniziert_an", label: "Communicated to", type: "text", column: false,
          help: "Who was told the result. A round whose figures stayed with whoever compiled them changed nothing. (UMS.6.1)" },
        { key: "verantwortlich", label: "Owner", type: "text", column: false },
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
      // PERF.1.3: "die Aktualität der Anforderungen {{Intervall}} überprüfen" - the package
      // is re-read against the information domain at the interval the institution sets,
      // generally yearly. The guidance names what the reading has to take in: changed
      // business processes, new IT components, organisational changes, and external factors
      // such as new regulation or a changed threat picture.
      //
      // The derivation is already repeatable and reports what changed (modelling.ts). What
      // was missing is the record that it HAPPENED, and when the next one is owed - the
      // half a tool can carry. A significant adjustment leads back into the modelling,
      // which the last field records rather than performs.
      key: "paket_review", label: "Package review", labelPlural: "Package reviews", group: "perf",
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "verfahren", label: "Runs under", type: "ref", refType: "verfahren", relation: "runs under",
          help: "The anchored procedure for measuring and evaluating the ISMS. (PERF.1.1)" },
        { key: "durchgefuehrt_am", label: "Held on", type: "text",
          help: "When the package was actually re-read. Leave it empty for one still planned." },
        // The interval lives as the next record, not as a number on this one: PERF.1.3
        // leaves the interval to the institution, and a reading that is owed is a reading
        // somebody has to put on the calendar. Past and not held is the finding.
        { key: "faellig", label: "Due on", type: "text",
          help: "When this reading is owed - generally a year after the last, and the interval is the institution's to set by size and depth. Past and not held is a finding. (PERF.1.3)" },
        { key: "betrachtet", label: "What was taken into account", type: "textarea", column: false,
          help: "The method names four: changed business processes, new IT components, organisational changes, and external factors - new regulation, a changed threat picture. (PERF.1.3)" },
        { key: "ergebnis", label: "What the reading found", type: "textarea", column: false,
          help: "Whether the package still fits the information domain, and where it does not." },
        { key: "anpassungen", label: "Adjustments made", type: "textarea", column: false,
          help: "What was changed in the selection of requirements as a result. (PERF.1.3)" },
        { key: "neumodellierung", label: "Led back into the modelling", type: "enum",
          options: ["No", "Yes - the package was derived again"],
          help: "A significant adjustment takes the whole cycle of structural modelling again. Recording which reviews did that is what makes the package's history readable. (PERF.1.3)" },
        { key: "abgestimmt_mit", label: "Agreed with", type: "text", column: false,
          help: "The areas the reading was agreed with. The method asks for it so that every relevant perspective is in it, not just the ISMS's own. (PERF.1.3)" },
        { key: "verantwortlich", label: "Owner", type: "text", column: false },
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
        { key: "kommuniziert_an", label: "Results communicated to", type: "text", column: false,
          help: "Which stakeholders were told what the audit found. The requirement is to inform them, and an audit whose result stayed with the auditor changed nothing. (PERF.3.2.2)" },
        { key: "folgemassnahmen", label: "Status of what the last review decided", type: "textarea", column: false,
          help: "What became of the decisions from the last review - done, and did they work? (PERF.4.1.1)" },
        { key: "entscheidungen", label: "Decisions and resources", type: "textarea", column: false },
        { key: "massnahmenvorschlaege", label: "Proposals, prioritised, with the effort they take", type: "textarea", column: false,
          help: "What the review proposes, in order, each with a realistic estimate of what carrying it out will cost. A proposal without an estimate is a wish the management cannot decide on. (PERF.4.1.9)" },
        { key: "vorgelegt_am", label: "Submitted on", type: "text", column: false },
      ],
    },

    // ── Verbesserung ──
    {
      // GC.4.1 and GC.4.2: the interested parties, external and internal, "sowie ihre
      // Bedürfnisse und Erwartungen an das Informationssicherheitsmanagement". Two MUSS,
      // one shape - the guidance's own examples split the same way: legislators, regulators,
      // customers, service providers and the public on one side; management, the ISB, the
      // data protection officer, staff, line managers and the works council on the other.
      //
      // What the requirement asks for is not a list of names. It is what each of them needs
      // and expects, and what follows from that for the ISMS - the guidance says the
      // relevance and priority of the identified demands are assessed and acted on.
      key: "partei", label: "Interested party", labelPlural: "Interested parties", group: "gc",
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "art", label: "Kind", type: "enum", options: ["External", "Internal"],
          help: "External: legislators, regulators, customers, service providers, the public. Internal: the management, the ISB, the data protection officer, staff, line managers, the works council. (GC.4.1, GC.4.2)" },
        { key: "bedarf", label: "Needs and expectations", type: "textarea",
          help: "What this party needs from information security and expects of it. The requirement is about this, not about the name. (GC.4.1, GC.4.2)" },
        { key: "relevanz", label: "Relevance", type: "scale", scaleLabels: SCALE,
          help: "How much weight this party's demands carry, assessed rather than assumed - the guidance asks for relevance and priority to be judged before anything follows from them." },
        { key: "ableitung", label: "What follows for the ISMS", type: "textarea", column: false,
          help: "The requirement, the objective or the measure that this party's expectation produced. An analysis nothing follows from was not an analysis." },
        { key: "verantwortlich", label: "Contact", type: "text", column: false },
      ],
    },
    {
      // GC.5.1 with .1.1 to .1.4: the objectives, the strategy, the commitment of the
      // management, the policy and its authorisation. Five MUSS about one document set, so
      // one record rather than five registers - the guidance for GC.5.1.3 says the policy
      // itself carries the overall responsibility, which is the commitment of GC.5.1.2.
      //
      // The objectives are NOT restated here. GC.5.1 asks for "konkrete und messbare Ziele"
      // and its own example is a metric - 98% of devices with signatures under 24 hours old.
      // This product already has metrics with a target and an actual, so the policy names
      // them and the numbers stay in one place.
      key: "leitlinie", label: "Security policy", labelPlural: "Security policy and strategy", group: "gc",
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "version", label: "Version", type: "text" },
        { key: "ziele", label: "Measurable objectives", type: "multiref", refType: "kennzahl", relation: "sets",
          help: "The objectives this policy sets, as the metrics that measure them. The method asks for them to be concrete and measurable, and its own example is a metric. (GC.5.1)" },
        { key: "strategie", label: "Strategy", type: "textarea",
          help: "How the institution means to reach those objectives - the overall approach and the principles, agreed with the management. (GC.5.1.1)" },
        { key: "verpflichtung", label: "Commitment of the management", type: "textarea", column: false,
          help: "The management taking overall responsibility, confirming and monitoring the objectives, and promoting the ISMS. The policy is where this is written down. (GC.5.1.2)" },
        { key: "dokument", label: "Written down in", type: "text", column: false },
        { key: "freigegeben_durch", label: "Authorised by", type: "text",
          help: "Who in the management put it in force. The method requires the authorisation itself to be documented. (GC.5.1.4)" },
        { key: "freigegeben_am", label: "Authorised on", type: "text" },
        { key: "status", label: "In force", type: "enum", options: ["Draft", "In force"], toggle: true },
      ],
    },
    {
      // GC.9.1 and its six sub-requirements: the security organisation. Eight MUSS in one
      // shape, and the product carried none of it - "who is answerable" was five free text
      // fields called `verantwortlich`, which names a person and can be asked nothing else.
      //
      // What the method asks per role, in its own words: the role assigned "inklusive ihrer
      // Kompetenzen bzw. Befugnisse" (GC.9.1.1), "für jeden Rollen- und Verantwortungsträger
      // die erforderlichen Anforderungen und Fähigkeiten" (GC.9.1.1.4), and
      // "Stellvertreterregelungen für alle relevanten Rollen" (GC.9.1.1.2). Avoiding
      // conflicts of interest (GC.9.1.1.3) reads differently - "Maßnahmen ... bei der
      // Festlegung von Rollen ... festlegen" is one decision about how roles are cut, not a
      // sentence owed by each - so it is a field here and not a check.
      key: "rolle", label: "Role", labelPlural: "Roles and responsibilities", group: "gc",
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        // The ISB is its own kind because the method makes it one: GC.9.1.1.1 is a
        // requirement about that function and nothing else, and it carries three more.
        { key: "art", label: "Kind", type: "enum",
          options: ["Information security officer", "Role", "Committee", "Interface to another discipline"],
          help: "The method asks for roles, responsibilities and committees (GC.9.1), and for the interfaces to data protection, physical security, classified information and occupational safety to be anchored with them." },
        { key: "traeger", label: "Held by", type: "text",
          help: "The person or the organisational unit that holds it. A role nobody holds is a role in a diagram. (GC.9.1.1)" },
        { key: "stellvertreter", label: "Deputy", type: "text",
          help: "Who acts when the holder cannot. The method asks for this for every relevant role - an organisation that stops when one person is away was never continuous. (GC.9.1.1.2)" },
        { key: "aufgaben", label: "Tasks", type: "textarea", column: false,
          help: "What this role does, in enough detail that someone else could tell whether it was done. (GC.9.1.1)" },
        { key: "befugnisse", label: "Authority", type: "textarea", column: false,
          help: "What it may decide and what it may demand. Tasks without authority are a wish. (GC.9.1.1)" },
        { key: "qualifikation", label: "Required qualification", type: "textarea", column: false,
          help: "The knowledge and abilities the holder needs. The method asks for this per holder, not per organisation. (GC.9.1.1.4)" },
        { key: "unterstellt", label: "Reports to", type: "text", column: false,
          help: "Where it sits in the line. The information security officer is answerable to the management directly - that is what the requirement says, and it is the part most often quietly lost. (GC.9.1.1.1)" },
        { key: "vorspracherecht", label: "Direct right of audience", type: "enum", options: ["Yes", "No"], column: false,
          help: "Whether this role can speak to the management without anyone in between. Empty means nobody has settled it. (GC.9.1.1.2 / GC.9.1.1.1.2)" },
        { key: "ressourcen", label: "Resources assigned", type: "textarea", column: false,
          help: "Time, budget and people. The requirement is not that the role exists but that it can act. (GC.9.1.1.1.1)" },
        { key: "interessenkonflikt", label: "Conflicts of interest", type: "textarea", column: false,
          help: "Which roles this one must not be held together with - an executing role and the role that checks or approves it, above all. (GC.9.1.1.3)" },
        { key: "status", label: "Established", type: "enum", options: ["Not established", "Established"], toggle: true,
          help: "Switch it on once the role is assigned and in force. Recording the ones the organisation still owes, switched off, is what makes the gap visible." },
      ],
    },
    {
      // Seventeen of the method's 95 requirements - fifteen of them MUSS - do not ask for a
      // record or a decision. They ask the institution to ANCHOR a procedure: "Umsetzung
      // MUSS ein Verfahren für die Nachverfolgung der Umsetzung von Maßnahmen verankern"
      // (UMS.6.1), "Verbesserung MUSS ein Verfahren zur kontinuierlichen Verbesserung des
      // ISMS verankern" (VRB.1.1), and so on through GC, UMS, VRB and PERF.
      //
      // A tool cannot anchor a procedure. What it can do is hold the statement that one
      // exists, what it says, who owns it, where it is written down and when it was last
      // looked at - which is exactly what an auditor asks for and what nobody can produce
      // from memory. Anchored is therefore a claim ON a record here, not a checkbox: a
      // procedure in force that names no document and no owner is an assertion, not a
      // procedure, and the checks say so.
      key: "verfahren", label: "Procedure", labelPlural: "Procedures and rules", group: "gc",
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "praktik", label: "Practice", type: "enum", options: PRAKTIKEN, optionLabels: labelsFor(PRAKTIKEN, PRACTICE_EN),
          help: "Which of the five ISMS practices this procedure belongs to. The method asks for procedures in GC, UMS, VRB and PERF." },
        { key: "anforderung", label: "Anchors requirement", type: "text",
          help: "The method requirement this procedure answers, by its identifier - UMS.6.1, VRB.1.1, PERF.3.1. More than one if it covers several." },
        { key: "description", label: "What the procedure says", type: "textarea",
          help: "The steps in it, in enough detail that someone who has not read the document can tell whether it was followed." },
        { key: "dokument", label: "Written down in", type: "text",
          help: "Where it lives - the document, its identifier, its version. A procedure nobody can point at is one nobody can follow. (GC.11.1)" },
        { key: "verantwortlich", label: "Owner", type: "text", column: false },
        { key: "freigegeben_am", label: "Approved on", type: "text", column: false,
          help: "When it was put in force, and by that fact who stands behind it. (GC.1.2)" },
        { key: "letzte_pruefung", label: "Last reviewed", type: "text", column: false,
          help: "When it was last read against what the institution actually does. A procedure that has not been looked at since it was written is a document, not a procedure." },
        // The toggle: present but not anchored is the honest state for a procedure the
        // method requires and the institution has not written yet.
        { key: "status", label: "In force", type: "enum", options: ["Not anchored", "In force"], toggle: true,
          help: "Switch it on once the procedure is written down and in force. Recording the ones you still owe, switched off, is what makes the gap visible." },
      ],
    },
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
        // VRB.2.1: "eine Methode zur Überprüfung von Nicht-Konformitäten hinsichtlich
        // Ursachen und Wiederauftreten". Two questions, not one - a cause that was found
        // and whether the thing can happen again are different findings, and an action that
        // removes the first without answering the second is why it comes back.
        { key: "ursache", label: "Cause", type: "textarea",
          help: "What let this happen, not what happened. A correction that removes the symptom leaves the cause in place. (VRB.2.1, VRB.4.1)" },
        { key: "wiederauftreten", label: "Can recur", type: "enum", options: ["Yes", "No"],
          help: "Whether this can happen again as things stand. Empty means nobody has examined it - the method asks for the examination, so silence is not an answer. (VRB.2.1)" },
        // VRB.2.2: the ISMS itself may be what needs changing, and that is a decision
        // somebody has to have taken rather than a question nobody asked.
        { key: "isms_anpassung", label: "ISMS needs adjusting", type: "enum", options: ["Yes", "No"], column: false,
          help: "Whether the management system itself has to change because of this, not just the case at hand. (VRB.2.2)" },
      ],
    },
    {
      // VRB.4.1, VRB.4.2, VRB.5.1 and VRB.6.1 as one register, because the method treats
      // them as one: "Verbesserung MUSS den Maßnahmen zur Korrektur und Verbesserung
      // Prioritäten zuweisen" (VRB.5.1) names both kinds in one breath. So one type with a
      // kind, not two registers that would then need the same priority rule twice.
      //
      // This replaces a free-text "Corrective action" on the nonconformity. A sentence
      // cannot carry a priority, an owner, a date or a test of whether it worked, and those
      // are exactly what VRB.5.1 and VRB.6.1 ask for.
      key: "verbesserung", label: "Corrective and improvement action", labelPlural: "Corrective and improvement actions", group: "vrb",
      fields: [
        { key: "name", label: "Name", type: "text", required: true },
        { key: "art", label: "Kind", type: "enum", options: ["Correction", "Improvement"],
          help: "A correction removes the cause of a fault (VRB.4.1). An improvement takes up a potential nobody was forced to act on (VRB.4.2, VRB.3.1)." },
        { key: "description", label: "What is done", type: "textarea" },
        { key: "abweichung", label: "Answers nonconformity", type: "ref", refType: "abweichung", relation: "answers",
          help: "The nonconformity whose cause this removes. A correction with none is either an improvement or an action nobody can trace. (VRB.4.1)" },
        { key: "vorteile_nachteile", label: "Advantages and disadvantages", type: "textarea", column: false,
          help: "What this gains and what it costs, weighed. The method asks for the judgement, not just the decision. (VRB.3.1, VRB.4.2)" },
        { key: "prioritaet", label: "Priority", type: "enum", options: ["1 - first", "2", "3", "4 - last"],
          help: "Where this stands next to the others. The method requires it of corrections and improvements alike. (VRB.5.1)" },
        { key: "verantwortlich", label: "Owner", type: "text", column: false },
        { key: "faellig", label: "Due", type: "text", column: false },
        { key: "status", label: "Status", type: "enum", options: ["Planned", "In progress", "Done", "Dropped"] },
        // VRB.6.1: "die Wirksamkeit der umgesetzten Korrektur- und Verbesserungsmaßnahmen
        // testen". Done is not the same as worked, and the method asks for the second.
        { key: "wirksamkeit", label: "Effectiveness tested", type: "enum", options: ["Effective", "Partly effective", "Not effective"],
          help: "What a test after the fact showed. Empty means it was not tested, which the method does not allow for an action reported done. (VRB.6.1)" },
        { key: "wirksamkeit_ergebnis", label: "What the test showed", type: "textarea", column: false,
          help: "How the effectiveness was tested and what it showed - the evidence behind the verdict beside it. (VRB.6.1, VRB.6.2)" },
      ],
    },
  ],
};
