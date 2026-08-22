# Maturity and suitability

What Aurelian Tessera++ **is** and **is not**, so an institution can weigh the effort fairly.
Read it alongside the [LICENSE](LICENSE) - Mozilla Public License 2.0, provided "as is".

## Status: 0.x

First release 2026-08-15, current 0.4.0. The version number says what it says: the method
coverage is measured and stated (see [`docs/method-conformance.md`](docs/method-conformance.md)),
and it is not yet complete - that document names, per BSI requirement, what this build does
not answer.

The data format is settled. A study written by an earlier version is read by a later one;
the taxonomy is migrated forward on load, and where the schema grows the change is in the
[CHANGELOG](CHANGELOG.md).

**Download:** [`aurelian-tessera.html`](https://github.com/aurelian-risk/aurelian-tessera/releases/latest/download/aurelian-tessera.html) - one file, no installation, open it in a
browser. That address always serves the newest release; earlier ones are on the
[releases page](https://github.com/aurelian-risk/aurelian-tessera/releases).

## What it is

- A tool for working the BSI's **Grundschutz++** method: classify assets, derive the
  requirement package from the published catalogue, decide relevance, record implementation,
  exceptions, audits and the management report.
- The **ruleset comes from the publisher**, fetched at build time from the BSI's own
  repository and carried in the build with the version it was taken from. No requirement
  text is written or paraphrased here.
- **Local and private.** No server, no account, no telemetry. Nothing leaves the device
  unless you export a file.

## What it is not

- **Not affiliated with, endorsed by or certified by the BSI.** Whether a security concept
  produced with it satisfies a certification scheme is decided by the certification body,
  not by this tool.
- **Not multi-user and not access-controlled.** No authentication, no authorisation, no
  server. An author name is self-declared, not a verified identity. Collaboration is by
  exchanging exported files.
- **Not evaluated for classified or protectively-marked information.** No accreditation, no
  certification, no formal security evaluation. Classifying your data and choosing a fitting
  environment is your responsibility.
- **Not a system of record.** Persistence is yours: export and back up. Browser storage can
  be cleared by the browser or the operating system.
- **Not professional advice, and not a compliance guarantee.** The derived package, the
  completeness checks and every rating are modelling aids that qualified people have to
  review.
- **No warranty.** Under MPL-2.0, "as is", without warranty and without liability, to the
  extent the law permits.

## Data and format

- Studies and the taxonomy are exported as JSON or YAML, deterministically, so a diff in
  version control is readable. Encrypted export is available.
- Every record carries a hash-chained change history; the chain is verifiable in the
  application.
- The ruleset is generated at build time and is in neither repository. Embedding-model
  weights are never bundled or exported; they are fetched by their library when the user
  starts that feature, and cached on the device.

## The engine

Tessera++ is built on the Aurelian engine, shared with
[Aurelian Lite](https://github.com/aurelian-risk/aurelian-lite) under the same licence. Both
are open-source companions to the commercial Aurelian Risk Manager; capabilities that need a
server or an ongoing service belong to that product.

## Changes

[CHANGELOG.md](CHANGELOG.md), one entry per release.
