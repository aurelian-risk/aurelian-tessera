// SPDX-License-Identifier: MPL-2.0 · Copyright (c) Aurelian-Risk
// The generic meta-schema: how to read, validate and reconcile records against a
// taxonomy - independent of WHICH taxonomy. The taxonomy itself is a product
// decision and lives in src/profile.
import type {
  EntityRecord, EntityTypeDef, FieldDef, FieldValue, Study, Taxonomy,
} from "./types";
import { DEFAULT_TAXONOMY, TAXONOMY_SCHEMA_VERSION } from "../profile";

export { DEFAULT_TAXONOMY, TAXONOMY_SCHEMA_VERSION };

// ── Helpers ────────────────────────────────────────────────────────────

export function getType(tax: Taxonomy, key: string): EntityTypeDef | undefined {
  return tax.entityTypes.find((t) => t.key === key);
}

export function getGroup(tax: Taxonomy, key: string) {
  return tax.groups.find((g) => g.key === key);
}

export function titleField(t: EntityTypeDef): string {
  return t.titleField ?? (t.fields.find((f) => f.type === "text")?.key ?? "name");
}

export function recordTitle(t: EntityTypeDef, r: EntityRecord): string {
  const v = r.values[titleField(t)];
  return typeof v === "string" && v.trim() ? v : "(untitled)";
}

/** Fields shown as table columns: everything non-textarea except the title. */
export function columnFields(t: EntityTypeDef): FieldDef[] {
  const title = titleField(t);
  return t.fields.filter(
    (f) => f.key !== title && f.type !== "textarea" && f.column !== false,
  );
}

export function refFields(t: EntityTypeDef): FieldDef[] {
  return t.fields.filter((f) => f.type === "ref" || f.type === "multiref");
}

export function emptyValues(t: EntityTypeDef): Record<string, FieldValue> {
  const v: Record<string, FieldValue> = {};
  for (const f of t.fields) {
    switch (f.type) {
      case "scale": v[f.key] = 2; break;
      case "number": v[f.key] = 0; break;
      case "boolean": v[f.key] = false; break;
      case "multiref": v[f.key] = []; break;
      case "ref": v[f.key] = null; break;
      // A NEW RECORD IS IN THE PERIMETER. For an ordinary enum the first option is a fair
      // default, but a two-state switch reads its FIRST option as "taken out" - so this
      // created every record outside the analysis, where no count, chart or figure would
      // ever see it, and nothing said so. The switch defaults to its second state; every
      // other enum keeps the first.
      case "enum":
        v[f.key] = (f.toggle && f.options?.length === 2 ? f.options[1] : f.options?.[0]) ?? "";
        break;
      default: v[f.key] = "";
    }
  }
  return v;
}

export function validateRecord(t: EntityTypeDef, values: Record<string, FieldValue>): string | null {
  for (const f of t.fields) {
    if (!f.required) continue;
    const v = values[f.key];
    const empty =
      v == null || v === "" || (Array.isArray(v) && v.length === 0);
    if (empty) return `"${f.label}" is required.`;
  }
  return null;
}

/** What to show for an enum value: the field's label for it, or the value itself. */
export function optionLabel(f: FieldDef, value: string): string {
  const i = f.options?.indexOf(value) ?? -1;
  return (i >= 0 ? f.optionLabels?.[i] : undefined) ?? value;
}

export function scaleMax(f: FieldDef): number {
  return f.scaleLabels?.length ?? 4;
}

export function scaleLabel(f: FieldDef, value: number): string {
  return f.scaleLabels?.[value - 1] ?? String(value);
}

/** Additively bring a stored taxonomy in line with the default one: enum fields whose
 *  vocabulary the default has since grown gain the missing options, and a field the
 *  default has since told where its values come from gains that declaration. Applied on
 *  load and on import, so an existing study picks up a new option (e.g. a further measure
 *  effect class) without the user having to reset the taxonomy and lose their
 *  customisations.
 *
 *  Runs at most once per stored taxonomy, gated on `schemaVersion` - so an option the
 *  user deliberately deleted is not resurrected on every load. Only enum vocabularies
 *  that still overlap the default one are extended; a taxonomy whose options were
 *  replaced wholesale is treated as user-owned and left alone. Nothing else is touched:
 *  no types, fields, labels or orders are added, removed or reordered.
 *
 *  `vocabulary` is carried over even where the options were replaced: it says where the
 *  values come from, which is the publisher's business rather than the user's, and a
 *  field that has lost it can no longer be refreshed from the source at all.
 *
 *  Returns the input unchanged when there is nothing to do. */
