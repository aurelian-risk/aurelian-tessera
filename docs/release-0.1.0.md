# Aurelian Tessera++ 0.1.0

First release. An ISMS tool for the BSI's Grundschutz++ method, in one HTML file that runs
over `file://` without installation, server or account.

`dist/index.html` — 3.94 MB, 1.08 MB gzipped.

## What is in it

**The ruleset, in the build.** 1000 requirements of the Anwenderkatalog Grundschutz++, with
modal verb, security level, effort level, the four security objectives, elementary threats,
the target-object categories each applies to, and the parameters each leaves open. Fetched
from the BSI repository at build time, so a release carries the state of its release day;
the version it was built against is stated in the application. A running installation can
refresh from the publisher without waiting for a release.

**The requirement package derived.** An asset is given its target-object category; the
category is widened along the BSI's own hierarchy (7 roots, 4 levels), the requirements of
those categories are collected, one reaching an asset twice is carried once, and the five
ISMS practices are added whole. `STM.2.1`, executed. The account is shown before it is
applied — which asset brought which requirement in, and what it inherited — and every
record added carries the rule that placed it.

**The 265 requirements the catalogue classifies nowhere** are put up for a relevance
decision by chapter, rather than passed over.

**Exceptions as decisions** (`UMS.5`): authorised by a named role, reasoned, dated and
bounded, with the risk consideration that not implementing a requirement triggers.

**Risk consideration where the method puts it.** Grundschutz++ prescribes no risk method
(`GC.7.2`); this one models the attack chain, with an effect model over five classes and a
Monte-Carlo loss expectation whose parametrisation is open and editable, every figure
carrying its evidence grade. It is entered from the triggers the method names, three of
which are checked automatically.

**A hash-chained change record** per study — every change with editor, time and reason,
chain-verified — and **a security concept** as a printable document, set the way the BSI
sets its own, stating what it was made from and on what terms.

## Measured against the original

The method was read from the BSI's machine-readable method catalogue, not from a
description of it. Two corrections came out of that, both quoted in the taxonomy:

- The protection need is **normal / hoch**, set on the business process (`GC.7.1`). The
  three-level scale is classic IT-Grundschutz; "sehr hoch" does not occur once in the
  368 KB method catalogue.
- The implementation status is **ja / nein** (`UMS.1.1`). What would elsewhere be "partly"
  is an exception, recorded as one.

The full account, including what is still open, is in `docs/method-conformance.md`.

## Verified

Against the portable build, without network: **225 checks**. Method-neutral engine suites:
modelling 12, vocabulary 16, catalogue import 68, OSCAL 18, list import 18, taxonomy
migration 20, quantification 114, audit 50. Against the published BSI catalogue: **38**.

## Licence

Software under MPL-2.0. The embedded ruleset is © Bundesamt für Sicherheit in der
Informationstechnik under CC BY-SA 4.0, carried with the changes made to it stated —
see `NOTICE.md`. Not affiliated with, endorsed by or certified by the BSI.

## Known limits

- Protection-need inheritance along `supports` is recorded but not calculated.
- A security level lowered from `erhöht` to `normal-SdT` is the one risk trigger not
  checked; it is a change rather than a state and stands in the change history.
- Effort levels are recorded but drive no order of implementation.
- Reference documents for certification are not produced as such.
- In the flow view, an asset lands in no chain: the engine's generic chain traversal
  follows edges in one direction at a time.
