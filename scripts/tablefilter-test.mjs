// SPDX-License-Identifier: MPL-2.0 · Copyright (c) Aurelian-Risk
// Search, facets and grouping for the entity tables.
//
// The rule under test is that all three are derived from the DATA. A requirement's
// framework and category are plain text fields, not enums, and they are exactly what an
// analyst wants to group by - so anything keyed off the schema would offer nothing here.
//
// A field pointing at other records is the second rule: "which requirements apply to THAT
// asset" is the question a register of a thousand rows is opened for, and a requirement
// naming three assets belongs under each of them rather than under a fourth category
// spelling all three out.
//
// Run: npm run test:tablefilter
import { pathToFileURL } from "node:url";

const need = (n) => { const v = process.env[n]; if (!v) { console.error(`set ${n}`); process.exit(2); } return v; };
const { facetsOf, countFacets, filterItems, groupItems, matchesQuery, haystack, activeCount, TOOLBAR_MIN_ROWS } =
  await import(pathToFileURL(need("MOD_TF")).href);

let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => { cond ? (pass++, console.log("✓", name)) : (fail++, console.log("✗", name, extra)); };

// A requirement type as the app defines it: every filterable field is free text.
const TYPE = {
  key: "requirement", label: "Requirement", labelPlural: "Requirements", group: "compliance",
  fields: [
    { key: "name", label: "Title", type: "text", required: true },
    { key: "ref_id", label: "Reference ID", type: "text" },
    { key: "framework", label: "Framework", type: "text" },
    { key: "category", label: "Category", type: "text" },
    { key: "description", label: "Description", type: "textarea" },
    { key: "priority", label: "Priority", type: "scale", scaleLabels: ["low", "moderate", "high", "critical"] },
    { key: "applies_to", label: "Applies to asset", type: "multiref", refType: "asset" },
    { key: "owner", label: "Owner", type: "ref", refType: "role" },
  ],
};
// The titles the app resolves from the study before it gets here. An id nobody knows reads
// as nothing, which is what an entity deleted out from under a reference leaves behind.
const NAMES = { a1: "Grid control", a2: "Billing", a3: "Customer portal", r1: "CISO", r2: "Head of IT" };
const display = (f, v) => {
  if (v == null || v === "") return [];
  if (f.type === "scale") return typeof v === "number" ? [f.scaleLabels?.[v - 1] ?? String(v)] : [];
  if (f.type === "multiref") return Array.isArray(v) ? v.map((id) => NAMES[id] ?? "").filter(Boolean) : [];
  if (f.type === "ref") return [NAMES[v] ?? ""].filter(Boolean);
  return [String(v)];
};
const rec = (id, values) => ({ id, type: "requirement", values, createdAt: "", updatedAt: "" });

const ITEMS = [
  rec("1", { name: "Risk analysis", ref_id: "21(2)(a)", framework: "NIS2", category: "Governance", priority: 4, description: "Policies for risk analysis.", applies_to: ["a1", "a2"], owner: "r1" }),
  rec("2", { name: "Incident handling", ref_id: "21(2)(b)", framework: "NIS2", category: "Operations", priority: 3, applies_to: ["a1"], owner: "r1" }),
  rec("3", { name: "Business continuity", ref_id: "21(2)(c)", framework: "NIS2", category: "Resilience", priority: 3, applies_to: ["a1", "a2", "a3"], owner: "r2" }),
  rec("4", { name: "Supply chain security", ref_id: "21(2)(d)", framework: "NIS2", category: "Supply chain", priority: 2, applies_to: ["a3"], owner: "r2" }),
  rec("5", { name: "Data Security", ref_id: "PR.DS", framework: "NIST CSF", category: "Protect", priority: 4, applies_to: ["a2"], owner: "r1" }),
  rec("6", { name: "Continuous Monitoring", ref_id: "DE.CM", framework: "NIST CSF", category: "Detect", priority: 3, applies_to: ["a1"], owner: "r2" }),
  rec("7", { name: "Access Control", ref_id: "AC", framework: "NIST 800-53", category: "Control family", priority: 4, applies_to: ["a3"], owner: "r1" }),
  rec("8", { name: "Audit and Accountability", ref_id: "AU", framework: "NIST 800-53", category: "Control family", priority: 2, applies_to: [], owner: "r2" }),
  rec("9", { name: "Uncategorised one", ref_id: "X1", framework: "NIST 800-53", category: "", priority: 1 }),
];

