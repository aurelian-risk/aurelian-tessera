// SPDX-License-Identifier: MPL-2.0 · Copyright (c) Aurelian-Risk
import { useEffect, useState, useSyncExternalStore } from "react";
import { t as tr, chooseLanguage, getLanguage, languageChoice, offeredLanguages, onLanguageChange } from "./domain/i18n";
import { useStore } from "./domain/store";
import { PRODUCT, makeSampleStudy } from "./profile";
import { Dashboard } from "./components/Dashboard";
import { StudyView } from "./components/StudyView";
import { TaxonomyView } from "./components/TaxonomyView";
import { ExplorerView } from "./components/TaxonomyExplorer";
import { DocumentsView } from "./components/DocumentsView";
import { ModelView } from "./components/ModelView";
import { TimelineView } from "./components/TimelineView";
import { Icon } from "./components/ui";

type Route = "dashboard" | "study" | "explore" | "taxonomy" | "documents" | "model" | "timeline";

/** The language, as a choice beside the theme.
 *
 *  The browser stays the default and the first entry says so, rather than the list opening
 *  on whatever the browser happened to pick: a reader who has not chosen should be able to
 *  see that they have not chosen. A language names itself in its own words - "Deutsch", not
 *  "German" - because the reader who needs the list is the one who cannot read the current
 *  language. `Intl` knows the name; nothing is shipped for it.
 *
 *  It appears only where there is something to choose between. */
function LanguagePicker() {
  const langs = offeredLanguages();
  if (langs.length < 2) return null;
  const endonym = (l: string): string => {
    try { return new Intl.DisplayNames([l], { type: "language" }).of(l) ?? l.toUpperCase(); }
    catch { return l.toUpperCase(); }
  };
  return (
    <label className="nav-item nav-lang" title={tr("ui.nav.the-language-this-interface", "The language this interface is shown in. Unset, it follows the browser.")}>
      <span className="dot" style={{ background: "var(--fg-muted)" }} />
      <select value={languageChoice()} onChange={(e) => chooseLanguage(e.target.value, PRODUCT.language ?? "en")}>
        <option value="">{tr("ui.nav.browser-language", "Browser language")}</option>
        {langs.map((l) => <option key={l} value={l}>{endonym(l)}</option>)}
      </select>
    </label>
  );
}

function Sidebar({ route, go, hasStudy }: { route: Route; go: (r: Route) => void; hasStudy: boolean }) {
  const [light, setLight] = useState(() => document.documentElement.classList.contains("light"));
  const toggleTheme = () => {
    const el = document.documentElement;
    const next = !light;
    el.classList.toggle("light", next);
    el.classList.toggle("dark", !next);
    setLight(next);
  };
  return (
    <div className="sidebar">
      <div className="brand">
        <svg className="logo-mark" width="42" height="42" viewBox="0 0 32 32" fill="none" aria-label={PRODUCT.mark}>
          <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--fg-muted)" }}>
            <path d="M8.5 24.8 L16 19.8 L23.5 24.8" opacity="0.55" />
            <path d="M8.5 17.5 L16 12.5 L23.5 17.5" />
          </g>
          <path d="M8.5 12.0 L16 7.0 L23.5 12.0" fill="none" stroke="var(--color-workshop-2)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div>
          <div className="name">{PRODUCT.name}</div>
          <div className="tag">{PRODUCT.tagline}</div>
        </div>
      </div>
      <div className="nav-section">{tr('ui.nav.navigation', 'Navigation')}</div>
      <button className={"nav-item" + (route === "dashboard" || route === "study" ? " active" : "")} onClick={() => go("dashboard")}>
        <span className="num">S</span> {tr('ui.nav.studies', 'Studies')}
      </button>
      <button className={"nav-item" + (route === "documents" ? " active" : "")} onClick={() => go("documents")}
        title={hasStudy ? tr("ui.nav.documents-for-the-active", "Documents for the active study")
          : tr("ui.nav.import-a-document-corpus", "Import a document corpus (creates a study)")}>
        <span className="num"><Icon.doc /></span> {tr('ui.nav.documents', 'Documents')}
      </button>
      <button className={"nav-item" + (route === "model" ? " active" : "")} onClick={() => go("model")}>
        <span className="num"><Icon.spark /></span> {tr('ui.nav.model', 'Model')}
      </button>
      <button className={"nav-item" + (route === "explore" ? " active" : "")} onClick={() => go("explore")}
        title={tr('ui.nav.read-the-model-what', 'Read the model: what it is made of, which fields the publication fills, what the classes carry, what points at what')}>
        <span className="num"><Icon.graph /></span> {PRODUCT.exploreLabel ?? "Explore"}
      </button>
      {/* "Schema", not "Taxonomy": the thing above is where a reader goes to READ the
          method's structure, and this is where they go to CHANGE the shape the application
          keeps it in. Both called some variant of "the model" is how they end up in the
          wrong one - and a publisher does not call its own structure a taxonomy either. */}
      <button className={"nav-item" + (route === "taxonomy" ? " active" : "")} onClick={() => go("taxonomy")}
        title={tr('ui.nav.the-shape-this-application', 'The shape this application keeps the model in: entity types, their fields, and the vocabularies behind them')}>
        <span className="num"><Icon.schema /></span> {tr('ui.nav.schema', 'Schema')}
      </button>
      <button className={"nav-item" + (route === "timeline" ? " active" : "")} onClick={() => go("timeline")}
        title={tr('ui.nav.change-timeline-of-the', 'Change timeline of the active study')}>
        <span className="num"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg></span> {tr('ui.nav.timeline', 'Timeline')}
      </button>

      <div style={{ flex: 1 }} />
      <LanguagePicker />
      <button className="nav-item" onClick={toggleTheme}>
        <span className="dot" style={{ background: "var(--primary)" }} />
        {light ? tr("ui.nav.theme.dark", "Dark theme") : tr("ui.nav.theme.light", "Light theme")}
      </button>
      {/* Under a file-level copyleft the built file has to tell its recipient where the
          source is - this build may well be the only copy someone ever receives. */}
      <div className="colophon">
        {PRODUCT.name} {__APP_VERSION__} · {__APP_LICENSE__}
        {PRODUCT.credit && (
          <span className="credit">
            {PRODUCT.credit.url
              ? <a href={PRODUCT.credit.url} target="_blank" rel="noreferrer">{PRODUCT.credit.text}</a>
              : PRODUCT.credit.text}
          </span>
        )}
        {PRODUCT.source && <><br /><a href={`https://${PRODUCT.source}`} target="_blank" rel="noreferrer">{PRODUCT.source}</a></>}
      </div>
    </div>
  );
}

