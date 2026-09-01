// The sample study, in German.
//
// The study is DATA, not interface, so this is not the overlay in words.ts: nothing is
// looked up while the page renders. The text is chosen once, when the study is created,
// and from then on it is what the records hold - a reader who loads it in German has a
// German study, and switching the browser afterwards does not rewrite their data.
//
// WHAT IS NOT IN HERE, and the apply function refuses to write it:
//
//   · anything published by the BSI. The 1000 catalogue requirements and the 35 measures
//     that carry a `framework` are the publisher's text, already German, and are not
//     touched. Only the 65 invented records are.
//   · anything the taxonomy declares. Type keys, field keys, enum values, scale ratings,
//     dates, references and ids are the engine's contract - `treatment.ts` compares
//     against "Accept", `dimWhen` against "out of scope", `calibration.ts` matches
//     `sector` literally. A German study differs from the English one in its `text` and
//     `textarea` fields and in nothing else, which is what scripts/sample-test.mjs
//     establishes rather than assumes.
//
// Keyed by `<type>/<name>` because that is what identifies a record here: the ids are
// generated per run, and the relations between records are by id, so translating a name
// moves no link.
import type { EntityRecord, Study } from "../../domain/types";
import type { LogInput } from "../../domain/audit";
import { DEFAULT_TAXONOMY } from "./taxonomy";

/** Field values, per record. Only text and textarea fields; see the header.
 *
 *  An entry that reads the same in both languages is written out rather than left out: a
 *  missing key and a deliberate repeat look identical from outside, and the check demands
 *  an entry for every value. What repeats here is a person's name, a date, a document
 *  number, a BSI abbreviation and a MITRE technique - published or proper names. */
