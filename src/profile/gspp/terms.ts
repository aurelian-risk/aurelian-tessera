// English for the BSI's German terms — for reading, not for recording.
//
// The BSI publishes this ruleset in German only: 82 files in the library, none carrying a
// language marker, no `lang` in the catalogue metadata. Checked 2026-08-14. So there is no
// authoritative English wording to adopt, and inventing one to STORE would be worse than
// useless: the term is an identifier. The engine matches on it, the catalogue import fills
// fields with it, and an auditor checks it against the publisher's own list.
//
// The BSI does the same thing itself where it wants both, writing "Vertraulichkeit
// (Confidentiality)" in documentation/namespaces/security_targets.csv. This file follows
// that: the value stays the BSI's, the label reads in the language of the interface, and
// the original stays one hover away.
//
// A term that has arrived from a newer catalogue and is not listed here shows in German —
// visibly untranslated rather than silently wrong. `npm run test:gspp` reports any.

/** documentation/namespaces/target_object_categories.csv — the 39 categories. */
export const CATEGORY_EN: Record<string, string> = {
  // Nutzende
  "Nutzende": "Users",
  "Mitarbeitende": "Employees",
  "Administrierende": "Administrators",
  "Führungskräfte": "Managers",
  "Institutionsleitung": "Executive management",
  // Anwendungen
  "Anwendungen": "Applications",
  "Dateiserver": "File servers",
  "DNS-Server": "DNS servers",
  "E-Mail": "Email",
  "Faxe": "Fax",
  "Interpersonelle Kommunikation": "Interpersonal communication",
  "Office-Anwendungen": "Office applications",
  "TK-Anwendungen": "Telephony applications",
  "Verzeichnisdienste": "Directory services",
  "Virtualisierungslösungen": "Virtualisation",
  "VK-Anwendungen": "Video-conferencing applications",
  "Webanwendungen": "Web applications",
  "Webbrowser": "Web browsers",
  "Webserver": "Web servers",
  // Einkäufe
  "Einkäufe": "Procurement",
  "Cloud-Dienste": "Cloud services",
  "Dienstleistungen": "Services",
  "IT-Produkte": "IT products",
  "Outsourcing": "Outsourcing",
  // Informationen
  "Informationen": "Information",
  "Daten": "Data",
  // Standorte
  "Standorte": "Sites",
  "Gebäude": "Buildings",
  "Räume": "Rooms",
  "Räume für technische Infrastruktur": "Technical infrastructure rooms",
  "Serverräume": "Server rooms",
  "Datenträgerarchiv": "Media archive",
  // IT-Systeme und Netze
  "IT-Systeme": "IT systems",
  "Endgeräte": "End devices",
  "Hostsysteme": "Host systems",
  "Netze": "Networks",
  "Externe Netzanschlüsse": "External network connections",
  "Interne Netzsegmente": "Internal network segments",
  "WLANs": "Wireless networks",
};

/** documentation/namespaces/practices.csv — the 20 practices, as "KEY Name". */
export const PRACTICE_EN: Record<string, string> = {
  "GC Governance und Compliance": "GC Governance and compliance",
  "STM Strukturmodellierung": "STM Structural modelling",
  "UMS Umsetzung": "UMS Implementation",
  "VRB Verbesserung": "VRB Improvement",
  "PERF Monitoring-Evaluation": "PERF Monitoring and evaluation",
  "RISK Risikomanagement": "RISK Risk management",
  "ASST Informationen und Assets": "ASST Information and assets",
  "PERS Personal": "PERS Personnel",
  "BES Beschaffungsmanagement": "BES Procurement management",
  "DLS Dienstleistersteuerung": "DLS Supplier management",
  "TEST Änderungen und Tests": "TEST Change and testing",
  "GEB Gebäudemanagement": "GEB Facility management",
  "SENS Sensibilisierung": "SENS Awareness",
  "ARCH Architektur": "ARCH Architecture",
  "BER Berechtigung": "BER Authorisation",
  "NOT Notfallplanung": "NOT Business continuity",
  "DET Detektion": "DET Detection",
  "REA Sicherheitsvorfallsbehandlung": "REA Incident response",
  "KONF Konfiguration": "KONF Configuration",
  "DEV Entwicklung": "DEV Development",
};

/** The remaining published vocabularies, small enough to keep beside the two big ones.
 *  The modal verbs are deliberately NOT translated: the BSI defines them against
 *  DIN 820-2 and RFC 2119, and MUSS/SOLLTE/KANN are how a requirement is cited. */
export const VALUE_EN: Record<string, string> = {
  // security_level.csv
  "normal-SdT": "normal (state of the art)",
  "erhöht": "elevated",
  // Schutzbedarf, GC.7.1
  "normal": "normal",
  "hoch": "high",
  // Umsetzungsstatus, UMS.1.1
  "ja": "yes",
  "nein": "no",
};

/** Labels for a list of options, positionally, from the tables above. An unlisted term
 *  keeps its published wording rather than being guessed at. */
export const labelsFor = (options: string[], table: Record<string, string>): string[] =>
  options.map((o) => table[o] ?? o);
