// SPDX-License-Identifier: MPL-2.0 · Copyright (c) Aurelian-Risk
// The derivation, shown before it is applied.
//
// A catalogue that classifies its requirements already says which of them reach which
// object. This panel performs that reading - classify, widen along the hierarchy, collect,
// de-duplicate - and shows the result as an account rather than a number: which object
// brought which requirement in, what it inherited, what is already recorded, and what the
// catalogue leaves undecided. Adding writes the requirements into the study's own table,
// each carrying the rule that put it there.
import { useMemo, useState } from "react";
import type { Study, Taxonomy } from "../domain/types";
import { packageRelationField, requirementPackage } from "../domain/modelling";
import { catalogTargets } from "../domain/catalog";
import { BUNDLED_FRAMEWORKS } from "../profile";
import { useStore } from "../domain/store";
import { getType, optionLabel } from "../domain/taxonomy";
import { Icon } from "./ui";

export function ModellingPanel({ tax, study, color }: { tax: Taxonomy; study: Study; color: string }) {
  const addEntity = useStore((s) => s.addEntity);
  const updateEntity = useStore((s) => s.updateEntity);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [fwKey, setFwKey] = useState(BUNDLED_FRAMEWORKS[0]?.key ?? "");

  const fw = BUNDLED_FRAMEWORKS.find((f) => f.key === fwKey) ?? BUNDLED_FRAMEWORKS[0];
  const pkg = useMemo(() => (fw ? requirementPackage(tax, study, fw) : null), [tax, study, fw]);
  if (!fw || !pkg) return null;

  const objectType = getType(tax, pkg.link.objectType);
  const itemType = getType(tax, pkg.link.itemType);
  const target = catalogTargets(tax).find((t) => t.type.key === pkg.link.itemType);
  const missing = pkg.items.filter((i) => !i.present);
  // What the catalogue classifies nowhere cannot be derived - it has to be decided. Shown
  // as its own list, grouped as the catalogue groups it, so the decision is per chapter
  // rather than per record over hundreds of them.
  const already = new Set(study.entities.filter((e) => e.type === pkg.link.itemType)
    .map((e) => String(e.values.ref_id ?? "")).filter(Boolean));
  // The field that says whether a record is in play. Its first option is "out", its second
  // "in" - the taxonomy names them; this only needs to know which is which.
  const scopeField = itemType?.fields.find((f) => (tax.dimWhen ?? []).some((d) => d.type === pkg.link.itemType && d.field === f.key));
  // Where the package is written as a relation rather than only as a sentence: the
  // requirement records which objects it applies to, so it can be read from either end.
  const relField = packageRelationField(tax, pkg.link);
  const cls = (c: string) => optionLabel(pkg.link.objectField, c);

  // One action, not two. The whole ruleset comes in; what the reading reaches is in scope
  // and says why, the rest is present and set back, to be brought in by hand where it
  // applies. Two separate lists - "the package" and "the ones to decide" - asked the user
  // to hold a distinction the table can simply show.
  //
  // Repeatable, because the method is: record an object, run the reading again, and the
  // package grows by exactly what that object brought. So a second run does not duplicate
  // anything - it refreshes the relation and the scope of what the reading now reaches,
  // and leaves everything it does not reach alone, decisions included.
  const derived = new Map(pkg.items.map((i) => [i.item.ref_id, i]));
  const byRefRecord = new Map(study.entities.filter((e) => e.type === pkg.link.itemType)
    .map((e) => [String(e.values.ref_id ?? ""), e]));
  const notYet = fw.items.filter((i) => !already.has(i.ref_id));
  const sameSet = (a: unknown, b: string[]) =>
    Array.isArray(a) && a.length === b.length && b.every((x) => a.includes(x));
  const stale = pkg.items.filter((i) => {
    const rec = byRefRecord.get(i.item.ref_id);
    if (!rec) return false;
    const scopeOff = !!scopeField && String(rec.values[scopeField.key] ?? "") !== (scopeField.options?.[1] ?? "");
    const relOff = !!relField && !sameSet(rec.values[relField.key], i.objects);
    return scopeOff || relOff;
  });
  const apply = () => {
    if (!target || !scopeField) return;
    for (const item of notYet) {
      const d = derived.get(item.ref_id);
      addEntity(target.type.key, {
        ...target.toValues(fw, item),
        [scopeField.key]: d ? scopeField.options?.[1] ?? "" : scopeField.options?.[0] ?? "",
        // The account of why a requirement is in scope travels with the record. Without it
        // the package is a list somebody has to take on trust.
        ...(d ? { begruendung: `In scope: ${d.reasons.join("; ")}.` } : {}),
        // …and beside the account, the relation itself: which objects it applies to.
        ...(d && relField ? { [relField.key]: d.objects } : {}),
      });
    }
    // Records already in the study that the reading now reaches differently: the relation
    // and the scope are the derivation's to keep current. The rationale is not overwritten
    // - it may have been written by hand since.
    for (const i of stale) {
      const rec = byRefRecord.get(i.item.ref_id);
      if (!rec) continue;
      updateEntity(rec.id, {
        [scopeField.key]: scopeField.options?.[1] ?? "",
        ...(relField ? { [relField.key]: i.objects } : {}),
      });
    }
    const parts = [
      notYet.length ? `${notYet.length} requirements added` : "",
      stale.length ? `${stale.length} brought up to date with the reading` : "",
    ].filter(Boolean);
    setMsg(`${parts.join(", ")} - ${derived.size} in scope from the reading, the rest present and set back until a reason is given.`);
  };

  return (
    <div className="panel ws-accent modelling" style={{ ["--ws-color" as string]: color, marginBottom: 20 }}>
      <div className="panel-head">
        <h3>Derived from the catalogue</h3>
        <span className="badge">{pkg.items.length}</span>
        <span className="spacer" />
        {BUNDLED_FRAMEWORKS.length > 1 && (
          <select value={fwKey} onChange={(e) => setFwKey(e.target.value)} style={{ width: "auto" }}>
            {BUNDLED_FRAMEWORKS.map((f) => <option key={f.key} value={f.key}>{f.name}</option>)}
          </select>
        )}
        <button className="btn ghost sm" onClick={() => setOpen((o) => !o)}>{open ? "Hide the account" : "Show the account"}</button>
      </div>
      <div className="panel-body" style={{ padding: "10px 0 14px" }}>
        <div className="guide" style={{ marginBottom: 10 }}>
          <b>{fw.name}</b> states, per requirement, which classes of object it applies to.
          Each {objectType?.label.toLowerCase() ?? "object"} below is read with its class and every
          class above it, the requirements of those classes are collected, and one reaching an
          object twice is carried once. {pkg.items.length} follow for this study
          {missing.length > 0 ? `, of which ${missing.length} are not yet recorded` : " and all are recorded"}.
          {pkg.unclassifiedItems.length > 0 && <> {pkg.unclassifiedItems.length} requirements name no class at
            all - nothing can derive them, so they are recorded and set back until someone says they apply.</>}
        </div>

        {pkg.unclassified.length > 0 && (
          <div className="guide warn" style={{ marginBottom: 10 }}>
            {pkg.unclassified.length} {(objectType?.labelPlural ?? "records").toLowerCase()} carry no
            class, so nothing can be derived for them: {pkg.unclassified.map((r) => String(r.values.name ?? r.id)).join(", ")}.
          </div>
        )}

        <table className="tbl">
          <thead><tr>
            <th>{objectType?.label ?? "Object"}</th><th>Class</th><th>Inherited</th><th>Requirements</th>
          </tr></thead>
          <tbody>
            {pkg.objects.map((o) => (
              <tr key={o.record.id}>
                <td><span className="name">{o.name}</span></td>
                <td>{o.own.map((c) => <span className="badge" key={c} title={c}>{cls(c)}</span>)}</td>
                <td>{o.inherited.length
                  ? o.inherited.map((c) => <span className="chip" key={c} title={c}>{cls(c)}</span>)
                  : <span className="hint"> - </span>}</td>
                <td style={{ fontVariantNumeric: "tabular-nums" }}>{o.count}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {open && (
          <div style={{ maxHeight: 320, overflow: "auto", marginTop: 10 }}>
            {pkg.items.slice(0, 400).map((i) => (
              <label key={i.item.ref_id} className="ex-cand">
                <span style={{ flex: 1 }}>
                  <span className="ex-cand-name">{i.item.ref_id} · {i.item.title}</span>
                  <span className="ex-cand-snip">{i.reasons.join(" · ")}</span>
                </span>
                {i.present && <span className="badge">recorded</span>}
              </label>
            ))}
            {pkg.items.length > 400 && <div className="hint" style={{ padding: "6px 4px" }}>+{pkg.items.length - 400} more…</div>}
          </div>
        )}

        {msg && <div className="guide warn" style={{ marginTop: 10 }}>{msg}</div>}
        <div style={{ marginTop: 10 }}>
          <button className="btn primary sm modelling-apply" disabled={(!notYet.length && !stale.length) || !scopeField} onClick={apply}>
            <Icon.plus /> {notYet.length ? `Bring in the ${notYet.length} not yet recorded`
              : stale.length ? `Bring ${stale.length} up to date with the reading`
              : "The whole ruleset is recorded, and the package is current"}
          </button>
        </div>
      </div>
    </div>
  );
}
