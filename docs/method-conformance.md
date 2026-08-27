# Does this product follow the Grundschutz++ method?

Measured 2026-08-14 against the BSI's own machine-readable specification, not against
secondary descriptions. Two sources, both in `github.com/BSI-Bund/Stand-der-Technik-Bibliothek`:

| Source | What it is | Size |
|---|---|---|
| `control_layer/Grundschutz++/sources/catalogs/Methodik-Grundschutz++/BSI-Methodik-Grundschutz++-catalog.json` | **the method itself**, as requirements | 368 KB, version 2026-08-13 |
| `control_layer/Grundschutz++/Grundschutz++-resolved_catalog.json` | the requirements a user works to | 5.4 MB, version 2026-08-13 |
| `documentation/namespaces/target_object_categories.csv` | the categories, **with their hierarchy** | 20 KB |

Where a secondary source and a measurement disagreed, the measurement decided. Two did:
one blog states the protection needs are `normal / hoch / sehr hoch`; the string `sehr
hoch` does not occur once in the 368 KB method catalogue.

## 1. The method, as the BSI specifies it

The method is written as five ISMS practices - GC, STM, UMS, VRB, PERF - each a set of
requirements. `STM.2 Anforderungspaket` is the core, and it is an algorithm:

| Step | What it requires |
|---|---|
| `STM.1.1/1.2` | Define the Informationsverbund and its external interfaces |
| `STM.2.1.1` | Model **all** requirements of the ISMS practices (GC, STM, PERF, VRB, UMS) onto the Verbund, without selection - "verbundweite Anforderungen" |
| `STM.2.1.2` | Record the relevant assets. First PDCA pass: only the most important business process |
| `STM.2.1.3` | Map every asset to one or more **Zielobjektkategorien**, functionally, not by technology |
| `STM.2.1.4` | Model the requirements of those categories onto the asset |
| `STM.2.1.4.1` | **Inherit up the category hierarchy** - every parent up to the root. "Die Vererbung ist deterministisch" |
| `STM.2.1.4.2` | Consolidate: a requirement reaching an asset through several categories is carried once |
| `STM.2.1.5` | Requirements **without** a category: decide relevance per business process, assign a process owner, strike the rest **with a justification** |
| `STM.2.1.6` | Assets with no matching requirement: write additional requirements, with a justification for why the catalogue does not suffice |
| `STM.2.1.7` | Add requirements from the institution's own compliance obligations |
| `STM.3.1` | Review the security level initially set, per asset where needed |
| `STM.4.1` | Risk consideration **where the method demands it** (see 3.) |
| `STM.5.1` | Set the parameters requirements carry |

Two further statements bind the data model:

- `GC.7.1` - "Hierbei wird zwischen dem Schutzbedarf „normal" und „hoch" unterschieden."
  The classification is made on the **business process or the information**, not per target
  object. "Eine Klassifizierung des Schutzbedarfs der Zielobjekte erfolgt auf
  Anforderungsebene" - the target object's level is carried by the requirement's
  `sec_level` (`normal-SdT` / `erhöht`).
