// SPDX-License-Identifier: MPL-2.0 · Copyright (c) Aurelian-Risk
import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import type { EntityRecord, EntityTypeDef, FieldDef, FieldType, FieldValue, Study, Taxonomy } from "../domain/types";
import { columnFields, getType, isSetBack, optionLabel, recordTitle, refFields, scaleLabel, scaleMax, setBackBlocked, titleField } from "../domain/taxonomy";
import { foldScope, getFolds, setFolds } from "../domain/viewstate";
import { scopeChange, deleteChange } from "../domain/scope";
import { TOOLBAR_MIN_ROWS } from "../domain/tablefilter";
import { TableTools, refTypeLabel, useNameOf, useTableFilter } from "./TableTools";
import { useStore } from "../domain/store";
import { ChangeHistoryModal, IntegrityBadge } from "./ChangeHistoryModal";
import { deletedRefs, entryOf } from "../domain/audit";
import { EntityModal } from "./EntityModal";
import { Icon, Overlay, ScaleBadge, ScaleBars, useDismissOnEscape } from "./ui";

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
/* The pixel widths that used to sit here (number 80, enum 124, scale 148, text 156,
   multiref 164) are what the unit counts below are rounded from: they were right about the
   RATIOS and wrong to be pixels, which is what gave every table a grid of its own. */
/** Floor for the name column, and the only thing the table's min-width adds to the sum of
 *  its value columns. Nothing is reserved for a trailing spacer: there is none any more. */
const NAME_MIN = 320;

/** ONE GRID FOR EVERY REGISTER IN A WORKSHOP.
 *
 *  A width in pixels, or a share of the table's OWN preferred width, gives each table a
 *  grid of its own: on the first workshop the five registers put their column edges at
 *  461/640/864, at 373/556/747 and at 678/942, and nothing lines up with anything. The
 *  tables are all the same width, so the fix is to measure the columns in the same unit for
 *  all of them - a percentage of the table rather than of what that table happens to hold.
 *
 *  Every value column is a whole number of units and is laid from the RIGHT, so every
 *  boundary in every register falls on the same ladder, and two registers ending in the
 *  same kind of column - the in-force and established switches, say - put those switches
 *  in the same place. The name column takes what is left, which is why it is the one that
 *  differs: it is the remainder, not a measurement.
 *
 *  The unit is set by the worst case rather than by taste. The widest register here carries
 *  five value columns worth 19 units; at 4% that leaves 24% of the table, 301px, for the
 *  name - about the floor at which a requirement title is still worth reading. */
const UNIT = 4;
const COL_UNITS: Record<FieldType, number> = {
  number: 2, boolean: 2,          // a figure or a tick
  enum: 3, scale: 3,              // a badge, or bars and their label
  text: 4, textarea: 4, ref: 4, multiref: 4,   // words, a chip, or chips and a "+n"
};
const gridUnits = (cols: FieldDef[]) => cols.reduce((u, c) => u + COL_UNITS[c.type], 0);
/** A value column: whole units of the table. */
const pctOf = (c: FieldDef) => `${(COL_UNITS[c.type] * UNIT).toFixed(3)}%`;
/** The name column: whatever the value columns leave, so their edges stay on the ladder.
 *  Where a register carries so many columns that nothing sensible is left, it keeps a floor
 *  and the table overflows its panel instead - the min-width above already says so. */
const pctName = (cols: FieldDef[]) => `${Math.max(18, 100 - gridUnits(cols) * UNIT).toFixed(3)}%`;
/** The floor, measured on the same ladder rather than as a second opinion in pixels.
 *
 *  A register that reaches ITS floor while the others still have room leaves the shared
 *  grid, and that is what breaks the alignment on a narrow window: measured across the five
 *  registers of the first workshop, they are identical at 1600 and 1440, one steps out at
 *  1280, and three different widths at 1150. Deriving the floor from the units keeps the
 *  order of that sensible - a register with more columns needs more room, and by how much
 *  is now the same arithmetic as the columns themselves. */
