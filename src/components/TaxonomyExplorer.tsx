// SPDX-License-Identifier: MPL-2.0 · Copyright (c) Aurelian-Risk
// The taxonomy, seen rather than edited.
//
// The editor beneath this shows one type at a time, which is the right shape for changing
// a field and the wrong one for understanding a model. Three readings, because three
// different questions are being asked:
//
//   · Outline - what is the model made of? Groups, types, fields, and how many records of
//     each the study actually holds.
//   · Classes - what does a published classification cost? The vocabulary that is a TREE
//     (Taxonomy.vocabularyHierarchy) with, per class, how many catalogue items name it,
//     what its parents add on top, and how many records of the study sit in it. This is
//     the only one that answers a question about the method rather than about the model.
//   · Relations - what is joined to what? Every ref/multiref field as an edge.
//
// Nothing here knows a method or a product. A taxonomy that declares no hierarchy simply
// has no Classes reading, and one with no relationships has an empty Relations one.
import { useMemo, useState } from "react";
import { t as tr, tn } from "../domain/i18n";
import type { EntityRecord, EntityTypeDef, FieldDef, Study, Taxonomy } from "../domain/types";
import { classificationLink, withAncestors } from "../domain/modelling";
import { BUNDLED_FRAMEWORKS } from "../profile";
import { catalogTargets } from "../domain/catalog";
import { fieldLabel, getType, groupLabel, optionLabel, recordTitle, typeLabel, typeLabelPlural } from "../domain/taxonomy";
import { EntityModal } from "./EntityModal";
import { useActiveStudy, useStore } from "../domain/store";
import { Icon } from "./ui";
import { PRODUCT } from "../profile";
import { VocabularySync } from "./VocabularySync";

type View = "outline" | "classes" | "relations";

const listOf = (v: unknown): string[] =>
  (Array.isArray(v) ? v.map(String) : v == null ? [] : String(v).split(","))
    .map((s) => s.trim()).filter(Boolean);

/** Which of a type's fields the PUBLICATION fills, and which this product adds around it.
 *
 *  A reader of the outline cannot tell one from the other, and the difference is the first
 *  thing an auditor asks: a field the publisher carries arrives filled and its values are
 *  the publisher's to change; a field of ours is what this application keeps beside it -
 *  the decisions, the owners, the dates. Neither is worth more, but reading them as one
 *  thing makes the register look either more official than it is or less.
 *
 *  Derived, not declared. The catalogue import writes each property into the field of the
 *  same name, which is why it needs no mapping step - so the keys the publication uses ARE
 *  the property names it carries, and asking the bundled catalogue is asking the source. */
function publishedKeys(tax: Taxonomy): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  for (const t of catalogTargets(tax)) {
    // The five the reader maps by position rather than by property name.
    const keys = new Set(["name", "ref_id", "framework", "category", "description"]);
    for (const fw of t.bundled) for (const it of fw.items) {
      for (const k of Object.keys(it.props ?? {})) keys.add(k);
    }
    // A field that declares where its values come from is the publisher's by declaration,
    // even where no item happened to carry that property.
    for (const f of t.type.fields) if (f.vocabulary) keys.add(f.key);
    out.set(t.type.key, keys);
  }
  return out;
}

/** What a field says about itself, in one line: the type, and where it points or what it
 *  may hold. A reader of the outline wants the shape, not the help text. */
function fieldSpec(f: FieldDef): string {
  switch (f.type) {
    case "ref": return `ref → ${f.refType}`;
    case "multiref": return `list → ${f.refType}`;
    case "enum": return `enum · ${f.options?.length ?? 0} values${f.vocabulary ? ` · ${f.vocabulary}` : ""}`;
    case "scale": return `scale 1–${f.scaleLabels?.length ?? 4}`;
    default: return f.vocabulary ? `${f.type} · ${f.vocabulary}` : f.type;
  }
}

// ── Outline ──────────────────────────────────────────────────────────────

/** Records shown under a type before the rest are counted rather than listed. */
const RECORD_PREVIEW = 40;