export const SAMPLE_DE: Record<string, Record<string, string>> = {
  // ── Step 1 · Rahmen und Planung ────────────────────────────────────────────
  "business_asset/Grid control": {
    name: "Netzsteuerung",
    description: "Rund um die Uhr Überwachung und Steuerung der Strom- und Fernwärmenetze. Ein Ausfall ist in jedem angeschlossenen Haushalt sofort zu spüren.",
    verantwortlich: "Leiter Netzbetrieb",
    protection_rationale: "Der Verlust der Fernsteuerung, oder ein unterwegs verändertes Schaltkommando, bedroht die Versorgung selbst. Mit der Leitung als hoch eingestuft, was zugleich die Risikobetrachtung nach GC.7.2 auslöst.",
  },
  "business_asset/Consumption billing": {
    name: "Verbrauchsabrechnung",
    description: "Zählerstände, Rechnungsstellung und Zahlungsläufe für Haushalts- und Gewerbekunden.",
    verantwortlich: "Leiter Kundenservice",
    protection_rationale: "Ein Abrechnungslauf lässt sich wiederholen. Verzögerung kostet, ist aber nicht existenzbedrohend.",
  },
  "business_asset/Customer master data": {
    name: "Kundenstammdaten",
    description: "Vertrags-, Bank- und Verbrauchsdaten der angeschlossenen Kunden. Personenbezogene Daten nach DSGVO.",
    verantwortlich: "Datenschutzbeauftragter",
    protection_rationale: "Eine Offenlegung ist meldepflichtig und betrifft alle Kunden auf einmal.",
  },

  // STM.2.1.7: the requirement the institution writes itself. The catalogue's 1000 are the
  // publisher's text and are never touched; this one is this file's own sentence.
  "requirement/Report a disturbance of the grid control systems to the Bundesnetzagentur without delay": {
    name: "Eine Störung der Netzsteuerungssysteme unverzüglich an die Bundesnetzagentur melden",
    // Deliberately the same on both sides: an identifier and a date are not translated, and
    // an entry saying so is what tells a reader it was considered rather than forgotten.
    ref_id: "EIGEN.1",
    faellig: "2026-12-31",
    compliance_basis: "§ 11 Abs. 1c EnWG in Verbindung mit dem IT-Sicherheitskatalog für Netzbetreiber - Beispiel, keine Rechtsberatung",
    verantwortlich: "Leiter Netzbetrieb",
    description: "Eine Störung der Systeme, die das Netz führen, wird unverzüglich in der Form an die Regulierungsbehörde gemeldet, die der Sicherheitskatalog vorschreibt.",
    begruendung: "Aufgenommen nach STM.2.1.7: die Pflicht trifft die Institution als Netzbetreiber und wird von keiner Anforderung des Katalogs abgedeckt.",
    residual_risk: "Eine verspätete Meldung verletzt die Pflicht selbst, unabhängig von der Störung.",
  },

  "partei/Bundesnetzagentur": {
    name: "Bundesnetzagentur",
    bedarf: "Einhaltung des IT-Sicherheitskatalogs für Netzbetreiber und Meldung eines meldepflichtigen Vorfalls innerhalb der gesetzlichen Frist.",
    ableitung: "Der Meldeweg ist Teil des Vorfallverfahrens, und die Frist hängt an der verantwortlichen Rolle statt am Gedächtnis einer Person.",
    verantwortlich: "Geschäftsführer",
  },
  "partei/Connected customers": {
    name: "Angeschlossene Kunden",
    bedarf: "Eine Versorgung, die nicht abreißt, und dass ihre Verbrauchs- und Bankdaten vertraulich bleiben.",
    ableitung: "Die Kundenstammdaten sind als hoch eingestuft, und ihre Offenlegung ist eines der Schadensereignisse, von denen die Risikobetrachtung ausgeht.",
    verantwortlich: "Leiter Kundenservice",
  },
  "partei/Works council": {
    name: "Betriebsrat",
    bedarf: "Dass Überwachungsmaßnahmen nicht zur Leistungskontrolle werden und dass jede Sitzungsaufzeichnung vereinbart ist, bevor sie eingeschaltet wird.",
    ableitung: "Die Auswertung der Wartungsaufzeichnungen benennt, was angesehen wird und was nicht; die Vereinbarung ist aus dem Verfahren heraus referenziert.",
    verantwortlich: "Leiter Personal",
  },
  "partei/Operations staff": {
    name: "Betriebspersonal",
    bedarf: "Sicherheit, die nicht zwischen ihnen und einem Schaltbefehl um drei Uhr morgens steht.",
    ableitung: "Der zweite Faktor für die Fernwartung wurde mit einem Notfallpfad entworfen, weshalb es eine Verbesserung ist und keine Korrektur.",
    verantwortlich: "Leiter Netzbetrieb",
  },

  "rolle/Information security officer": {
    name: "Informationssicherheitsbeauftragter",
    traeger: "M. Adler",
    stellvertreter: "S. Brandt",
    aufgaben: "Berät die Leitung zur Informationssicherheit, koordiniert das Sicherheitskonzept und das Anforderungspaket, untersucht Vorfälle und berichtet über den Stand der Sicherheit.",
    befugnisse: "Darf von jeder Einheit Auskunft verlangen, darf eine Änderung stoppen, die eine MUSS-Anforderung offen ließe, und berichtet der Leitung aus eigenem Antrieb.",
    qualifikation: "Kenntnis von Grundschutz++ und der Prozessleittechnik des Versorgers; zwei Jahre in einer operativen Sicherheitsrolle; jährlich fortgebildet.",
    unterstellt: "Unmittelbar dem Geschäftsführer, außerhalb der IT-Linie.",
    ressourcen: "0,6 VZÄ, ein Fortbildungsbudget von 4.000 EUR im Jahr und das Budget für das externe Audit.",
    interessenkonflikt: "Nicht in einer Hand mit der Leitung des IT-Betriebs: die Rolle prüft, was diese Einheit baut.",
  },
  "rolle/Information security committee": {
    name: "Informationssicherheitsgremium",
    traeger: "Geschäftsführer, Leiter Netzbetrieb, Leiter IT, Datenschutzbeauftragter, ISB",
    stellvertreter: "Jedes Mitglied benennt in der Geschäftsordnung eine ständige Vertretung.",
    aufgaben: "Tagt vierteljährlich, entscheidet über das Anforderungspaket, über Ausnahmen ab Schwere 3 und über den Verbesserungsplan.",
    befugnisse: "Genehmigt Ausnahmen und gibt die Mittel für den Umsetzungsplan frei.",
    qualifikation: "Mitglieder sind die Träger der genannten Posten; eine eigene Qualifikation wird von ihnen nicht verlangt.",
  },
  "rolle/Interface to data protection": {
    name: "Schnittstelle zum Datenschutz",
    traeger: "Datenschutzbeauftragter",
    stellvertreter: "Stellvertretender Datenschutzbeauftragter",
    aufgaben: "Gemeinsame Bewertung, wo personenbezogene Daten und Informationssicherheit sich berühren - Meldepflichten, Aufbewahrung, Zugriff auf Kundenstammdaten.",
    befugnisse: "Kann verlangen, dass eine Sicherheitsmaßnahme auf ihre Wirkung auf die Rechte der Betroffenen bewertet wird.",
    qualifikation: "Nach DSGVO als Datenschutzbeauftragter bestellt.",
    interessenkonflikt: "Vom ISB von der Anlage her unabhängig; beide berichten der Leitung getrennt.",
  },
  "rolle/Deputy for the ISB during long absence": {
    name: "Vertretung des ISB bei längerer Abwesenheit",
    aufgaben: "Offen. Die ständige Vertretung deckt Tage ab, nicht Monate; für eine längere Abwesenheit ist niemand benannt und keine Übergabe niedergeschrieben.",
  },

  "verfahren/Continuous improvement of the ISMS": {
    name: "Kontinuierliche Verbesserung des ISMS",
    anforderung: "VRB.1.1",
    description: "Abweichungen und Verbesserungspotenziale werden aus Audits, Vorfällen und der jährlichen Bewertung gesammelt, auf Ursache und Wiederauftreten untersucht und mit priorisierten Maßnahmen beantwortet, deren Wirkung im Nachhinein geprüft wird.",
    dokument: "ISMS-VA-05 Kontinuierliche Verbesserung, v2.1",
    verantwortlich: "M. Adler",
    freigegeben_am: "2026-02-14",
    letzte_pruefung: "2026-07-30",
  },
  "verfahren/Audit programme and audit reports": {
    name: "Auditprogramm und Auditberichte",
    anforderung: "PERF.3.1, PERF.3.2",
    description: "Das Auditprogramm wird jährlich aus dem Risiko und aus dem, was sich geändert hat, aufgestellt, von Personen durchgeführt, die von dem Geprüften unabhängig sind, und so berichtet, dass Feststellungen, Verbesserungspotenzial und das Funktionierende gleichermaßen lesbar sind.",
    dokument: "ISMS-VA-08 Auditprogramm, v1.4",
    verantwortlich: "K. Cordes",
    freigegeben_am: "2026-01-20",
    letzte_pruefung: "2026-06-12",
  },
  "verfahren/Tracking the implementation of measures": {
    name: "Nachverfolgung der Maßnahmenumsetzung",
    anforderung: "UMS.6.1, UMS.6.2",
    description: "Offen und noch nicht geschrieben. Statusberichte, Soll gegen Ist und die Kennzahlenauswertung finden statt, aber niemand hat festgelegt, in welchem Abstand, an wen berichtet wird oder wie der Plan überarbeitet wird, wenn beides auseinanderläuft.",
  },

  // ── Step 2 · Anforderungsanalyse ───────────────────────────────────────────
  "supporting_asset/Control system (SCADA)": {
    name: "Leitsystem (SCADA)",
    description: "Zentrales Leitsystem, das Umspannwerke und Heizwerke fernbedient.",
    begruendung: "Zugeordnet zu IT-Systeme: es wird als eigenständiges System betrieben, nicht als Anwendung auf einer fremden Plattform.",
  },
  "supporting_asset/Telecontrol network": {
    name: "Fernwirknetz",
    description: "Eigenes Weitverkehrsnetz zwischen Leitstelle und Stationen.",
    begruendung: "Zugeordnet zu Netze: es trägt die Schaltbefehle und wird als Netz betrieben.",
  },
  "supporting_asset/Dial-up access at the legacy stations": {
    name: "Wählzugang an den Altstationen",
    description: "Eine Wählverbindung aus der Zeit vor dem Fernwirknetz, an sechs Stationen noch angeschlossen.",
    begruendung: "Zugeordnet zu Externe Netzanschlüsse: sie erreicht die Fernwirktechnik von außen, am kontrollierten Übergang vorbei. Erbt Netze.",
  },
  "supporting_asset/Remote-maintenance provider": {
    name: "Fernwartungsdienstleister",
    description: "Der Hersteller, mit Fernzugriff auf das Leitsystem aus einem Wartungsvertrag.",
    externe_schnittstelle: "Der eigene Wartungsprozess des Herstellers greift über diesen Zugang in das Leitnetz. Was übergeht: eine je Auftrag geöffnete Sitzung aus dem Netz des Herstellers und die Diagnosedaten, die sie zurücknimmt. Betrieben vom Hersteller; auf dieser Seite verantwortet der Leiter Netzbetrieb sie. (STM.1.2)",
    begruendung: "Zugeordnet zu Dienstleistungen: eingekauft wird die Leistung, nicht ein Produkt. Erbt Einkäufe.",
  },
  "supporting_asset/Directory service": {
    name: "Verzeichnisdienst",
    description: "Zentrale Benutzer- und Berechtigungsverwaltung für die Verwaltungs-IT.",
    begruendung: "Zugeordnet zu Verzeichnisdienste, die der Katalog unter Anwendungen führt.",
  },
  "supporting_asset/Billing system": {
    name: "Abrechnungssystem",
    description: "Die ERP-Anwendung für Zählerstände, Rechnungen und Zahlungsläufe.",
    begruendung: "Zugeordnet zu Anwendungen: es läuft auf der gemeinsamen Plattform und nicht als eigenes System.",
  },

  "feared_event/Loss of network control": {
    name: "Verlust der Netzsteuerung",
    description: "Die Leitstelle verliert die Fernsteuerung; geschaltet werden kann nur noch vor Ort.",
  },
  "feared_event/Switching commands manipulated": {
    name: "Manipulierte Schaltbefehle",
    description: "Veränderte Befehle führen zu Fehlschaltungen im Verteilnetz.",
  },
  "feared_event/Customer data disclosed": {
    name: "Offenlegung von Kundendaten",
    description: "Vertrags- und Bankdaten angeschlossener Kunden werden abgezogen; meldepflichtig nach DSGVO.",
  },

  // The practices are the catalogue's own top-level grouping and are published in German.
  "praktik/Governance und Compliance": {
    name: "Governance und Compliance", kuerzel: "GC",
    description: "Der strategische Rahmen: Rollen, Pflichten, Nachweise.",
  },
  "praktik/Berechtigung": {
    name: "Berechtigung", kuerzel: "BER",
    description: "Zugang nur für berechtigte Personen und Systeme.",
  },
  "praktik/Dienstleistersteuerung": {
    name: "Dienstleistersteuerung", kuerzel: "DLS",
    description: "Was von einem Dienstleister verlangt wird und wie es nachgewiesen wird.",
  },

  // ── Step 3 · Risikobetrachtung ─────────────────────────────────────────────
  "risk_origin/Organised cybercrime": {
    name: "Organisierte Cyberkriminalität",
    description: "Eine Erpressergruppe, die gegen Betreiber kritischer Versorgung arbeitet.",
    motivation: "Lösegeld",
  },
  "risk_origin/State actor": {
    name: "Staatlicher Akteur",
    description: "Auf die Sabotage von Versorgungsinfrastruktur gerichtet.",
    motivation: "Sabotage",
  },

  "strategic_scenario/Entry through the manufacturer's remote maintenance": {
    name: "Einstieg über die Fernwartung des Herstellers",
    description: "Der Angreifer kompromittiert den Fernzugang des Herstellers und erreicht darüber das Fernwirknetz.",
  },
  "strategic_scenario/Sabotage of network control": {
    name: "Sabotage der Netzsteuerung",
    description: "Ein staatlicher Akteur richtet sich dauerhaft ein und verändert Schaltbefehle zu einem selbst gewählten Zeitpunkt.",
  },

  "operational_scenario/Encryption of the control-room systems": {
    name: "Verschlüsselung der Leitstellensysteme",
    description: "Die Kette vom kompromittierten Wartungszugang bis zum Verlust der Fernsteuerung.",
  },
  // The techniques are MITRE's identifiers and names, cited as published.
  "kill_chain_step/Takeover of the maintenance access": {
    name: "Übernahme des Wartungszugangs",
    description: "Die Zugangsdaten des Dienstleisters werden erlangt.",
    technique: "T1078 Valid Accounts",
  },
  "kill_chain_step/Persistence on the jump host": {
    name: "Einnisten auf dem Sprungserver",
    description: "Dauerhafter Zugang auf dem Wartungssystem.",
    technique: "T1053 Scheduled Task/Job",
  },
  "kill_chain_step/Move into the control system": {
    name: "Übergang ins Leitsystem",
    description: "Aus dem Wartungssegment in das Leitsystem.",
    technique: "T1021 Remote Services",
  },
  "kill_chain_step/Encryption of the control-room servers": {
    name: "Verschlüsselung der Leitstellenserver",
    description: "Die Fernsteuerung geht verloren.",
    technique: "T1486 Data Encrypted for Impact",
  },
  "operational_scenario/Mis-operation through altered switching commands": {
    name: "Fehlschaltung durch veränderte Schaltbefehle",
    description: "Die Kette vom Zugang zur Fernwirktechnik bis zu einer beliebig ausgelösten Schalthandlung. Der Angreifer bleibt still, bis der Zeitpunkt gewählt ist.",
  },
  "kill_chain_step/Entry over the legacy dial-up line": {
    name: "Einstieg über die alte Wählverbindung",
    description: "Eine Wählverbindung in die Fernwirktechnik, am kontrollierten Übergang vorbei.",
    technique: "T1133 External Remote Services",
  },
  "kill_chain_step/Reading the telecontrol protocol": {
    name: "Mitlesen des Fernwirkprotokolls",
    description: "Schaltbefehle werden aufgezeichnet, um zu lernen, wie die Anlage gefahren wird.",
    technique: "T0842 Network Sniffing",
  },
  "kill_chain_step/Injection of altered switching commands": {
    name: "Einspielen veränderter Schaltbefehle",
    description: "Der Angreifer öffnet Abzweige zu einem selbst gewählten Zeitpunkt.",
    technique: "T0831 Manipulation of Control",
  },

  "risk_treatment/Secure the remote-maintenance access": {
    name: "Den Fernwartungszugang absichern",
    owner: "Leiter IT-Betrieb",
    deadline: "2026-10-31",
    justification: "Ein zweiter Faktor und die Zonentrennung verengen den Zugang; die Auswertung der Sitzungsprotokolle ist beauftragt.",
  },
  "risk_treatment/Bring the telecontrol access back to one controlled crossing": {
    name: "Den Fernwirkzugang auf einen kontrollierten Übergang zurückführen",
    owner: "Leiter Netzbetrieb",
    deadline: "2027-06-30",
    justification: "Der Rückbau der Wählverbindungen beseitigt den unkontrollierten Einstieg. Bis dahin ist die Kette allein durch Erkennung gedeckt.",
  },

  // ── Step 4 · Umsetzung ─────────────────────────────────────────────────────
  // Eight measures of the institution's own. The 35 the BSI publishes are not here.
  "security_measure/Multi-factor authentication for remote-maintenance access": {
    name: "Mehrfaktor-Authentisierung für den Fernwartungszugang",
    description: "Ein zweiter Faktor für jeden Zugriff des Herstellers, je Sitzung freigegeben.",
    verantwortlich: "IT-Betrieb",
    termin: "2026-10-31",
  },
  "security_measure/Maintenance access released only on request": {
    name: "Wartungszugang nur auf Anforderung freigegeben",
    description: "Der Zugang des Herstellers ist standardmäßig gesperrt und wird je Auftrag für ein Zeitfenster geöffnet.",
    verantwortlich: "IT-Betrieb",
  },
  "security_measure/Separation of the telecontrol network from the office IT": {
    name: "Trennung des Fernwirknetzes von der Büro-IT",
    description: "Getrennte Übertragungswege und ein kontrollierter Übergang zwischen den Zonen.",
    verantwortlich: "Netzbetrieb",
  },
  "security_measure/Evaluation of the remote-maintenance logs": {
    name: "Auswertung der Fernwartungsprotokolle",
    description: "Sitzungsprotokolle werden zentral gesammelt und auf Auffälligkeiten durchgesehen.",
    verantwortlich: "IT-Sicherheit",
    termin: "2027-03-31",
  },
  "security_measure/Offline backup of the control-system configuration": {
    name: "Offline-Sicherung der Leitsystemkonfiguration",
    description: "Eine wöchentliche Sicherung außerhalb des Netzes, vierteljährlich zurückgespielt, um zu belegen, dass sie trägt.",
    verantwortlich: "IT-Betrieb",
  },
  "security_measure/Announced recording of every maintenance session": {
    name: "Angekündigte Aufzeichnung jeder Wartungssitzung",
    description: "Jede Sitzung des Herstellers wird aufgezeichnet; die Aufzeichnung steht im Vertrag und wird beim Verbinden angesagt.",
    verantwortlich: "IT-Sicherheit",
  },
  "security_measure/Removal of the legacy dial-up lines": {
    name: "Rückbau der alten Wählverbindungen",
    description: "Die sechs verbliebenen Wählverbindungen werden getrennt und die Stationen auf das Fernwirknetz gelegt.",
    verantwortlich: "Netzbetrieb",
    termin: "2027-06-30",
  },
  "security_measure/Anomaly detection on the telecontrol protocol": {
    name: "Anomalieerkennung auf dem Fernwirkprotokoll",
    description: "Schaltbefehle werden gegen das erwartete Betriebsmuster geprüft und Abweichungen an die Leitstelle gemeldet.",
    verantwortlich: "Netzbetrieb",
    termin: "2027-09-30",
  },

  // ── Step 5 · Monitoring ────────────────────────────────────────────────────
  "audit/Internal audit of remote maintenance": {
    name: "Internes Audit der Fernwartung",
    ziel: "Feststellen, ob die Anforderungen an den Fernwartungszugang erfüllt sind und ob die Maßnahmen darauf wirken.",
    umfang: "Der Zugang des Herstellers zum Leitsystem, der Wartungs-Sprungserver und die Sitzungsaufzeichnungen, für das laufende Jahr.",
    kriterien: "Gespräche mit dem IT-Betrieb, Durchsicht des Wartungsvertrags und der Sitzungsaufzeichnungen sowie eine technische Prüfung der Zugriffsregeln auf dem Sprungserver.",
    auditteam: "Interne Revision, mit einem externen Netzspezialisten. Keiner von beiden ist am Betrieb des Zugangs beteiligt.",
    geplant_fuer: "2026-09-15",
    durchgefuehrt_am: "2026-09-17",
    bericht: "Der Zugang wird je Auftrag freigegeben und wie verlangt aufgezeichnet. Die Sitzungsaufzeichnungen werden gesammelt, aber nicht ausgewertet: niemand ist als Auswertender benannt, ein Missbrauch wäre also erst im Nachhinein sichtbar. Die Zweifaktor-Authentisierung ist bei drei von fünf Konten eingerichtet.",
  },
  "audit/Surveillance audit of the telecontrol network": {
    name: "Überwachungsaudit des Fernwirknetzes",
    ziel: "Feststellen, ob die Trennung zwischen Fernwirknetz und Büro-IT so trägt, wie sie entworfen wurde.",
    umfang: "Der Übergang zwischen den Zonen und die sechs alten Wählstationen.",
    kriterien: "Konfigurationsprüfung des Übergangs und eine Stichprobe der Wählverbindungen vor Ort.",
    auditteam: "Externer Auditor, für das Jahr bestellt.",
    geplant_fuer: "2027-03-10",
  },

  "managementbericht/Management report on information security, first half of 2026": {
    name: "Managementbericht Informationssicherheit, erstes Halbjahr 2026",
    zeitraum: "Januar bis Juni 2026",
    eignung: "Das Anforderungspaket ist modelliert, und die Maßnahmen am Prozess Netzsteuerung sind eingerichtet oder geplant. An zwei Stellen wird der beabsichtigte Zweck noch nicht wirksam erreicht: die Wartungssitzungen werden aufgezeichnet, aber nicht gelesen, und die alten Wählverbindungen hängen noch.",
    folgemassnahmen: "Der Beschluss der letzten Bewertung, die Wählverbindungen zurückzubauen, liegt hinter dem Plan; das Budget ist nach 2027 übertragen.",
    rahmenbedingungen: "Im März wurde das Fernwärmenetz übernommen, die Netzsteuerung deckt seitdem beide Netze ab und der Prozess wurde auf hoch neu eingestuft. Der veröffentlichte Katalog ist auf den Stand 2026-08 gewechselt; die Ableitung wurde erneut ausgeführt und brachte neun Anforderungen herein, keine davon MUSS.",
    erfolge_probleme: "Der zweite Faktor auf der Fernwartung trägt seit Februar, ohne eine gewährte Ausnahme. Dagegen: im April wurde zweimal ein Schaltbefehl über das Wartungs-Gateway eingereiht - kein Ausfall, aber gefunden hat es der Anlagenfahrer und nicht wir.",
    eignung_massnahmen: "Die Mehrfaktor-Authentisierung erreicht ihr Ziel, belegt am Freigabeprotokoll des letzten Quartals. Die Aufzeichnung der Wartungssitzungen nicht: die Aufzeichnungen liegen vor und niemand liest sie, die Maßnahme erkennt also nichts. Sie wird um einen benannten Auswertenden ergänzt, nicht ersetzt.",
    rueckmeldungen: "Die Bundesnetzagentur hat im Mai gefragt, wie lange eine Störungsmeldung hier braucht; die Antwort wurde als eigene Anforderung festgehalten. Das Betriebspersonal meldet, dass der zweite Faktor etwa eine Minute je Sitzung kostet, was niemand beanstandet hat. Von angeschlossenen Kunden kam in diesem Zeitraum keine Rückmeldung zur Sicherheit.",
    planstatus: "Von acht geplanten Maßnahmen sind vier umgesetzt, zwei in Arbeit, zwei nicht begonnen. Das Risiko am Prozess Netzsteuerung ist von wahrscheinlich-existenzbedrohend auf möglich-schwer gerückt; die beiden nicht begonnenen sind die an den Altstationen, der Wählpfad ist also unverändert.",
    verbesserungen_bericht: "Die Bewertung des letzten Zeitraums verlangte, das Ausnahmeverfahren niederzuschreiben; es ist verankert und seit April in Kraft. Zweimal angewandt, beide Male mit benannter freigebender Stelle und Enddatum - wofür es da war. Ob es eine unbefristete Ausnahme verhindert, lässt sich vor Ablauf der ersten nicht sagen.",
    entscheidungen: "Der Rückbau der Wählverbindungen ist für das erste Halbjahr 2027 bestätigt. Für das Lesen der Sitzungsaufzeichnungen ist eine verantwortliche Stelle benannt.",
    massnahmenvorschlaege: "1 - Die Wartungsaufzeichnungen wöchentlich lesen, mit benannter auswertender Person: 2 Stunden je Woche aus der Rufbereitschaft, kein Budget. 2 - Zweiter Faktor für die verbleibenden zwei administrativen Konten: 4 Personentage und 900 EUR für Token. 3 - Rückbau der sechs alten Wählstationen: 25 Personentage und 40.000 EUR, davon 18.000 EUR im Jahr 2027.",
    vorgelegt_am: "2026-07-28",
  },

  "niveau_review/Redundant telecoms connection at the legacy stations": {
    name: "Redundante TK-Anbindung an den Altstationen",
    begruendung: "Die sechs Wählverbindungen werden im Laufe des Jahres getrennt und die Stationen auf das Fernwirknetz gelegt. Eine zweite Anbindung für eine Strecke zu bauen, die zurückgebaut wird, bindet das Budget, das der Rückbau braucht.",
    decided_on: "2026-05-20",
  },
  "exception/No separate fire compartment in the substation": {
    name: "Kein eigener Brandabschnitt im Umspannwerk",
    begruendung: "Das Stationsgebäude ist älter als die Anforderung und lässt sich nicht unterteilen, ohne den Abzweig wochenlang außer Betrieb zu nehmen. Stattdessen ist eine Detektion mit Alarmierung eingerichtet.",
    authorised_by: "Geschäftsführer, auf Vorschlag des Leiters Netzbetrieb",
    decided_on: "2026-07-02",
    valid_until: "2028-12-31",
  },

  "kennzahl/Share of MUSS requirements implemented": {
    name: "Anteil umgesetzter MUSS-Anforderungen",
    description: "Wie viel von dem, was das Regelwerk unbedingt setzt, tatsächlich eingerichtet ist.",
    einheit: "%",
  },
  "kennzahl/Privileged accounts with a second factor": {
    name: "Privilegierte Konten mit zweitem Faktor",
    description: "Anteil der administrativen Konten hinter einer Mehrfaktor-Authentisierung.",
    einheit: "%",
  },

  "leitlinie/Information security policy of Riverbend Municipal Utilities": {
    name: "Leitlinie zur Informationssicherheit der Stadtwerke Riverbend",
    version: "2.0",
    strategie: "Sicherheit folgt der Versorgung. Wo eine Maßnahme die Führung des Netzes verlangsamen würde, wird die Maßnahme neu entworfen und nicht der Prozess; überall sonst wird die veröffentlichte Anforderung erfüllt, wie sie geschrieben steht. Nichts erreicht das Leitnetz, was nicht durch das Wartungs-Gateway gegangen ist, und nichts verlässt die Institution ohne benannte Verantwortung.",
    verpflichtung: "Der Geschäftsführer trägt die Gesamtverantwortung für die Informationssicherheit, bestätigt die obigen Ziele zweimal jährlich gegen die Geschäftsziele, empfängt den ISB ohne Zwischeninstanz und gibt die Mittel frei, die der Umsetzungsplan nennt.",
    dokument: "ISMS-LL-01 Leitlinie Informationssicherheit, v2.0",
    freigegeben_durch: "Geschäftsführer",
    freigegeben_am: "2026-02-14",
  },

  // ── Step 6 · Verbesserung ──────────────────────────────────────────────────
  "abweichung/Maintenance sessions are recorded but never read": {
    name: "Wartungssitzungen werden aufgezeichnet, aber nie gelesen",
    description: "Sitzungen des Herstellers werden aufgezeichnet, und niemand sieht die Protokolle durch.",
    ursache: "Die Aufzeichnung wurde als technische Maßnahme eingerichtet und nie jemandem als Aufgabe übergeben; das Betriebshandbuch nennt weder eine auswertende Stelle noch einen Abstand.",
  },
  "abweichung/The role description is out of date": {
    name: "Die Rollenbeschreibung ist veraltet",
    description: "Die benannte Rolle ist besetzt; ihre Beschreibung verweist noch auf die vorige Fassung des Regelwerks.",
  },
  "verbesserung/Log review into the operating manual, with a named reviewer": {
    name: "Protokollauswertung ins Betriebshandbuch, mit benannter auswertender Person",
    description: "Die Wartungsaufzeichnungen an die zentrale Protokollauswertung anschließen, im Betriebshandbuch eine auswertende Person benennen und einen wöchentlichen Abstand festlegen.",
    vorteile_nachteile: "Kostet etwa zwei Stunden je Woche aus der Rufbereitschaft; macht eine Sitzung, die niemand beobachtet hat, binnen sieben Tagen sichtbar statt nie.",
    verantwortlich: "M. Adler",
    faellig: "2026-10-31",
    wirksamkeit_ergebnis: "Geprüft durch eine absichtliche Sitzung außerhalb der Dienstzeit am 2026-11-04: sie tauchte in der Wochenauswertung auf, aber drei Tage später statt binnen eines Tages. Die Grenze ist der Abstand, nicht der Anschluss.",
  },
  "verbesserung/Second factor for the manufacturer's remote maintenance": {
    name: "Zweiter Faktor für die Fernwartung des Herstellers",
    description: "Der Zugang besteht und wird überwacht; ein zweiter Faktor nähme das stehende Zugangsmittel als einzelne Schwachstelle heraus.",
    vorteile_nachteile: "Beseitigt das stehende Zugangsmittel; der Hersteller muss einen Token führen, und eine Notfallsitzung braucht länger, bis sie offen ist.",
    verantwortlich: "S. Brandt",
    faellig: "2027-03-31",
  },

  "paket_review/Annual reading of the requirement package 2026": {
    name: "Jährliche Auswertung des Anforderungspakets 2026",
    durchgefuehrt_am: "2026-03-31",
    faellig: "2026-03-31",
    betrachtet: "Die Verlagerung der Zählerablesung auf den neuen Messstellenbetrieb, zwei fernbediente Umspannwerke, die Zusammenlegung von IT und Netzbetrieb zu einer Einheit und das NIS2-Umsetzungsgesetz.",
    ergebnis: "Das Paket passt weiterhin zum Leitsystem und zum Abrechnungslauf. Zum Messstellenbetrieb passt es nicht: dieser Prozess erreicht Zielobjekte, denen keine Kategorie des Katalogs zugeordnet war, die Ableitung erreichte sie also mit nichts.",
    anpassungen: "Der Messstellenbetrieb wurde klassifiziert, seine zwei Zielobjekte zugeordnet und das Paket erneut abgeleitet. 41 Anforderungen kamen herein, 3 wurden mit festgehaltener Begründung als nicht einschlägig gestrichen.",
    abgestimmt_mit: "Netzbetrieb, Kundenservice, Datenschutzbeauftragter",
    verantwortlich: "M. Adler",
  },
  "paket_review/Annual reading of the requirement package 2027": {
    name: "Jährliche Auswertung des Anforderungspakets 2027",
    faellig: "2027-03-31",
    verantwortlich: "M. Adler",
  },
  "nachverfolgung/Q3/2026 status round": {
    name: "Statusrunde Q3/2026",
    durchgefuehrt_am: "2026-09-30",
    ursache: "Beide offenen Maßnahmen warten auf den Hersteller: der zweite Faktor braucht einen Token, den der Wartungsvertrag noch nicht abdeckt, und die Protokollauswertung ein Exportformat, das der Hersteller nicht geliefert hat. Keines von beiden ist ein Ressourcenmangel auf unserer Seite, weshalb eine höhere Priorität allein sie nicht bewegt hätte.",
    planaenderung: "Der zweite Faktor rückte von 2026-12-31 auf 2027-03-31, und die Vertragsergänzung wurde ihm als Vorgänger vorangestellt. Die Protokollauswertung bleibt, wo sie steht; ihr Termin lag ohnehin hinter den Vertragsgesprächen.",
    kommuniziert_an: "Geschäftsleitung, IT-Betrieb, Netzbetrieb",
    verantwortlich: "M. Adler",
  },
  "nachverfolgung/Q4/2026 status round": {
    name: "Statusrunde Q4/2026",
    verantwortlich: "M. Adler",
  },
};

