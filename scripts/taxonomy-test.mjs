// SPDX-License-Identifier: MPL-2.0 · Copyright (c) Aurelian-Risk
// Unit test for the additive taxonomy migration (reconcileTaxonomy).
//
// This path cannot be reached from the e2e run: that starts from empty storage and
// therefore always gets the current default taxonomy. A stored taxonomy from an older
// build only appears on a real upgrade - exactly the case where a mistake is silent and
// costs the user their customisations. Hence a dedicated test over the bundled module.
//
// Product-neutral on purpose. reconcileTaxonomy compares a stored taxonomy against the
// ACTIVE default one, so the test picks its subject out of that default - the first enum
// vocabulary with enough options to prune and regrow - rather than naming a type that only
// one product has. A sibling product built on this engine runs the same file unchanged.
//
// Run: npm run test:taxonomy   (esbuild bundles the pure module into node_modules/.cache)
import { pathToFileURL } from "node:url";

const MOD = process.env.MOD;
if (!MOD) { console.error("set MOD=<bundled taxonomy.mjs>"); process.exit(2); }
const { DEFAULT_TAXONOMY, TAXONOMY_SCHEMA_VERSION, reconcileTaxonomy, isSetBack, setBackBlocked }
  = await import(pathToFileURL(MOD).href);

let pass = 0, fail = 0;
const ok = (name, cond) => { cond ? (pass++, console.log("✓", name)) : (fail++, console.log("✗", name)); };
const clone = (o) => JSON.parse(JSON.stringify(o));

/** Two enum vocabularies out of the active default: one to prune and regrow, a second to
 *  show the migration is not specific to the first. Both need at least three options. */
const enums = [];
for (const t of DEFAULT_TAXONOMY.entityTypes) {
  for (const f of t.fields) if (f.type === "enum" && (f.options?.length ?? 0) >= 3) enums.push({ type: t.key, field: f.key, full: [...f.options] });
}
if (enums.length < 2) { console.error("the active taxonomy has fewer than two enum vocabularies to test against"); process.exit(2); }
const SUBJECT = enums[0], OTHER = enums.find((e) => e.type !== SUBJECT.type || e.field !== SUBJECT.field);
const NEWEST = SUBJECT.full[SUBJECT.full.length - 1];        // stands in for the option a new build added
const KEPT = SUBJECT.full.slice(0, SUBJECT.full.length - 1);

const mt = (tax) => tax.entityTypes.find((t) => t.key === SUBJECT.type).fields.find((f) => f.key === SUBJECT.field).options;
const setMt = (tax, opts) => { mt(tax).length = 0; mt(tax).push(...opts); return tax; };
/** A taxonomy as an older build would have persisted it: an earlier schema, and the
 *  subject vocabulary without its most recent option. */
const stored = () => setMt(Object.assign(clone(DEFAULT_TAXONOMY), { schemaVersion: TAXONOMY_SCHEMA_VERSION - 1 }), KEPT);

// ── The upgrade case ──────────────────────────────────────────────────────
const old = stored();
const migrated = reconcileTaxonomy(old);
ok(`a stored vocabulary gains the option the default has since added (${SUBJECT.type}.${SUBJECT.field} → ${NEWEST})`,
  mt(migrated).length === SUBJECT.full.length && mt(migrated).includes(NEWEST));
ok("existing options keep their order", mt(migrated).slice(0, KEPT.length).join() === KEPT.join());
ok("the stored taxonomy is not mutated in place", mt(old).length === KEPT.length && old.schemaVersion === TAXONOMY_SCHEMA_VERSION - 1);
ok("schema version is stamped forward", migrated.schemaVersion === TAXONOMY_SCHEMA_VERSION);

// ── Customisations must survive ───────────────────────────────────────────
const custom = setMt(stored(), ["Eigenwert A", "Eigenwert B"]);
ok("a replaced vocabulary is left alone", mt(reconcileTaxonomy(custom)).join() === "Eigenwert A,Eigenwert B");
ok("a replaced vocabulary is still version-stamped", reconcileTaxonomy(custom).schemaVersion === TAXONOMY_SCHEMA_VERSION);