const UNIT_MIN = 40;
/** ...and it is the WORKSHOP's floor, not this register's.
 *
 *  A floor per register is why the alignment held at 1600 and 1440 and fell apart below:
 *  the widest register reached its own floor while the others still had room, stepped out
 *  of the shared width, and from there its columns were on a ladder of a different size.
 *  Measured at 1150: five registers at 820, 806, 1060, 860 and 860.
 *
 *  The floor is therefore the widest register of the same group - the same workshop the
 *  reader is looking at - so they all reach it together and none leaves the others behind.
 *  The cost is that a register of three columns keeps the width of one with six and scrolls
 *  where it would have fitted; that is the trade, and it is taken because the columns
 *  standing under each other is what the whole grid is for. */
const groupFloor = (tax: Taxonomy, group: string | undefined) => {
  const peers = tax.entityTypes.filter((t) => (t.group ?? "") === (group ?? ""));
  const units = peers.length ? Math.max(...peers.map((t) => gridUnits(columnFields(t)))) : 0;
  return NAME_MIN - 20 + units * UNIT_MIN;
};

function FieldValueView({ field, value, tax, study, recordId, onOpen, onToggle, toggleBlocked }:
  { field: FieldDef; value: FieldValue; tax: Taxonomy; study: Study; recordId?: string;
    onOpen?: (id: string) => void;
    onToggle?: (field: FieldDef, next: string) => void;
    /** Why the switch may not be flipped right now, if it may not - see setBackBlocked. */
    toggleBlocked?: string | null }) {
  // A reference whose target was deleted leaves a hole: the field is emptied and the record
  // reads as if it never pointed anywhere. The log still knows what stood there, so the gap
  // is shown rather than left silent - in the colour of something that is gone, not of
  // something merely quiet.
  const lost = recordId ? (deletedRefs(study.log, recordId).get(field.key) ?? []) : [];
  const gonePill = (x: { id: string; title: string }) => (
    <span className="chip gone" key={"gone-" + x.id} title={`${x.title} - deleted`}>{x.title}</span>
  );
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
      // A two-state field is never unset. Silence means the first state is NOT in force -
      // `isSetBack` reads it that way, every count reads it that way - so a read-only view
      // has to say so too. Rendered without a switch (the row detail passes no onToggle) an
      // untouched record showed a dash, which reads as "not decided" for something the study
      // has already decided.
      if (field.toggle && field.options?.length === 2)
        return <span className="badge">{optionLabel(field, field.options[String(value ?? "") !== field.options[0] ? 1 : 0])}</span>;
      return value ? <span className="badge" title={String(value)}>{optionLabel(field, String(value))}</span> : <span className="hint"> - </span>;
    }
    case "scale": {
      const v = typeof value === "number" ? value : 1;
      return <ScaleBadge value={v} max={scaleMax(field)} label={scaleLabel(field, v)} positive={field.polarity === "positive"} />;
    }
    case "boolean":
      return <span className="badge">{value ? "yes" : "no"}</span>;
    case "ref":
      if (typeof value === "string" && value) return chip(value);
      return lost.length ? <>{lost.map(gonePill)}</> : <span className="hint"> - </span>;
    case "multiref": {
      const ids = Array.isArray(value) ? (value as string[]) : [];
      if (!ids.length) return lost.length ? <div className="multi">{lost.map(gonePill)}</div> : <span className="hint"> - </span>;
      // Compact in the table: first two, then a count - the full list is in the row detail.
      return (
        <div className="multi">
          {ids.slice(0, 2).map(chip)}
          {lost.map(gonePill)}
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
  // The scope switch is the only way in or out of the perimeter now, so the dialog that
  // knows what hangs on a record belongs beside the switch rather than in the row detail.
  const [scopeAsk, setScopeAsk] = useState<EntityRecord | null>(null);
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
    <>
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
          <table className="tbl tbl-share" style={{ minWidth: groupFloor(tax, type.group) }}>
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
              <col style={{ width: pctName(cols) }} />
              {cols.map((c) => <col key={c.key} style={{ width: pctOf(c) }} />)}
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
                      {cols.map((c) => <td key={c.key}><FieldValueView field={c} value={r.values[c.key] ?? null} tax={tax} study={study} recordId={r.id}
                        onOpen={openEntity} toggleBlocked={setBackBlocked(tax, study, r)}
                        onToggle={(f, next) => {
                          // Out of the perimeter is the direction with consequences: what
                          // cannot stand without this record goes too, and what would be
                          // left pointing at it has to be named. Coming back IN never
                          // conflicts with anything, so that stays one click. And where
                          // nothing hangs off the record the dialog would have nothing to
                          // say, so it does not appear.
                          const out = next === f.options?.[0];
                          const ch = out ? scopeChange(tax, study, r.id) : null;
                          if (ch && (ch.carried.length > 1 || ch.blocked.length || ch.weakened.length)) {
                            setScopeAsk(r);
                            return;
                          }
                          updateEntity(r.id, { ...r.values, [f.key]: next }, `${f.label}: ${optionLabel(f, next)}`);
                        }} /></td>)}
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

      {scopeAsk && <ScopeDialog record={scopeAsk} tax={tax} study={study} onClose={() => setScopeAsk(null)} />}
      {modal && <EntityModal type={getType(tax, modal.typeKey)!} tax={tax} study={study} record={modal.record} onClose={() => setModal(null)} />}
    </div>
    </>
  );
}

