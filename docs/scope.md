# Scope: Grundschutz++ on the Aurelian engine

As at 2026-08-15. Everything below marked as measured was taken from the BSI's own
published files; where a secondary source disagreed with a measurement, the measurement
decided. How far the product follows the method, and what is left, is in
`docs/method-conformance.md`.

## 1. What Grundschutz++ is

The BSI published the guide "Methodik Grundschutz++" in **April 2026**. Adoption has been
running since **1 January 2026**, with a transition of several years, to about **2029**,
during which classic IT-Grundschutz and Grundschutz++ are both admissible.

What changes against the compendium:

| Classic | Grundschutz++ |
|---|---|
| Bausteine, document-centred | **practices** (thematic security fields) × **target-object categories** |
| ~6,500 requirements spread over many Bausteine | consolidated; **1000**, measured |
| PDF compendium | machine-readable **JSON in OSCAL**, published on GitHub |
| prose requirements | sentence template `{practice} [für {category}] {MUSS/SOLLTE/KANN} <event> {action word}` |
| implicit prioritisation | **effort levels 0–5** (`effort_level`), level 0 = to be implemented in any case |
| implicit cycle | explicit **PDCA** in five process steps |

Identifiers follow the pattern `BER.1.1` - practice abbreviation, section, running number,
one level deeper for sub-requirements (`GC.3.1.1`). The share of MUSS requirements is meant
to fall below 10 %; measured, it is 141 of 1000, so 14 %.

It replaces **BSI-Standard 200-1 and 200-2**. It keeps the other two and says so: **200-3**
is named as one option for the risk consideration, beside ISO 27005 and ISO 31000; **200-4**
is referenced eleven times, and the practice NOT (business continuity) defers to it rather
than regulating it again.

## 1a. The ruleset as it actually is

Measured against the original, 2026-08-14. The BSI publishes the ruleset itself:

**`github.com/BSI-Bund/Stand-der-Technik-Bibliothek`**, directory `control_layer/Grundschutz++/`

| | |
|---|---|
| Format | OSCAL 1.1.3, JSON |
| Catalogue | `Grundschutz++-resolved_catalog.json`, 5.4 MB |
| Title | Anwenderkatalog Grundschutz++ |
| Version checked | 2026-08-13 |
| Requirements | **1000** over four levels of nesting (652 / 327 / 19 / 2), each with `statement` and `guidance` |
| Practices (top-level groups) | 20 (plus `EXMP`, a test entry) |
| Target-object categories | 39, a **tree**: 7 roots, 4 levels deep |
| Licence | **CC BY-SA 4.0** |

Beside the catalogue lies **the method itself**, machine-readable:
`sources/catalogs/Methodik-Grundschutz++/BSI-Methodik-Grundschutz++-catalog.json`, 368 KB -
the five ISMS practices as requirements. That file, not a secondary description, is what
`docs/method-conformance.md` was measured against.

Practices: GC Governance und Compliance, STM Strukturmodellierung, UMS Umsetzung,
VRB Verbesserung, PERF Monitoring-Evaluation, RISK Risikomanagement, ASST Informationen
und Assets, PERS Personal, BES Beschaffungsmanagement, DLS Dienstleistersteuerung,
TEST Änderungen und Tests, GEB Gebäudemanagement, SENS Sensibilisierung, ARCH Architektur,
BER Berechtigung, NOT Notfallplanung, DET Detektion, REA Sicherheitsvorfallsbehandlung,
KONF Konfiguration, DEV Entwicklung.

Each requirement carries machine-readable properties that map straight onto fields of the
taxonomy:

| OSCAL `prop` | Values | what it is here |
|---|---|---|
| `sec_level` | `normal-SdT`, `erhöht` | the level from which the requirement applies - **not** an asset's protection need |
| `effort_level` | 0–5 | effort: 0 = unconditional anyway, 5 = a geo-redundant data centre |
| `confidentiality`, `integrity`, `availability`, `authenticity` | 0, 1, 2 | how strongly the requirement acts on that objective |
| `threats` | elementary threats, e.g. `G 0.18` | the join to the risk analysis |
| `target_object_categories` | from the namespace | which classes of object it applies to - the modelling rule |
| `modal_verb` | MUSS, SOLLTE, KANN | how binding it is |
| `documentation`, `result`, `action_word`, `tags` | from the BSI namespaces | evidence, result, action word, filtering |

Modal verbs in the requirement text: 141 MUSS, 618 SOLLTE, 220 KANN.

**Sub-requirements are full requirements.** 348 of the 1000 sit under another, and each
carries its own text, security level and effort level. Counting only the top level loses a
third of the ruleset.

**The security objectives appear only on the applied requirements.** The 99 requirements of
the six methodological practices (GC, STM, UMS, VRB, PERF, RISK) carry no values for
confidentiality, integrity, availability or authenticity - they govern the ISMS process, not
the properties of an object. The remaining 901 carry them throughout; the single exception
is `ASST.5.1`, with no authenticity value.

**The modelling rule is published, not to be derived.** 636 of the 1000 requirements carry
`target_object_categories`. Of the remaining 364, 99 are the methodological ones, which
apply to the whole information domain; 265 are applied requirements with no category, and
each needs a relevance decision of its own (STM.2.1.5).

**208 requirements leave a parameter open** - `{{ insert: param, … }}` in the prose, a
period or a role the institution sets (STM.5.1).

**Migration is already mapped.** `control_layer/Mappings/IT-GS2023-zu-GSpp/` holds 1013 and
172 entries mapping Baustein requirements of the 2023 compendium (identifiers of the form
`APP.3.6.A1-UA.2`) onto Grundschutz++ requirements. A second mapping runs from ISO 27001
Annex A to GS++. Migration is therefore no longer an open field but the application of an
existing mapping.