const extended = stored();
mt(extended).push("Eigene Ergänzung");
const ext = mt(reconcileTaxonomy(extended));
ok("an own extra option survives alongside the new default", ext.includes("Eigene Ergänzung") && ext.includes(NEWEST));

// ── Runs at most once ─────────────────────────────────────────────────────
const pruned = setMt(stored(), KEPT.slice(0, 2));              // the user deleted some options
const once = reconcileTaxonomy(pruned);
ok("a pruned vocabulary is topped up once", mt(once).length === SUBJECT.full.length);
ok("a deleted option is not resurrected on the next load", reconcileTaxonomy(once) === once);
ok("the current default is returned unchanged", reconcileTaxonomy(DEFAULT_TAXONOMY) === DEFAULT_TAXONOMY);
ok("re-running on a migrated taxonomy is a no-op", reconcileTaxonomy(migrated) === migrated);
ok("a taxonomy with no schemaVersion migrates", reconcileTaxonomy({ ...stored(), schemaVersion: undefined }).schemaVersion === TAXONOMY_SCHEMA_VERSION);

// ── The generic meta-schema must not be assumed to be the default one ─────
const weird = stored();
weird.entityTypes.push({ key: "my_type", label: "X", labelPlural: "Xs", group: DEFAULT_TAXONOMY.groups[0].key, fields: [{ key: "k", label: "K", type: "enum", options: ["a"] }] });
ok("unknown entity types pass through untouched", reconcileTaxonomy(weird).entityTypes.find((t) => t.key === "my_type").fields[0].options.join() === "a");

const missing = stored();
missing.entityTypes = missing.entityTypes.filter((t) => t.key !== DEFAULT_TAXONOMY.entityTypes[0].key);
ok("a taxonomy missing a default type still migrates", reconcileTaxonomy(missing).entityTypes.length === stored().entityTypes.length - 1);

const noEnums = { ...stored(), entityTypes: [{ key: SUBJECT.type, label: "M", labelPlural: "Ms", group: DEFAULT_TAXONOMY.groups[0].key, fields: [{ key: "name", label: "Name", type: "text" }] }] };
ok("a type without enum fields is left as-is", reconcileTaxonomy(noEnums).entityTypes[0].fields.length === 1);

// Migration is generic: a second, unrelated vocabulary is reconciled the same way.
const second = stored();
const other = second.entityTypes.find((t) => t.key === OTHER.type).fields.find((f) => f.key === OTHER.field);
other.options = other.options.slice(0, 2);
ok(`any default enum vocabulary is reconciled, not just the first (${OTHER.type}.${OTHER.field})`,
  reconcileTaxonomy(second).entityTypes.find((t) => t.key === OTHER.type).fields.find((f) => f.key === OTHER.field).options.join() === OTHER.full.join());

// ── Where a field's values come from ──────────────────────────────────────
// A build may tell a field which published vocabulary it draws on. That declaration has
// to reach a taxonomy stored before it existed, or the field can never be refreshed from
// the source again. Driven by declaring it on the default for the length of this block,
// so the check holds whichever profile is active - and removed again afterwards.
const defField = DEFAULT_TAXONOMY.entityTypes.find((t) => t.key === SUBJECT.type).fields.find((f) => f.key === SUBJECT.field);
const hadVocabulary = defField.vocabulary;
defField.vocabulary = "test_source";
const fld = (tax) => tax.entityTypes.find((t) => t.key === SUBJECT.type).fields.find((f) => f.key === SUBJECT.field);
/** As a build that did not yet declare the source would have stored it. */
const beforeDeclared = () => { const t = stored(); delete fld(t).vocabulary; return t; };

ok("a stored field gains the declaration of where its values come from",
  fld(reconcileTaxonomy(beforeDeclared())).vocabulary === "test_source");
const ownOptions = setMt(beforeDeclared(), ["Eigenwert A", "Eigenwert B"]);
ok("...even where the user replaced the options, so the field stays refreshable",
  fld(reconcileTaxonomy(ownOptions)).vocabulary === "test_source"
  && fld(reconcileTaxonomy(ownOptions)).options.join() === "Eigenwert A,Eigenwert B");
