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

The method is written as five ISMS practices — GC, STM, UMS, VRB, PERF — each a set of
requirements. `STM.2 Anforderungspaket` is the core, and it is an algorithm:

| Step | What it requires |
|---|---|
| `STM.1.1/1.2` | Define the Informationsverbund and its external interfaces |
| `STM.2.1.1` | Model **all** requirements of the ISMS practices (GC, STM, PERF, VRB, UMS) onto the Verbund, without selection — "verbundweite Anforderungen" |
| `STM.2.1.2` | Record the relevant assets. First PDCA pass: only the most important business process |
| `STM.2.1.3` | Map every asset to one or more **Zielobjektkategorien**, functionally, not by technology |
| `STM.2.1.4` | Model the requirements of those categories onto the asset |
| `STM.2.1.4.1` | **Inherit up the category hierarchy** — every parent up to the root. "Die Vererbung ist deterministisch" |
| `STM.2.1.4.2` | Consolidate: a requirement reaching an asset through several categories is carried once |
| `STM.2.1.5` | Requirements **without** a category: decide relevance per business process, assign a process owner, strike the rest **with a justification** |
| `STM.2.1.6` | Assets with no matching requirement: write additional requirements, with a justification for why the catalogue does not suffice |
| `STM.2.1.7` | Add requirements from the institution's own compliance obligations |
| `STM.3.1` | Review the security level initially set, per asset where needed |
| `STM.4.1` | Risk consideration **where the method demands it** (see 3.) |
| `STM.5.1` | Set the parameters requirements carry |

Two further statements bind the data model:

- `GC.7.1` — "Hierbei wird zwischen dem Schutzbedarf „normal" und „hoch" unterschieden."
  The classification is made on the **business process or the information**, not per target
  object. "Eine Klassifizierung des Schutzbedarfs der Zielobjekte erfolgt auf
  Anforderungsebene" — the target object's level is carried by the requirement's
  `sec_level` (`normal-SdT` / `erhöht`).
- `UMS.1.1` — "Der Umsetzungsstatus einer Anforderung kann grundsätzlich nur „umgesetzt"
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
binding — a requirement counts as implemented only when it and everything it rests on are.
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
risk method. But they are the exception path, entered under four named conditions — not
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
| `STM.2.1.5` relevance decision per business process, with owner; struck ones with a reason | both are checked; the struck ones are checked although they are set back |
| `STM.2.1.6/.7` own requirements, with the justification and the obligation | recorded as such, and each has to say why the catalogue does not suffice |
| `STM.3.1` review of the initial security level, per asset where needed | a review record of its own; the published level stays untouched beside it |
| `STM.4.1` risk consideration on its four triggers | all four are checked — high protection need, level lowered, requirement unimplemented, asset the catalogue does not reach |
| `STM.5.1` parameters set per requirement | what the catalogue leaves open is listed; what was set is recorded beside it |
| `UMS.1.1` status `ja` / `nein`, and dependencies met | two values, and the catalogue's own 67 dependency edges are followed |
| `UMS.1.2` residual risk from what is not implemented | stated per requirement, for consolidation |
| `UMS.2.2 / 3.1 / 4.1` priority, owner, date | recorded, and their absence is a finding while the requirement is open |
| `UMS.5` exceptions authorised and documented | a record of its own, with authoriser, reason and validity |
| `UMS.6` progress and plan revision | recorded per requirement |
| `PERF.3` audit programme, plan, independent team, report | a record of its own, checked before and after the audit |
| `PERF.4` management report | a record of its own, drawing on the audits, carrying the last review's follow-ups |
| `GC.11` / `UMS.5.2` documentation duties | hash-chained change history over every record |

Two things the method names that this build answers differently, and says so:

- **The risk method** is not prescribed (`STM.4.1`). This one models the attack chain and
  places the risk on a matrix before and after treatment, which is the 200-3 line.
- **An asset's protection need** is not classified anywhere in `GC.7` — the classification
  is on the business process, and the target object's level is carried by the requirement's
  `sec_level`. `STM.4.1` nevertheless names assets with a high protection need as a
  trigger; here it is reached through the process the asset supports, which is where the
  rating exists.

## 5. What follows

The method catalogue holds requirements this build does not yet answer:

1. `PERF.1.3` — the annual review of whether the package still fits the information domain.
   The derivation is repeatable and reports what changed, but nothing schedules it or
   records that it was done.
2. `UMS.6.1` — progress is recorded per requirement; the procedure the requirement asks for
   (status reporting, target-versus-actual, KPI measurement) is not modelled as one.
3. `VRB.5` — the correction and improvement plan as a plan, rather than as corrective
   actions on individual nonconformities.
4. `STM.2.1.6` — the closing step, "dem BSI zugestellt": an export of own requirements in
   the form the BSI reads.
5. The reference documents of the classic certification, once the scheme for GS++ is fixed.
