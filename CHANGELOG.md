# Changelog

All notable changes to Aurelian Tessera++ are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/), and the project aims to follow
[Semantic Versioning](https://semver.org/). Each released version is also published as a
downloadable single-file build under
[Releases](https://github.com/aurelian-risk/aurelian-tessera/releases).

## [0.4.2] - 2026-08-22

### Fixed

- **Published catalogues import whatever their line breaks.** The check deciding whether a
  file is a table read it line by line, so a requirement text running over several lines
  inside a quoted field looked like an unstable column count. The shape is judged on what
  the parser read now: all five bundled catalogues arrive, a 1189-requirement file in a
  tenth of a second.
- **The flow view keeps the reader's place when a node is selected.** Picking one narrows
  the lanes for a few frames, and the browser clamps the horizontal scroll to what fits in
  that moment. The position is captured on pointer-down and restored until it holds.

## [0.4.1] - 2026-08-21

### Added

- A recorded tour in the README: the requirement package derived from the catalogue with the
  account of what brought each requirement in, the risk matrix before and after treatment,
  an attack chain along its MITRE tactics, every chain of the study on the objects they
  cross, chain defence per scenario and per step, the hash-chained change timeline, and a
  document read into the register.
- `TRADEMARK.md`, `THIRD-PARTY-NOTICES.md` and `MATURITY.md`. The notices reproduce the
  copyright and permission text of the six libraries the single file inlines, as MIT, ISC
  and Apache-2.0 require. `MATURITY.md` states what this build is and is not.

### Changed

- The download has one fixed address that always serves the newest release:
  `releases/latest/download/aurelian-tessera.html`.

### Fixed

- The build names itself Aurelian Tessera++ - in its own header, in the browser tab, and in
  the source reference it hands a recipient.
- In the flow view, a selecting click keeps the horizontal scroll where the reader left it.

## [0.4.0] - 2026-08-21

### Added

- On a kill-chain step, the last entry of the measure list writes the measure that does not
  exist yet, as a full form with the step it acts on already filled in. Everything recorded
  is in that list already, the catalogue being imported into it, so offering the recorded
  ones again there offered the same thing twice.

### Changed

- A measure sitting on an attack step is in use by that fact, so the switch that would take
  it out of use is refused in that direction. The refusal names what holds it, two records
  and a count beyond that, rather than a field label and a number.

## [0.3.0] - 2026-08-15

### Added

- **Explore** - a page in the navigation with three views of the loaded model: an outline
  (6 groups, 17 entity types, their fields and the records themselves), the 39
  target-object categories as a tree showing per class how many requirements it carries by
  itself and how many it inherits, and the 17 types with their 25 relationships as a graph
  where a box opens onto its fields and both directions of its links. One search box for
  all three.
- Tables fold away by their heading.
- On a kill-chain step, "From a catalogue..." is the last entry of the measure list; what
  is picked already covers that step and is set to "in use".
- The 35 published BSI implementations carry the source catalogue, the name as published
  and the kind as fields, and the requirements they implement as links to the requirement
  records - 291 links, resolved from the identifiers the BSI states. The list of component
  definitions is read from the repository at build time instead of being fixed in the
  build script.

### Changed

- The table filter is one line: one menu per column instead of one row of chips per
  column. The coverage matrix has the same filter and a "gaps only" switch.
- "Applies to assets" is a column. 296 of the 392 requirements in scope name an asset; the
  95 ISMS practices name none, because they apply to the whole information domain
  (`STM.2.1.1`).
- What points at a record is grouped by kind and relation, with a count; the first twelve
  are shown.
- What a published implementation does for each requirement is listed against that
  requirement, in the catalogue's naming rather than by UUID.
- The help texts on the fields were rewritten in plain language.

### Fixed

- A measure marked "not in use" counted towards chain coverage, the framework radar and
  the traceability matrix. It no longer does.
- The vocabulary check reported "39 new" on every run against an unchanged catalogue,
  because it compared a text field that has no list of its own against an empty one. Only
  fields with a list are compared now.

## [0.2.0] - 2026-08-15

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
  requirements, 96 from ISO/IEC 27001 Annex A reaching 280 - each with how close the
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

## [0.1.0] - 2026-08-14

First release. An ISMS tool for the BSI's Grundschutz++ method, in one HTML file that runs
over `file://` without installation, server or account.

### Added

- **The ruleset is in the build.** 1000 requirements of the Anwenderkatalog Grundschutz++
  with modal verb, security level, effort level, the four security objectives, elementary
  threats, the target-object categories each applies to and the parameters each leaves
  open. Fetched from the BSI repository before every build, so a release carries the state
  of its release day and says which version that was.
- **The requirement package is derived, not assembled.** An asset's target-object
  categories are widened along the BSI's own hierarchy - 7 roots, 4 levels - the
  requirements of those categories are collected, one reaching an asset twice is carried
  once, and the five ISMS practices are added whole. That is `STM.2.1`, executed. The
  reading is shown as an account before anything is written, and every record carries the
  rule that placed it.
- **The whole ruleset is in the register, with what no rule reached set back.** 391 in
  scope from the reading, 609 present and dimmed. One press brings a requirement in, and
  the press goes through the change record with its reason.
- **What the BSI publishes as implementations.** 35 components from the implementation
  layer - AWS Security Hub, Keycloak, network architecture, password policy, supply-chain
  security, GA-Lotse - each naming the requirements it answers. 304 of 305 references
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
Informationstechnik under CC BY-SA 4.0, carried with the changes made to it named - see
`NOTICE.md`. Not affiliated with, endorsed by or certified by the BSI.
