# Changelog

All notable changes to Aurelian Tessera++ are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/), and the project aims to follow
[Semantic Versioning](https://semver.org/). Each released version is also published as a
downloadable single-file build under
[Releases](https://github.com/aurelian-risk/aurelian-tessera/releases).

## [0.6.5] - 2026-09-02

### Added

- **An export decides what goes in, in one dialog.** Scope, contents, format, file name and
  who may open it, with the size stated before the file is written. Beside the single text
  file there is now an **archive**: the study as readable JSON and the source documents next
  to it. A JSON export carries references only - measured on a corpus of 40 documents, 9 kB
  against 6.2 MB - so the archive is what moves a corpus to another machine. Driven end to
  end: a document is exported and read back in a profile that has nothing, with its text and
  its source file rather than a reference to them.
- **A document keeps its source file**, not only the text extracted from it, and saving one
  asks where it goes instead of assuming.
- **A portable file can carry the public keys its seals are checked with**, so a recipient
  can verify them without being sent a second file.

### Changed

- **The interface reads as one language.** 22 further texts that no key could reach -
  sentences broken by their own markup, counted phrases, the words on the perimeter switch -
  and the model view's file note is set as three steps rather than one paragraph. The Explore
  view showed the whole model under its authored English names while every register beside it
  read German; only the schema editor keeps the authored word, where it is the thing being
  edited.
- **Published terms are not translated.** MITRE's tactics were read into German, so the
  register read "Laterale Bewegung" while the defence chart beside it read "Lateral
  Movement". The kill chain, an attack path, a choke point and defense in depth keep the
  words an analyst reads and searches for; prose about them is German.
- **The example study follows the reader's language.** Untouched it is built again in
  silence; worked in, it asks first, and a refusal is remembered.
- **Table cells hold what they are given.** A chip is capped and truncated with its full name
  in the title, so a column of them reads as a column; the scale bars give the rung name
  15px back. Measured at 1600/1280/1024 in both languages: labels drawn over the column
  beside them, 21 at 1024px, now 0.

### Fixed

- **The scenario name in the TTP panel was cropped mid-word** with nothing to say it had
  been: `text-overflow` does not apply to a flex container.
- **Two sentences agreed with nothing** - a ring read "1 erkennen ihn", and the model note
  came out as German word salad because it was five fragments in a fixed order.
- **A merge kept the hour it was made.** git runs `post-merge` for the commit a merge makes,
  never `post-commit`, so the rule about publishing hours passed every merge by.

## [0.6.4] - 2026-08-31

### Added

- **The application is in German where it is read in German, and the language can be
  chosen.** The browser decides by default, as before; a choice made in the sidebar is kept
  and wins at the next start. 478 interface texts go through a lookup, 475 of them have a
  German wording, and so do the 19 completeness checks the engine declares. Measured at the
  built page across every workshop and view: of 4920 visible runs of text, 13 read the same
  in both languages - three by intention, six the schema editor, where the word a taxonomy
  was authored with is the right one.
- **The report follows the reader.** It read every type, field, group and value straight off
  the declaration, so a German study came out with English headings: 68 of its 962 lines.
  Now 0. A delivered document is unaffected - its wording is fixed whatever language the
  application is worked in, and it names its own words.
- **The example study is built in the language it is read in**, including a switch made
  after it was loaded - while nobody has worked in it. An edited one is left alone.

### Fixed

- **A record whose perimeter was never set read as though it were outside it.** A two-state
  field that carries no value is in force by its second state - the counts, the report and
  the badge beside the switch all read it that way, and the switch itself read the first.
  24 records of the example study stood in their register saying "out of scope" while every
  figure counted them in, and one press sent them where they already were, so the dialog
  that says what a record takes with it never opened.
- **A pill that will not wrap may not grow either.** "existenzbedrohend" measured 175px in a
  113px cell and was drawn over the column beside it - 21 of them at 1024px, now 0. The rung
  name breaks at a hyphenation point instead, and in a table cell the bars give it 15px back.
- **Two sentences that agreed with nothing.** A ring read "1 erkennen ihn" - two counts
  govern two verbs. The model guide was five fragments in a fixed order and came out as
  German word salad.
- **Three values in the example study that no vocabulary declares.** Nothing failed: a value
  outside its own list is answered by no option table, so it printed as stored.
- **A relation read as the English word inside a German sentence** - on every graph edge and
  in every record panel. All 31 the taxonomy declares were untranslated.

## [0.6.3] - 2026-08-30

### Added

- **A record can leave the perimeter without being deleted.** Mid-analysis a scenario turns
  out not to apply, or assets leave the scope. The judgement about them is part of the
  record, so they are set aside rather than removed: still there, out of every count, chart
  and figure. The switch says first what that costs - what cannot stand without the record
  and goes with it, what still points at it and refuses, what merely loses one reason of
  several. Measured on the example study: **34 of 1101 records raise a question, 19 refuse**.
  A refusal is a judgement about the perimeter, not an impossibility, so it can be
  overruled - and then what stood in the way goes too, and whatever stands in *its* way
  after that.
- **Deleting asks first, and says what the survivors lose.** It used to happen without a
  word. On the example study **309 of 1101 deletions affect something else**: four take
  another record with them, 308 empty a reference somewhere. Those records now carry a red
  mark where the link was, read back out of the change log, instead of reading as though
  they had never pointed anywhere.

### Changed

- **The flow chart can be pulled back from and dragged.** The sheet is far larger than the
  window it sits in - measured on the example study, **4838 x 62861px against 1256 x 790**.
  The wheel zooms, dragging the ground pans, and the view travels to the card that was
  clicked instead of the card being moved to the view. Every ribbon end stays on its card
  throughout a zoom, within a pixel over fifty frames.
- **The registers of a workshop stand on one grid.** Their columns were each a share of that
  table's own preferred width, so the five registers of the first workshop put their edges
  at 461/640/864, at 373/556/747 and at 678/942 - nothing lined up with anything. Every
  value column is a whole number of units of the table now and is laid from the right, so
  the switches and badges that end each register stand in the same place. It holds at every
  window width: with a floor per register, the widest stepped out below 1440px.
- **The first row of a lane begins below the heading, not behind it.** The mask over the
  header row fades out at 60px and the lane body started at 42, so the top card of every
  lane sat inside the fade before anything had been scrolled - 24 of them.
- **Text that could not be read.** Measured at the rendered pixel across three views: 53 of
  231 runs below the 4.5:1 that body text needs, worst 1.73:1. Now 0.

### Fixed

- **A measure on an attack step counts as in use everywhere, or nowhere.** The coverage
  matrix and the framework radar left it out while the chain counted it.
- **Cards flew to where the view had been, not where it would be.** Selecting flies the
  neighbours over 0.55s while the panel below grows over 0.32s, shrinking the view they are
  aimed at: every card took eleven corrections spread over 155px. Now two, over 4px.
- **A dialog opened inside a long register was drawn far off screen** - at y=49265 in a
  window 900px high. `position: fixed` does not mean the window when an ancestor carries a
  filter.
- **A new record started outside the perimeter**, seen by no count, and nothing said so.
- **A button that refuses carries no count.** "Add 0 to study" stated an action that was not
  on offer.

## [0.6.2] - 2026-08-27

### Fixed

- **Text that could not be read.** Measured at the rendered pixel across three views, with
  the text hidden and the ground behind each run photographed: **53 of 231 runs were below
  the 4.5:1 that body text needs**, worst 1.73:1. Now 0. Three tokens were at fault, each
  defined once for a dark ground and used on a light one - the four state colours, which
  carry lint severities as words; the five workshop accents, which fail in both directions
  at once because the same colour is white-on-button and a number on a card; and the muted
  grey of table headers and sub-lines.
- **A narrower window takes the same fraction off every column.** Reported as columns
  squeezing unevenly, and measured across six window widths it was exact: the value columns
  held 124, 148, 156 and 164 pixels at *every* size while the name column absorbed the whole
  reduction alone, **983px down to 319**. A pixel width on a column is a floor as much as a
  preference. The columns of a register are shares of it now. A table still stops at its own
  minimum, past which the panel scrolls.
- **A measure on an attack step is in use everywhere, or nowhere.** A measure that covers a
  step could be stored as not in use if the relation was made from the record rather than
  from the chain view: the coverage matrix and the framework radar then left it out while
  the chain counted it. The fact that a record is held decides now, not the stored value.
- **A button that refuses carries no count.** "Add 0 to study" stated an action that was not
  on offer, and a count on a disabled control reads as a threat rather than a quantity. Three
  places, one rule.
- **The attack-path sheet stays a diagram.** Its height was linear in the tallest column and
  nothing bounded it: a study of thirty chains drew a sheet **4278px** tall, four screens
  for one picture. Above nine boxes in a column they carry name and state, with tactic and
  technique on the box itself - **2022px** for the same study, and the sheet says it
  compressed rather than letting the tactic quietly stop being there.
- **Cards fly to where the view will be, not where it was.** Selecting a card flies its
  neighbours into a tree over 0.55s while the detail panel below grows over 0.32s, shrinking
  the view the flight is aimed at. Every card took **eleven corrections spread over 155.5px**;
  the end height is derivable at the first frame, so it is now 2 corrections over 3.7px.

### Added

- **The management report states the seven things PERF.4.1 asks of it** - conditions,
  successes and problems, suitability of the measures, feedback, plan status and
  improvements, each as a field of the record rather than as advice in a help text.
- **A check refuses to measure a build that was not made.** Eight files read
  `dist/index.html` and nothing else, so a build that fails leaves the previous artefact and
  every one of them reports on a file nobody asked for. They stop instead. The release push
  is one of them: it checked that the artefact reports the version being released, which a
  leftover of the *same* version passes.

### Removed

- **Nine `npm run` entries that could not run.** The published `package.json` named the
  local model harness, the mirroring machinery and the demo recording, whose files are not
  part of this repository.

## [0.6.1] - 2026-08-25

### Removed

- **The sector selection.** It selects the attack-rate exceptions applied to a study, and
  those exist only with the quantification, which this product does not carry. Traced rather
  than assumed: `study.sector` is read for the base rate of the risk model and by the
  quantitative half of the report, and by nothing else. It was offered in the first workshop,
  in the study dialog, in the calibration and in the report's document control, and changed
  nothing in any of them - a control that changes nothing is worse than none.

## [0.6.0] - 2026-08-25

### Changed

- **A column is as wide as what it holds.** Every value column was 150px, which failed in
  both directions at once: a badge column paid rent on width it does not use while a column
  of chips wrapped. Measured at 1280px, the commonest window: **13 of 28 tables scrolled
  sideways, now 4**, and columns more than 60px wider than their content went from 38 to 28.
- **The graph relieves its own crowding.** Past a certain neighbour count the arc cannot hold
  them and they landed on top of each other - at one focus of the example, 100 nodes with
  **117 overlapping labels**. Now 18, and none is cut off at the edge: a label near the edge
  turns inward. The clearance is flat rather than round, because a node is a dot with a label
  beside it, and a round clearance parts the dots while the labels still collide. The layout
  is deterministic and the foci do not move.
- **A relation is written once per fan.** Ninety-nine edges all saying "applies to" wrote it
  ninety-nine times, stacked in the middle of the ring. It is said once per focus and
  relation now, on the middle edge of that fan; every edge still answers the pointer with its
  own relation.
- **A value in a register reads as a value.** Squared off it read as a button, and every one
  being a different width then read as a fault.

### Fixed

- **The licence notice named a library the build does not contain.** `THIRD-PARTY-NOTICES.md`
  listed `d3-force` from v0.4.1: declared as a dependency, imported nowhere, and not once in
  the shipped file. Both are gone, and the notice is now checked against the built artefact -
  every package it names has to be in there, and every dependency has to be named.
- **The headerless column at the right of every register.** A spacer that absorbed the
  remaining width; it was 103px wide on a register with five value columns and 403px on one
  with three, so no two tables ended in the same place. The same filler stood in the coverage
  matrix and the chain defence.
- **The tables in a generated document line up with each other**, and a long register is set
  dense on a sheet that grows to hold it rather than at prose measure.

## [0.5.1] - 2026-08-24

### Added

- **The reference documents are a page to read and print, and they are written in German.**
  The delivery goes to a German federal office, so the words this tool writes are German -
  the headings, the columns, the licence notice - and the page says which language it is in,
  which is what hyphenation and a screen reader read. Where the method catalogue has the
  word, the document uses that word: Anforderung, Informationsverbund, Zielobjektkategorie,
  Umsetzungsstatus, Sicherheitsniveau. What the BSI publishes as a value stands in it as
  published; this product's own values are read in German without the stored value changing.
- **A contact address** in the README.

### Changed

- **The tables in a generated document line up with each other.** The small ones were capped
  at the prose measure and stood 400px short of the wide ones on the same left edge; two
  registers read from the same records sat a few pixels apart in their shared columns; and an
  equal share per column cramped a sentence into a quarter while a licence name got the same
  room. Every table now has the same two edges and a column takes the width its content needs.
- **The generated documents are set like documents.** A serif for prose and a sans for
  everything carrying data - tables, figures, the meta block - so a reader can tell at a
  glance which of the two they are looking at. A title block, sections opened by a rule, the
  sentence under a heading as a lede, hairline tables with the figures in columns, and a
  table header that repeats on every page it runs over. Nothing is fetched: every family is
  one the machine already has.
- **A printed register past a dozen records is a table**, and past twenty rows it is set
  dense. The rule was inside the report's own loop, so a document assembled from the same
  registers printed a headed block per record - 393 requirements over several thousand
  lines, 198 kB. 900px is a measure for prose and left a seven-column register wrapping
  every cell, so the sheet grows to hold its widest table while the prose keeps its measure
  on it, and printing sets the table fixed so it cannot grow past the page. A paragraph
  field stays out of the columns and is printed where it is read.

## [0.5.0] - 2026-08-23

### Added

- **The reference documents, A.0-A.6.** The seven documents a certification asks for,
  filled from the study: policy, structure analysis, protection-need assessment, modelling,
  the result of the Grundschutz check, the risk analysis and the implementation plan.
  Grundschutz++ declares no set of its own, so this is the published set of the classic
  IT-Grundschutz certification and the document's first sentence says so. Offered beside the
  report, which stays the security concept.
- **The interested parties and the security policy** (`GC.4`, `GC.5`): who expects something
  of information security, what they need, and the policy that answers them - its objectives
  named as the metrics that measure them, its strategy, the management's commitment, and the
  authorisation the document draws its force from.
- **The security organisation** (`GC.9.1`): a register of roles and committees with the
  holder, the deputy, the tasks, the authority and the qualification, and the information
  security officer singled out.
- **The procedures the method asks to be anchored**: seventeen requirements, fifteen of them
  MUSS, ask for a procedure rather than a record. The register holds what exists, what it
  says, where it is written down, who owns it, when it was last read - and what is still
  owed.
- **The improvement practice** (`VRB.2`-`VRB.6`): a nonconformity examined for cause and
  recurrence, corrections and improvements in one register with priority, owner and date,
  and a verdict on whether what was carried out worked.
- **Own requirements delivered to the BSI** (`STM.2.1.6`): a requirement written because the
  catalogue reaches an asset with nothing is written back out as an OSCAL catalogue.
- **The tracking round** (`UMS.6`) and **the package re-read at the institution's interval**
  (`PERF.1.3`), each as a record with what it took in, what it found and what it changed.
- **A register can be filtered and grouped by the records a row points at** - which of the
  thousand requirements apply to one asset, 93 of them in the example.
- **Seals and keys**: the head of the change log signed with a verdict per seal, export
  addressed to a recipient's public key, and the sender's key checked at import.

### Changed

- **The checks page went from 1143 findings to 6.** Three rules named 95, 269 and 389 of 392
  requirements - the register's normal content rather than a gap. Each is now asked at the
  moment the method asks it.
- **The registers get the width the window has.** The content column was capped at 1180px
  while the requirements table measures 1276.
- **How a reader arranged a table is remembered** outside the study, so an export does not
  carry it.

### Fixed

- **The page no longer blanks after working in it.** A component returned before its hooks
  ran, so one render counted three and the next six. Measured at the v0.4.2 artefact: seven
  steps, React error #310, and only after the table tools had been used.
- **The build reports its own version.** v0.4.2 shipped naming itself 0.4.1.
- **The catalogue version a document prints** is the day, not the microsecond the OSCAL
  file carries.

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