- `UMS.1.1` - "Der Umsetzungsstatus einer Anforderung kann grundsätzlich nur „umgesetzt"
  („ja") oder „nicht umgesetzt" („nein") sein. Eine Anforderung gilt nur dann als
  umgesetzt, wenn sie selbst sowie alle in Abhängigkeit stehenden Anforderungen umgesetzt
  sind."

## 2. What the requirements actually carry

1000 requirements, measured:

| | Count | Consequence for modelling |
|---|---|---|
| Carry `target_object_categories` | **636** | assigned automatically, per `STM.2.1.4` |
| ISMS practices (GC 35, STM 15, UMS 11, VRB 10, PERF 24) | **95** | assigned to the whole Verbund, per `STM.2.1.1` |
| RISK | 4 | no category; RISK is **not** an ISMS practice in `STM.2.1.1` |
| Remaining, no category | **265** | need a relevance decision each, per `STM.2.1.5` |

The 39 categories are a **tree, not a list**: 7 roots (Anwendungen, Einkäufe,
Informationen, IT-Systeme, Netze, Nutzende, Standorte) and 32 nodes beneath them, deepest
chain `Einkäufe → Dienstleistungen → Outsourcing → Cloud-Dienste`. `ChildOfUUID` in the CSV
carries the edges. Without the tree, `STM.2.1.4.1` cannot be executed at all.

**222 parameter placeholders** of the form `{{ insert: param, ums.1.1-prm1 }}` survive in
the *resolved* catalogue. They are what `STM.5.1` is about.

The catalogue also states **dependencies between its own requirements**: 67 `required`
edges over 59 requirements, and 210 weaker `related` ones. `UMS.1.1` makes the first kind
binding - a requirement counts as implemented only when it and everything it rests on are.
And it states, in two mapping collections of its own, what a requirement corresponds to in
the **IT-Grundschutz-Kompendium 2023** (1185 entries reaching 322 requirements) and in
**ISO/IEC 27001 Annex A** (96 entries reaching 280), each with how close the
correspondence is: `equal-to`, `equivalent-to`, `subset-of`, `superset-of`,
`intersects-with`.

## 3. Risk: an exception path, and the method does not prescribe it

`GC.7.2` and `STM.4.1` name the triggers for a risk consideration:

- a business process or information with **hoher Schutzbedarf**,
- **downgrading** a security level from `erhöht` to `normal-SdT`,
- **not implementing** a requirement,
- an asset for which the catalogue holds no requirement.

And on the method to use: "deren konkrete Ausgestaltung nicht durch den GS++ vorgegeben
wird. Gängige Standards als Basis für ein Risikomanagement sind die ISO27005, die ISO31000
oder der BSI Standard 200-3."

This is the single most consequential finding for this product. The kill chain and the
effect model are **not** in conflict with Grundschutz++: they are a permitted choice of
risk method. But they are the exception path, entered under four named conditions - not
the main line of work, which is where this build currently puts them.

The risk consideration is qualitative throughout: the chain is modelled, the measures on
it are read for what they block and what they detect, and the risk is placed on the matrix
before and after treatment. That is what 200-3 asks for.

## 4. Where this build stands

Measured again 2026-08-15, after the second pass over the method catalogue.

| Method requires | This build |
|---|---|
| `GC.7.1` Schutzbedarf `normal` / `hoch`, on the business process or the information | two values, on the business process; `sehr hoch` does not exist here either |
| `STM.2.1.3` every asset mapped to target-object categories, functionally | the BSI's 39 categories, with the reason for the mapping recorded beside it |
| `STM.2.1.4.1` inheritance up the category hierarchy | the tree is carried, 7 roots and 4 levels, and every parent joins before the requirements are collected |
| `STM.2.1.4.2` consolidation, keeping the reference to each asset | a requirement reached twice is carried once and names every asset it reached, as a relation |
| `STM.2.1.1` the ISMS practices modelled onto the whole domain, without selection | the 95 arrive whole, distinguished from what an asset brought in |
| `STM.2.1.5` relevance decision per business process, with owner; struck ones with a reason | the reading records why it reached a requirement and why it did not, so the justification is on the record; the check asks only where a person decided differently, and leaves out the 95 the method assigns to the whole domain |
| `STM.2.1.6/.7` own requirements, with the justification and the obligation | recorded as such; one written for an asset gap has to say why the catalogue does not suffice AND which protection goals it acts on, and can be **delivered to the BSI** as an OSCAL catalogue, which is the closing step of `.6`. Requirements taken on out of the institution's own compliance environment (`.7`) are not in that delivery: `.7` names none, and they are its contracts |
| `STM.3.1` review of the initial security level, per asset where needed | a review record of its own; the published level stays untouched beside it |
| `STM.4.1` risk consideration on its four triggers | all four are checked - high protection need, level lowered, requirement unimplemented, asset the catalogue does not reach |
| `STM.5.1` parameters set per requirement | what the catalogue leaves open is listed; what was set is recorded beside it |
| `UMS.1.1` status `ja` / `nein`, and dependencies met | two values, and the catalogue's own 67 dependency edges are followed |
| `UMS.1.2` residual risk from what is not implemented | stated per requirement, for consolidation |
| `UMS.2.2 / 3.1 / 4.1` priority, owner, date | recorded; their absence is a finding once the requirement carries a priority, which is when it has entered the plan |
| `UMS.5` exceptions authorised and documented | a record of its own, with authoriser, reason and validity |
| `UMS.6` progress and plan revision | a record of its own: the round, with the target against the actual, the metrics it read, the cause where they diverge, the actions it decided, and what it changed in the plan |
| `PERF.1.3` the package re-read at the institution's interval | a record of its own: what the reading took in, what it found, what was adjusted, whether it took the modelling again, and who it was agreed with. The interval is the next record's due date rather than a number, because the method leaves the interval to the institution; a due date behind us is a finding |
| `PERF.3` audit programme, plan, independent team, report | a record of its own, checked before and after the audit |
| `PERF.4` management report | a record of its own, drawing on the audits, carrying the last review's follow-ups |
| `PERF.4.1.2` - `.8` the seven contents of that report | one field each, because they are seven questions: whether the conditions changed is not whether the measures still fit, and neither is whether the plan advanced. Merged into one box the report could no longer say which of them was answered |
| `GC.2.1` the external context of the institution determined | **partly**: the external interested parties carry most of it - who outside expects something of information security here, what they need, how much weight it carries and what followed from it - and the study's scope states the boundary. What is not separately recorded is the external context *as such*, the way a single statement would put it. Whether one is wanted is a product question rather than a gap |
| `GC.2.2` the internal context analysed | **partly**: the internal interested parties, the roles and the study's own organisation and sector carry most of it; there is no single record that says "these are our internal conditions", and whether one is wanted is a product question rather than a gap |
| `GC.6.1` a scope, delimited comprehensibly, after the management releases it | **partly**: the study carries the scope as text, and the policy that states it is authorised by the management with the date recorded. What is not separately checkable is the release of the scope *as such* |
| `GC.7.1.1` the business processes or information relevant to the scope | the business-process register, whose kinds are process, statutory task and information - the three the requirement names |
| `GC.10.1.2` security involvement at fixed points in a project | a procedure in the register, which is what "verankern" asks for |
| `GC.12.1` one methodology for information security risk management | a procedure in the register. The methodology itself is the institution's choice: `STM.4.1` leaves it open and this build answers it with the attack chain and the matrix |
| `STM.1.2` the interfaces of the information domain to external processes | recorded on the asset the external process reaches through, beside the requirements that land there rather than in a second list that drifts |
| `UMS.2.1` measures for what is not yet implemented, by a structured approach | the measures, each fulfilling named requirements, with the priority, owner and date that the derivation and `UMS.2.2 / 3.1 / 4.1` put on them |
| `PERF.1.2` review and revision of the implementation plan | a procedure in the register, and the round it describes is the tracking round - what a round changed in the plan sits on the round, so a revision can be traced back to the reading behind it |
| `PERF.3.2.2` all relevant stakeholders informed of the audit results | recorded on the audit, and a finding once it has been carried out - the requirement is about the telling, not the finding |
| `PERF.4.1.9` prioritised proposals with realistic effort estimates | a field on the management report, and a finding once it is submitted. Both halves are in the requirement: an order, and what each one costs |
| `PERF.4.2` the management informed of the state of the system | the report carries the date it was submitted |
| `PERF.5.1` monitoring methods and tools anchored | a procedure in the register; what is monitored is the metrics |
| `GC.4.1 / .4.2` the interested parties, external and internal, with their needs and expectations | a register that asks what each needs, how much weight it carries and what followed from it - the requirement is an analysis, and a list of names would answer none of it |
| `GC.5.1` concrete and measurable objectives | the policy names them as the **metrics** that measure them: the method asks for measurable objectives and its own example is a metric, so the numbers stay in one place instead of being restated |
| `GC.5.1.1 / .1.2` a strategy agreed with the management, and the management's commitment | both on the policy record, which is where `GC.5.1.3`'s guidance puts the overall responsibility |
| `GC.5.1.3 / .1.4` a policy, authorised by the management | one record, and the authorisation is a finding at **high** severity when missing: "Diese Autorisierung muss dokumentiert werden" is the whole of that requirement's guidance, and the document's force comes from it |
| `GC.9.1` a security organisation of roles, responsibilities and committees | a register of its own, holding roles, committees and the interfaces to data protection, physical security and the rest that the guidance names |
| `GC.9.1.1 / .1.4` roles assigned, with their authority and the qualification their holder needs | required of every established role; a role with only a name is an organisation chart |
| `GC.9.1.1.2` deputies for all relevant roles | required of every established role, because the guidance's reason is continuity and continuity has no exceptions |
| `GC.9.1.1.1` an information security officer answerable to the management directly, `.1.1` with resources, `.1.2` with a direct right of audience | one finding, at high severity, on the function the method singles out - these three are what an appointment on paper leaves out |
| `GC.9.1.1.3` measures against conflicts of interest | a field on the role, not a check: "Maßnahmen ... bei der Festlegung von Rollen ... festlegen" is one decision about how roles are cut, not a sentence each role owes |
| `VRB.2.1` nonconformities examined for cause and recurrence | both are fields on the record and both are asked for while it is open; a finding with neither is one nobody has understood yet |
| `VRB.2.2` whether the ISMS itself has to change | recorded on the nonconformity as a decision somebody took, rather than a question nobody asked |
| `VRB.4.1 / 4.2` corrective and improvement actions | one register, because `VRB.5.1` prioritises both in one sentence; a correction names the nonconformity whose **cause** it removes, an improvement names the potential it takes up |
| `VRB.5.1` priorities on both kinds | required while an action is planned or in progress |
| `VRB.6.1` the effectiveness of what was carried out | an action reported done owes a verdict and the evidence behind it - done is not the same as worked |
| `GC.11` / `UMS.5.2` documentation duties | hash-chained change history over every record |
| The reference documents of a certification | the classic set, A.0-A.6, filled from the study and named as the classic set - Grundschutz++ declares none, and the document says so in its first sentence. Beside the report rather than instead of it |

Two things the method names that this build answers differently, and says so:

- **The risk method** is not prescribed (`STM.4.1`). This one models the attack chain and
  places the risk on a matrix before and after treatment, which is the 200-3 line.
- **An asset's protection need** is not classified anywhere in `GC.7` - the classification
  is on the business process, and the target object's level is carried by the requirement's
  `sec_level`. `STM.4.1` nevertheless names assets with a high protection need as a
  trigger; here it is reached through the process the asset supports, which is where the
  rating exists.

## 5. What follows

The method catalogue holds requirements this build does not yet answer:

1. A set of reference documents the BSI declares for **this** method. The classic set is
   delivered and named as the classic set; what is not settled is what a Grundschutz++
   certification would ask for.
2. And the ones the reading has not reached at all - see section 7. Thirteen are left, all
   SOLLTE, and the reading for each is written down there now.

`VRB.5` and `STM.2.1.6` came off this list on 2026-08-22, `UMS.6.1`, `PERF.1.3` and the
reference documents on 2026-08-23, and the seven contents of the management report
(`PERF.4.1.2` to `.8`) on 2026-08-26.

## 6. Findings, and what is deliberately not one

A rule that names almost every record in the register is not a finding: it restates the
register's normal content and buries the ones that point somewhere. Measured on the sample,
three rules did exactly that - 95, 269 and 389 of 392 requirements - and the whole checks
page carried 1143 findings. It carries 6 now, each naming one or two records.

What changed, and why each is the method's own reading:

- `STM.2.1.1` models the 95 ISMS practices onto the whole information domain "ohne Auswahl".
  They name no business process **because the method says so**, so the rule about
  requirements the catalogue classifies nowhere leaves those five practices out.
- `STM.2.1.5` wants a decision with a justification. The derivation already knows the
  justification for what it did not reach, and now records it, so the rule asks only where a
  person decided against the reading.
- `UMS.2.2 / 3.1 / 4.1` are about the implementation **plan**. An owner and a date are owed
  once a requirement carries a priority, not on the first day for all 392.
- `UMS.5` is about what an institution decides **not** to do. The rule as it can be written
  today fires on every unimplemented requirement, which is the backlog rather than a
  decision; it is switched off until the condition can say "and the date has passed". The
  residual risk of `UMS.1.2` stands on the requirement as its own field either way.

## 7. What has not been read yet

`npm run test:method` measures this document against the published method catalogue rather
than against a memory of it. Measured 2026-08-26, against catalogue version 2026-08-20:

**95 requirements - 76 MUSS, 19 SOLLTE, no KANN. 82 are named somewhere in this repository;
13 are not, and none of them is a MUSS.**

The ratchet in the test stands at **76 of 76 MUSS**. That says the reading is written down,
not that the product carries all of it: a large part is a duty of the **institution**, not a
capability of a tool. Software does not establish an ISMS; what it can do is carry the record
that one was established, by whom and when.

The first run of this test, on 2026-08-22, found 35 named and 60 not, 45 of them MUSS. That
sentence stood here until 2026-08-26 and understated the state by 45 MUSS requirements.

The thirteen still named nowhere are all SOLLTE, and they fall into two kinds:

| | What it asks | Reading |
|---|---|---|
| `GC.3.1.2` | the responsible bodies in the institution are consulted when the compliance obligations are documented | **a duty of the institution, recorded through the procedure it belongs to.** `GC.3.1` "Verfahren und Regelungen" is in the procedure register; these four say what that procedure's text has to cover, and no tool can read a text for whether a legal department was heard |
| `GC.3.1.3` | contractual obligations affecting the processing of information are analysed | as above, and where one produces a requirement of its own it carries the obligation it comes from (`STM.2.1.7`, field `compliance_basis`) |
| `GC.3.1.4` | a procedure against breaches is anchored | as above |
| `GC.10.1.1` | an external exchange on information security is anchored | **as above**, under `GC.10.1` "Kommunikationsmanagement", which is in the register |
| `PERF.2.1` | compliance with obligations is checked at an interval and on occasion | **as above**, under `PERF.1.1` "Verfahren und Regelungen"; the interval is a parameter the institution sets |
| `PERF.3.2.1` | one assessment scheme for audit findings | **as above**, under `PERF.3.2` "Dokumentation von Auditergebnissen". A scheme is the procedure's content; the register holds that the procedure exists and where it is written |
| `PERF.4.1.2` … `.8` | seven contents of the management report | **answered**, 2026-08-26: seven of them, one field each - changed conditions, successes and problems, whether the measures still fit, what stakeholders said, the status of the plan, the improvements the review derived, and the audits it rests on (`.4`, through the relation, since each audit carries its own report) |

The whole list is printed by the test, so it is one command rather than a document to keep
in step by hand.

## 8. The procedures the method asks to be anchored

Seventeen of the 95 requirements - fifteen of them MUSS - ask for neither a record nor a
decision. They ask the institution to **anchor a procedure**. A tool cannot anchor one.
What it can hold is the statement that one exists, what it says, where it is written down,
who owns it and when it was last read against what the institution actually does - which is
what an auditor asks for and what nobody produces from memory. The register also holds the
ones still owed, switched off, because a procedure nobody has noticed is missing is the gap
that stays open longest.

| | Requirement | What has to be anchored |
|---|---|---|
| MUSS | `GC.1.1` | Errichtung und Aufrechterhaltung eines ISMS |
| MUSS | `GC.3.1` | Verfahren und Regelungen |
| MUSS | `GC.7.1` | Vorgehen bei der Informationssicherheitseinstufung |
| MUSS | `GC.8.1` | Verfahren zur Ressourcenplanung |
| MUSS | `GC.10.1` | Festlegung eines Verfahrens zum Kommunikationsmanagement |
| MUSS | `GC.11.1` | Dokumentenlenkung |
| MUSS | `UMS.6.1` | Nachverfolgung des Umsetzungsfortschritts |
| MUSS | `UMS.6.2` | Fortschreibung des Umsetzungsplans |
| MUSS | `UMS.7.1` | Wahrung von Compliance in der Umsetzung |
| MUSS | `VRB.1.1` | Verfahren zur kontinuierlichen Verbesserung |
| MUSS | `VRB.2.1` | Umgang mit Nicht-Konformitäten |
| MUSS | `VRB.3.1` | Identifikation von Verbesserungspotenzialen |
| SOLLTE | `VRB.6.2` | Bewertung der erreichten Verbesserung |
| SOLLTE | `VRB.7.1` | Behandlung von Compliance-Verstößen |
| MUSS | `PERF.1.1` | Verfahren und Regelungen |
| MUSS | `PERF.3.1` | Aufbau und Pflege eines Auditprogramms |
| MUSS | `PERF.3.2` | Dokumentation von Auditergebnissen |

The procedures themselves are the institution's work and their content is not this
product's business. What the product owes is that none of them can be forgotten silently.
