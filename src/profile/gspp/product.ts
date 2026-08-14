// What this build is called, and how it looks. Changing the name is this one file.
//
// "IT-Grundschutz" and "Grundschutz++" are the BSI's own terms for the method. Naming the
// method a product implements is descriptive use; naming the PRODUCT after it would claim
// the BSI's mark. Hence a name of our own plus a descriptive line.
//
// A tessera was the tablet carrying the watchword, passed from sentry to sentry through
// the night — and the single stone a mosaic is composed of. Both readings are the work:
// the round that keeps watch, and the picture that only exists once the pieces are laid.
import type { Product } from "../../domain/types";
import { THEME } from "./theme";
import { STYLES, REPORT_STYLES } from "./styles";

export const PRODUCT: Product = {
  name: "Aurelian Tessera++",
  tagline: "BSI Grundschutz implemented",
  mark: "Aurelian Tessera",
  source: "github.com/aurelian-risk/aurelian-tessera",
  // The method is the BSI's work; this is the acknowledgement of that, not a licence
  // notice — those travel with the documents that quote the ruleset, and stand in NOTICE.md.
  credit: {
    text: "Method: Grundschutz++ © Bundesamt für Sicherheit in der Informationstechnik, CC BY-SA 4.0",
    url: "https://github.com/BSI-Bund/Stand-der-Technik-Bibliothek",
  },
  // CC BY-SA 4.0 asks for the creator, a link, the licence and an indication of what was
  // changed. The build carries the ruleset, so it carries the notice too — in the
  // application and in every document it generates.
  attribution: [{
    title: "Anwenderkatalog Grundschutz++",
    holder: "Bundesamt für Sicherheit in der Informationstechnik",
    licence: "CC BY-SA 4.0",
    url: "https://github.com/BSI-Bund/Stand-der-Technik-Bibliothek",
    changes: "read from OSCAL into this application's own structure; parameter placeholders resolved into the prose; the alt-identifier property and properties this taxonomy does not declare are not carried",
  }],
  // A security concept is read beside the BSI's own publication, so the tool is set the
  // way that publication is: light, ruled, and printed rather than assembled.
  scheme: "light",
  theme: THEME,
  styles: STYLES,
  // What the method calls its deliverable: a security concept, handed to an auditor
  // beside the BSI's own publication and set the same way.
  documentTitle: "Security concept to Grundschutz++",
  reportCss: REPORT_STYLES,
};

export type { Product };
