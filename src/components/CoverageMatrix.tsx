// SPDX-License-Identifier: MPL-2.0 · Copyright (c) Aurelian-Risk
// Coverage / traceability - maps EXISTING requirements to the security measures
// that fulfil them. A compact table of frameworks with a coverage status in the
// quick view; expand a framework to assign measures per requirement (writes their
// `fulfills`). Requirements themselves are added in the Requirements table above.
import { Fragment, useState } from "react";
import { t as tr } from "../domain/i18n";
import type { EntityRecord, EntityTypeDef, Study, Taxonomy } from "../domain/types";
import { getType, isSetBack, recordTitle } from "../domain/taxonomy";
import { useStore } from "../domain/store";
import { EntityModal } from "./EntityModal";
import { MultiSelect, Icon } from "./ui";
import { TableTools, useNameOf, useTableFilter } from "./TableTools";

export function CoverageMatrix({ tax, study, reqType, color }: { tax: Taxonomy; study: Study; reqType: EntityTypeDef; color: string }) {
  const updateEntity = useStore((s) => s.updateEntity);
  const [rec, setRec] = useState<EntityRecord | null>(null);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (k: string) => setOpen((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });

  const measureType = tax.entityTypes.find((t) => t.fields.some((f) => f.type === "multiref" && f.refType === reqType.key));
  const fulfillsF = measureType?.fields.find((f) => f.type === "multiref" && f.refType === reqType.key);

  // EVERY hook runs before the guard below, and that ordering is the whole point of the
  // next three lines being here rather than after it.
  //
  // The guard used to sit above them, so a render that took it counted three hooks and the
  // next one counted six. React counts hooks per render and throws when the number changes,
  // and the page goes WHITE: no message, no view, nothing to go back to. It was reported as
  // "switching tabs sometimes blanks the page, especially on Implementation", which is
  // where this matrix lives.
  //
  // Measured against the artefact carrying the old order: it blanks after 7 steps with
  // React error #310. Navigation alone never does it - the table tools have to be used
  // first, which is why every check that visits a view once and in order missed it.
  //
  // What decides whether a taxonomy can reach it: StudyView mounts this matrix for the
  // first type in the ACTIVE group carrying a `framework` field. Where two groups each hold
  // one and only one of them has a type pointing back at it, the guard takes one workshop
  // and not the other, at the same position in the tree - and that is the render whose hook
  // count differs. A taxonomy with a single such type, in a single group, never gets there:
  // this one is that case, which is why it does not blank here.
  const reqs = study.entities.filter((e) => e.type === reqType.key);
  const nameOf = useNameOf(tax, study);
  const f = useTableFilter(reqType, reqs, { nameOf });
  const [gapsOnly, setGapsOnly] = useState(false);

  if (!measureType || !fulfillsF) return null;

  const measures = study.entities.filter((e) => e.type === measureType.key && !isSetBack(tax, e));
  const measureOpts = measures.map((m) => ({ id: m.id, label: recordTitle(measureType, m) }));

  const fulfils = (m: EntityRecord, rid: string) => Array.isArray(m.values[fulfillsF.key]) && (m.values[fulfillsF.key] as string[]).includes(rid);
  const fulfilling = (rid: string) => measures.filter((m) => fulfils(m, rid)).map((m) => m.id);
  const assign = (rid: string, ids: string[]) => {
    for (const m of measures) {
      const cur = Array.isArray(m.values[fulfillsF.key]) ? (m.values[fulfillsF.key] as string[]) : [];
      const has = cur.includes(rid), should = ids.includes(m.id);
      if (should && !has) updateEntity(m.id, { ...m.values, [fulfillsF.key]: [...cur, rid] });
      else if (!should && has) updateEntity(m.id, { ...m.values, [fulfillsF.key]: cur.filter((x) => x !== rid) });
    }
  };

  // The filter every long table has - declared above with the other hooks. A package of a
  // thousand requirements is not readable as a matrix without one, and "show me only what
  // nothing fulfils" is the question this view exists to answer.
  const visible = gapsOnly ? f.shown.filter((r) => !measures.some((m) => fulfils(m, r.id))) : f.shown;

  const byFw = new Map<string, EntityRecord[]>();
  for (const r of visible) { const k = String(r.values.framework || "Other"); const a = byFw.get(k) ?? []; a.push(r); byFw.set(k, a); }

  return (
    <div className="panel ws-accent" style={{ ["--ws-color" as string]: color, marginBottom: 20 }}>
      <div className="panel-head">
        <h3>{tr('ui.coveragematrix.coverage-traceability', 'Coverage & traceability')}</h3>
        <span className="badge">{visible.length === reqs.length ? reqs.length : `${visible.length} / ${reqs.length}`}</span>
        <span className="spacer" />
        <button className={"facet-btn" + (gapsOnly ? " on" : "")} onClick={() => setGapsOnly((g) => !g)}
          title={tr('ui.coveragematrix.only-the-requirements-no', 'Only the requirements no measure fulfils')}>{tr('ui.coveragematrix.gaps-only', 'Gaps only')}</button>
      </div>
      <TableTools type={reqType} f={f} groupable={false} />
      <div className="panel-body">
        {reqs.length === 0
          ? <div className="empty" style={{ padding: "24px 16px" }}>{tr('ui.coveragematrix.no-requirements-yet-add', 'No requirements yet - add them in the Requirements table above (e.g. “+ From framework…”).')}</div>
          : (
            <table className="tbl">
              <colgroup><col style={{ width: 260 }} /><col /></colgroup>
              <thead><tr><th>{tr('ui.coveragematrix.framework', 'Framework')}</th><th>{tr('ui.coveragematrix.coverage', 'Coverage')}</th></tr></thead>
              <tbody>
                {[...byFw.entries()].map(([fw, list]) => {
                  const covered = list.filter((r) => measures.some((m) => fulfils(m, r.id))).length;
                  const gaps = list.length - covered;
                  const isOpen = open.has(fw);
                  const sc = gaps === 0 ? "var(--color-state-success)" : "var(--color-state-warning)";
                  return (
                    <Fragment key={fw}>
                      <tr className={"row-clickable" + (isOpen ? " expanded" : "")} onClick={() => toggle(fw)}>
                        <td><div className="name"><span className={"caret" + (isOpen ? " open" : "")}><Icon.chevron /></span>{fw}</div></td>
                        <td>
                          <span className="badge" style={{ background: `color-mix(in oklch, ${sc} 20%, transparent)`, color: "var(--fg)" }}>{covered}/{list.length} covered</span>
                          {gaps > 0 && <span className="hint" style={{ marginLeft: 8 }}>{gaps} gap{gaps > 1 ? "s" : ""}</span>}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="detail-row">
                          <td colSpan={2}>
                            {list.slice(0, 400).map((r) => {
                              const gap = !measures.some((m) => fulfils(m, r.id));
                              return (
                                <div key={r.id} className={"kcm-step" + (gap ? " gap" : "")}>
                                  <span className="kcm-idx" style={{ width: "auto", padding: "0 6px" }}>{String(r.values.ref_id ?? "")}</span>
                                  <span className="kcm-main">
                                    <button className="chip link" onClick={() => setRec(r)}>{recordTitle(reqType, r)}</button>
                                    {r.values.category ? <span className="kcm-meta hint">{String(r.values.category)}</span> : null}
                                  </span>
                                  <span className="kcm-measures">
                                    {gap && <span className="badge" style={{ color: "var(--color-state-warning)", background: "color-mix(in oklch, var(--color-state-warning) 16%, transparent)" }}>gap</span>}
                                    <MultiSelect options={measureOpts} selected={fulfilling(r.id)} onChange={(ids) => assign(r.id, ids)} placeholder="+ measure" emptyHint="no security measures yet"
                                      onClickChip={(id) => { const m = measures.find((x) => x.id === id); if (m) setRec(m); }} />
                                  </span>
                                </div>
                              );
                            })}
                            {list.length > 400 && <div className="hint" style={{ padding: "6px 4px" }}>
                              +{list.length - 400} more - narrow the filter to see them.</div>}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
      </div>
      {rec && <EntityModal type={getType(tax, rec.type)!} tax={tax} study={study} record={rec} onClose={() => setRec(null)} />}
    </div>
  );
}
