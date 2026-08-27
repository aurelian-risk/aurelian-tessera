// SPDX-License-Identifier: MPL-2.0 · Copyright (c) Aurelian-Risk
import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import type { EntityRecord, EntityTypeDef, FieldDef, FieldType, FieldValue, Study, Taxonomy } from "../domain/types";
import { columnFields, getType, optionLabel, recordTitle, refFields, scaleLabel, scaleMax, setBackBlocked, titleField } from "../domain/taxonomy";
import { foldScope, getFolds, setFolds } from "../domain/viewstate";
import { TOOLBAR_MIN_ROWS } from "../domain/tablefilter";
import { TableTools, refTypeLabel, useNameOf, useTableFilter } from "./TableTools";
import { useStore } from "../domain/store";
import { ChangeHistoryModal, IntegrityBadge } from "./ChangeHistoryModal";
import { entryOf } from "../domain/audit";
import { EntityModal } from "./EntityModal";
import { Icon, ScaleBadge, ScaleBars } from "./ui";

const clip = (s: string, n = 90) => (s.length > n ? s.slice(0, n) + "…" : s);

/** Records shown per incoming relation before the rest fold behind a "+n more". */
const BACKREF_PREVIEW = 12;

// ── How wide a table gets ────────────────────────────────────────────────────
//
// The name column takes whatever is left over, so it grows with the window; every other
// column is sized by WHAT IT HOLDS. One flat width for all of them fails in both directions
// at once: a badge column pays rent on 150px it does not use while a column of chips wraps
// its rows. Measured at 1280px before these numbers: 13 of 28 tables scrolled sideways and
// 38 columns were more than 60px wider than their content.
//
// The numbers are Aurelian Lite's measurement (harness/table-width.mjs, docs/table-width.md)
// rather than a second guess at the same question - what each field type wants to show one
// value on one line, chips truncated. Taking their figures is the point: two answers to one
// question is how a shared engine drifts apart while it still looks merged.
const COL_WIDTH: Record<FieldType, number> = {
  number: 80,
  boolean: 96,
  enum: 124,
  scale: 148,      // bars plus the longest scale label
  text: 156,
  textarea: 156,   // never a column today (columnFields drops it), sized for completeness
  ref: 156,        // one chip
  multiref: 164,   // two chips and a "+n", each chip clipped to a readable stub
};
/** Floor for the name column, and the only thing the table's min-width adds to the sum of
 *  its value columns. Nothing is reserved for a trailing spacer: there is none any more. */
const NAME_MIN = 320;
const tableMinWidth = (cols: FieldDef[]) =>
  NAME_MIN + cols.reduce((w, c) => w + COL_WIDTH[c.type], 0);
/** A column's width as its share of the table it sits in. */
const pct = (w: number, cols: FieldDef[]) => `${((w / tableMinWidth(cols)) * 100).toFixed(3)}%`;

function FieldValueView({ field, value, tax, study, onOpen, onToggle, toggleBlocked }:
  { field: FieldDef; value: FieldValue; tax: Taxonomy; study: Study; onOpen?: (id: string) => void;
    onToggle?: (field: FieldDef, next: string) => void;
    /** Why the switch may not be flipped right now, if it may not - see setBackBlocked. */
    toggleBlocked?: string | null }) {
  const nameOf = (id: string) => {
    const r = study.entities.find((e) => e.id === id);
    const t = r && getType(tax, r.type);
    return r && t ? recordTitle(t, r) : " - ";
  };
  const chip = (id: string) => onOpen
    ? <button className="chip link" key={id} title="Open" onClick={(e) => { e.stopPropagation(); onOpen(id); }}>{nameOf(id)}</button>
    : <span className="chip" key={id}>{nameOf(id)}</span>;
  switch (field.type) {
    case "enum": {
      // A two-state field that is flipped often is a switch, not a label to open a form for.
      if (field.toggle && field.options?.length === 2 && onToggle) {
        const on = String(value ?? "") === field.options[1];
        // Blocked only in the direction that would take the record out of play: putting
        // one IN is never in conflict with anything.
        return (
          <button className={"cell-toggle" + (on ? " on" : "") + (on && toggleBlocked ? " locked" : "")}
            disabled={!!(on && toggleBlocked)}
            title={(on && toggleBlocked) || `${optionLabel(field, field.options[on ? 0 : 1])} instead`}
            onClick={(e) => { e.stopPropagation(); if (!(on && toggleBlocked)) onToggle(field, field.options![on ? 0 : 1]); }}>
            {optionLabel(field, field.options[on ? 1 : 0])}
          </button>
        );
      }
      return value ? <span className="badge" title={String(value)}>{optionLabel(field, String(value))}</span> : <span className="hint"> - </span>;
    }
    case "scale": {
      const v = typeof value === "number" ? value : 1;
      return <ScaleBadge value={v} max={scaleMax(field)} label={scaleLabel(field, v)} positive={field.polarity === "positive"} />;
    }
    case "boolean":
      return <span className="badge">{value ? "yes" : "no"}</span>;
    case "ref":
      return typeof value === "string" && value ? chip(value) : <span className="hint"> - </span>;
    case "multiref": {
      const ids = Array.isArray(value) ? (value as string[]) : [];
      if (!ids.length) return <span className="hint"> - </span>;
      // Compact in the table: first two, then a count - the full list is in the row detail.
      return (
        <div className="multi">
          {ids.slice(0, 2).map(chip)}
          {ids.length > 2 && <span className="chip more" title={ids.map(nameOf).join(", ")}>+{ids.length - 2}</span>}
        </div>
      );
    }
    default:
      return <span>{clip(String(value ?? ""), 60) || <span className="hint"> - </span>}</span>;
  }
}

