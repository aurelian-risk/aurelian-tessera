# Notices

## This software

Aurelian Tessera++ — © Aurelian-Risk, licensed under the **Mozilla Public License 2.0**
(`LICENSE`). MPL-2.0 is a file-level copyleft: a modified source file stays under the MPL,
and a build combining it with other work does not have to. The built application states its
licence and where its source is, because a single HTML file may be the only copy a recipient
ever receives.

## Content that is not ours

### Anwenderkatalog Grundschutz++

- **Rights holder:** Bundesamt für Sicherheit in der Informationstechnik (BSI)
- **Source:** <https://github.com/BSI-Bund/Stand-der-Technik-Bibliothek>,
  `control_layer/Grundschutz++/Grundschutz++-resolved_catalog.json`
- **Licence:** Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0),
  <https://creativecommons.org/licenses/by-sa/4.0/>
- **Version carried:** stated in the build, in `catalog.generated.ts` and in the colophon.

**Changes made.** The catalogue is not passed on as published. It is read from OSCAL into
this application's own structure; the parameter placeholders OSCAL leaves in the prose
(`{{ insert: param, … }}`) are resolved, with an open parameter rendered as its suggested
wording in guillemets; the `alt-identifier` property and any property this application's
taxonomy does not declare are not carried. The requirement texts themselves are not
rewritten, shortened or paraphrased.

**Share-alike.** Because those changes make the embedded catalogue adapted material, the
adapted catalogue is distributed under **CC BY-SA 4.0**, the same licence as the original.
That applies to the catalogue data in the build — `src/profile/gspp/catalog.generated.ts`
and its equivalent inside `dist/index.html` — not to this application's source code, which
is a separate work under the MPL.

The generated file is not committed to this repository. It is produced at build time by
`npm run sync` from the published original.

### The vocabularies

The practice names, target-object categories, security levels and modal verbs in
`src/profile/gspp/vocabulary.generated.ts` are derived from
`documentation/namespaces/*.csv` in the same BSI repository, under the same licence and with
the same attribution. The English wordings in `src/profile/gspp/terms.ts` are ours and are
for display only; the value recorded is always the BSI's own term.

## Marks and affiliation

"IT-Grundschutz", "Grundschutz++" and "BSI" are the Federal Office for Information
Security's own designations. They are used here descriptively, to say which method this
software implements. **This project is not affiliated with, endorsed by or certified by the
BSI.** Whether a security concept produced with it meets a certification scheme is decided
by the certification body, not by this tool.

## The engine

This product is built on the Aurelian engine, shared with Aurelian Lite
(<https://github.com/aurelian-risk/aurelian-lite>), under the same MPL-2.0.

## Runtime downloads

Nothing is fetched to render the application. Two optional features reach the network, and
only when the user asks for them:

- the embedding and language models (Transformers.js from a CDN, weights from Hugging Face),
- the ruleset download from the BSI repository.

No telemetry, no error reporting, no automatic update check. The data being worked on never
leaves the device.
