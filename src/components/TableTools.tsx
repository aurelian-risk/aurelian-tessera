// SPDX-License-Identifier: MPL-2.0 · Copyright (c) Aurelian-Risk
// One filter, used by every long table.
//
// The first version laid every facet out as a row of chips. That reads well for three
// values and badly for thirty: a register of a thousand rows carried more filter than
// table, and the table it was meant to serve started below the fold. Here a facet is a
// menu that says its name and how many of its values are picked; opening it shows the
// values with their counts. Nothing is hidden - a picked value is visible on the button
// itself - and the whole toolbar is one line until it needs two.
//
// The state and the filtering live in useTableFilter, so a view that is not a plain
// entity table (the coverage matrix, say) gets the same behaviour by calling one hook.
import { useMemo, useRef, useState, useEffect } from "react";
import { t as tr } from "../domain/i18n";
import { getGroupKey, setGroupKey as storeGroupKey } from "../domain/viewstate";
import type { EntityRecord, EntityTypeDef, FieldDef, FieldValue, Study, Taxonomy } from "../domain/types";
import { fieldLabel, getType, recordTitle, scaleLabel, typeLabelPlural } from "../domain/taxonomy";
import { facetsOf, countFacets, filterItems, groupItems, activeCount, type Selection } from "../domain/tablefilter";
import { Icon } from "./ui";

/** Who a reference points at, by title. Without one, references read as nothing and are
 *  not offered - which is what every caller got before there was a way to resolve them. */
export type NameOf = (id: string) => string;

/** How a value READS in a table - a scale as its label, not its number. Filtering and
 *  searching go by this, so a chip always says what the row says. A list, because a field
 *  can point at several records; see the note in tablefilter.ts. */
export function displayValue(f: FieldDef, v: FieldValue, nameOf?: NameOf): string[] {
  if (v == null || v === "") return [];
  switch (f.type) {
    case "scale": return typeof v === "number" ? [scaleLabel(f, v)] : [];
    case "boolean": return [v ? "yes" : "no"];
    case "ref": return nameOf ? [nameOf(String(v))].filter(Boolean) : [];
    case "multiref": return nameOf && Array.isArray(v)
      ? (v as string[]).map((id) => nameOf(String(id))).filter(Boolean) : [];
    default: return [String(v)];
  }
}

/** One title lookup for the whole study, so resolving a column of references is a map
 *  read per cell rather than a scan of every record. */
export function useNameOf(tax: Taxonomy, study: Study): NameOf {
  return useMemo(() => {
    const names = new Map<string, string>();
    for (const r of study.entities) {
      const t = getType(tax, r.type);
      if (t) names.set(r.id, recordTitle(t, r));
    }
    return (id: string) => names.get(id) ?? "";
  }, [tax, study.entities]);
}

export interface TableFilter {
  query: string; setQuery: (s: string) => void;
  sel: Selection; toggleFacet: (key: string, value: string) => void;
  groupKey: string; setGroupKey: (k: string) => void;
  facets: ReturnType<typeof countFacets>;
  shown: EntityRecord[];
  groupField: FieldDef | null;
  groups: ReturnType<typeof groupItems>;
  filtered: boolean;
  clearAll: () => void;
  total: number;
}

export function useTableFilter(type: EntityTypeDef, items: EntityRecord[],
  opts?: { onGroupChange?: () => void; nameOf?: NameOf; scope?: string }): TableFilter {
  const { onGroupChange, nameOf, scope } = opts ?? {};
  const display = useMemo<(f: FieldDef, v: FieldValue) => string[]>(
    () => (f, v) => displayValue(f, v, nameOf), [nameOf]);
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState<Selection>({});
  // How the table is ARRANGED comes back with the reader; what it is filtered to does not.
  // A table that silently holds fewer rows than it has, because of a facet set on a
  // previous visit, is a trap - see viewstate.ts.
  const [groupKey, setGroupKeyRaw] = useState(() => (scope ? getGroupKey(scope) : ""));

  const facetSet = useMemo(() => facetsOf(type, items, display), [type, items, display]);
  const facets = useMemo(() => countFacets(facetSet, items, type, query, sel, display), [facetSet, items, type, query, sel, display]);
  const shown = useMemo(() => filterItems(items, type, query, sel, display), [items, type, query, sel, display]);
  const groupField = groupKey ? type.fields.find((f) => f.key === groupKey) ?? null : null;
  const groups = useMemo(() => groupItems(shown, groupField, display), [shown, groupField, display]);

  const toggleFacet = (key: string, value: string) => setSel((s) => {
    const cur = s[key] ?? [];
    const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
    const out = { ...s, [key]: next };
    if (!next.length) delete out[key];
    return out;
  });
  const setGroupKey = (k: string) => { setGroupKeyRaw(k); if (scope) storeGroupKey(scope, k); onGroupChange?.(); };

  return {
    query, setQuery, sel, toggleFacet, groupKey, setGroupKey, facets, shown,
    groupField, groups,
    filtered: query.trim() !== "" || activeCount(sel) > 0,
    clearAll: () => { setQuery(""); setSel({}); },
    total: items.length,
  };
}