/** Build the example study again when the reader changes language.
 *
 *  A study is data and a language change does not rewrite it - the seal hashes the values.
 *  The example is the one study where that is the wrong answer: it exists to be read, and a
 *  reader who switches to German and finds the demonstration in English reads it as a
 *  translation that failed. Measured: switch first and it loads German; load first and it
 *  stayed English.
 *
 *  Only while UNTOUCHED. The comparison is the change log: the example arrives with a fixed
 *  number of entries, and one edit is one more. Someone who has worked in it keeps their
 *  work, in the language they wrote it in. */
function useSampleInReadersLanguage(lang: string) {
  const studies = useStore((s) => s.studies);
  const activeId = useStore((s) => s.activeStudyId);
  const mergeStudies = useStore((s) => s.mergeStudies);
  const setActiveStudy = useStore((s) => s.setActiveStudy);
  useEffect(() => {
    const study = studies.find((s) => s.id === activeId);
    if (!study?.example || study.language === lang) return;
    const fresh = makeSampleStudy();
    if ((fresh.log?.length ?? 0) !== (study.log?.length ?? 0)
        || fresh.entities.length !== study.entities.length) return;
    mergeStudies([fresh]);
    setActiveStudy(fresh.id);
  }, [lang, activeId, studies, mergeStudies, setActiveStudy]);
}

export default function App() {
  // The words are read at render, all over the tree, so the language has to be a value the
  // ROOT subscribes to. Subscribing where the choice is made repaints only the control: the
  // stored tag was right, the document language was right, and the sidebar beside it still
  // said "Studien" - measured, before this line existed.
  const lang = useSyncExternalStore(onLanguageChange, getLanguage);
  useSampleInReadersLanguage(lang);
  const hydrated = useStore((s) => s.hydrated);
  const hydrate = useStore((s) => s.hydrate);
  const activeStudyId = useStore((s) => s.activeStudyId);
  const [route, setRoute] = useState<Route>("dashboard");

  useEffect(() => { void hydrate(); }, [hydrate]);
  useEffect(() => { if (hydrated && activeStudyId) setRoute("study"); }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!hydrated) {
    return <div className="empty" style={{ height: "100%", display: "grid", placeItems: "center" }}>{tr('ui.app.loading', 'Loading …')}</div>;
  }

  return (
    <div className="app">
      <Sidebar route={route} go={setRoute} hasStudy={!!activeStudyId} />
      {route === "timeline" ? (
        <div className="main"><TimelineView /></div>
      ) : route === "documents" ? (
        <div className="main"><DocumentsView /></div>
      ) : route === "model" ? (
        <div className="main"><ModelView /></div>
      ) : route === "explore" ? (
        <div className="main"><ExplorerView /></div>
      ) : route === "taxonomy" ? (
        <div className="main"><TaxonomyView /></div>
      ) : route === "study" && activeStudyId ? (
        <StudyView onBack={() => setRoute("dashboard")} />
      ) : (
        <div className="main"><Dashboard onOpen={() => setRoute("study")} /></div>
      )}
    </div>
  );
}