/** The study's own free text. `sector` is deliberately absent - it is matched literally
 *  against the sectors in calibration.ts, and a translated one silently loses the rate
 *  exception. `organization` is an invented name and is given its German form. */
export const STUDY_DE: { name: string; organization: string; scope: string } = {
  name: "Stadtwerke Riverbend - Netzsteuerung (Beispiel)",
  organization: "Stadtwerke Riverbend",
  scope: "Die Leitstelle, die Fernwirktechnik und die Verwaltungs-IT, die ihnen dient, am Hauptstandort.",
};

/** The edits the log carries, keyed by the English comment. `from`/`to` are given only
 *  where the changed field holds text: an enum value ("normal" → "hoch") is data. */
export const LOG_DE: Record<string, { comment: string; from?: string; to?: string }> = {
  "Raised to hoch after the site visit: a mis-operation reaches supply directly. This is what opened the risk consideration.": {
    comment: "Nach der Begehung auf hoch angehoben: eine Fehlschaltung erreicht die Versorgung unmittelbar. Das hat die Risikobetrachtung eröffnet.",
    // protection_need normal → hoch is an enum value and stays as it is.
  },
  "Found during the asset survey - six stations still answer on the old dial-up line.": {
    comment: "Bei der Zielobjektaufnahme gefunden - sechs Stationen antworten noch auf der alten Wählverbindung.",
    from: "Mit der Einführung des Fernwirknetzes stillgelegt.",
    // ...and the `to` is the description the record ends up with, word for word.
    to: "Eine Wählverbindung aus der Zeit vor dem Fernwirknetz, an sechs Stationen noch angeschlossen.",
  },
  "Verified during the maintenance window: the second factor is enforced for every session of the provider.": {
    comment: "Im Wartungsfenster nachgewiesen: der zweite Faktor wird für jede Sitzung des Dienstleisters erzwungen.",
  },
  "The access is disabled by default and opened per assignment; the release log was sampled for the last quarter.": {
    comment: "Der Zugang ist standardmäßig gesperrt und wird je Auftrag geöffnet; das Freigabeprotokoll wurde für das letzte Quartal stichprobenartig geprüft.",
  },
  "After taking over the district-heating network the process covers both.": {
    comment: "Nach der Übernahme des Fernwärmenetzes deckt der Prozess beide ab.",
    from: "Rund um die Uhr Überwachung und Steuerung des Stromnetzes.",
    to: "Rund um die Uhr Überwachung und Steuerung der Strom- und Fernwärmenetze. Ein Ausfall ist in jedem angeschlossenen Haushalt sofort zu spüren.",
  },
};