// ── what is offered ──────────────────────────────────────────────────────
const facets = facetsOf(TYPE, ITEMS, display);
const keys = facets.map((f) => f.field.key);
ok("offers the free-text fields whose values repeat", keys.includes("framework") && keys.includes("category"), keys.join(","));
ok("offers a scale field by its label", keys.includes("priority"), keys.join(","));
ok("never offers the title", !keys.includes("name"), keys.join(","));
ok("never offers free description text", !keys.includes("description"), keys.join(","));
ok("drops an identifier column, where every row differs", !keys.includes("ref_id"), keys.join(","));

const fw = facets.find((f) => f.field.key === "framework");
ok("counts each value", fw.values.find((v) => v.value === "NIS2").count === 4 && fw.values.find((v) => v.value === "NIST CSF").count === 2,
  JSON.stringify(fw.values));
ok("puts the commonest value first", fw.values[0].value === "NIS2", fw.values[0].value);
ok("a scale reads as its label, not its number",
  facets.find((f) => f.field.key === "priority").values.some((v) => v.value === "critical"));

{
  // One value everywhere is no choice; a value per row is a haystack of its own.
  const same = ITEMS.map((r) => rec(r.id, { ...r.values, framework: "NIS2" }));
  ok("a field with one value is not offered", !facetsOf(TYPE, same, display).some((f) => f.field.key === "framework"));
  const many = Array.from({ length: 30 }, (_, i) => rec(String(i), { name: `n${i}`, framework: `FW${i}` }));
  ok("a field with too many values is not offered", !facetsOf(TYPE, many, display).some((f) => f.field.key === "framework"));
}

// ── search ───────────────────────────────────────────────────────────────
ok("all words must appear, in any order and any field",
  matchesQuery(haystack(TYPE, ITEMS[0], display), "nis2 risk") && !matchesQuery(haystack(TYPE, ITEMS[0], display), "nis2 backup"));
ok("quotes keep a phrase together",
  matchesQuery(haystack(TYPE, ITEMS[3], display), '"supply chain"') && !matchesQuery(haystack(TYPE, ITEMS[3], display), '"chain supply"'));
ok("search covers the description too", filterItems(ITEMS, TYPE, "policies", {}, display).length === 1);
ok("an empty query changes nothing", filterItems(ITEMS, TYPE, "   ", {}, display).length === ITEMS.length);
ok("search is case-insensitive", filterItems(ITEMS, TYPE, "NIST csf", {}, display).length === 2);

// ── filtering ────────────────────────────────────────────────────────────
ok("values within one field are alternatives",
  filterItems(ITEMS, TYPE, "", { framework: ["NIS2", "NIST CSF"] }, display).length === 6);
ok("different fields must all hold",
  filterItems(ITEMS, TYPE, "", { framework: ["NIS2"], category: ["Operations"] }, display).length === 1);
ok("search and filters combine",
  filterItems(ITEMS, TYPE, "security", { framework: ["NIS2"] }, display).length === 1);
ok("an empty selection on a field is no filter",
  filterItems(ITEMS, TYPE, "", { framework: [] }, display).length === ITEMS.length);
ok("a filter matching nothing yields nothing, rather than everything",
  filterItems(ITEMS, TYPE, "", { framework: ["ISO 27001"] }, display).length === 0);