const ownSource = beforeDeclared();
fld(ownSource).vocabulary = "meine_quelle";
ok("...but a source the user set is not overwritten",
  fld(reconcileTaxonomy(ownSource)).vocabulary === "meine_quelle");
if (hadVocabulary === undefined) delete defField.vocabulary; else defField.vocabulary = hadVocabulary;
ok("the default is left as this check found it", defField.vocabulary === hadVocabulary);

// ── set back, and what overrules it ──────────────────────────────────────────
//
// Two functions read dimWhen.lockedWhile and they have to read it the same way. The
// refusal guards one control; the reading is what every register, chart and export asks.
// A relation made from the other end - an editor that fills the field without going near
// the switch - reaches a state the refusal was written to prevent, and before this the two
// disagreed about it: the coverage matrix left the record out while the chain counted it.
//
// Synthetic on purpose. lockedWhile is a declaration a product may or may not make, so a
// test that reached into the active default would assert nothing in a product that
// declares none.
{
  const TAX = {
    entityTypes: [{
      key: "control", label: "Control", labelPlural: "Controls", fields: [
        { key: "name", label: "Name", type: "text" },
        { key: "scope", label: "Scope", type: "enum", options: ["not in use", "in use"] },
        { key: "covers", label: "Covers", type: "multiref", refType: "step", relation: "covers" },
        { key: "owner", label: "Owner", type: "text" },
      ],
    }, {
      key: "step", label: "Step", labelPlural: "Steps",
      fields: [{ key: "name", label: "Name", type: "text" }],
    }],
    dimWhen: [{ type: "control", field: "scope", values: ["not in use", ""], lockedWhile: ["covers"] }],
  };
  const step = { id: "s1", type: "step", values: { name: "Gain a foothold" } };
  const rec = (values) => ({ id: "c1", type: "control", values });
  const study = { entities: [step] };

  ok("a control left at the dormant value is set back",
    isSetBack(TAX, rec({ scope: "not in use", covers: [] })));
  ok("...and one with no value at all is too, because empty is declared dormant",
    isSetBack(TAX, rec({})));
  ok("...while one switched on is not", !isSetBack(TAX, rec({ scope: "in use" })));

  const held = rec({ scope: "not in use", covers: ["s1"] });
  ok("a control that covers a step is in play whatever the switch says", !isSetBack(TAX, held));
  ok("...and the switch is refused, so the two agree", !!setBackBlocked(TAX, study, held));
  ok("...with the refusal naming what holds it, not counting it",
    /Gain a foothold/.test(setBackBlocked(TAX, study, held) ?? ""));
  ok("a control held only by an unsaved reference is still in play",
    !isSetBack(TAX, rec({ scope: "not in use", covers: ["gone"] })));

  // The empty forms of a multiref are the ones that used to slip through as "held".
  ok("an empty list does not hold anything", isSetBack(TAX, rec({ scope: "not in use", covers: [] })));
  ok("...nor a list of empty strings", isSetBack(TAX, rec({ scope: "not in use", covers: ["", ""] })));
  ok("...nor an empty string in a single field",
    isSetBack(TAX, rec({ scope: "not in use", covers: "" })));

  // Only the named field overrules. Anything else on the record is just data.
  ok("a field lockedWhile does not name leaves the record set back",
    isSetBack(TAX, rec({ scope: "not in use", owner: "Security office" })));
  ok("...and nothing holds a record whose lockedWhile field is empty",
    !setBackBlocked(TAX, study, rec({ scope: "not in use", covers: [] })));

  // A type the taxonomy says nothing about is never dormant, which is what keeps every
  // has()-guarded reader working in a product that declares no switch at all.
  ok("an undeclared type is never set back", !isSetBack(TAX, { id: "x", type: "step", values: {} }));
  ok("...and a taxonomy with no dimWhen at all sets nothing back",
    !isSetBack({ entityTypes: TAX.entityTypes }, rec({ scope: "not in use" })));
}

console.log(`\n${pass}/${pass + fail} taxonomy-migration assertions passed · ${fail} failed`);
process.exit(fail ? 1 : 0);
