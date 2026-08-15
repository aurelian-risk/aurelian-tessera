# Aurelian Tessera++ 0.3.0

`dist/index.html` - 4.08 MB. 243 end-to-end checks, 59 against the published catalogue.

## New

- **Explore** - a page in the navigation, with three views of the loaded model: an outline
  (6 groups, 17 entity types, their fields, and the records themselves), the 39
  target-object categories as a tree showing per class how many requirements it carries by
  itself and how many it inherits, and the 17 types with their 25 relationships as a graph
  where a box opens onto its fields and both directions of its links. One search box for
  all three.
- Tables fold away by their heading.
- The 35 published BSI implementations now carry the source catalogue, the name as
  published and the kind as fields, and the requirements they implement as links to the
  requirement records - 291 links, resolved from the identifiers the BSI states. What a
  component does for each requirement is listed against that requirement, in the
  catalogue's naming rather than by UUID.
- On a kill-chain step, "From a catalogue..." is the last entry of the measure list; what
  is picked already covers that step.
- The list of BSI component definitions is read from the repository at build time instead
  of being fixed in the build script.

## Changed

- The table filter is one line: one menu per column instead of one row of chips per
  column. The coverage matrix has the same filter and a "gaps only" switch.
- "Applies to assets" is a column now. 296 of the 392 requirements in scope name an asset;
  the 95 ISMS practices name none because they apply to the whole information domain.
- What points at a record is grouped by kind and relation, with a count.
- The help texts on the fields were rewritten in plain language.

## Fixed

- A measure marked "not in use" counted towards chain coverage, the framework radar and
  the traceability matrix. It no longer does. Putting a measure on a kill-chain step now
  sets it to "in use".
- The vocabulary check reported "39 new" on every run against an unchanged catalogue,
  because it compared a text field that has no list against an empty one.

Detail in `CHANGELOG.md`; what is still open is in `docs/method-conformance.md`.