ok("counts what is active", activeCount({ framework: ["NIS2", "NIST CSF"], category: ["Protect"] }) === 3);

// ── grouping ─────────────────────────────────────────────────────────────
{
  const groups = groupItems(ITEMS, TYPE.fields.find((f) => f.key === "framework"), display);
  ok("groups by the displayed value", groups.length === 3, `${groups.length}`);
  ok("the biggest group comes first", groups[0].key === "NIS2" && groups[0].items.length === 4);
  ok("no row is lost", groups.reduce((n, g) => n + g.items.length, 0) === ITEMS.length);
}
{
  // A row with no value must not vanish - that would read as data loss.
  const groups = groupItems(ITEMS, TYPE.fields.find((f) => f.key === "category"), display);
  const blank = groups.find((g) => g.key === "");
  ok("rows without a value form their own group", !!blank && blank.items.length === 1);
  ok("that group comes last", groups[groups.length - 1].key === "");
}
ok("grouping by nothing yields one group", groupItems(ITEMS, null, display).length === 1);

// ── a field that points at other records ─────────────────────────────────
{
  const keys = facets.map((f) => f.field.key);
  ok("a reference is offered as a facet", keys.includes("applies_to") && keys.includes("owner"), keys.join(","));

  const at = facets.find((f) => f.field.key === "applies_to");
  ok("a row counts under each record it names",
    at.values.find((v) => v.value === "Grid control").count === 4
    && at.values.find((v) => v.value === "Billing").count === 3,
    JSON.stringify(at.values));
  ok("...so the counts add up to more than the table holds",
    at.values.reduce((n, v) => n + v.count, 0) === 10, JSON.stringify(at.values));

  ok("picking one keeps the rows that name it among others",
    filterItems(ITEMS, TYPE, "", { applies_to: ["Grid control"] }, display).length === 4);
  ok("two of them are alternatives, not both at once",
    filterItems(ITEMS, TYPE, "", { applies_to: ["Grid control", "Customer portal"] }, display).length === 6);
  ok("a reference filter still combines with another field",
    filterItems(ITEMS, TYPE, "", { applies_to: ["Grid control"], framework: ["NIS2"] }, display).length === 3);

  const groups = groupItems(ITEMS, TYPE.fields.find((f) => f.key === "applies_to"), display);
  ok("grouping puts a row under each record it names",
    groups.find((g) => g.key === "Grid control").items.length === 4
    && groups.reduce((n, g) => n + g.items.length, 0) === 12,
    groups.map((g) => `${g.key || "-"}:${g.items.length}`).join(" "));
  ok("...and every row is somewhere, including the ones naming none",
    new Set(groups.flatMap((g) => g.items.map((r) => r.id))).size === ITEMS.length);
  ok("rows naming none form the trailing group", groups[groups.length - 1].key === ""
    && groups[groups.length - 1].items.length === 2);

  // A reference to one record partitions the table like any other field.
  const byOwner = groupItems(ITEMS, TYPE.fields.find((f) => f.key === "owner"), display);
  ok("a reference to a single record loses no row and duplicates none",
    byOwner.reduce((n, g) => n + g.items.length, 0) === ITEMS.length, `${byOwner.length} groups`);

  // The names are the reader's, not the ids'. An id nobody knows must not become a chip.
  const stale = [...ITEMS, rec("10", { name: "Stale", framework: "NIS2", applies_to: ["gone"] })];
  ok("a reference to a record that is gone reads as no value, not as an id",
    !facetsOf(TYPE, stale, display).find((f) => f.field.key === "applies_to")
      .values.some((v) => v.value === "gone"));

  // Search still stops at references: matching a linked name would return a row with no
  // visible reason for matching, and the facet is the way to ask that question.
  ok("search does not follow a reference",
    filterItems(ITEMS, TYPE, "grid control", {}, display).length === 0);

  // The wider limit for references: forty assets is a menu, forty free-text values is not.
  const assets = Array.from({ length: 40 }, (_, i) => `a${i}`);
  Object.assign(NAMES, Object.fromEntries(assets.map((a, i) => [a, `Asset ${i}`])));
  const wide = Array.from({ length: 90 }, (_, i) =>
    rec(`w${i}`, { name: `w${i}`, framework: `FW${i % 30}`, applies_to: [assets[i % 40]] }));
  const wf = facetsOf(TYPE, wide, display).map((f) => f.field.key);
  ok("forty referenced records are still offered", wf.includes("applies_to"), wf.join(","));
  ok("...where thirty free-text values are not", !wf.includes("framework"), wf.join(","));
}