/** Values shown inside an open facet menu before the rest fold behind a "show all". */
const FACET_PREVIEW = 12;

function FacetMenu({ facet, chosen, onToggle, type }:
  { facet: TableFilter["facets"][number]; chosen: string[]; onToggle: (v: string) => void;
    /** The register the facet belongs to: a field key is not unique, so its name is looked
     *  up under the type as well. */
    type: EntityTypeDef }) {
  const [open, setOpen] = useState(false);
  const [all, setAll] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  const values = all ? facet.values : facet.values.slice(0, FACET_PREVIEW);
  const hidden = facet.values.length - values.length;
  return (
    <div className="facet-menu" ref={box}>
      <button type="button" className={"facet-btn" + (chosen.length ? " on" : "")}
        aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {fieldLabel(facet.field, type)}
        {chosen.length > 0 && <span className="facet-n">{chosen.length}</span>}
        <span className="facet-caret"><Icon.chevron /></span>
      </button>
      {open && (
        <div className="facet-pop">
          {values.map((v) => {
            const on = chosen.includes(v.value);
            return (
              <button key={v.value} type="button" className={"facet-opt" + (on ? " on" : "")}
                aria-pressed={on} onClick={() => onToggle(v.value)}>
                <span className="facet-tick">{on ? <Icon.check /> : null}</span>
                <span className="facet-v">{v.value}</span>
                <span className="facet-n">{v.count}</span>
              </button>
            );
          })}
          {hidden > 0 && (
            <button type="button" className="facet-opt more" onClick={() => setAll(true)}>
              show the remaining {hidden}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** What a reference field points AT, by the name of the type - "asset", not the field's own
 *  "Applies to assets". A sentence about one row needs the singular. */
export function refTypeLabel(tax: Taxonomy | undefined, f: FieldDef | null): string {
  if (!tax || !f?.refType) return "";
  return getType(tax, f.refType)?.label.toLowerCase() ?? "";
}

export function TableTools({ type, f, tax, groupable = true }:
  { type: EntityTypeDef; f: TableFilter; tax?: Taxonomy; groupable?: boolean }) {
  if (!f.facets.length && f.total < 8) return null;
  return (
    <div className="tbl-tools">
      <label className="tbl-search">
        <Icon.search />
        <input type="search" value={f.query} placeholder={`Search ${typeLabelPlural(type).toLowerCase()}…`}
          onChange={(e) => f.setQuery(e.target.value)} aria-label={`Search ${typeLabelPlural(type)}`} />
      </label>
      {f.facets.map((facet) => (
        <FacetMenu key={facet.field.key} facet={facet} type={type} chosen={f.sel[facet.field.key] ?? []}
          onToggle={(v) => f.toggleFacet(facet.field.key, v)} />
      ))}
      {groupable && f.facets.length > 0 && (
        <select className="tbl-group" value={f.groupKey} onChange={(e) => f.setGroupKey(e.target.value)}
          aria-label={tr('ui.tabletools.group-by', 'Group by')} title={tr('ui.tabletools.group-the-rows-by', 'Group the rows by a column')}>
          <option value="">{tr("ui.tabletools.no-grouping", "no grouping")}</option>
          {f.facets.map((facet) => <option key={facet.field.key} value={facet.field.key}>by {fieldLabel(facet.field, type).toLowerCase()}</option>)}
        </select>
      )}
      {f.groupField?.type === "multiref" && (
        // Otherwise the group counts look like duplicated rows: they add up to more than
        // the table holds, because that is what grouping by a reference means.
        <span className="tbl-note">
          a row appears under each {refTypeLabel(tax, f.groupField) || "one"} it names
        </span>
      )}
      <span className="tbl-count">
        {f.filtered ? `${f.shown.length} of ${f.total}` : `${f.total}`}
      </span>
      {f.filtered && <button className="tbl-clear" onClick={f.clearAll} title={tr('ui.tabletools.clear-every-filter', 'Clear every filter')}><Icon.close /></button>}
    </div>
  );
}
