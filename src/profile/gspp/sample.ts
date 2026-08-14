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
import { targetByKind } from "../../domain/catalog";
import { DEFAULT_TAXONOMY } from "./taxonomy";
import { GRUNDSCHUTZ_PP } from "./catalog.generated";
import { GSPP_COMPONENTS } from "./components.generated";
import { VOCABULARY } from "./vocabulary.generated";

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** The five ISMS practices. STM.2.1.1: their requirements are modelled onto the whole
 *  information domain without selection, and carried as "verbundweite Anforderungen". */
const ISMS_PRACTICES = ["GC", "STM", "UMS", "VRB", "PERF"];

/** A category plus every category above it, up to the root (STM.2.1.4.1). Deterministic,
 *  because the hierarchy is fixed — which is why the method says it can be automated. */
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
  const aProvider = asset({ name: "Remote-maintenance provider", description: "The manufacturer, holding remote access to the control system under a maintenance contract.", supports: [pGrid], begruendung: "Mapped to Dienstleistungen: what is bought is the service, not a product. Inherits Einkäufe." }, ["Dienstleistungen"]);
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
  // record — a difference between them would be a bug in one of the two paths.
  const target = targetByKind(DEFAULT_TAXONOMY, "requirement");
  const byRefId = new Map<string, string>();          // catalogue identifier → entity id
  if (target) {
    const packaged = new Map<string, { item: (typeof GRUNDSCHUTZ_PP.items)[number]; why: string[] }>();
    const put = (item: (typeof GRUNDSCHUTZ_PP.items)[number], why: string) => {
      const seen = packaged.get(item.ref_id);
      // STM.2.1.4.2: carried once, but keeping the reference to every asset it reached.
      if (seen) { if (!seen.why.includes(why)) seen.why.push(why); return; }
      packaged.set(item.ref_id, { item, why: [why] });
    };

    for (const a of assets) {
      const cats = withAncestors(a.categories);
      const inherited = [...cats].filter((c) => !a.categories.includes(c));
      for (const item of GRUNDSCHUTZ_PP.items) {
        const hit = categoriesOf(item.props).find((c) => cats.has(c));
        if (!hit) continue;
        put(item, `${a.name} — category ${hit}${inherited.includes(hit) ? " (inherited)" : ""}`);
      }
    }
    for (const item of GRUNDSCHUTZ_PP.items) {
      if (ISMS_PRACTICES.includes(item.ref_id.split(".")[0])) {
        put(item, "ISMS practice — applies to the whole information domain, without selection (STM.2.1.1)");
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
        ...(hit ? { begruendung: `In scope: ${hit.why.join("; ")}.` } : {}),
      }));
    }
  }
  /** A requirement of the package, by its published identifier. */
  const req = (refId: string): string[] => (byRefId.has(refId) ? [byRefId.get(refId)!] : []);
  const met = (refId: string) => { const id = byRefId.get(refId); if (id) entities.find((e) => e.id === id)!.values.umsetzung = "ja"; };

  // ── The risk consideration (GC.7.2 / STM.4.1) ──────────────────────────
  // Entered because the grid-control process was rated "hoch" — the first of the four
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
  own({ name: "Multi-factor authentication for remote-maintenance access", description: "A second factor for every access by the manufacturer, released per session.", measure_type: "Preventive", status: "In progress", fulfills: req("DLS.2.1"), covers: [s1], implementation_level: 3, priority: 4, verantwortlich: "IT Operations", termin: "2026-10-31" });
  // Two measures on one step: what the second adds on top of the first is the question the
  // defence-in-depth table answers, and the step breakdown shows the arithmetic.
  own({ name: "Maintenance access released only on request", description: "The manufacturer's access is disabled by default and opened for a time window per assignment.", measure_type: "Preventive", status: "Implemented", fulfills: req("ASST.5.6"), covers: [s1], implementation_level: 3, priority: 3, verantwortlich: "IT Operations", termin: "" });
  own({ name: "Separation of the telecontrol network from the office IT", description: "Separate transmission paths and a controlled crossing between the zones.", measure_type: "Preventive", status: "Verified", fulfills: [], covers: [s3], implementation_level: 4, priority: 3, verantwortlich: "Network Operations", termin: "" });
  own({ name: "Evaluation of the remote-maintenance logs", description: "Session logs are collected centrally and reviewed for anomalies.", measure_type: "Detective", status: "Proposed", fulfills: [], covers: [s2], implementation_level: 1, priority: 3, verantwortlich: "IT Security", termin: "2027-03-31" });
  own({ name: "Offline backup of the control-system configuration", description: "A weekly backup held off the network, restored once a quarter to prove it works.", measure_type: "Corrective", status: "Implemented", fulfills: [], covers: [s4], implementation_level: 3, priority: 2, verantwortlich: "IT Operations", termin: "" });
  own({ name: "Announced recording of every maintenance session", description: "Every session by the manufacturer is recorded; the recording is stated in the contract and at connection time.", measure_type: "Deterrent", status: "Implemented", fulfills: [], covers: [s1], implementation_level: 4, priority: 2, verantwortlich: "IT Security", termin: "" });
  own({ name: "Removal of the legacy dial-up lines", description: "The six remaining dial-up connections are disconnected and the stations moved onto the telecontrol network.", measure_type: "Avoidance", status: "Planned", fulfills: req("DLS.4.1"), covers: [b1], implementation_level: 1, priority: 4, verantwortlich: "Network Operations", termin: "2027-06-30" });
  own({ name: "Anomaly detection on the telecontrol protocol", description: "Switching commands are checked against the expected operating pattern and deviations reported to the control room.", measure_type: "Detective", status: "In progress", fulfills: [], covers: [b2], implementation_level: 3, priority: 4, verantwortlich: "Network Operations", termin: "2027-09-30" });
  ["DLS.2.1", "ASST.5.6", "DLS.4.1"].forEach(met);

  // UMS.5: the method knows two implementation states and no third. What would elsewhere
  // be recorded as "partly" is a decision here — authorised, reasoned, and dated, with the
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
        scope: "not in use",
        status: "Recommended",
      });
    }
  }

  // ── Step 4 · Monitoring ────────────────────────────────────────────────
  add("kennzahl", { name: "Share of MUSS requirements implemented", description: "How much of what the ruleset makes unconditional is actually in place.", praktik: "GC Governance und Compliance", zielwert: 100, istwert: 12, einheit: "%" });
  add("kennzahl", { name: "Privileged accounts with a second factor", description: "Share of administrative accounts behind multi-factor authentication.", praktik: "BER Berechtigung", zielwert: 100, istwert: 74, einheit: "%" });

  // ── Step 5 · Improvement ───────────────────────────────────────────────
  add("abweichung", { name: "Maintenance sessions are recorded but never read", description: "Sessions by the manufacturer are recorded, and nobody reviews the logs.", requirement: byRefId.get("DLS.2.1") ?? "", schwere: 3, status: "In progress", korrektur: "Connect to the central log evaluation and put the review into the operating manual." });
  add("abweichung", { name: "The role description is out of date", description: "The named role is filled; its description still refers to the previous version of the ruleset.", requirement: "", schwere: 1, status: "Open", korrektur: "" });

  // A study that only ever shows creates says nothing about the change history, which is
  // one of the things this product is for. The sample therefore carries a few real edits
  // with editors, timestamps and reasons, as an audit would find them.
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
  edit(aLegacy, day(6), "M. Adler", "Found during the asset survey — six stations still answer on the old dial-up line.",
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
  pending.sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));
  const lastIdx = new Map<string, number>();
  pending.forEach((p, i) => lastIdx.set(p.entity, i));
  const byId = new Map(entities.map((e) => [e.id, e]));
  const log = sealLog(pending.map((p, i) =>
    lastIdx.get(p.entity) === i ? { ...p, state: hashValues(byId.get(p.entity)!.values) } : p));

  return {
    id: uid(),
    name: "Riverbend Municipal Utilities — grid control (example)",
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
}