ok("the toolbar threshold is a small table, not a large one", TOOLBAR_MIN_ROWS >= 5 && TOOLBAR_MIN_ROWS <= 15, String(TOOLBAR_MIN_ROWS));

// ── counts follow the current filters ────────────────────────────────────
//
// A count that stays put while the table narrows tells the reader nothing. What must NOT
// move is which chips exist - they would slide under the pointer.
{
  const base = facetsOf(TYPE, ITEMS, display);
  const narrowed = countFacets(base, ITEMS, TYPE, "", { category: ["Control family"] }, display);
  const fw = narrowed.find((f) => f.field.key === "framework");
  ok("counts narrow under another field's filter",
    fw.values.find((v) => v.value === "NIST 800-53").count === 2 && fw.values.find((v) => v.value === "NIS2").count === 0,
    JSON.stringify(fw.values));
  ok("values that are left with nothing stay listed, at zero",
    fw.values.length === base.find((f) => f.field.key === "framework").values.length);

  // Its own selection is ignored: the alternatives must still show what they would give.
  const own = countFacets(base, ITEMS, TYPE, "", { framework: ["NIS2"] }, display)
    .find((f) => f.field.key === "framework");
  ok("a field is counted ignoring its own selection",
    own.values.find((v) => v.value === "NIST CSF").count === 2, JSON.stringify(own.values));

  const bySearch = countFacets(base, ITEMS, TYPE, "security", {}, display).find((f) => f.field.key === "framework");
  ok("counts follow the search box too", bySearch.values.find((v) => v.value === "NIS2").count === 1,
    JSON.stringify(bySearch.values));
  ok("with nothing selected the counts are the plain ones",
    JSON.stringify(countFacets(base, ITEMS, TYPE, "", {}, display)) === JSON.stringify(base));
}

// A two-state field rendered as a switch is what the register is FOR; the others describe
// what is in it. It comes first among the facets, whatever its cardinality.
{
  const t = { key: "r", label: "R", labelPlural: "Rs", group: "g", fields: [
    { key: "name", label: "Name", type: "text", required: true },
    { key: "kind", label: "Kind", type: "enum", options: ["a", "b", "c"] },
    { key: "scope", label: "In scope", type: "enum", options: ["out", "in"], toggle: true },
  ] };
  const rows = [
    { id: "1", type: "r", values: { name: "one", kind: "a", scope: "in" }, createdAt: "", updatedAt: "" },
    { id: "2", type: "r", values: { name: "two", kind: "b", scope: "out" }, createdAt: "", updatedAt: "" },
    { id: "3", type: "r", values: { name: "three", kind: "c", scope: "out" }, createdAt: "", updatedAt: "" },
    { id: "4", type: "r", values: { name: "four", kind: "a", scope: "out" }, createdAt: "", updatedAt: "" },
  ];
  const fs = facetsOf(t, rows, (f, v) => (v == null ? [] : [String(v)]));
  ok("the switch field is offered as the first facet", fs[0]?.field.key === "scope",
    fs.map((f) => f.field.key).join(","));
  ok("...and the others are still offered", fs.some((f) => f.field.key === "kind"));
}

console.log(`\n${pass}/${pass + fail} table-filter assertions passed · ${fail} failed`);
process.exit(fail ? 1 : 0);