export function reconcileTaxonomy(tax: Taxonomy): Taxonomy {
  if ((tax.schemaVersion ?? 0) >= TAXONOMY_SCHEMA_VERSION) return tax;
  const entityTypes = tax.entityTypes.map((t) => {
    const def = DEFAULT_TAXONOMY.entityTypes.find((d) => d.key === t.key);
    if (!def) return t;
    let typeChanged = false;
    const fields = t.fields.map((f) => {
      const defF = def.fields.find((d) => d.key === f.key);
      let next = f;
      if (defF?.vocabulary && !f.vocabulary) { next = { ...next, vocabulary: defF.vocabulary }; typeChanged = true; }
      const opts = f.options;
      if (f.type !== "enum" || !opts) return next;
      const defOpts = defF?.type === "enum" ? defF.options : undefined;
      // No overlap at all = the user replaced this vocabulary with their own.
      if (!defOpts || !opts.some((o) => defOpts.includes(o))) return next;
      const missing = defOpts.filter((o) => !opts.includes(o));
      if (!missing.length) return next;
      typeChanged = true;
      return { ...next, options: [...opts, ...missing] };
    });
    return typeChanged ? { ...t, fields } : t;
  });
  return { ...tax, schemaVersion: TAXONOMY_SCHEMA_VERSION, entityTypes };
}

/** What a record holds in the fields dimWhen.lockedWhile names, as a list of raw values.
 *  Empty means the record is held by nothing. */
function heldBy(d: { lockedWhile?: string[] }, r: EntityRecord): string[] {
  const out: string[] = [];
  for (const key of d.lockedWhile ?? []) {
    const v = r.values[key];
    if (Array.isArray(v)) out.push(...v.map(String).filter(Boolean));
    else if (v != null && v !== "") out.push(String(v));
  }
  return out;
}

/** Is this record present but not in play? Declared by the taxonomy (dimWhen), not decided
 *  here: which states are dormant is a property of the method. Read wherever a record's
 *  presence would otherwise be taken for participation - a measure recorded from a
 *  publisher's library but not adopted must not defend anything, and a register that shows
 *  it must not count it.
 *
 *  A record held by its lockedWhile field is in play whatever the stored value says.
 *  `setBackBlocked` refuses to FLIP the switch while such a field holds something, which is
 *  the same fact - but a refusal only guards the one control that reads it. The relation
 *  can be made from the other end, by an editor that knows nothing about the switch, and
 *  then the record is stored as dormant while acting all the same: excluded from coverage
 *  and from the framework radar, and counted by the chain. One question cannot have two
 *  answers depending on which view asks it, so the fact decides and the stored value is
 *  read only where nothing holds the record. */
export function isSetBack(tax: Taxonomy, r: EntityRecord): boolean {
  return (tax.dimWhen ?? []).some((d) => d.type === r.type
    && d.values.includes(String(r.values[d.field] ?? ""))
    && !heldBy(d, r).length);
}

/** Why this record cannot be set back right now, or null. Declared through
 *  dimWhen.lockedWhile: a record whose named field says something is in play by that fact,
 *  and flipping the switch would leave the study saying two things at once.
 *
 *  The message NAMES what holds it. A count alone ("(1)") leaves the reader to go and find
 *  which one, which is the work the message was supposed to save. */
export function setBackBlocked(tax: Taxonomy, study: Study, r: EntityRecord): string | null {
  for (const d of tax.dimWhen ?? []) {
    if (d.type !== r.type || !d.lockedWhile?.length) continue;
    const t = tax.entityTypes.find((x) => x.key === r.type);
    for (const key of d.lockedWhile) {
      const f = t?.fields.find((x) => x.key === key);
      const held = heldBy({ lockedWhile: [key] }, r);
      if (!held.length) continue;
      const named = (f?.type === "ref" || f?.type === "multiref")
        ? held.map((id) => {
          const ref = study.entities.find((e) => e.id === id);
          const rt = ref && getType(tax, ref.type);
          return ref && rt ? recordTitle(rt, ref) : null;
        }).filter((x): x is string => !!x)
        : held;
      const shown = named.slice(0, 2).join(", ");
      const rest = named.length - Math.min(2, named.length);
      const what = shown ? `${shown}${rest > 0 ? ` and ${rest} more` : ""}` : `${held.length}`;
      return `In use: ${(f?.relation ?? f?.label ?? key).toLowerCase()} ${what}. Take it off there first.`;
    }
  }
  return null;
}

/** The field a taxonomy uses to set records of this type back, if it declares one, with
 *  the value that means "in play" - the SECOND option, as the toggle contract says. */
export function inPlayField(tax: Taxonomy, typeKey: string): { field: FieldDef; on: string } | null {
  const d = (tax.dimWhen ?? []).find((x) => x.type === typeKey);
  if (!d) return null;
  const t = tax.entityTypes.find((x) => x.key === typeKey);
  const field = t?.fields.find((f) => f.key === d.field);
  const on = field?.options?.[1];
  return field && on ? { field, on } : null;
}

/** The two-state field a type is switched by, if it declares one. */
export function toggleField(t: EntityTypeDef): FieldDef | undefined {
  return t.fields.find((f) => f.toggle && f.type === "enum" && f.options?.length === 2);
}

/** A type's switch and the two values it stands on: `off` is the first option, `on` the
 *  second, as the toggle contract says. Null for a type without a switch, so a caller can
 *  spread the result and stay generic. */
export function toggleStates(t: EntityTypeDef): { field: FieldDef; on: string; off: string } | null {
  const f = toggleField(t);
  const [off, on] = f?.options ?? [];
  return f && on && off ? { field: f, on, off } : null;
}