/** What disabling a record would do, shown before it is done.
 *
 *  Three lists, no prose: what is in use here (and therefore refuses), what goes with it,
 *  what stays with one reason fewer. Each entry is a box carrying the record, its type and
 *  the field it hangs on - a sentence would say the same and be read less carefully. */
function ScopeDialog({ record, tax, study, onClose }:
  { record: EntityRecord; tax: Taxonomy; study: Study; onClose: () => void }) {
  const setScope = useStore((s) => s.setScope);
  const change = scopeChange(tax, study, record.id);
  const inPlay = !isSetBack(tax, record);
  const typeOf = (r: EntityRecord) => getType(tax, r.type)?.label ?? r.type;
  const title = (r: EntityRecord) => { const t = getType(tax, r.type); return t ? recordTitle(t, r) : r.id; };
  useDismissOnEscape(true, onClose);

  const boxes = (items: { record: EntityRecord; note?: string }[], tone: string, cap = 10) => (
    <div className="dep-grid">
      {items.slice(0, cap).map((x, i) => (
        <div className={"dep " + tone} key={`${x.record.id}-${i}`}>
          <b>{title(x.record)}</b>
          <span>{typeOf(x.record)}{x.note ? ` · ${x.note}` : ""}</span>
        </div>
      ))}
      {items.length > cap && <div className={"dep " + tone + " more"}>+{items.length - cap} more</div>}
    </div>
  );

  const others = change.carried.filter((r) => r.id !== record.id);
  const blocked = change.blocked.map((b) => ({ record: b.record, note: b.field }));
  const weak = change.weakened.map((w) => ({ record: w.record,
    note: w.left === 0 ? `${w.field}: none left` : `${w.field}: ${w.left} other${w.left === 1 ? "" : "s"}` }));

  return (
    <Overlay onClose={onClose}>
      <div className="modal-lg scope-dlg" style={{ maxWidth: 620 }} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-lg-head">
          <h3>{inPlay ? "Disable" : "Enable"} <span className="scope-name">{title(record)}</span></h3>
        </div>
        <div className="modal-lg-body">
          {!inPlay ? (
            <p className="scope-lead">Counts again everywhere.</p>
          ) : blocked.length ? (
            <>
              <p className="scope-lead warn">Currently in use by {blocked.length} record{blocked.length === 1 ? "" : "s"}</p>
              {boxes(blocked, "block")}
              {/* Standing in the way is a judgement about the perimeter, not a technical
                  impossibility - so it can be overruled, the way a delete can. What it
                  costs is said first: the ones in the way go too, and whatever stands in
                  THEIR way after that, or the same contradiction reappears one step out. */}
              {/* Says what the number on the button means, and nothing else. The count is
                  larger than the list above because taking those out can be refused in
                  turn, and that refusal is lifted with them. */}
              <p className="scope-lead">Taking it out anyway takes
                {blocked.length === 1 ? " that one" : ` those ${blocked.length}`} with it
                — {change.forced.length} records in all.</p>
            </>
          ) : (
            <>
              {others.length > 0 && (
                <>
                  <p className="scope-h">Disabled with it ({others.length})</p>
                  {boxes(others.map((r) => ({ record: r })), "carry")}
                </>
              )}
              {weak.length > 0 && (
                <>
                  {/* Not "still used elsewhere": some of these lose their last link in the
                      field named and keep standing for another reason entirely. "Affected"
                      is what they have in common; the box says the rest. */}
                  <p className="scope-h">Also affected ({weak.length})</p>
                  {boxes(weak, "weak", 6)}
                </>
              )}
              {!others.length && !weak.length && <p className="scope-lead">Nothing else is affected.</p>}
              {!change.possible && <p className="scope-lead warn">A type involved has no switch in this taxonomy.</p>}
            </>
          )}
        </div>
        <div className="modal-lg-foot">
          <span className="spacer" />
          <button className="btn ghost sm" onClick={onClose}>Cancel</button>
          {inPlay && blocked.length > 0 && change.possible && (
            <button className="btn sm danger" onClick={() => {
              setScope(change.forced.map((r) => r.id), false,
                `Out of scope with ${change.forced.length - 1} dependent record${change.forced.length === 2 ? "" : "s"}, over ${blocked.length} in use`);
              onClose();
            }}>
              <Icon.ban /> Out of scope anyway ({change.forced.length})
            </button>
          )}
          {/* Not shown beside the override: a dead button next to a live one asks the reader
              to work out why one of them is grey. Where the refusal cannot be lifted at all -
              a type without a switch - it stays, disabled, because then there IS nothing else. */}
          {!(inPlay && blocked.length > 0 && change.possible) && (
          <button className={"btn sm " + (inPlay ? "danger" : "primary")}
            disabled={inPlay && (blocked.length > 0 || !change.possible)}
            onClick={() => {
              if (inPlay) setScope(change.carried.map((r) => r.id), false, others.length ? `Disabled with ${others.length} dependent record${others.length === 1 ? "" : "s"}` : "Disabled");
              else setScope([record.id], true, "Enabled");
              onClose();
            }}>
            {/* The count is what WILL happen; with the action refused there is nothing to
                count, and a disabled button reading "Disable 4" reads like a threat. */}
            {inPlay ? <><Icon.ban /> Disable{others.length && !blocked.length ? ` ${change.carried.length}` : ""}</> : "Enable"}
          </button>
          )}
        </div>
      </div>
    </Overlay>
  );
}

