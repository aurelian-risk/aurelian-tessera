// SPDX-License-Identifier: MPL-2.0 · Copyright (c) Aurelian-Risk
// One shared definition of the two catalog "targets" - requirement and security
// measure - so the bundled-seed picker (CatalogAdd, on the tables) and the
// semi-deterministic table import (Documents) treat them analogously: same catalog
// shape, same value-mapping and de-dup, only the target entity type differs.
import type { EntityRecord, EntityTypeDef, FieldValue, Taxonomy } from "./types";
import type { Framework, FrameworkItem } from "./frameworks";
import { requirementValues, measureValues } from "./frameworks";
import { inPlayField } from "./taxonomy";
import { GROUPS_VOCABULARY, PARAMS_VOCABULARY, topGroupOf } from "./vocabulary";
import { BUNDLED_FRAMEWORKS, BUNDLED_MEASURE_CATALOGS } from "../profile";

/** Write a catalogue item's extra properties into the entity, for every property whose
 *  name matches a field the taxonomy declares. Values the primary mapping already set
 *  win, so a `category` property cannot displace the item's own category.
 *
 *  This is what lets a profile absorb a publisher's vocabulary without the engine
 *  knowing it: declare a field keyed `effort_level`, and an OSCAL catalogue carrying
 *  that property fills it. Declare nothing, and the property is simply not used. */
function withProps(type: EntityTypeDef, base: Record<string, FieldValue>, it: FrameworkItem): Record<string, FieldValue> {
  const out = { ...base };
  for (const f of type.fields) {
    // A field may instead name where its value comes from when the catalogue carries it
    // as structure rather than as a property: "@groups" is the top-level grouping the
    // item sits under, which is how a catalogue states the chapter - practice, family,
    // domain - a control belongs to. Without this the field stays empty however
    // faithfully the catalogue was read.
    const raw = f.vocabulary === GROUPS_VOCABULARY ? topGroupOf(it.section)
      : f.vocabulary === PARAMS_VOCABULARY ? it.params
      : it.props?.[f.key];
    if (raw == null || raw === "") continue;
    const set = out[f.key];
    if (set != null && set !== "" && !(Array.isArray(set) && set.length === 0)) continue;
    switch (f.type) {
      case "number": case "scale": {
        const n = Number(raw);
        if (Number.isFinite(n)) out[f.key] = n;
        break;
      }
      case "boolean":
        out[f.key] = !/^(0|false|nein|no)$/i.test(raw.trim());
        break;
      case "ref": case "multiref":
        break;                                    // a property is text; it cannot name a record id
      default:
        out[f.key] = raw;                         // text, textarea, enum - kept verbatim
    }
  }
  return out;
}

/** Resolve a catalogue item's identifier-valued properties onto the records they name.
 *
 *  A property is text and cannot hold a record id, so `withProps` leaves ref and multiref
 *  fields alone. But a publisher's component definition says, by identifier, which
 *  requirements it implements - and that is a relation, not a sentence. A list field that
 *  declares `vocabulary` naming the property gets those identifiers looked up among the
 *  records already in the study, by their own `ref_id`.
 *
 *  What does not resolve is simply not linked: the identifiers stay in the text field
 *  beside it, so nothing is lost and nothing is invented. */
export function refsFromProps(existing: EntityRecord[], type: EntityTypeDef, it: FrameworkItem): Record<string, FieldValue> {
  const out: Record<string, FieldValue> = {};
  for (const f of type.fields) {
    if (f.type !== "multiref" || !f.refType || !f.vocabulary) continue;
    const raw = it.props?.[f.vocabulary];
    if (!raw) continue;
    const wanted = new Set(String(raw).split(/[,;]/).map((x) => x.trim()).filter(Boolean));
    if (!wanted.size) continue;
    const ids = existing
      .filter((e) => e.type === f.refType && wanted.has(String(e.values.ref_id ?? "")))
      .map((e) => e.id);
    if (ids.length) out[f.key] = ids;
  }
  return out;
}

export interface CatalogTarget {
  kind: "requirement" | "measure";
  type: EntityTypeDef;
  bundled: Framework[];
  toValues: (fw: Framework, it: FrameworkItem) => Record<string, FieldValue>;
  /** true if an equivalent entity already exists in the study (de-dup). */
  exists: (existing: EntityRecord[], fw: Framework, it: FrameworkItem) => boolean;
}

// Taxonomy-driven detection (no hard-coded type keys):
//  · requirement = a type carrying both `framework` and `ref_id` fields;
//  · measure     = a type with a multiref back to the kill-chain step type (`covers`).
/** The state a record taken from a catalogue starts in: present, not adopted. Nobody has
 *  said yet that it applies here, and that is written as a value rather than left as an
 *  empty field, because an empty field is silence and an engine is free to read silence
 *  either way. Read as "in play", every entry ever taken from a catalogue would count in
 *  the coverage matrix, the radar and the checks from the moment it was taken.
 *
 *  It sits on the target rather than at the pickers, so the picker, the import and the
 *  derivation cannot drift apart. A caller that knows the record goes straight to work
 *  overrides it: its own values are spread after these. */
function seedState(tax: Taxonomy, typeKey: string): Record<string, FieldValue> {
  const inPlay = inPlayField(tax, typeKey);
  const off = inPlay?.field.options?.[0];
  return inPlay && off ? { [inPlay.field.key]: off } : {};
}

export function catalogTargets(tax: Taxonomy): CatalogTarget[] {
  const out: CatalogTarget[] = [];

  const reqType = tax.entityTypes.find((t) => t.fields.some((f) => f.key === "framework") && t.fields.some((f) => f.key === "ref_id"));
  if (reqType) out.push({
    kind: "requirement", type: reqType, bundled: BUNDLED_FRAMEWORKS,
    toValues: (fw, it) => withProps(reqType, { ...seedState(tax, reqType.key), ...requirementValues(fw, it) }, it),
    exists: (ex, fw, it) => ex.some((r) => String(r.values.framework ?? "") === fw.name && String(r.values.ref_id ?? "") === it.ref_id),
  });

  const stepType = tax.entityTypes.find((t) => t.fields.some((f) => f.type === "ref" && f.refType) && t.fields.some((f) => f.type === "number"));
  const measureType = tax.entityTypes.find((t) => t.key !== stepType?.key && t.fields.some((f) => f.type === "multiref" && f.refType === stepType?.key));
  if (measureType) out.push({
    kind: "measure", type: measureType, bundled: BUNDLED_MEASURE_CATALOGS,
    toValues: (fw, it) => withProps(measureType, { ...seedState(tax, measureType.key), ...measureValues(fw, it) }, it),
    // measures carry no ref_id/framework, so de-dup on the (case-insensitive) name.
    exists: (ex, _fw, it) => ex.some((m) => String(m.values.name ?? "").trim().toLowerCase() === it.title.trim().toLowerCase()),
  });

  return out;
}

export function targetByKind(tax: Taxonomy, kind: "requirement" | "measure"): CatalogTarget | undefined {
  return catalogTargets(tax).find((t) => t.kind === kind);
}
