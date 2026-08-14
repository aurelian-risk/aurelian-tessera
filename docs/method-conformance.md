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

| Method requires | This build | Verdict |
|---|---|---|
| Schutzbedarf `normal` / `hoch`, on the business process | three levels `normal/hoch/sehr hoch`, three C/I/A fields on the target object | **wrong**; the scale is classic IT-Grundschutz, and it sits on the wrong entity |
| Umsetzungsstatus `ja` / `nein` | five values incl. `teilweise`, `entbehrlich`, `unbearbeitet` | **wrong**; that is the 200-2 Basis-Sicherheitscheck vocabulary |
| Category **hierarchy** with inheritance | flat list of 39 | **missing**; the inheritance step cannot run |
| Anforderungspaket per asset | no such concept | **missing** — the core of the product |
| Relevance decision for the 265 uncategorised, with justification | no such concept | **missing** |
| Own requirements for uncovered assets, with justification | free-text entry only | partial |
| Parameters set per requirement | placeholders shown verbatim in the text | **defect** |
| Risk consideration as an exception with four triggers | a full workshop, entered freely | **misplaced**, not wrong |
| Verbundweite requirements (95) modelled once | not distinguished from asset requirements | missing |
| Exceptions authorised and documented (`UMS.5`) | no such concept | missing |
| Residual risk from unimplemented requirements (`UMS.1.2`) | derived from the kill chain instead | different, and defensible alongside |

What the build already does that the method asks for: the catalogue arrives complete with
its properties; `sec_level`, `effort_level` and the four security objectives are carried;
the practice is derived from the catalogue's own grouping; the change history satisfies the
documentation duties (`GC.11`, `UMS.5.2`); the vocabularies are dated and refreshable.

## 5. What follows

Certain and cheap — the method states these literally:

1. Protection needs `normal` / `hoch`, recorded on the business process; drop `sehr hoch`.
2. Implementation status `ja` / `nein`; an exception becomes an exception record, not a
   third status value.
3. Carry the category **hierarchy**, not a flat list.
4. Resolve the 222 parameters, or show them as fields to fill.

The core, and the reason the product exists:

5. **Anforderungspaket.** Asset → categories → inherit up the tree → union of the
   requirements → consolidate → plus the 95 Verbund-wide ones → plus a relevance decision
   on the 265 uncategorised, each carrying its justification. Every assignment traceable to
   the rule that produced it.

Then:

6. Exceptions with authorisation and justification (`UMS.5`).
7. Residual risk from unimplemented requirements (`UMS.1.2`), beside the one the
   treatment matrix derives.
8. Risk consideration entered from its four triggers, and marked as such.
