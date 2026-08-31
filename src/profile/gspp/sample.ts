// A sample study built the way the method says to build one.
//
// The requirements in it are NOT invented. They are the published Grundschutz++
// requirements, selected exactly as STM.2.1 prescribes:
//
//   · every asset is mapped to its target-object categories (STM.2.1.3),
//   · each category is widened to its parents up the hierarchy (STM.2.1.4.1),
//   · the requirements of those categories are collected (STM.2.1.4),
//   · a requirement reaching an asset twice is carried once (STM.2.1.4.2),
//   · the ISMS practices are added whole, without selection (STM.2.1.1).
//
// Every requirement therefore carries, in its rationale, the rule that put it there. That
// is the traceability an audit asks for, and it is also this file's second job: it shows
// what the modelling step has to produce before it exists as a feature of its own.
//
// The organization and its assets are invented and marked as an example. The requirement
// texts are the BSI's, as published.
import type { EntityRecord, FieldValue, Study } from "../../domain/types";
import { hashValues, sealLog, type LogInput } from "../../domain/audit";
import { refsFromProps, targetByKind } from "../../domain/catalog";
import { DEFAULT_TAXONOMY } from "./taxonomy";
import { GRUNDSCHUTZ_PP } from "./catalog.generated";
import { GSPP_COMPONENTS } from "./components.generated";
import { VOCABULARY } from "./vocabulary.generated";
import { getLanguage } from "../../domain/i18n";
import { germanizeEntities, germanizeLog, germanizeStudy } from "./sample.de";

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** The five ISMS practices. STM.2.1.1: their requirements are modelled onto the whole
 *  information domain without selection, and carried as "verbundweite Anforderungen". */
const ISMS_PRACTICES = ["GC", "STM", "UMS", "VRB", "PERF"];

/** A category plus every category above it, up to the root (STM.2.1.4.1). Deterministic,
 *  because the hierarchy is fixed - which is why the method says it can be automated. */
function withAncestors(categories: string[]): Set<string> {
  const out = new Set<string>();
  for (const start of categories) {
    let c: string | undefined = start;
    while (c && !out.has(c)) { out.add(c); c = VOCABULARY.parentCategory[c]; }
  }
  return out;
}

const categoriesOf = (props: Record<string, string> | undefined): string[] =>
  (props?.target_object_categories ?? "").split(",").map((s) => s.trim()).filter(Boolean);