## 2. What this build brings

- **One file, no server.** `dist/index.html` runs over `file://`, without installation or
  network. Where clearance rules apply, that is not convenience but the precondition for the
  tool being usable at all.
- **The ruleset in the build.** Every build fetches the published catalogue, so the product
  opens with the 1000 current requirements and no preparation step - and a running
  installation can refresh from the publisher without waiting for a release.
- **The requirement package derived, with its reasons.** Asset → categories → inheritance up
  the tree → collection → consolidation, each requirement carrying the rule that placed it
  and the reference to every asset it reached. Repeatable: record an asset, derive again,
  and the package grows by exactly what that asset brought.
- **The dependencies and the mappings the catalogue states.** 67 `required` edges, so a
  requirement counts as implemented only when what it rests on is (UMS.1.1); and the BSI's
  own mappings from the 2023 compendium (1185 entries) and ISO 27001 Annex A (96), each
  with the closeness of the correspondence.
- **What implements a requirement, from the publisher.** The 35 component definitions of the
  implementation layer, linked to their requirements through `alt-identifier`.
- **Kill chain and effect model.** Measures act on attack steps rather than on a checklist.
  Grundschutz++ prescribes no risk method (GC.7.2), so this is a permitted choice - entered
  from the triggers the method names.
- **The parameters behind the effect model exposed**, editable in the interface, every
  figure carrying its evidence grade (measured / derived / judgement).
- **A hash-chained change record per study.** Every change with editor, time and comment,
  chain-verified. Directly usable as evidence towards an auditor.
- **Semi-deterministic catalogue import** from PDF, Word, CSV and JSON, measured against nine
  original documents from BSI, NIST, CIS, ISO, EUR-Lex and OWASP.

## 3. How that maps onto the engine

See `src/profile/gspp/taxonomy.ts`. In short: the engine's keys stay, the labels become the
method's, and the workshops are the five process steps of the guide rather than practice
names. Seven types are added with no engine counterpart (`praktik`, `kennzahl`, `abweichung`,
`exception`, `niveau_review`, `audit`, `managementbericht`). The reasoning and the tables are in `src/profile/gspp/taxonomy.ts`, at the head of the file.

Not mapped, still open - the full account is in `docs/method-conformance.md`:

- **A set of reference documents for this method.** The classic A.0–A.6 set is produced
  from the study and named as the classic set; Grundschutz++ declares none of its own, and
  what one would ask for is not settled.

Retired rather than open: **protection-need inheritance** along `supports`. The method
classifies only business processes and information (GC.7.1), in two levels, and the target
object's level is carried by the requirement's `sec_level`. "Maximumprinzip", "Kumulation"
and "Verteilungseffekt" do not occur in the method catalogue at all.

## 4. Order of work

Done, in this order:

1. **`test:e2e` rewritten for this product** - 360 checks against the portable build,
   without network, driven by the position of a group in the taxonomy and by the heading of
   the section a table sits in, never by label text.
2. **Vocabularies derived from the publication, and kept current.** `npm run sync` runs
   before every build: it derives practices, categories, security levels and modal verbs
   from `documentation/namespaces/*.csv`, checks them against the catalogue and writes them
   dated. Definition and use agree in all four namespaces.
3. **OSCAL import**, complete: 1000 requirements with text, modal verb, security level,
   effort level, security objectives, threats, categories and open parameters. The practice
   comes from the catalogue's own top-level grouping.
4. **The requirement package derived** (`STM.2.1`), with the account shown before it is
   applied and the rule carried on every record.
5. **Exceptions** (UMS.5), **residual risk** on the requirement (UMS.1.2), and the **risk
   triggers** of GC.7.2 / STM.4.1 as declared checks.
6. **The package as a relation** (STM.2.1.4.2), the **relevance decision** on what the
   catalogue classifies nowhere (STM.2.1.5), and **own requirements** (STM.2.1.6/.7).
7. **The security-level review** (STM.3.1) as a record, which turns the fourth risk trigger
   from a change into a state.
8. **Implementation planning** (UMS.2.2 / 3.1 / 4.1), **audits and the management report**
   (PERF.3, PERF.4), and the **migration mappings** carried with the ruleset.
9. **The annual review of the package** (PERF.1.3) as a scheduled and recorded step.
10. **The progress procedure** (UMS.6.1) as the round it runs - the target against the
    actual, the metrics read, the cause where they part, and what it changed in the plan.
11. **The improvement plan** (VRB.5) as one register of corrections and improvements.
12. **Own requirements delivered to the BSI** (STM.2.1.6), as an export in the form the BSI
    reads. The OSCAL reader exists; this is the writer.
13. **The reference documents**, A.0–A.6, filled from the study, as a page to read and
    print, written in German for the office they are addressed to.

Next:

14. **A set the BSI declares for Grundschutz++**, if a certification scheme for it settles
    on one. The seven sections are a declared table; a different set is an edit to it.

**Settled: the ruleset ships in the build.** Parsed rather than raw - 1.59 MB from 5.38 MB
of OSCAL, because the reader strips the scaffolding the product never looks at, and the
mappings are reduced to what they state. `dist` is 4.08 MB. The generated files are not committed: the
repository holds no foreign ruleset, the build output does.

## Sources

- BSI, "Leitfaden zur Methodik Grundschutz++", March 2026 - via the BSI website
- BSI, Stand-der-Technik-Bibliothek: <https://github.com/BSI-Bund/Stand-der-Technik-Bibliothek>