// Deleting asks the same question as disabling and answers it destructively. The warning
// and the store read the SAME traversal (domain/scope.ts), so what is listed here is what
// will happen - a warning derived separately would eventually describe something else.
function DeleteDialog({ record, tax, study, onConfirm, onClose }:
  { record: EntityRecord; tax: Taxonomy; study: Study; onConfirm: () => void; onClose: () => void }) {
  const change = deleteChange(tax, study, record.id);
  const typeOf = (r: EntityRecord) => getType(tax, r.type)?.label ?? r.type;
  const title = (r: EntityRecord) => { const t = getType(tax, r.type); return t ? recordTitle(t, r) : r.id; };
  useDismissOnEscape(true, onClose);

  const boxes = (items: { record: EntityRecord; note?: string }[], tone: string, cap = 10) => (
    <div className="dep-grid">
      {items.slice(0, cap).map((x, i) => (
        <div className={"dep " + tone} key={`${x.record.id}-${i}`}>
          <b>{title(x.record)}</b>
          <span>{typeOf(x.record)}{x.note ? ` · ${x.note}` : ""}</span>
        </div>
      ))}
      {items.length > cap && <div className={"dep " + tone + " more"}>+{items.length - cap} more</div>}
    </div>
  );

  const others = change.removed.filter((r) => r.id !== record.id);
  const lost = [
    ...change.cleared.map((c) => ({ record: c.record, note: `${c.field}: emptied` })),
    ...change.shortened.map((c) => ({ record: c.record,
      note: c.left === 0 ? `${c.field}: none left` : `${c.field}: ${c.left} left` })),
  ];

  return (
    <Overlay onClose={onClose}>
      <div className="modal-lg scope-dlg" style={{ maxWidth: 620 }} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-lg-head">
          <h3>Delete <span className="scope-name">{title(record)}</span></h3>
        </div>
        <div className="modal-lg-body">
          {others.length > 0 ? (
            <>
              <p className="scope-lead warn">Deleted with it ({others.length}) — this cannot be undone</p>
              {boxes(others.map((r) => ({ record: r })), "block")}
            </>
          ) : lost.length > 0 ? (
            <p className="scope-lead">This record alone is deleted.</p>
          ) : null}
          {lost.length > 0 && (
            <>
              {/* These keep standing; what they lose is the LINK to the record being
                  deleted. "Loses a reference to it" read as though the deleted record were
                  losing something - the relation the wrong way round, over a list of other
                  records. The subject has to be the list. */}
              <p className="scope-h">These stay, and lose their link to it ({lost.length})</p>
              {boxes(lost, "weak", 6)}
            </>
          )}
          {/* Say what WILL happen, not two things that will not. "Nothing else is deleted.
              Nothing else is affected." is a pair of negations followed by advice, and a
              reader looking at it learns nothing about their own study. */}
          {!others.length && !lost.length && (
            <p className="scope-lead">Nothing in the study refers to it. Deleting removes
              this one record, and the deletion is recorded.</p>
          )}
          <p className="scope-lead">To keep the record and its judgement out of the figures, disable it instead.</p>
        </div>
        <div className="modal-lg-foot">
          <span className="spacer" />
          <button className="btn ghost sm" onClick={onClose}>Cancel</button>
          <button className="btn sm danger" onClick={() => { onConfirm(); onClose(); }}>
            <Icon.trash /> Delete{others.length ? ` ${change.removed.length}` : ""}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

// Inline expandable detail. Linked entities (refs + referenced-by) are
// clickable → open in the popup (used to reach items from other workshops).
function EntityDetail({ type, record, tax, study, color, onEdit, onDelete, onOpenEntity, extra }: {
  type: EntityTypeDef; record: EntityRecord; tax: Taxonomy; study: Study; color: string;
  onEdit: () => void; onDelete: () => void; onOpenEntity: (id: string) => void; extra?: ReactNode;
}) {
  const [histOpen, setHistOpen] = useState(false);
  const [delAsk, setDelAsk] = useState(false);
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
        {/* No second door into the perimeter. Scope is one state with one rule, and the
            switch in the table carries it - including the dialog, when something hangs on
            the record. A button here would be the same field with a different name and a
            different rule, which is what it had become. */}
        <button className="btn sm danger" onClick={() => setDelAsk(true)}><Icon.trash /> Delete</button>
      </div>
      {delAsk && <DeleteDialog record={record} tax={tax} study={study}
        onConfirm={onDelete} onClose={() => setDelAsk(false)} />}
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
            <div className="d-v"><FieldValueView field={f} value={record.values[f.key] ?? null} tax={tax} study={study} recordId={record.id} /></div>
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