export function makeSampleStudy(): Study {
  const ts = new Date().toISOString();
  const entities: EntityRecord[] = [];
  const add = (type: string, values: Record<string, FieldValue>): string => {
    const id = uid();
    entities.push({ id, type, values, createdAt: ts, updatedAt: ts });
    return id;
  };

  // ── Step 1 · Scope and planning ────────────────────────────────────────
  // The protection need is decided here, on the process, in two steps (GC.7.1.2). The
  // grid-control process is the one the institution cannot do without, so it is the one
  // the first pass of the cycle models (STM.2.1.2).
  const pGrid = add("business_asset", { name: "Grid control", description: "Round-the-clock supervision and control of the electricity and district-heating networks. An outage is felt immediately by every connected household.", asset_type: "Process", verantwortlich: "Head of Network Operations", criticality: 4, protection_need: "hoch", protection_rationale: "A loss of remote control, or a switching command altered in transit, threatens supply itself. Rated high with the management, which is also the trigger for the risk consideration under GC.7.2." });
  const pBilling = add("business_asset", { name: "Consumption billing", description: "Meter readings, invoicing and payment runs for domestic and commercial customers.", asset_type: "Statutory task", verantwortlich: "Head of Customer Service", criticality: 3, protection_need: "normal", protection_rationale: "A billing run can be repeated. Delay is costly but not existential." });
  const pCustomer = add("business_asset", { name: "Customer master data", description: "Contract, bank and consumption data of connected customers. Personal data under the GDPR.", asset_type: "Information", verantwortlich: "Data Protection Officer", criticality: 3, protection_need: "hoch", protection_rationale: "Disclosure is reportable and affects every customer at once." });

  // GC.4.1 and GC.4.2: who has expectations of information security here, what they are,
  // and what followed from them. The regulator is the one with a deadline attached, which is
  // why its weight is the highest; the works council is the one an institution forgets until
  // a monitoring measure is already built.
  add("partei", { name: "Bundesnetzagentur", art: "External", relevanz: 4,
    bedarf: "Compliance with the IT security catalogue for grid operators, and notification of a reportable incident within the statutory deadline.",
    ableitung: "The reporting path is part of the incident procedure, and the deadline is on the responsible role rather than in someone's memory.",
    verantwortlich: "Managing director" });
  add("partei", { name: "Connected customers", art: "External", relevanz: 3,
    bedarf: "Supply that does not stop, and that their consumption and bank data stay confidential.",
    ableitung: "Customer master data is rated high, and its disclosure is one of the loss events the risk consideration starts from.",
    verantwortlich: "Head of Customer Service" });
  add("partei", { name: "Works council", art: "Internal", relevanz: 3,
    bedarf: "That monitoring measures do not become performance monitoring, and that any recording of sessions is agreed before it is switched on.",
    ableitung: "The review of maintenance recordings names what is looked at and what is not; the agreement is referenced from the procedure.",
    verantwortlich: "Head of Human Resources" });
  add("partei", { name: "Operations staff", art: "Internal", relevanz: 2,
    bedarf: "Security that does not stand between them and a switching command at three in the morning.",
    ableitung: "The second factor for remote maintenance was designed with an emergency path, which is why it is an improvement rather than a correction.",
    verantwortlich: "Head of Network Operations" });

  // GC.9.1 and its six sub-requirements: the security organisation. The ISB carries the
  // three the method asks of that function alone - answerable to the management directly, a
  // direct right of audience, and resources. The committee shows that the register holds
  // more than posts, and the data-protection interface that GC.9.1's guidance asks for the
  // neighbouring disciplines to be anchored too. The last one is owed and not yet filled,
  // which is the state the checks exist to name.
  add("rolle", { name: "Information security officer", art: "Information security officer",
    traeger: "M. Adler", stellvertreter: "S. Brandt",
    aufgaben: "Advises the management on information security, coordinates the security concept and the requirement package, investigates incidents and reports on the state of security.",
    befugnisse: "May demand information from every unit, may stop a change that would leave a MUSS requirement unmet, and reports to the management on their own initiative.",
    qualifikation: "Knowledge of Grundschutz++ and of the utility's process control; two years in an operational security role; kept current by yearly training.",
    unterstellt: "Directly to the managing director, outside the IT line.",
    vorspracherecht: "Yes",
    ressourcen: "0.6 FTE, a training budget of EUR 4,000 a year, and the external audit budget.",
    interessenkonflikt: "Not to be held together with the head of IT operations: the role checks what that unit builds.",
    status: "Established" });
  add("rolle", { name: "Information security committee", art: "Committee",
    traeger: "Managing director, head of network operations, head of IT, data protection officer, ISB",
    stellvertreter: "Each member names a standing deputy in the convening order.",
    aufgaben: "Meets quarterly, decides on the requirement package, on exceptions above severity 3, and on the improvement plan.",
    befugnisse: "Approves exceptions and releases the resources for the implementation plan.",
    qualifikation: "Members are the holders of the named posts; no separate qualification is required of them.",
    status: "Established" });
  add("rolle", { name: "Interface to data protection", art: "Interface to another discipline",
    traeger: "Data Protection Officer", stellvertreter: "Deputy data protection officer",
    aufgaben: "Joint assessment where personal data and information security meet - reporting duties, retention, access to customer master data.",
    befugnisse: "May require a security measure to be assessed for its effect on the rights of data subjects.",
    qualifikation: "Appointed as data protection officer under the GDPR.",
    interessenkonflikt: "Independent of the ISB by design; both report to the management separately.",
    status: "Established" });
  add("rolle", { name: "Deputy for the ISB during long absence", art: "Role",
    aufgaben: "Owed. The standing deputy covers days, not months; nobody has been named for a longer absence and no handover is written down.",
    status: "Not established" });

  // Fifteen MUSS requirements of the method ask the institution to ANCHOR a procedure
  // rather than to record a decision. Three of them here as an example: two written down
  // and in force, one the institution owes and has not written - which is the state worth
  // recording, because a procedure nobody has noticed is missing is the gap the register
  // exists to show.
  add("verfahren", { name: "Continuous improvement of the ISMS", praktik: "VRB Verbesserung", anforderung: "VRB.1.1",
    description: "Nonconformities and improvement potentials are collected from audits, incidents and the annual review, examined for cause and recurrence, and answered by prioritised actions whose effect is tested afterwards.",
    dokument: "ISMS-VA-05 Kontinuierliche Verbesserung, v2.1", verantwortlich: "M. Adler",
    freigegeben_am: "2026-02-14", letzte_pruefung: "2026-07-30", status: "In force" });
  add("verfahren", { name: "Audit programme and audit reports", praktik: "PERF Monitoring-Evaluation", anforderung: "PERF.3.1, PERF.3.2",
    description: "The audit programme is drawn up annually from risk and from what changed, carried out by people independent of what they examine, and reported so that findings, room for improvement and what worked are all readable.",
    dokument: "ISMS-VA-08 Auditprogramm, v1.4", verantwortlich: "K. Cordes",
    freigegeben_am: "2026-01-20", letzte_pruefung: "2026-06-12", status: "In force" });
  const vfNachverfolgung = add("verfahren", { name: "Tracking the implementation of measures", praktik: "UMS Umsetzung", anforderung: "UMS.6.1, UMS.6.2",
    description: "Owed and not yet written. Status reporting, target against actual and the KPI readings happen, but nobody has set down at what interval, to whom they are reported, or how the plan is revised when they diverge.",
    status: "Not anchored" });

  // ── Step 2 · Requirements analysis ─────────────────────────────────────
  // The assets of the prioritised process, each mapped to the categories the BSI defines
  // (STM.2.1.3). The mapping is functional, not technical, and the reason is recorded:
  // it decides which requirements reach the asset.
  const assets: { id: string; name: string; categories: string[] }[] = [];
  const asset = (values: Record<string, FieldValue>, categories: string[]): string => {
    const id = add("supporting_asset", { ...values, asset_type: categories[0] });
    assets.push({ id, name: String(values.name), categories });
    return id;
  };

  const aScada = asset({ name: "Control system (SCADA)", description: "Central control system operating the substations and heating plants remotely.", supports: [pGrid], begruendung: "Mapped to IT-Systeme: it is operated as a system in its own right, not as an application on someone else's platform." }, ["IT-Systeme"]);
  const aTelecontrol = asset({ name: "Telecontrol network", description: "Separate wide-area network between the control room and the stations.", supports: [pGrid], begruendung: "Mapped to Netze: it carries the switching commands and is operated as a network." }, ["Netze"]);
  const aLegacy = asset({ name: "Dial-up access at the legacy stations", description: "A dial-up line from before the telecontrol network, still connected at six stations.", supports: [pGrid], begruendung: "Mapped to Externe Netzanschlüsse: it reaches the telecontrol equipment from outside, past the controlled crossing point. Inherits Netze." }, ["Externe Netzanschlüsse"]);
  const aProvider = asset({ name: "Remote-maintenance provider", description: "The manufacturer, holding remote access to the control system under a maintenance contract.", supports: [pGrid], begruendung: "Mapped to Dienstleistungen: what is bought is the service, not a product. Inherits Einkäufe.", externe_schnittstelle: "The manufacturer's own maintenance process reaches into the control network through this access. What crosses: a session opened per assignment from the manufacturer's network, and the diagnostic data it takes back. Run by the manufacturer; on this side the head of Network Operations answers for it. (STM.1.2)" }, ["Dienstleistungen"]);
  const aDirectory = asset({ name: "Directory service", description: "Central user and permission management for the administrative IT.", supports: [pBilling, pCustomer], begruendung: "Mapped to Verzeichnisdienste, which the catalogue places under Anwendungen." }, ["Verzeichnisdienste"]);
  asset({ name: "Billing system", description: "The ERP application handling meter readings, invoices and payment runs.", supports: [pBilling, pCustomer], begruendung: "Mapped to Anwendungen: it runs on the shared platform rather than as a system of its own." }, ["Anwendungen"]);

  const eOutage = add("feared_event", { name: "Loss of network control", description: "The control room loses remote control; switching is possible only on site.", business_asset: pGrid, impact: "Availability", severity: 4 });
  const eManipulation = add("feared_event", { name: "Switching commands manipulated", description: "Altered commands cause mis-operation in the distribution network.", business_asset: pGrid, impact: "Integrity", severity: 4 });
  add("feared_event", { name: "Customer data disclosed", description: "Contract and bank data of connected customers are exfiltrated; reportable under the GDPR.", business_asset: pCustomer, impact: "Confidentiality", severity: 3 });

  // The practices this example touches, as the BSI names them.
  add("praktik", { name: "Governance und Compliance", kuerzel: "GC", schwerpunkt: "Methodical", description: "The strategic frame: roles, obligations, evidence." });
  add("praktik", { name: "Berechtigung", kuerzel: "BER", schwerpunkt: "Technical", description: "Access for authorised people and systems only." });
  add("praktik", { name: "Dienstleistersteuerung", kuerzel: "DLS", schwerpunkt: "Organisational", description: "What is required of a service provider, and how it is verified." });

  // ── The requirement package (STM.2.1) ──────────────────────────────────
  // Built here rather than typed out. The values are produced by the very function the
  // catalogue import uses, so a sample requirement and an imported one are the same
  // record - a difference between them would be a bug in one of the two paths.
  const target = targetByKind(DEFAULT_TAXONOMY, "requirement");
  const byRefId = new Map<string, string>();          // catalogue identifier → entity id
  if (target) {
    const packaged = new Map<string, { item: (typeof GRUNDSCHUTZ_PP.items)[number]; why: string[]; assets: string[] }>();
    const put = (item: (typeof GRUNDSCHUTZ_PP.items)[number], why: string, assetId?: string) => {
      const seen = packaged.get(item.ref_id);
      // STM.2.1.4.2: carried once, but keeping the reference to every asset it reached.
      if (seen) {
        if (!seen.why.includes(why)) seen.why.push(why);
        if (assetId && !seen.assets.includes(assetId)) seen.assets.push(assetId);
        return;
      }
      packaged.set(item.ref_id, { item, why: [why], assets: assetId ? [assetId] : [] });
    };

    for (const a of assets) {
      const cats = withAncestors(a.categories);
      const inherited = [...cats].filter((c) => !a.categories.includes(c));
      for (const item of GRUNDSCHUTZ_PP.items) {
        const hit = categoriesOf(item.props).find((c) => cats.has(c));
        if (!hit) continue;
        put(item, `${a.name} - category ${hit}${inherited.includes(hit) ? " (inherited)" : ""}`, a.id);
      }
    }
    for (const item of GRUNDSCHUTZ_PP.items) {
      if (ISMS_PRACTICES.includes(item.ref_id.split(".")[0])) {
        put(item, "ISMS practice - applies to the whole information domain, without selection (STM.2.1.1)");
      }
    }

    // The whole ruleset is recorded, as the product records it. What the reading reached is
    // in scope and says through which asset; the rest is present and set back, which is what
    // a relevance decision is made on (STM.2.1.5).
    for (const item of GRUNDSCHUTZ_PP.items) {
      const hit = packaged.get(item.ref_id);
      byRefId.set(item.ref_id, add(target.type.key, {
        ...target.toValues(GRUNDSCHUTZ_PP, item),
        scope: hit ? "in scope" : "out of scope",
        // UMS.1.1 knows two answers only. Nothing has been checked yet in this example
        // beyond the handful the measures below account for.
        umsetzung: "nein",
        // The reading records why it reached a requirement AND why it did not. STM.2.1.5
        // wants a decision with a justification for what the catalogue classifies nowhere,
        // and the reading already knows that justification - demanding it by hand made 269
        // findings out of a fact the register was already carrying in two other fields.
        ...(hit
          ? { begruendung: `In scope: ${hit.why.join("; ")}.` }
          : { begruendung: (item.props?.target_object_categories ?? "")
              ? "Out of scope: no asset of this domain carries a class this requirement applies to."
              : "Out of scope: the catalogue names no target-object category for this requirement, so no asset reaches it. Bring it in where it applies (STM.2.1.5)." }),
        // The package as a relation, not only as a sentence (STM.2.1.4.2). The ISMS
        // practices reach the whole information domain and name no asset.
        ...(hit?.assets.length ? { applies_to_asset: hit.assets } : {}),
      }));
    }
  }
  /** A requirement of the package, by its published identifier. */
  const req = (refId: string): string[] => (byRefId.has(refId) ? [byRefId.get(refId)!] : []);
  const met = (refId: string) => { const id = byRefId.get(refId); if (id) entities.find((e) => e.id === id)!.values.umsetzung = "ja"; };

  // ── The risk consideration (GC.7.2 / STM.4.1) ──────────────────────────
  // Entered because the grid-control process was rated "hoch" - the first of the four
  // triggers. GS++ leaves the method open; this one models the attack chain.
  const rCrime = add("risk_origin", { name: "Organised cybercrime", description: "An extortion group working against operators of critical supply.", category: "Cybercriminals", motivation: "Ransom", capability: 3, resources: 3, activity: 4, relevance: 4 });
  const rState = add("risk_origin", { name: "State actor", description: "Directed at sabotaging supply infrastructure.", category: "State actor", motivation: "Sabotage", capability: 4, resources: 4, activity: 2, relevance: 3 });

  const tsRemote = add("strategic_scenario", { name: "Entry through the manufacturer's remote maintenance", description: "The attacker compromises the manufacturer's remote access and reaches the telecontrol network through it.", risk_origin: rCrime, feared_event: eOutage, likelihood: 3, gravity: 4 });
  const tsSabotage = add("strategic_scenario", { name: "Sabotage of network control", description: "A state actor establishes lasting access and alters switching commands at a time of its choosing.", risk_origin: rState, feared_event: eManipulation, likelihood: 2, gravity: 4 });

  const asRansom = add("operational_scenario", { name: "Encryption of the control-room systems", description: "The chain from the compromised maintenance access to the loss of remote control.", strategic_scenario: tsRemote, likelihood: 3, difficulty: 3 });
  const s1 = add("kill_chain_step", { name: "Takeover of the maintenance access", description: "The provider's credentials are obtained.", operational_scenario: asRansom, step_order: 1, tactic: "Initial Access", technique: "T1078 Valid Accounts", targets_asset: aProvider });
  const s2 = add("kill_chain_step", { name: "Persistence on the jump host", description: "Lasting access on the maintenance system.", operational_scenario: asRansom, step_order: 2, tactic: "Persistence", technique: "T1053 Scheduled Task/Job", targets_asset: aDirectory, predecessors: [s1] });
  const s3 = add("kill_chain_step", { name: "Move into the control system", description: "From the maintenance segment into the control system.", operational_scenario: asRansom, step_order: 3, tactic: "Lateral Movement", technique: "T1021 Remote Services", targets_asset: aScada, predecessors: [s2] });
  const s4 = add("kill_chain_step", { name: "Encryption of the control-room servers", description: "Remote control is lost.", operational_scenario: asRansom, step_order: 4, tactic: "Impact", technique: "T1486 Data Encrypted for Impact", targets_asset: aScada, predecessors: [s3] });

  // The second chain shares a route with the first: its second step also follows from the
  // move into the control system. Two chains through one step is what makes that step a
  // choke point in the attack-path projection.
  const asSabotage = add("operational_scenario", { name: "Mis-operation through altered switching commands", description: "The chain from access to the telecontrol equipment to a switching operation triggered at will. The attacker stays quiet until the moment is chosen.", strategic_scenario: tsSabotage, likelihood: 2, difficulty: 4 });
  const b1 = add("kill_chain_step", { name: "Entry over the legacy dial-up line", description: "A dial-up connection into the telecontrol equipment, past the controlled crossing point.", operational_scenario: asSabotage, step_order: 1, tactic: "Initial Access", technique: "T1133 External Remote Services", targets_asset: aLegacy });
  const b2 = add("kill_chain_step", { name: "Reading the telecontrol protocol", description: "Recording switching commands to learn how the plant is operated.", operational_scenario: asSabotage, step_order: 2, tactic: "Discovery", technique: "T0842 Network Sniffing", targets_asset: aTelecontrol, predecessors: [b1, s3] });
  add("kill_chain_step", { name: "Injection of altered switching commands", description: "The attacker opens feeders at a time of its choosing.", operational_scenario: asSabotage, step_order: 3, tactic: "Impact", technique: "T0831 Manipulation of Control", targets_asset: aScada, predecessors: [b2] });

  add("risk_treatment", { name: "Secure the remote-maintenance access", strategic_scenario: tsRemote, decision: "Reduce", owner: "Head of IT Operations", deadline: "2026-10-31", status: "In progress", justification: "A second factor and the zone separation reduce the access; evaluation of the session logs is commissioned." });
  add("risk_treatment", { name: "Bring the telecontrol access back to one controlled crossing", strategic_scenario: tsSabotage, decision: "Reduce", owner: "Head of Network Operations", deadline: "2027-06-30", status: "Proposed", justification: "Removing the dial-up lines removes the uncontrolled entry. Until then the chain is covered by detection alone." });

  // ── Step 3 · Implementation ────────────────────────────────────────────
  // The five effect classes act at different points of the model: a deterrent measure
  // lowers the number of attempts, an avoidance measure removes the exposure. Without one
  // of each, half the effect model has nothing to show for itself.
  const own = (values: Record<string, FieldValue>) => add("security_measure", { ...values, scope: "in use" });
  own({ name: "Multi-factor authentication for remote-maintenance access", description: "A second factor for every access by the manufacturer, released per session.", measure_type: "Preventive", status: "Planned", fulfills: req("DLS.2.1"), covers: [s1], implementation_level: 3, priority: 4, verantwortlich: "IT Operations", termin: "2026-10-31" });
  // Two measures on one step: what the second adds on top of the first is the question the
  // defence-in-depth table answers, and the step breakdown shows the arithmetic.
  own({ name: "Maintenance access released only on request", description: "The manufacturer's access is disabled by default and opened for a time window per assignment.", measure_type: "Preventive", status: "Implemented", fulfills: req("ASST.5.6"), covers: [s1], implementation_level: 3, priority: 3, verantwortlich: "IT Operations", termin: "" });
  own({ name: "Separation of the telecontrol network from the office IT", description: "Separate transmission paths and a controlled crossing between the zones.", measure_type: "Preventive", status: "Implemented", fulfills: [], covers: [s3], implementation_level: 4, priority: 3, verantwortlich: "Network Operations", termin: "" });
  own({ name: "Evaluation of the remote-maintenance logs", description: "Session logs are collected centrally and reviewed for anomalies.", measure_type: "Detective", status: "Recommended", fulfills: [], covers: [s2], implementation_level: 1, priority: 3, verantwortlich: "IT Security", termin: "2027-03-31" });
  own({ name: "Offline backup of the control-system configuration", description: "A weekly backup held off the network, restored once a quarter to prove it works.", measure_type: "Corrective", status: "Implemented", fulfills: [], covers: [s4], implementation_level: 3, priority: 2, verantwortlich: "IT Operations", termin: "" });
  own({ name: "Announced recording of every maintenance session", description: "Every session by the manufacturer is recorded; the recording is stated in the contract and at connection time.", measure_type: "Deterrent", status: "Implemented", fulfills: [], covers: [s1], implementation_level: 4, priority: 2, verantwortlich: "IT Security", termin: "" });
  own({ name: "Removal of the legacy dial-up lines", description: "The six remaining dial-up connections are disconnected and the stations moved onto the telecontrol network.", measure_type: "Avoidance", status: "Planned", fulfills: req("DLS.4.1"), covers: [b1], implementation_level: 1, priority: 4, verantwortlich: "Network Operations", termin: "2027-06-30" });
  own({ name: "Anomaly detection on the telecontrol protocol", description: "Switching commands are checked against the expected operating pattern and deviations reported to the control room.", measure_type: "Detective", status: "Planned", fulfills: [], covers: [b2], implementation_level: 3, priority: 4, verantwortlich: "Network Operations", termin: "2027-09-30" });
  ["DLS.2.1", "ASST.5.6", "DLS.4.1"].forEach(met);

  // PERF.3 · PERF.4: the audit programme and the report the management reads. Planned
  // before it is held, risk-oriented in what it examines, and independent of it.
  const audit1 = add("audit", {
    name: "Internal audit of remote maintenance", audit_type: "Internal",
    ziel: "Establish whether the requirements on remote-maintenance access are met and whether the measures on it work.",
    umfang: "The manufacturer's access to the control system, the maintenance jump host and the session records, for the year to date.",
    supporting_asset: [aProvider, aScada], requirement: req("DLS.2.1").concat(req("ASST.5.6")),
    kriterien: "Interviews with IT Operations, review of the maintenance contract and the session records, and a technical check of the access rules on the jump host.",
    auditteam: "Internal Audit, with an external network specialist. Neither is involved in operating the access.",
    unabhaengig: "ja", geplant_fuer: "2026-09-15", durchgefuehrt_am: "2026-09-17",
    bericht: "Access is released per assignment and recorded as required. The session records are collected but not evaluated: nobody is named as reading them, so a misuse would be visible only after the fact. Two-factor authentication is in place for three of five accounts.",
    kommuniziert_an: "Managing director and the security committee on 2026-09-24; IT Operations and the maintenance provider on 2026-09-25, the provider only for the part concerning its own access.",
  });
  add("audit", {
    name: "Surveillance audit of the telecontrol network", audit_type: "Surveillance",
    ziel: "Establish whether the separation between the telecontrol network and the office IT holds as designed.",
    umfang: "The crossing point between the zones and the six legacy dial-up stations.",
    supporting_asset: [aTelecontrol, aLegacy],
    kriterien: "Configuration review of the crossing point, and a sample of the dial-up lines on site.",
    auditteam: "External auditor, appointed for the year.", unabhaengig: "ja",
    geplant_fuer: "2027-03-10",
  });
  add("managementbericht", {
    name: "Management report on information security, first half of 2026",
    zeitraum: "January to June 2026", anlass: "Scheduled",
    eignung: "The requirement package is modelled and the measures on the grid-control process are in place or planned. The intended purpose is not yet effectively met at two points: the maintenance sessions are recorded but not read, and the legacy dial-up lines are still connected.",
    audit: [audit1],
    folgemassnahmen: "The decision of the last review to remove the dial-up lines is behind schedule; the budget has been carried into 2027.",
    rahmenbedingungen: "The district-heating network was taken over in March, so grid control now covers both networks and the process was re-rated hoch. The published catalogue moved to the 2026-08 version; the derivation was run again and brought in nine requirements, none of them MUSS.",
    erfolge_probleme: "The second factor on remote maintenance has held since February with no exception granted. Against that: a switching command was queued twice in April through the maintenance gateway - no outage, but it was found by the operator and not by us.",
    eignung_massnahmen: "Multi-factor authentication reaches its objective, verified against the release log for the last quarter. Recording the maintenance sessions does not: the records exist and nobody reads them, so the measure detects nothing. It is to be extended by a named reviewer rather than replaced.",
    rueckmeldungen: "The Bundesnetzagentur asked in May how long a disturbance report takes here; the answer was written down as an own requirement. Operations staff report that the second factor costs about a minute per session, which nobody has objected to. No feedback from connected customers on security this period.",
    planstatus: "Of eight planned measures four are implemented, two in progress, two not started. The risk on the grid-control process moved from likely-existential to possible-severe; the two not started are the ones on the legacy stations, so the dial-up path is unchanged.",
    verbesserungen_bericht: "The review of the last period asked for the exception procedure to be written down; it is anchored and in force since April. It has been used twice, both times with a named authoriser and an end date - which is what it was for. Whether it prevents an open-ended exception cannot be said before the first one expires.",
    entscheidungen: "The removal of the dial-up lines is confirmed for the first half of 2027. An owner is named for reading the session records.",
    massnahmenvorschlaege: "1 - Read the maintenance session records weekly, with a named reviewer: 2 hours a week of the on-call role, no budget. 2 - Second factor on the remaining two administrative accounts: 4 person-days plus EUR 900 for tokens. 3 - Remove the six legacy dial-up stations: 25 person-days and EUR 40,000, of which EUR 18,000 falls in 2027.",
    vorgelegt_am: "2026-07-28",
  });

  // STM.2.1.7: the package is extended by what the institution's own compliance
  // environment requires. It carries the obligation it follows from and the processes it
  // applies to, because nothing in the catalogue can supply either.
  add("requirement", {
    name: "Report a disturbance of the grid control systems to the Bundesnetzagentur without delay",
    ref_id: "EIGEN.1", herkunft: "Own - compliance obligation",
    compliance_basis: "§ 11 (1c) EnWG together with the security catalogue for grid operators - example, not legal advice",
    modal_verb: "MUSS", praktik: "GC Governance und Compliance",
    applies_to_process: [pGrid], verantwortlich: "Head of Network Operations",
    scope: "in scope", umsetzung: "nein", prioritaet: "1 - first", faellig: "2026-12-31",
    description: "A disturbance of the systems operating the grid is reported to the regulator without delay, in the form the security catalogue prescribes.",
    begruendung: "Taken on under STM.2.1.7: the obligation applies to the institution as a grid operator and is not covered by any requirement of the catalogue.",
    residual_risk: "A late report is a breach of the obligation itself, independently of the disturbance.",
  });

  // STM.3.1: the initial security level is reviewed and, where the context of the
  // institution differs, changed - here for one asset rather than everywhere. Lowering it
  // from erhöht to normal-SdT is the fourth trigger for a risk consideration (STM.4.1),
  // so the review carries the consideration and the reason.
  const redundancy = byRefId.get("ARCH.8.2") ?? "";
  if (redundancy) add("niveau_review", {
    name: "Redundant telecoms connection at the legacy stations",
    requirement: redundancy, supporting_asset: aLegacy,
    level_before: "erhöht", level_after: "normal-SdT",
    begruendung: "The six dial-up lines are being disconnected within the year and the stations moved onto the telecontrol network. Building a second connection for a link that is to be removed would tie up the budget the removal needs.",
    risk_considered: "ja", strategic_scenario: tsSabotage, decided_on: "2026-05-20",
  });

  // UMS.5: the method knows two implementation states and no third. What would elsewhere
  // be recorded as "partly" is a decision here - authorised, reasoned, and dated, with the
  // risk consideration that not implementing it triggers (STM.4.1).
  const anyReq = [...byRefId.entries()].find(([id]) => id.startsWith("GEB"))?.[1] ?? "";
  if (anyReq) add("exception", { name: "No separate fire compartment in the substation", requirement: anyReq,
    supporting_asset: aScada,
    begruendung: "The station building predates the requirement and cannot be subdivided without taking the feeder out of service for weeks. A detection and alerting arrangement is in place instead.",
    authorised_by: "Managing Director, on the proposal of the Head of Network Operations",
    decided_on: "2026-07-02", valid_until: "2028-12-31", risk_considered: "ja", strategic_scenario: tsSabotage });

  // The BSI's published implementations, all recorded so they can be found and none of
  // them claimed: what this institution uses is switched on, the rest is present and set
  // back. The requirements each one answers come from the publisher, not from us.
  const measureTarget = targetByKind(DEFAULT_TAXONOMY, "measure");
  if (measureTarget) {
    for (const item of GSPP_COMPONENTS.items) {
      add(measureTarget.type.key, {
        ...measureTarget.toValues(GSPP_COMPONENTS, item),
        // The publisher states, by identifier, which requirements each implementation
        // answers. Resolved onto the requirement records already recorded above, so the
        // mapping is a relation rather than a string nobody can follow.
        ...refsFromProps(entities, measureTarget.type, item),
        scope: "not in use",
        status: "Recommended",
      });
    }
  }

  // ── Step 4 · Monitoring ────────────────────────────────────────────────
  const kMuss = add("kennzahl", { name: "Share of MUSS requirements implemented", description: "How much of what the ruleset makes unconditional is actually in place.", praktik: "GC Governance und Compliance", zielwert: 100, istwert: 12, einheit: "%" });
  const kMfa = add("kennzahl", { name: "Privileged accounts with a second factor", description: "Share of administrative accounts behind multi-factor authentication.", praktik: "BER Berechtigung", zielwert: 100, istwert: 74, einheit: "%" });

  // GC.5.1 to GC.5.1.4 in one record: the objectives (as the metrics that measure them,
  // because the method asks for them to be measurable and its own example is a metric), the
  // strategy, the commitment of the management, and the authorisation without which the
  // document has no force.
  add("leitlinie", { name: "Information security policy of Riverbend Municipal Utilities", version: "2.0",
    ziele: [kMuss, kMfa],
    strategie: "Security follows supply. Where a measure would slow the control of the grid, the measure is redesigned rather than the process; everywhere else the published requirement is met as written. Nothing reaches the control network that has not been through the maintenance gateway, and nothing leaves the institution without a named owner.",
    verpflichtung: "The managing director carries overall responsibility for information security, confirms the objectives above against the business objectives twice a year, receives the ISB without an intermediary, and releases the resources the implementation plan names.",
    dokument: "ISMS-LL-01 Leitlinie Informationssicherheit, v2.0",
    freigegeben_durch: "Managing director", freigegeben_am: "2026-02-14", status: "In force" });

  // ── Step 5 · Improvement ───────────────────────────────────────────────
  // VRB.2.1 asks a nonconformity two questions - what let it happen, and whether it can
  // happen again - and VRB.4.1 asks for an action against the CAUSE. The first of these
  // carries both and its action; the second is left as a finding somebody has written down
  // and not yet understood, which is the state the checks are there to name.
  const abw1 = add("abweichung", { name: "Maintenance sessions are recorded but never read", description: "Sessions by the manufacturer are recorded, and nobody reviews the logs.", requirement: byRefId.get("DLS.2.1") ?? "", audit: audit1, schwere: 3, status: "In progress",
    ursache: "The recording was set up as a technical measure and never given to anyone as a task; the operating manual names no reviewer and no interval.",
    wiederauftreten: "Yes", isms_anpassung: "Yes" });
  add("abweichung", { name: "The role description is out of date", description: "The named role is filled; its description still refers to the previous version of the ruleset.", requirement: "", schwere: 1, status: "Open" });

  // VRB.4.1 · VRB.4.2 · VRB.5.1 · VRB.6.1: corrections and improvements in one register,
  // because VRB.5.1 prioritises them in one sentence. One carried out and tested, one
  // planned, one improvement taken up without any fault forcing it.
  add("verbesserung", { name: "Log review into the operating manual, with a named reviewer",
    art: "Correction", abweichung: abw1,
    description: "Connect the maintenance recordings to the central log evaluation, name a reviewer in the operating manual and set a weekly interval.",
    vorteile_nachteile: "Costs about two hours a week of the on-call role; makes a session that nobody watched visible within seven days instead of never.",
    prioritaet: "1 - first", verantwortlich: "M. Adler", faellig: "2026-10-31", status: "Done",
    wirksamkeit: "Partly effective",
    wirksamkeit_ergebnis: "Tested by a deliberate out-of-hours session on 2026-11-04: it appeared in the weekly review, but three days later rather than within one. The interval is the limit, not the connection." });
  const vbMfa = add("verbesserung", { name: "Second factor for the manufacturer's remote maintenance",
    art: "Improvement",
    description: "The access exists and is monitored; a second factor would remove the standing credential as a single point of failure.",
    vorteile_nachteile: "Removes the standing credential; the manufacturer has to carry a token, and an emergency session takes longer to open.",
    prioritaet: "2", verantwortlich: "S. Brandt", faellig: "2027-03-31", status: "Planned" });

  // PERF.1.3: the package is re-read at the institution's interval. One reading held, which
  // took the modelling again because a whole process had moved; one on the calendar and not
  // yet due. Moving that date into the past is what makes the overdue check fire, and the
  // end-to-end script does exactly that rather than the sample carrying a standing finding.
  add("paket_review", { name: "Annual reading of the requirement package 2026",
    verfahren: vfNachverfolgung, durchgefuehrt_am: "2026-03-31", faellig: "2026-03-31",
    betrachtet: "The move of meter reading to the new metering service, two substations taken into remote operation, the merger of IT and network operations into one unit, and the NIS2 implementing act.",
    ergebnis: "The package still fits the control system and the billing run. It does not fit the metering service: that process reaches assets no category of the catalogue had been mapped to, so the derivation reached them with nothing.",
    anpassungen: "The metering service was classified, its two assets mapped, and the package derived again. 41 requirements came in, 3 were struck as not relevant with the reason recorded.",
    neumodellierung: "Yes - the package was derived again",
    abgestimmt_mit: "Network Operations, Customer Service, Data Protection Officer",
    verantwortlich: "M. Adler" });
  add("paket_review", { name: "Annual reading of the requirement package 2027",
    verfahren: vfNachverfolgung, faellig: "2027-03-31",
    verantwortlich: "M. Adler" });

  // UMS.6.1 · UMS.6.2: the tracking round the procedure above still owes in writing. One
  // held, behind plan, with the cause found and the plan revised because of it; one on the
  // calendar and not yet run. The round points at the metrics rather than repeating their
  // numbers.
  add("nachverfolgung", { name: "Q3/2026 status round", verfahren: vfNachverfolgung,
    durchgefuehrt_am: "2026-09-30", soll: 6, ist: 4,
    kennzahl: [kMuss, kMfa],
    ursache: "Both open measures wait on the manufacturer: the second factor needs a token the maintenance contract does not yet cover, and the log evaluation needs an export format the manufacturer has not delivered. Neither is a resource shortage on our side, which is why raising the priority alone would not have moved them.",
    verbesserung: [vbMfa],
    planaenderung: "The second factor moved from 2026-12-31 to 2027-03-31 and the contract amendment was made its predecessor. The log evaluation stays where it is; its date was already behind the contract talks.",
    kommuniziert_an: "Management board, IT Operations, Network Operations",
    verantwortlich: "M. Adler" });
  add("nachverfolgung", { name: "Q4/2026 status round", verfahren: vfNachverfolgung,
    verantwortlich: "M. Adler" });

  // A study that only ever shows creates says nothing about the change history, which is
  // one of the things this product is for. The sample therefore carries a few real edits
  // with editors, timestamps and reasons, as an audit would find them.
  // The study is written in German where the reader is. This happens HERE, before the log
  // is built: the entries take their title from the record, and the seal below hashes the
  // values, so a rewrite afterwards would break the chain rather than translate it.
  const de = getLanguage() === "de";
  if (de) germanizeEntities(entities);

  const day = (back: number) => new Date(Date.parse(ts) - back * 86400000).toISOString();
  const pending: LogInput[] = entities.map((e, i) => ({
    ts: day(30 - Math.min(29, Math.floor((i / Math.max(1, entities.length)) * 29))),
    editor: ["M. Adler", "S. Brandt", "K. Cordes"][i % 3], kind: "create" as const,
    entity: e.id, entityType: e.type, title: String(e.values.name ?? e.id),
  }));
  const edit = (id: string, at: string, editor: string, comment: string, changes: LogInput["changes"]) => {
    const e = entities.find((x) => x.id === id);
    if (!e) return;
    e.updatedAt = at;
    pending.push({ ts: at, editor, kind: "update", entity: id, entityType: e.type,
      title: String(e.values.name ?? id), changes, comment });
  };
  edit(pGrid, day(9), "S. Brandt", "Raised to hoch after the site visit: a mis-operation reaches supply directly. This is what opened the risk consideration.",
    [{ field: "protection_need", from: "normal", to: "hoch" }]);
  edit(aLegacy, day(6), "M. Adler", "Found during the asset survey - six stations still answer on the old dial-up line.",
    [{ field: "description", from: "Decommissioned with the telecontrol rollout.", to: "A dial-up line from before the telecontrol network, still connected at six stations." }]);
  // UMS.1.1 in the log: the implementation status is a finding, and a finding is
  // recorded with who established it and on what basis.
  const dls = byRefId.get("DLS.2.1");
  if (dls) edit(dls, day(4), "K. Cordes", "Verified during the maintenance window: the second factor is enforced for every session of the provider.",
    [{ field: "umsetzung", from: "nein", to: "ja" }]);
  const asst = byRefId.get("ASST.5.6");
  if (asst) edit(asst, day(3), "K. Cordes", "The access is disabled by default and opened per assignment; the release log was sampled for the last quarter.",
    [{ field: "umsetzung", from: "nein", to: "ja" }]);
  edit(pGrid, day(14), "M. Adler", "After taking over the district-heating network the process covers both.",
    [{ field: "description", from: "Round-the-clock supervision and control of the electricity network.", to: "Round-the-clock supervision and control of the electricity and district-heating networks. An outage is felt immediately by every connected household." }]);
  if (de) germanizeLog(pending);
  pending.sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));
  const lastIdx = new Map<string, number>();
  pending.forEach((p, i) => lastIdx.set(p.entity, i));
  const byId = new Map(entities.map((e) => [e.id, e]));
  const log = sealLog(pending.map((p, i) =>
    lastIdx.get(p.entity) === i ? { ...p, state: hashValues(byId.get(p.entity)!.values) } : p));

  const study: Study = {
    id: uid(),
    // Example data, and it says so: the language below is the one its text was written in,
    // and while nobody has worked in it the application may build it again in another.
    example: true,
    language: getLanguage(),
    name: "Riverbend Municipal Utilities - grid control (example)",
    organization: "Riverbend Municipal Utilities",
    // One of the sectors declared in calibration.ts. The value is matched literally
    // against the rate exceptions there; this one triples the state-actor rate.
    sector: "Energy & utilities",
    scope: "The control room, the telecontrol equipment and the administrative IT that serves them, at the main works.",
    createdAt: ts,
    updatedAt: ts,
    entities,
    log,
  };
  if (de) germanizeStudy(study);
  return study;
}
