// SPDX-License-Identifier: MPL-2.0 · Copyright (c) Aurelian-Risk
// Bringing the taxonomy's vocabularies up to the publisher's current ones.
//
// A build carries the vocabulary of the day it was made. The publisher moves on, and a
// taxonomy that cannot follow becomes a copy that ages in silence: a category is added,
// nothing fails, and the value simply never appears in the picker.
//
// This is the same reading the catalogue import performs, put where the taxonomy is
// looked at rather than inside a dialogue about importing requirements - the two are
// different errands, and one of them is the reason someone opens this page.
import { useState } from "react";
import { t as tr } from "../domain/i18n";
import { Sentence } from "./Sentence";
import type { Taxonomy } from "../domain/types";
import { fetchPublishedCatalog, type PublishedCatalog } from "../domain/frameworks";
import { looksLikeOscal, parseOscalCatalog } from "../domain/oscal";
import { planVocabularyUpdate, applyVocabularyUpdate, catalogDefinesVocabulary, shortVersion, type VocabularyChange } from "../domain/vocabulary";
import { PUBLISHED_CATALOGS } from "../profile";
import { useStore } from "../domain/store";
import { Icon } from "./ui";

export function VocabularySync({ tax }: { tax: Taxonomy }) {
  const setTaxonomy = useStore((s) => s.setTaxonomy);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [plan, setPlan] = useState<{ changes: VocabularyChange[]; name: string; version?: string } | null>(null);

  if (!PUBLISHED_CATALOGS.length) return null;

  const check = async (pc: PublishedCatalog) => {
    setBusy(pc.key); setPlan(null);
    setMsg(`Reading ${pc.name} from ${new URL(pc.url).host}…`);
    try {
      const raw = await fetchPublishedCatalog(pc, (loaded, total) => setMsg(
        `Reading ${pc.name}… ${(loaded / 1e6).toFixed(1)} MB${total ? ` of ${(total / 1e6).toFixed(1)} MB` : ""}`));
      if (!looksLikeOscal(raw)) throw new Error("the file is not an OSCAL catalogue");
      const fw = parseOscalCatalog(raw, pc.name);
      const version = /version ([^\s·]+)/.exec(fw.source)?.[1];
      const changes = planVocabularyUpdate(tax, fw).filter((c) => c.added.length > 0);
      if (!changes.length) {
        setMsg(catalogDefinesVocabulary(tax, fw)
          ? `${fw.name}${version ? `, version ${version}` : ""}: the vocabularies this build offers are the ones it uses. Nothing to bring up to date.`
          : `${fw.name} defines none of the vocabularies this taxonomy draws on.`);
      } else {
        setPlan({ changes, name: fw.name, version });
        setMsg(null);
      }
    } catch (e) {
      setMsg(`${pc.name} could not be read: ${e instanceof Error ? e.message : String(e)}. The published file can be imported from disk in Documents instead.`);
    }
    setBusy(null);
  };

  const apply = () => {
    if (!plan) return;
    setTaxonomy(applyVocabularyUpdate(tax, plan.changes, plan.changes.map((c) => `${c.typeKey}.${c.fieldKey}`),
      { key: plan.name, name: plan.name, source: plan.version ? `version ${plan.version}` : "", items: [] }));
    setMsg(`${plan.changes.length} vocabular${plan.changes.length === 1 ? "y" : "ies"} extended from ${plan.name}. Values already recorded are untouched.`);
    setPlan(null);
  };

  const src = tax.vocabularySource;
  return (
    <div className="panel vocab-sync" style={{ marginBottom: 18 }}>
      <div className="panel-head">
        <h3>{tr('ui.vocabularysync.vocabularies', 'Vocabularies')}</h3>
        <span className="spacer" />
        {PUBLISHED_CATALOGS.map((pc) => (
          <button key={pc.key} className="btn sm vocab-check" disabled={!!busy} onClick={() => check(pc)}>
            <Icon.download /> {busy === pc.key ? "Reading…" : `Check ${pc.name}`}
          </button>
        ))}
      </div>
      <div className="panel-body" style={{ padding: "10px 0 4px" }}>
        {/* Four sentences here said three things the reader already knows and one they
            need: which publication these lists came from. The rest - that the terms are the
            publisher's, that nothing is fetched unpressed, that nothing is removed - is
            either visible from the button or a rule that belongs in the documentation. */}
        <div className="guide">
          {src
            ? <Sentence k="ui.vocabularysync.from-source-taken-on"
                en="From {0}{1}, taken {2}. Checking adds what the publisher has added since."
                parts={[<b>{src.name}</b>,
                        src.version ? tr("ui.vocabularysync.version", ", version ") + shortVersion(src.version) : "",
                        src.at.slice(0, 10)]} />
            : <>{tr('ui.vocabularysync.checking-asks-the-publisher', 'Checking asks the publisher for the current lists and adds what is new.')}</>}
        </div>

        {plan && (
          <div style={{ marginTop: 10 }}>
            {plan.changes.map((c) => (
              <label key={`${c.typeKey}.${c.fieldKey}`} className="ex-cand">
                <span style={{ flex: 1 }}>
                  <span className="ex-cand-name">{c.typeLabel} · {c.fieldLabel} <span className="hint">({c.current.length} → {c.merged.length})</span></span>
                  <span className="ex-cand-snip">{c.added.length} new: {c.added.slice(0, 10).join(", ")}{c.added.length > 10 ? " …" : ""}</span>
                </span>
              </label>
            ))}
            <button className="btn primary sm vocab-apply" style={{ marginTop: 8 }} onClick={apply}>
              <Icon.plus /> Bring {plan.changes.length} up to date
            </button>
          </div>
        )}

        {msg && <div className="guide warn" style={{ marginTop: 10 }}>{msg}</div>}
      </div>
    </div>
  );
}