const textFields = (() => {
  const m = new Map<string, Set<string>>();
  for (const t of DEFAULT_TAXONOMY.entityTypes) {
    m.set(t.key, new Set(t.fields.filter((f) => f.type === "text" || f.type === "textarea").map((f) => f.key)));
  }
  return m;
})();

/** True for a record this file may rewrite: invented, and not the publisher's.
 *
 *  A requirement is the publisher's - EXCEPT the one the method asks the institution to
 *  write itself (STM.2.1.6/.7), which is this file's own sentence. `herkunft` is what tells
 *  the two apart, and the delivery to the BSI already selects on it. */
export const isOurs = (e: EntityRecord): boolean =>
  !e.values.framework
  && (e.type !== "requirement" || String(e.values.herkunft ?? "").startsWith("Own"));

/** Rewrite the invented records in place. Anything the table names that is not a text
 *  field of that type is skipped rather than written: the promise that only text moves is
 *  kept here, not only in the check. */
export function germanizeEntities(entities: EntityRecord[]): void {
  for (const e of entities) {
    if (!isOurs(e)) continue;
    const words = SAMPLE_DE[`${e.type}/${String(e.values.name ?? "")}`];
    if (!words) continue;
    const allowed = textFields.get(e.type);
    for (const [k, v] of Object.entries(words)) {
      if (allowed?.has(k) && typeof e.values[k] === "string") e.values[k] = v;
    }
  }
}

/** ...and the log's comments, with the before and after of a text change. Called before
 *  the log is sealed: the seal hashes the values, so a rewrite afterwards would break the
 *  chain rather than translate it. */
export function germanizeLog(pending: LogInput[]): void {
  for (const p of pending) {
    const de = p.comment ? LOG_DE[p.comment] : undefined;
    if (!de) continue;
    p.comment = de.comment;
    for (const c of p.changes ?? []) {
      if (de.from !== undefined && typeof c.from === "string") c.from = de.from;
      if (de.to !== undefined && typeof c.to === "string") c.to = de.to;
    }
  }
}

/** The study's own fields. */
export function germanizeStudy(s: Study): void {
  if (STUDY_DE.name) s.name = STUDY_DE.name;
  if (STUDY_DE.organization) s.organization = STUDY_DE.organization;
  if (STUDY_DE.scope) s.scope = STUDY_DE.scope;
}
