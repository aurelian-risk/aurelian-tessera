// No catalogue ships with this build.
//
// The Grundschutz++ ruleset is published by the BSI as OSCAL JSON:
// github.com/BSI-Bund/Stand-der-Technik-Bibliothek, control_layer/Grundschutz++/
// Grundschutz++-resolved_catalog.json - 1000 requirements, 5.2 MB, CC BY-SA 4.0. Whether
// to bundle it or to import it from file is open; the trade-off is in docs/scope.md.
// src/domain/oscal.ts reads it, and npm run test:gspp measures the import against the
// published file.
//
// Requirement texts are not re-written by hand: an approximation carrying real BSI
// identifiers would state something the BSI did not.
import type { Framework, PublishedCatalog } from "../../domain/frameworks";
import { GRUNDSCHUTZ_PP } from "./catalog.generated";
import { GSPP_COMPONENTS } from "./components.generated";

/** The ruleset, in the build. `npm run sync` runs before every build and writes
 *  catalog.generated.ts from the published file, so a build carries the ruleset as it
 *  stood that day and the requirements are there on first start. The generated file is
 *  not committed: the repository holds no foreign ruleset, the build output does. */
export const BUNDLED_FRAMEWORKS: Framework[] = [GRUNDSCHUTZ_PP];

/** What the BSI publishes about things that implement its requirements. Each component
 *  names the controls it implements, so the link between a measure and the requirements it
 *  answers is read from the publisher rather than decided here - 304 of 305 references in
 *  the published definitions resolve against the catalogue. An institution still writes
 *  its own measures; these are the ones it does not have to write. */
export const BUNDLED_MEASURE_CATALOGS: Framework[] = [GSPP_COMPONENTS];

/** Where the ruleset is published, offered for download in the import dialog.
 *
 *  Fetched only when the user presses it. The application starts, runs and closes without
 *  it; a machine with no network imports the same file from disk. What the download is
 *  for, beyond the 1000 requirements, is the vocabulary: the practices, the target-object
 *  categories, the modal verbs and the security levels are the BSI's lists, and the fields
 *  that use them declare it (see taxonomy.ts), so they can be brought up to date from the
 *  source instead of being maintained here by hand. */
export const PUBLISHED_CATALOGS: PublishedCatalog[] = [
  {
    key: "gspp",
    name: "Anwenderkatalog Grundschutz++",
    url: "https://raw.githubusercontent.com/BSI-Bund/Stand-der-Technik-Bibliothek/main/control_layer/Grundschutz%2B%2B/Grundschutz%2B%2B-resolved_catalog.json",
    source: "BSI, Stand-der-Technik-Bibliothek · OSCAL 1.1.3 · CC BY-SA 4.0",
    size: "5,4 MB",
  },
];