/** A record present but not in play: shown, and visibly set back. Declared in the taxonomy
 *  (dimWhen) rather than decided here - which states are dormant is a property of the
 *  method, not of the table.
 *
 *  This product records the WHOLE published ruleset and sets back what no rule reached, so
 *  a register of a thousand rows is only readable if the difference shows at a glance.
 *  Without it a table says "in scope" and "out of scope" in the same tone. */
function dimPredicate(tax: Taxonomy, typeKey: string): (r: EntityRecord) => boolean {
  const rules = (tax.dimWhen ?? []).filter((d) => d.type === typeKey);
  if (!rules.length) return () => false;
  return (r) => rules.some((d) => d.values.includes(String(r.values[d.field] ?? "")));
}

/** Which registers are folded away, by study and type. Kept out of the study on purpose:
 *  it is how someone is reading right now, not something about the analysis, so it must not
 *  land in an export or in the change record. Module-level, so switching workshop and coming
 *  back does not silently lay every thousand-row register out again. */
const folded = new Set<string>();

export function EntitySection({ type, study, tax, color, draggableRows, renderDetailExtra, headerExtra, hideAdd }:
  { type: EntityTypeDef; study: Study; tax: Taxonomy; color: string;
    draggableRows?: boolean; renderDetailExtra?: (r: EntityRecord) => ReactNode; headerExtra?: ReactNode; hideAdd?: boolean }) {
  const deleteEntity = useStore((s) => s.deleteEntity);
  const updateEntity = useStore((s) => s.updateEntity);
  const dimmed = useMemo(() => dimPredicate(tax, type.key), [tax, type.key]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [modal, setModal] = useState<{ typeKey: string; record: EntityRecord | null } | null>(null);
  const foldKey = `${study.id}:${type.key}`;
  const [open, setOpen] = useState(() => !folded.has(foldKey));
  const fold = () => setOpen((o) => { o ? folded.add(foldKey) : folded.delete(foldKey); return !o; });

  const items = study.entities.filter((e) => e.type === type.key);
  const cols = columnFields(type);
  const title = titleField(type);

  // One filter, shared with every other long table - see TableTools.
  // The table's own name, so its arrangement is remembered per study and per type.
  const tableScope = foldScope(study.id, type.key);
  const nameOf = useNameOf(tax, study);
  const f = useTableFilter(type, items,
    { onGroupChange: () => setCollapsed(new Set()), nameOf, scope: tableScope });
  const { shown, groups, groupField, filtered } = f;
  // What this reader folded away here last time. Kept out of the study on purpose: a fold
  // belongs to whoever is reading, not to the analysis - see viewstate.ts. Grouping by a
  // different field is a different layout, so the axis is part of the name.
  const scope = foldScope(study.id, type.key, groupField?.key ?? "");
  const [collapsed, setCollapsed] = useState<Set<string>>(() => getFolds(scope));
  useEffect(() => { setCollapsed(getFolds(scope)); }, [scope]);
  // Only worth showing once a table is long enough to be hard to read.
  const showTools = items.length >= TOOLBAR_MIN_ROWS;
  const clearAll = f.clearAll;
  const toggleGroup = (k: string) => setCollapsed((c) => {
    const n = new Set(c); n.has(k) ? n.delete(k) : n.add(k);
    setFolds(scope, n);        // coalesced; a burst of clicks writes once
    return n;
  });

  const refTargets = (typeKey: string) => study.entities.filter((e) => e.type === typeKey);
  const missingReq = type.fields.find((f) => f.type === "ref" && f.required && refTargets(f.refType ?? "").length === 0);
  const targetLabel = missingReq ? getType(tax, missingReq.refType ?? "")?.label ?? "entity" : "";
  const addBlocked = missingReq ? `Create a ${targetLabel} first - required by "${missingReq.label}".` : null;

  // Open a linked entity from ANOTHER workshop (or type) in the modal popup.
  const openEntity = (id: string) => { const r = study.entities.find((e) => e.id === id); if (r) setModal({ typeKey: r.type, record: r }); };

  return (
    <div className={"panel ws-accent" + (open ? "" : " folded")} style={{ ["--ws-color" as string]: color, marginBottom: 20 }}>
      <div className="panel-head">
        {/* The heading is the switch: a workshop holding several registers of a thousand
            rows is unreadable if every one of them is always laid out in full. */}
        <button className="panel-fold" aria-expanded={open} onClick={fold}
          title={open ? `Fold ${type.labelPlural.toLowerCase()} away` : `Show ${type.labelPlural.toLowerCase()}`}>
          <Icon.chevron />
        </button>
        <h3 onClick={fold} style={{ cursor: "pointer" }}>{type.labelPlural}</h3>
        <span className="badge" title={filtered ? `${shown.length} shown of ${items.length}` : undefined}>{filtered ? `${shown.length} / ${items.length}` : items.length}</span>
        <span className="spacer" />
        {open && headerExtra}
        {open && !hideAdd && (
          <button className="btn sm primary" disabled={!!addBlocked} title={addBlocked ?? undefined}
            onClick={() => setModal({ typeKey: type.key, record: null })}>
            <Icon.plus /> {type.label}
          </button>
        )}
      </div>

      {open && addBlocked && <div style={{ padding: "12px 16px 0" }}><div className="guide warn">{addBlocked}</div></div>}

      {open && showTools && <TableTools type={type} f={f} tax={tax} />}

      {open && <div className="panel-body">
        {items.length === 0 ? (
          <div className="empty" style={{ padding: "28px 16px" }}>No {type.labelPlural.toLowerCase()} yet.</div>
        ) : shown.length === 0 ? (
          <div className="empty" style={{ padding: "28px 16px" }}>
            Nothing matches. <button className="btn ghost sm" onClick={clearAll}>Clear filters</button>
          </div>
        ) : (
          <table className="tbl tbl-share" style={{ minWidth: tableMinWidth(cols) }}>
            {/* The name column takes what the value columns leave. It used to be a percentage
                with an empty column absorbing the remainder, which left a headerless gap -
                103px on a register with five value columns, 403px on one with three - so
                every table ended somewhere else. Under a FIXED layout neither an auto column
                nor `calc(100% - …)` absorbs it: the percentage does not resolve against the
                table's width and the leftover simply stays unallocated. The table is laid out
                automatically instead, where the widths below are hints and the name column
                takes the rest. */}
            {/* Shares, not pixels. A pixel width is a floor as well as a preference: the
                value columns held their exact width at every window size and the name column
                gave up the whole reduction alone - 983px to 319px on the first tab, while
                nothing beside it moved. Below the table's minimum every column now gives up
                the same fraction, because a share of the table is what each one is. The
                minWidth above is still the floor; past it the panel scrolls. */}
            <colgroup>
              <col style={{ width: pct(NAME_MIN, cols) }} />
              {cols.map((c) => <col key={c.key} style={{ width: pct(COL_WIDTH[c.type], cols) }} />)}
            </colgroup>
            <thead>
              <tr>
                <th>{type.fields.find((f) => f.key === title)?.label ?? "Name"}</th>
                {cols.map((c) => <th key={c.key}>{c.label}</th>)}
              </tr>
            </thead>
            {groups.map((g) => (
            <tbody key={g.key || "_"} className={groupField ? "grouped" : undefined}>
              {groupField && (
                <tr className="group-row" onClick={() => toggleGroup(g.key)}>
                  <th colSpan={cols.length + 1}>
                    <span className={"caret" + (collapsed.has(g.key) ? "" : " open")}><Icon.chevron /></span>
                    {g.key || <span className="hint">
                      {groupField.refType ? `no ${refTypeLabel(tax, groupField)} named` : `no ${groupField.label.toLowerCase()}`}
                    </span>}
                    <span className="badge">{g.items.length}</span>
                  </th>
                </tr>
              )}
              {(groupField && collapsed.has(g.key) ? [] : g.items).map((r) => {
                const isOpen = expanded === r.id;
                return (
                  <Fragment key={r.id}>
                    <tr className={"row-clickable" + (isOpen ? " expanded" : "") + (draggableRows ? " row-drag" : "") + (dimmed(r) ? " row-dim" : "")}
                      draggable={draggableRows || undefined}
                      onDragStart={draggableRows ? (e) => { e.dataTransfer.setData("text/plain", r.id); e.dataTransfer.effectAllowed = "move"; } : undefined}
                      onClick={() => setExpanded(isOpen ? null : r.id)}>
                      <td>
                        <div className="name">
                          <span className={"caret" + (isOpen ? " open" : "")}><Icon.chevron /></span>
                          {recordTitle(type, r)}
                        </div>
                        {typeof r.values.description === "string" && r.values.description && (
                          <div className="desc">{clip(r.values.description)}</div>
                        )}
                      </td>
                      {cols.map((c) => <td key={c.key}><FieldValueView field={c} value={r.values[c.key] ?? null} tax={tax} study={study}
                        onOpen={openEntity} toggleBlocked={setBackBlocked(tax, study, r)}
                        onToggle={(f, next) => updateEntity(r.id, { ...r.values, [f.key]: next },
                          `${f.label}: ${optionLabel(f, next)}`)} /></td>)}
                    </tr>
                    {isOpen && (
                      <tr className="detail-row">
                        <td colSpan={cols.length + 1}>
                          <EntityDetail type={type} record={r} tax={tax} study={study} color={color}
                            onEdit={() => setModal({ typeKey: type.key, record: r })}
                            onDelete={() => deleteEntity(r.id)} onOpenEntity={openEntity}
                            extra={renderDetailExtra ? renderDetailExtra(r) : null} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
            ))}
          </table>
        )}
      </div>}

      {modal && <EntityModal type={getType(tax, modal.typeKey)!} tax={tax} study={study} record={modal.record} onClose={() => setModal(null)} />}
    </div>
  );
}

// Inline expandable detail. Linked entities (refs + referenced-by) are
// clickable → open in the popup (used to reach items from other workshops).
function EntityDetail({ type, record, tax, study, color, onEdit, onDelete, onOpenEntity, extra }: {
  type: EntityTypeDef; record: EntityRecord; tax: Taxonomy; study: Study; color: string;
  onEdit: () => void; onDelete: () => void; onOpenEntity: (id: string) => void; extra?: ReactNode;
}) {
  const [histOpen, setHistOpen] = useState(false);
  const [openRels, setOpenRels] = useState<Set<string>>(new Set());
  const title = titleField(type);
  const scalarFields = type.fields.filter((f) => f.key !== title && f.type !== "textarea" && f.type !== "ref" && f.type !== "multiref");
  const scaleFields = scalarFields.filter((f) => f.type === "scale");
  const otherScalars = scalarFields.filter((f) => f.type !== "scale");
  const relFields = refFields(type);
  const descFields = type.fields.filter((f) => f.type === "textarea");

  const linkChip = (id: string) => {
    const r = study.entities.find((e) => e.id === id);
    const t = r && getType(tax, r.type);
    return (
      <button className="chip link" key={id} onClick={() => onOpenEntity(id)} title="Open">
        {r && t ? recordTitle(t, r) : " - "}
      </button>
    );
  };

  // What points at this record, grouped by WHO points and THROUGH WHICH relation. An
  // asset a hundred requirements name is a wall of chips as one flat list; as "Requirements
  // - applies to (93)" it is a sentence, and the hundred are one press away.
  const backGroups = new Map<string, { type: EntityTypeDef; rel: string; ids: string[] }>();
  for (const e of study.entities) {
    const et = getType(tax, e.type);
    if (!et || e.id === record.id) continue;
    for (const f of refFields(et)) {
      const v = e.values[f.key];
      const ids = f.type === "multiref" ? (Array.isArray(v) ? (v as string[]) : []) : v ? [v as string] : [];
      if (!ids.includes(record.id)) continue;
      const rel = f.relation ?? f.label;
      const key = `${et.key}::${rel}`;
      const g = backGroups.get(key);
      if (g) g.ids.push(e.id);
      else backGroups.set(key, { type: et, rel, ids: [e.id] });
    }
  }
  const incoming = [...backGroups.values()].sort((a, b) => b.ids.length - a.ids.length);

  return (
    <div className="detail">
      <div className="detail-actions">
        <span className="d-sub" style={{ margin: 0, flex: 1 }}>Details</span>
        <button className="btn sm" style={{ background: `color-mix(in oklch, ${color} 20%, transparent)`, borderColor: `color-mix(in oklch, ${color} 45%, transparent)`, color: "var(--fg)" }} onClick={onEdit}><Icon.edit /> Edit</button>
        <button className="btn sm danger" onClick={onDelete}><Icon.trash /> Delete</button>
      </div>
      {record.source && <div className="ent-source" style={{ marginBottom: 8 }} title="Extracted from this source"><Icon.doc /> {record.source}</div>}
      {descFields.map((f) => {
        const v = record.values[f.key];
        return typeof v === "string" && v.trim() ? <p className="d-desc" key={f.key}>{v}</p> : null;
      })}
      {extra && <div className="detail-extra">{extra}</div>}
      {scaleFields.length > 0 && (
        <div className="d-scales">
          {scaleFields.map((f) => {
            const v = typeof record.values[f.key] === "number" ? (record.values[f.key] as number) : 1;
            return (
              <div className="d-scale-row" key={f.key}>
                <span className="d-k">{f.label}</span>
                <ScaleBars value={v} max={scaleMax(f)} label={scaleLabel(f, v)} positive={f.polarity === "positive"} />
              </div>
            );
          })}
        </div>
      )}
      <div className="detail-grid">
        {otherScalars.map((f) => (
          <div className="d-item" key={f.key}>
            <span className="d-k">{f.label}</span>
            <div className="d-v"><FieldValueView field={f} value={record.values[f.key] ?? null} tax={tax} study={study} /></div>
          </div>
        ))}
        {relFields.map((f) => {
          const v = record.values[f.key];
          const ids = f.type === "multiref" ? (Array.isArray(v) ? (v as string[]) : []) : v ? [v as string] : [];
          return (
            <div className="d-item" key={f.key}>
              <span className="d-k">{f.label}</span>
              <div className="d-v multi">{ids.length ? ids.map(linkChip) : <span className="hint"> - </span>}</div>
            </div>
          );
        })}
      </div>
      {incoming.length > 0 && (
        <div className="detail-rels">
          <span className="d-sub">Referenced by</span>
          {incoming.map((g) => {
            const key = `${g.type.key}::${g.rel}`;
            const all = openRels.has(key);
            const shown = all ? g.ids : g.ids.slice(0, BACKREF_PREVIEW);
            return (
              <div className="d-rel-group" key={key}>
                <div className="d-rel-head">
                  <span className="d-rel-what">{g.ids.length === 1 ? g.type.label : g.type.labelPlural}</span>
                  <span className="d-rel-how">{g.rel} &rarr;</span>
                  <span className="badge">{g.ids.length}</span>
                </div>
                <div className="multi">
                  {shown.map(linkChip)}
                  {g.ids.length > shown.length && (
                    <button type="button" className="chip more"
                      onClick={() => setOpenRels((o) => { const n = new Set(o); n.add(key); return n; })}>
                      +{g.ids.length - shown.length} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {(() => {
        const hist = entryOf(study.log, record.id);
        return hist.length > 0 && (
          <button className="hist-btn" onClick={() => setHistOpen(true)}>
            <span className="d-sub" style={{ margin: 0 }}>Change history</span>
            <span className="hist-count">{hist.length}</span>
            <IntegrityBadge study={study} entityId={record.id} />
            <span className="hist-view">View →</span>
          </button>
        );
      })()}
      {histOpen && <ChangeHistoryModal tax={tax} study={study} record={record} onClose={() => setHistOpen(false)} />}
      <div className="detail-meta mono">updated {new Date(record.updatedAt).toLocaleString()}</div>
    </div>
  );
}
