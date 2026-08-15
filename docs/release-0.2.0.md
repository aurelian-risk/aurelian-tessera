# Aurelian Tessera++ 0.2.0

The method, further in. Measured again against the BSI's own method catalogue
(version 2026-08-13, 95 requirements) rather than against secondary descriptions.

`dist/index.html` — 4.25 MB, 1.18 MB gzipped.

- **The requirement package is a relation, per asset** (`STM.2.1.4.2`), and the derivation
  is repeatable: record an asset, run it again, and the package grows by what it brought.
- **The dependencies the catalogue states** — 67 edges. A requirement counts as implemented
  only when what it rests on is (`UMS.1.1`).
- **The migration path, as published**: 1185 mapping entries from the IT-Grundschutz
  compendium 2023 and 96 from ISO/IEC 27001 Annex A, each with the closeness of the
  correspondence.
- **The security-level review** (`STM.3.1`), which turns the fourth risk trigger from a
  change into a state, and **own requirements** (`STM.2.1.6/.7`).
- **Audits and the management report** (`PERF.3`, `PERF.4`), **implementation planning**
  (`UMS.2.2 / 3.1 / 4.1`).

Detail in `CHANGELOG.md`; what is still open is in `docs/method-conformance.md`.
