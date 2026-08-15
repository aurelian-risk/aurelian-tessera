# Changelog

All notable changes to Aurelian Tessera++ are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/), and the project aims to follow
[Semantic Versioning](https://semver.org/). Each released version is also published as a
downloadable single-file build under
[Releases](https://github.com/aurelian-risk/aurelian-tessera/releases).

## [0.2.0] — 2026-08-15

### Added

- **The requirement package is a relation, per asset.** The consolidation keeps the
  reference to every asset a requirement reached (`STM.2.1.4.2`), so an asset can be asked
  what it carries. The derivation is repeatable: record an asset, run it again, and the
  package grows by exactly what that asset brought.
- **The dependencies the catalogue states between its requirements.** 67 `required` edges
  over 59 requirements, plus 210 `related` ones. A requirement reported as implemented
  while something it rests on is not is a finding (`UMS.1.1`).
- **The migration path, as published.** Every build carries the BSI's own mapping
  collections: 1185 entries from the IT-Grundschutz-Kompendium 2023 reaching 322
  requirements, 96 from ISO/IEC 27001 Annex A reaching 280 — each with how close the
  correspondence is.
- **The security-level review** (`STM.3.1`) as a record of its own, for one asset where the
  method allows that. Lowering a level from `erhöht` to `normal-SdT` now fires the fourth
  risk trigger (`STM.4.1`), which was a change rather than a state until now.
- **Own requirements** (`STM.2.1.6/.7`): a requirement says where it comes from, and one of
  the institution's own has to say why the catalogue does not suffice, or name the
  obligation it follows from.
- **The audit programme and the management report** (`PERF.3`, `PERF.4`): objective, scope,
  criteria and an independent team before an audit, the report after it, and a management
  report that says whether the ISMS is effective and what became of the last review's
  decisions.
- **Implementation planning** (`UMS.2.2`, `UMS.3.1`, `UMS.4.1`, `UMS.6.1`): priority, owner,
  due date and progress on a requirement, with their absence reported while it is open.
- The relevance decision the method requires on requirements the catalogue classifies
  nowhere (`STM.2.1.5`) is checked from both sides: assigned with a process owner, or
  struck with a documented reason.

## [0.1.0] — 2026-08-14

First release. An ISMS tool for the BSI's Grundschutz++ method, in one HTML file that runs
over `file://` without installation, server or account.

### Added

- **The ruleset is in the build.** 1000 requirements of the Anwenderkatalog Grundschutz++
  with modal verb, security level, effort level, the four security objectives, elementary
  threats, the target-object categories each applies to and the parameters each leaves
  open. Fetched from the BSI repository before every build, so a release carries the state
  of its release day and says which version that was.
- **The requirement package is derived, not assembled.** An asset's target-object
  categories are widened along the BSI's own hierarchy — 7 roots, 4 levels — the
  requirements of those categories are collected, one reaching an asset twice is carried
  once, and the five ISMS practices are added whole. That is `STM.2.1`, executed. The
  reading is shown as an account before anything is written, and every record carries the
  rule that placed it.
- **The whole ruleset is in the register, with what no rule reached set back.** 391 in
  scope from the reading, 609 present and dimmed. One press brings a requirement in, and
  the press goes through the change record with its reason.
- **What the BSI publishes as implementations.** 35 components from the implementation
  layer — AWS Security Hub, Keycloak, network architecture, password policy, supply-chain
  security, GA-Lotse — each naming the requirements it answers. 304 of 305 references
  resolve against the catalogue, so the link between a measure and its requirements is
  read rather than judged.
- **Exceptions as decisions** (`UMS.5`): authorised by a named role, reasoned, dated and
  bounded, carrying the risk consideration that not implementing a requirement triggers.
- **The risk consideration entered from its triggers** (`GC.7.2`, `STM.4.1`): a process
  rated hoch, a requirement left unimplemented, an asset the catalogue does not cover.
  Three of the four are states of a record and are checked; the fourth is a change and
  stands in the change history.
- **The vocabularies can be brought up to date** from the publisher, on the taxonomy page,
  on a press. Extending is the default; a value already recorded is never taken away.
- **A security concept** as a printable document, set the way the BSI sets its own:
  numbered sections, ruled tables, front matter stating what it was made from and on what
  terms, and the change record with the reason given for each entry.

### Method

Read from the BSI's own machine-readable method catalogue rather than from a description
of it. Two corrections came out of that:

- the protection need is **normal / hoch** and is set on the business process (`GC.7.1`).
  The three-level scale is classic IT-Grundschutz; "sehr hoch" does not occur once in the
  method catalogue.
- the implementation status is **ja / nein** (`UMS.1.1`). What would elsewhere be recorded
  as "partly" is an exception, with an authorisation and a reason.

The full account, including what this build does not yet do, is in
`docs/method-conformance.md`.

### Verified

225 checks against the portable build without network, 42 against the published BSI
catalogue, and the method-neutral engine suites: modelling 12, vocabulary 16, catalogue
import 68, OSCAL 29, list import 18, taxonomy migration 20, quantification 114, audit 50,
table filter 35.

### Licence

Software under MPL-2.0. The embedded ruleset is © Bundesamt für Sicherheit in der
Informationstechnik under CC BY-SA 4.0, carried with the changes made to it named — see
`NOTICE.md`. Not affiliated with, endorsed by or certified by the BSI.