function Outline({ tax, study, q, onOpen }: { tax: Taxonomy; study: Study; q: string; onOpen: (r: EntityRecord) => void }) {
  const published = useMemo(() => publishedKeys(tax), [tax]);
  const [open, setOpen] = useState<Set<string>>(() => new Set(tax.groups.map((g) => g.key)));
  const [openType, setOpenType] = useState<Set<string>>(new Set());
  const [openRecords, setOpenRecords] = useState<Set<string>>(new Set());
  const toggle = (set: Set<string>, k: string, put: (s: Set<string>) => void) => {
    const n = new Set(set); n.has(k) ? n.delete(k) : n.add(k); put(n);
  };
  const recordsOf = (t: EntityTypeDef) => study.entities.filter((e) => e.type === t.key);
  const count = (t: EntityTypeDef) => recordsOf(t).length;
  const hit = (s: string) => q === "" || s.toLowerCase().includes(q);

  return (
    <div className="tx-outline">
      {tax.groups.map((g) => {
        const all = tax.entityTypes.filter((t) => t.group === g.key);
        // A search reaches types, their fields and their records; a group survives if
        // anything under it does, so nothing hides behind a fold that did not match.
        const types = q === "" ? all : all.filter((t) =>
          hit(t.label) || hit(t.labelPlural) || hit(typeLabel(t)) || hit(typeLabelPlural(t)) || hit(t.key)
          || t.fields.some((f) => hit(f.label) || hit(fieldLabel(f, t)) || hit(f.key))
          || recordsOf(t).some((r) => hit(recordTitle(t, r))));
        if (q !== "" && !types.length && !hit(g.label) && !hit(groupLabel(g))) return null;
        const records = all.reduce((n, t) => n + count(t), 0);
        const shown = q !== "" ? true : open.has(g.key);
        return (
          <div key={g.key} className="tx-group">
            <button className="tx-row tx-row-g" onClick={() => toggle(open, g.key, setOpen)} aria-expanded={shown}>
              <span className={"caret" + (shown ? " open" : "")}><Icon.chevron /></span>
              <span className="tx-dot" style={{ background: g.color }} />
              <span className="tx-name">{groupLabel(g)}</span>
              <span className="tx-num">{tn("ui.taxonomyexplorer.n-types", types.length, "{0} type", "{0} types")}</span>
              <span className="tx-num strong">{records}</span>
            </button>
            {shown && types.map((t) => {
              const tOpen = q !== "" ? true : openType.has(t.key);
              const recs = recordsOf(t).filter((r) => hit(recordTitle(t, r)));
              const showRecs = openRecords.has(t.key) || (q !== "" && recs.length > 0 && recs.length < count(t));
              return (
                <div key={t.key}>
                  <button className="tx-row tx-row-t" onClick={() => toggle(openType, t.key, setOpenType)} aria-expanded={tOpen}>
                    <span className={"caret" + (tOpen ? " open" : "")}><Icon.chevron /></span>
                    <span className="tx-name">{typeLabelPlural(t)}</span>
                    <span className="tx-key">{t.key}</span>
                    <span className="tx-num">{tn("ui.taxonomyexplorer.n-fields", t.fields.length, "{0} field", "{0} fields")}</span>
                    {published.has(t.key) && (
                      <span className="tx-num" title={tr('ui.taxonomyexplorer.fields-the-published-catalogue', 'Fields the published catalogue itself fills; the rest are what this application keeps beside them')}>
                        {t.fields.filter((f) => published.get(t.key)!.has(f.key)).length} published
                      </span>
                    )}
                    <span className="tx-num strong">{count(t)}</span>
                  </button>
                  {tOpen && t.fields.filter((f) => q === "" || hit(f.label) || hit(f.key) || hit(t.label)).map((f) => (
                    <div key={f.key} className="tx-row tx-row-f">
                      <span className="tx-name">{fieldLabel(f, t)}</span>
                      <span className="tx-key">{f.key}</span>
                      {published.get(t.key)?.has(f.key) && (
                        <span className="tx-pub" title={tr('ui.taxonomyexplorer.filled-by-the-published', "Filled by the published catalogue - the publisher's to change")}>published</span>
                      )}
                      <span className="tx-spec">{fieldSpec(f)}</span>
                    </div>
                  ))}
                  {/* The records themselves, one level down: a model is easier to believe
                      when what is actually in it is one press away. */}
                  {tOpen && count(t) > 0 && (
                    <button className="tx-row tx-row-r-head" aria-expanded={showRecs}
                      onClick={() => toggle(openRecords, t.key, setOpenRecords)}>
                      <span className={"caret" + (showRecs ? " open" : "")}><Icon.chevron /></span>
                      <span className="tx-name">{recs.length === count(t) ? "records" : `records matching`}</span>
                      <span className="tx-num strong">{recs.length}</span>
                    </button>
                  )}
                  {tOpen && showRecs && (
                    <div className="tx-records">
                      {recs.slice(0, RECORD_PREVIEW).map((r) => (
                        <button key={r.id} className="tx-rec" onClick={() => onOpen(r)} title={tr('ui.taxonomyexplorer.open', 'Open')}>
                          {recordTitle(t, r)}
                        </button>
                      ))}
                      {recs.length > RECORD_PREVIEW && (
                        <span className="tx-rec more">+{recs.length - RECORD_PREVIEW} more</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ── Classes ──────────────────────────────────────────────────────────────

interface ClassNode {
  name: string; depth: number; children: ClassNode[];
  /** Items naming this class directly. */
  own: number;
  /** Items reaching it through its parents - what the inheritance adds. */
  inherited: number;
  /** Records of the study classified here. */
  records: number;
}

function classTree(tax: Taxonomy, study: Study): { nodes: ClassNode[]; source: string; label: string } | null {
  const link = classificationLink(tax);
  if (!link) return null;
  const parent = tax.vocabularyHierarchy?.[link.source];
  const all = link.objectField.options ?? [];
  if (!all.length) return null;

  // How many published items name each class, counted once over every bundled catalogue.
  const direct = new Map<string, number>();
  for (const fw of BUNDLED_FRAMEWORKS) {
    for (const it of fw.items) {
      for (const c of listOf(it.props?.[link.itemField.key])) direct.set(c, (direct.get(c) ?? 0) + 1);
    }
  }
  const records = new Map<string, number>();
  for (const e of study.entities) {
    if (e.type !== link.objectType) continue;
    for (const c of listOf(e.values[link.objectField.key])) records.set(c, (records.get(c) ?? 0) + 1);
  }

  const childrenOf = new Map<string, string[]>();
  for (const c of all) {
    const p = parent?.[c];
    if (!p) continue;
    childrenOf.set(p, [...(childrenOf.get(p) ?? []), c]);
  }
  const build = (name: string, depth: number): ClassNode => {
    // What the class inherits is what its ancestors carry - the same widening the
    // derivation performs, so the two cannot disagree.
    const ancestors = withAncestors(tax, link.source, [name]).filter((c) => c !== name);
    return {
      name, depth,
      children: (childrenOf.get(name) ?? []).map((c) => build(c, depth + 1)),
      own: direct.get(name) ?? 0,
      inherited: ancestors.reduce((n, a) => n + (direct.get(a) ?? 0), 0),
      records: records.get(name) ?? 0,
    };
  };
  const roots = all.filter((c) => !parent?.[c]).map((c) => build(c, 0));
  return { nodes: roots, source: link.source, label: link.objectField.label };
}

function Classes({ tax, study, q }: { tax: Taxonomy; study: Study; q: string }) {
  const tree = useMemo(() => classTree(tax, study), [tax, study]);
  const [only, setOnly] = useState(false);
  if (!tree) return <div className="empty">{tr('ui.taxonomyexplorer.this-taxonomy-declares-no', 'This taxonomy declares no classification with a hierarchy.')}</div>;

  const link = classificationLink(tax)!;
  const total = tree.nodes.reduce(function sum(n: number, x: ClassNode): number {
    return x.children.reduce(sum, n + 1);
  }, 0);
  const max = (() => {
    let m = 1;
    const walk = (n: ClassNode) => { m = Math.max(m, n.own + n.inherited); n.children.forEach(walk); };
    tree.nodes.forEach(walk);
    return m;
  })();

  const rows: ClassNode[] = [];
  const flatten = (n: ClassNode) => {
    const used = n.records > 0 || n.children.some(function any(c: ClassNode): boolean {
      return c.records > 0 || c.children.some(any);
    });
    const named = q === "" || n.name.toLowerCase().includes(q)
      || optionLabel(link.objectField, n.name).toLowerCase().includes(q);
    if ((!only || used) && named) rows.push(n);
    n.children.forEach(flatten);
  };
  tree.nodes.forEach(flatten);

  return (
    <>
      <div className="guide" style={{ marginBottom: 10 }}>
        <b>{tree.label}</b> - {total} classes over {1 + Math.max(...rows.map((r) => r.depth))} levels,
        as the publisher orders them. <b>{tr('ui.taxonomyexplorer.own', 'Own')}</b> is how many requirements name the class itself;
        <b> inherited</b> is what its parents add on top, which is what an object of this class
        actually carries. Choosing a class costs the sum.
        {tree.nodes.length > 0 && <> {study.entities.filter((e) => e.type === link.objectType).length} records
          of this study are classified.</>}
      </div>
      <div className="tx-only">
        <label><input type="checkbox" checked={only} onChange={(e) => setOnly(e.target.checked)} />
          <span>{tr('ui.taxonomyexplorer.only-the-classes-this', 'Only the classes this study uses')}</span></label>
      </div>
      <div className="tx-classes">
        {rows.map((n) => {
          const carries = n.own + n.inherited;
          return (
            <div key={n.name} className={"tx-row tx-class" + (n.records ? " used" : "")} style={{ paddingLeft: 10 + n.depth * 18 }}>
              <span className="tx-name" title={n.name}>{optionLabel(link.objectField, n.name)}</span>
              <span className="tx-bar" title={`${n.own} own + ${n.inherited} inherited`}>
                <span className="tx-bar-own" style={{ width: `${(n.own / max) * 100}%` }} />
                <span className="tx-bar-inh" style={{ width: `${(n.inherited / max) * 100}%` }} />
              </span>
              <span className="tx-num" title="named by the class itself">{n.own}</span>
              <span className="tx-num dim" title="added by the classes above it">+{n.inherited}</span>
              <span className="tx-num strong" title="what an object of this class carries">{carries}</span>
              <span className={"tx-num" + (n.records ? " strong" : " dim")} title="records of this study">{n.records || " - "}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ── Relations ────────────────────────────────────────────────────────────

interface Edge { from: string; to: string; label: string; many: boolean }

function Relations({ tax, study, q }: { tax: Taxonomy; study: Study; q: string }) {
  const { nodes, edges, W, H } = useMemo(() => {
    const cols = tax.groups.map((g) => ({ g, types: tax.entityTypes.filter((t) => t.group === g.key) }))
      .filter((c) => c.types.length > 0);
    const COL = 210, ROW = 58, PAD = 24;
    const nodes = new Map<string, { t: EntityTypeDef; x: number; y: number; color: string }>();
    cols.forEach((c, ci) => c.types.forEach((t, ti) => {
      nodes.set(t.key, { t, x: PAD + ci * COL, y: PAD + ti * ROW, color: c.g.color });
    }));
    const edges: Edge[] = [];
    for (const t of tax.entityTypes) {
      for (const f of t.fields) {
        if ((f.type !== "ref" && f.type !== "multiref") || !f.refType) continue;
        if (!nodes.has(f.refType)) continue;
        edges.push({ from: t.key, to: f.refType, label: f.relation ?? f.label, many: f.type === "multiref" });
      }
    }
    const rows = Math.max(...cols.map((c) => c.types.length));
    return { nodes, edges, W: PAD * 2 + (cols.length - 1) * COL + 170, H: PAD * 2 + rows * ROW };
  }, [tax]);

  const count = (k: string) => study.entities.filter((e) => e.type === k).length;
  const [hover, setHover] = useState<string | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const hit = (k: string) => {
    if (q === "") return true;
    const t = getType(tax, k);
    return !!t && (t.label.toLowerCase().includes(q) || t.key.toLowerCase().includes(q));
  };
  const picked = chosen ? getType(tax, chosen) : null;
  // What the model says about one type, read off the taxonomy rather than remembered:
  // where it sits, what it holds, what it points at and what points back at it.
  const outgoing = picked ? picked.fields.filter((f) => (f.type === "ref" || f.type === "multiref") && f.refType) : [];
  const incoming = picked
    ? tax.entityTypes.flatMap((t) => t.fields
      .filter((f) => (f.type === "ref" || f.type === "multiref") && f.refType === picked.key)
      .map((f) => ({ from: t, field: f })))
    : [];

  return (
    <>
      <div className="guide" style={{ marginBottom: 10 }}>
        {nodes.size} entity types, {edges.length} relationships. A column is a group, in the
        taxonomy's own order; an arrow runs from the type that holds the field to the type it
        points at. A dashed arrow is a list - one record may name several.
      </div>
      <div className="tx-graph-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="tx-graph">
          <defs>
            <marker id="tx-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L8 4 L0 8 z" fill="var(--fg-subtle)" />
            </marker>
          </defs>
          {edges.map((e, i) => {
            const a = nodes.get(e.from)!, b = nodes.get(e.to)!;
            const ax = a.x + 150, ay = a.y + 16, bx = b.x, by = b.y + 16;
            const dim = hover !== null && hover !== e.from && hover !== e.to;
            const mx = (ax + bx) / 2;
            return (
              <path key={i} d={`M${ax} ${ay} C${mx} ${ay} ${mx} ${by} ${bx} ${by}`}
                className={"tx-edge" + (dim ? " dim" : "")} strokeDasharray={e.many ? "4 3" : undefined}
                markerEnd="url(#tx-arrow)">
                <title>{`${e.from} - ${e.label} → ${e.to}`}</title>
              </path>
            );
          })}
          {[...nodes.values()].map(({ t, x, y, color }) => (
            <g key={t.key} transform={`translate(${x},${y})`}
              className={"tx-node-g" + (hit(t.key) ? "" : " dim")} role="button" tabIndex={0}
              onClick={() => setChosen(t.key)}
              onMouseEnter={() => setHover(t.key)} onMouseLeave={() => setHover(null)}>
              <rect width="150" height="32" rx="4" className="tx-node" style={{ stroke: color }} />
              {/* The count owns the right-hand end of the box, so a long label is cut
                  rather than written over it. The full name is in the tooltip. */}
              <text x="9" y="20" className="tx-node-t">{t.label.length > 17 ? t.label.slice(0, 16) + "…" : t.label}</text>
              <text x="141" y="20" className="tx-node-n" textAnchor="end">{count(t.key)}</text>
              <title>{`${t.key} · ${t.fields.length} fields · ${count(t.key)} records`}</title>
            </g>
          ))}
        </svg>
      </div>
      {picked && (
        <div className="overlay" onMouseDown={() => setChosen(null)}>
          <div className="modal-lg tx-detail" style={{ maxWidth: 620 }} onMouseDown={(e) => e.stopPropagation()}>
            <header className="modal-lg-head">
              <div style={{ flex: 1 }}>
                <div className="dialog-sub" style={{ margin: 0 }}>
                  {tax.groups.find((g) => g.key === picked.group)?.label ?? picked.group} · {count(picked.key)} records
                </div>
                <h2 style={{ fontSize: 19 }}>{picked.labelPlural}</h2>
                <div className="tx-key">{picked.key}</div>
              </div>
              <button className="btn ghost sm" onClick={() => setChosen(null)} aria-label={tr('ui.taxonomyexplorer.close', 'Close')}><Icon.close /></button>
            </header>
            <div className="modal-lg-body">
              <h3 className="tx-detail-h">Fields ({picked.fields.length})</h3>
              {picked.fields.map((f) => (
                <div key={f.key} className="tx-row tx-row-f">
                  <span className="tx-name">{f.label}{f.required ? " *" : ""}</span>
                  <span className="tx-key">{f.key}</span>
                  <span className="tx-spec">{fieldSpec(f)}</span>
                </div>
              ))}
              <h3 className="tx-detail-h">Points at ({outgoing.length})</h3>
              {outgoing.length === 0 ? <div className="hint" style={{ padding: "2px 10px 8px" }}>nothing</div>
                : outgoing.map((f) => (
                  <button key={f.key} className="tx-row tx-row-f" onClick={() => setChosen(f.refType!)}>
                    <span className="tx-name">{f.relation ?? f.label}</span>
                    <span className="tx-spec">{getType(tax, f.refType!)?.labelPlural ?? f.refType}</span>
                  </button>
                ))}
              <h3 className="tx-detail-h">Pointed at by ({incoming.length})</h3>
              {incoming.length === 0 ? <div className="hint" style={{ padding: "2px 10px 8px" }}>nothing</div>
                : incoming.map(({ from, field }) => (
                  <button key={from.key + field.key} className="tx-row tx-row-f" onClick={() => setChosen(from.key)}>
                    <span className="tx-name">{from.labelPlural}</span>
                    <span className="tx-spec">{field.relation ?? field.label}</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── The panel ────────────────────────────────────────────────────────────

const VIEWS: { key: View; label: string; hint: string }[] = [
  { key: "outline", label: "Outline", hint: "Groups, types and fields, with what the study holds" },
  { key: "classes", label: "Classes", hint: "The published class hierarchy, and what each class carries" },
  { key: "relations", label: "Relations", hint: "Which type points at which" },
] as const;
// The tabs are DATA, and data is read once at module load - before a language is settled.
// The words are therefore looked up where they are shown, under the key the tab carries;
// the authored text beside them stays the fallback, as everywhere else.
// Written out rather than composed from the key: the check reads call sites off the source,
// so a key built at run time is a key it cannot see, and an entry for it reads as an orphan.
const viewWords = (v: View): { label: string; hint: string } =>
  v === "outline" ? {
    label: tr("ui.taxonomyexplorer.outline", "Outline"),
    hint: tr("ui.taxonomyexplorer.groups-types-and-fields", "Groups, types and fields, with what the study holds") }
  : v === "classes" ? {
    label: tr("ui.taxonomyexplorer.classes", "Classes"),
    hint: tr("ui.taxonomyexplorer.the-published-class-hierarchy", "The published class hierarchy, and what each class carries") }
  : {
    label: tr("ui.taxonomyexplorer.relations", "Relations"),
    hint: tr("ui.taxonomyexplorer.which-type-points-at", "Which type points at which") };

export function TaxonomyExplorer({ tax, study }: { tax: Taxonomy; study: Study | null }) {
  const [view, setView] = useState<View>("outline");
  const [query, setQuery] = useState("");
  const [rec, setRec] = useState<EntityRecord | null>(null);
  const q = query.trim().toLowerCase();
  // The explorer reads a study for its counts; without one it still describes the model.
  const s: Study = study ?? { id: "", name: "", organization: "", scope: "", createdAt: "", updatedAt: "", entities: [], log: [] };
  const active = VIEWS.find((v) => v.key === view)!;

  return (
    <div className="panel tx-explorer">
      <div className="panel-head">
        <h3>{viewWords(active.key).label}</h3>
        <span className="badge">{tax.entityTypes.length} types</span>
        <span className="spacer" />
        <label className="tbl-search" style={{ flex: "0 1 220px" }}>
          <Icon.search />
          <input type="search" value={query} placeholder={tr('ui.taxonomyexplorer.search-the-model', 'Search the model…')}
            onChange={(e) => setQuery(e.target.value)} aria-label={tr('ui.taxonomyexplorer.search-the-model-2', 'Search the model')} />
        </label>
        <div className="tx-seg">
          {VIEWS.map((v) => (
            <button key={v.key} className={"seg-btn" + (view === v.key ? " on" : "")}
              title={viewWords(v.key).hint} onClick={() => setView(v.key)}>{viewWords(v.key).label}</button>
          ))}
        </div>
      </div>
      <div className="panel-body" style={{ padding: "12px 0 16px" }}>
        {view === "outline" && <Outline tax={tax} study={s} q={q} onOpen={setRec} />}
        {view === "classes" && <Classes tax={tax} study={s} q={q} />}
        {view === "relations" && <Relations tax={tax} study={s} q={q} />}
      </div>
      {rec && getType(tax, rec.type) && (
        <EntityModal type={getType(tax, rec.type)!} tax={tax} study={s} record={rec} onClose={() => setRec(null)} />
      )}
    </div>
  );
}

/** The explorer as a page of its own, reached from the navigation. It reads the taxonomy
 *  that is loaded and the study that is open; both come from the store. */
export function ExplorerView() {
  const tax = useStore((st) => st.taxonomy);
  const study = useActiveStudy();
  return (
    <div className="content">
      <div className="page-head">
        <div style={{ flex: 1 }}>
          <div className="eyebrow">{tr('ui.taxonomyexplorer.the-published-method', 'The published method')}</div>
          <h1 className="grad-text">{PRODUCT.exploreLabel ?? "Explore"}</h1>
          <div className="meta" style={{ color: "var(--fg-subtle)" }}>
            {tax.name}{study ? ` · ${study.name}` : " · no study open"}
          </div>
        </div>
      </div>
      {/* The vocabularies are the PUBLISHER'S lists, and asking the publisher whether they
          have changed is a question about the publication - so it belongs on the page about
          the publication, not in the schema editor beside "add a field". It stood there
          until someone read the two pages side by side and asked why a BSI download was in
          the internal model. */}
      <VocabularySync tax={tax} />
      <TaxonomyExplorer tax={tax} study={study} />
    </div>
  );
}
