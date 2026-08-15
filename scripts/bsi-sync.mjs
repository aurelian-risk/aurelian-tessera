// Pull the published Grundschutz++ ruleset into this build.
//
//   npm run sync        · on its own
//   npm run build       · runs it first, so every build carries the current ruleset
//
// Two files are written, both generated and both git-ignored:
//
//   src/profile/gspp/vocabulary.generated.ts  the four namespaces, in the BSI's order and
//                                             grouping, plus the category hierarchy
//   src/profile/gspp/catalog.generated.ts     all 1000 requirements, parsed
//
// The vocabularies come from documentation/namespaces/*.csv, which is where the BSI
// DEFINES them, and are then checked against the catalogue, which is where the BSI USES
// them: a term applied but not defined, or defined but never applied, is reported rather
// than quietly averaged. That check is the point of deriving these lists instead of
// typing them.
//
// Neither file is committed. The repository holds no foreign ruleset; the build output
// does, which is what makes the product work without preparation. A running installation
// can go further and refresh from the publisher at any time — see PUBLISHED_CATALOGS.
//
// Offline: the last download is cached under node_modules/.cache/bsi and reused, with a
// conditional request so an unchanged file costs nothing. With no network and no cache
// the build stops here rather than producing a product with an empty catalogue.
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const out = resolve(root, "src/profile/gspp/vocabulary.generated.ts");
const outCatalog = resolve(root, "src/profile/gspp/catalog.generated.ts");
const outComponents = resolve(root, "src/profile/gspp/components.generated.ts");
const cache = resolve(root, "node_modules/.cache/bsi");
mkdirSync(cache, { recursive: true });

const RAW = "https://raw.githubusercontent.com/BSI-Bund/Stand-der-Technik-Bibliothek/main";
/** The implementation layer: what the BSI publishes about things that implement its
 *  requirements. Each one names the controls it implements, so the link between a measure
 *  and its requirements is read rather than guessed. */
const COMPONENTS = [
  "AWS Beispiel-Components/AWS Security Hub",
  "GA-Lotse_Grundmodul/GA-Lotse_Grundmodul",
  "Keycloak/Keycloak",
  "Lieferkettensicherheit/Lieferkettensicherheit",
  "Netzarchitektur/Netzarchitektur",
  "Passwortrichtlinie/Passwortrichtlinie",
];
/** The BSI's own mapping collections. An institution arriving from the 2023 compendium or
 *  from ISO 27001 has a body of work already done; the mapping says which Grundschutz++
 *  requirement each of its controls corresponds to, and how closely. Applied, not
 *  re-derived — deriving a mapping ourselves would state a correspondence the BSI did not.
 *  The relationship is kept with each entry, because "subset-of" and "equal-to" are not
 *  the same claim and a migration that flattens them overstates what was carried over. */
const MAPPINGS = [
  { key: "itgs_2023", label: "IT-Grundschutz-Kompendium 2023",
    url: `${RAW}/control_layer/Mappings/IT-GS2023-zu-GSpp/ITGS-to-GS%2B%2B-mapping_collection.json` },
  { key: "iso_27001", label: "ISO/IEC 27001 Annex A",
    url: `${RAW}/control_layer/Mappings/ISO-27001-zu-GSpp/ISO27001-AnnexA-to-GS%2B%2B-mapping_collection.json` },
];
const NS = `${RAW}/documentation/namespaces`;
const URLS = {
  practices: `${NS}/practices.csv`,
  categories: `${NS}/target_object_categories.csv`,
  secLevel: `${NS}/security_level.csv`,
  modalVerb: `${NS}/modal_verbs.csv`,
  catalog: `${RAW}/control_layer/Grundschutz%2B%2B/Grundschutz%2B%2B-resolved_catalog.json`,
};

/** Quote-aware CSV → array of row objects keyed by the header line. */
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; }
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const head = rows.shift().map((h) => h.trim());
  return rows.filter((r) => r.some((v) => v.trim()))
    .map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim()])));
}

/** Fetch, but ask the publisher whether anything changed first. An unchanged 5 MB
 *  catalogue then costs one round trip instead of a download, which is what makes running
 *  this on every build reasonable. Falls back to the cache when the network is away. */
const get = async (url) => {
  const key = resolve(cache, encodeURIComponent(url).replace(/%/g, "_").slice(-120));
  const tag = `${key}.etag`;
  const cached = existsSync(key) ? readFileSync(key, "utf8") : null;
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: cached && existsSync(tag) ? { "If-None-Match": readFileSync(tag, "utf8") } : {},
    });
    if (res.status === 304 && cached != null) return cached;
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const body = await res.text();
    writeFileSync(key, body);
    const etag = res.headers.get("etag");
    if (etag) writeFileSync(tag, etag);
    return body;
  } catch (e) {
    if (cached != null) {
      console.log(`  · ${url.split("/").pop()}: ${e instanceof Error ? e.message : e} — using the cached copy`);
      return cached;
    }
    throw new Error(`${url} could not be fetched and is not cached: ${e instanceof Error ? e.message : e}`);
  }
};

console.log("Reading the published namespaces…");
const [practicesCsv, categoriesCsv, secLevelCsv, modalVerbCsv, catalogJson] =
  await Promise.all(Object.values(URLS).map(get));

// ── The four lists, as the BSI defines them ──────────────────────────────

// "GC Governance und Compliance" — the form the catalogue's own group labels take, so the
// two are comparable and a requirement's practice can be matched against this list.
const practiceRows = parseCsv(practicesCsv)
  .filter((r) => r["Kürzel"] && r["Kürzel"] !== "EXMP")            // EXMP is the BSI's test entry
  .sort((a, b) => Number(a.Nummerierung ?? 0) - Number(b.Nummerierung ?? 0));
const practices = practiceRows.map((r) => `${r["Kürzel"]} ${r.Begriff}`);

// Kept in the BSI's own grouping (the CSV's `Typ`), because that grouping is what makes a
// list of 39 readable. Groups appear in the order the CSV first shows them.
const catRows = parseCsv(categoriesCsv).filter((r) => r.Zielobjekt);
const catGroups = [];
for (const r of catRows) {
  const typ = r.Typ || "—";
  (catGroups.find((g) => g.typ === typ) ?? catGroups[catGroups.push({ typ, items: [] }) - 1]).items.push(r.Zielobjekt);
}
const categories = catGroups.flatMap((g) => g.items);

// The categories are a TREE, and the method turns on it: STM.2.1.4.1 requires every
// parent up to the root to be added to an asset's categories before the requirements are
// collected. `ChildOfUUID` carries the edges; a flat list cannot express the step at all.
const nameOf = new Map(catRows.map((r) => [r.UUID, r.Zielobjekt]));
const parentOf = {};
for (const r of catRows) {
  const p = nameOf.get(r.ChildOfUUID);
  if (p) parentOf[r.Zielobjekt] = p;
}
const roots = categories.filter((c) => !parentOf[c]);
const depthOf = (c) => (parentOf[c] ? 1 + depthOf(parentOf[c]) : 1);
const depth = Math.max(...categories.map(depthOf));
const secLevel = parseCsv(secLevelCsv).map((r) => r.Begriff).filter(Boolean);
// The CSV is alphabetical; the ruleset's own order is by how binding the verb is.
const RANK = { MUSS: 0, SOLLTE: 1, KANN: 2 };
const modalVerb = parseCsv(modalVerbCsv).map((r) => r.Begriff).filter(Boolean)
  .sort((a, b) => (RANK[a] ?? 9) - (RANK[b] ?? 9));

// ── What the catalogue actually uses ─────────────────────────────────────
const catalog = JSON.parse(catalogJson).catalog;
const used = { practices: new Set(), categories: new Set(), secLevel: new Set(), modalVerb: new Set() };
const scanParts = (parts) => {
  for (const pt of parts ?? []) {
    for (const p of pt.props ?? []) {
      if (p.name === "target_object_categories") String(p.value).split(",").forEach((v) => used.categories.add(v.trim()));
      if (p.name === "modal_verb") used.modalVerb.add(String(p.value));
    }
    scanParts(pt.parts);
  }
};
const scanControl = (c) => {
  for (const p of c.props ?? []) if (p.name === "sec_level") used.secLevel.add(String(p.value));
  scanParts(c.parts);
  for (const n of c.controls ?? []) scanControl(n);
};
let requirements = 0;
const scanGroup = (g, top) => {
  const label = [g.id, g.title].filter(Boolean).join(" ").trim();
  const t = top ?? label;
  if (t) used.practices.add(t);
  for (const c of g.controls ?? []) { requirements++; scanControl(c); countNested(c); }
  for (const s of g.groups ?? []) scanGroup(s, t);
};
function countNested(c) { for (const n of c.controls ?? []) { requirements++; countNested(n); } }
for (const g of catalog.groups ?? []) scanGroup(g, null);

// The BSI ships a test practice in the catalogue too; it is not part of the namespace.
used.practices.delete("EXMP Beispiel");
for (const p of [...used.practices]) if (/^EXMP\b/.test(p)) used.practices.delete(p);

let complaints = 0;
const compare = (what, defined, usedSet) => {
  const undef = [...usedSet].filter((v) => v && !defined.includes(v));
  const unused = defined.filter((v) => !usedSet.has(v));
  if (undef.length) { complaints++; console.log(`  ! ${what}: used by the catalogue, not defined in the namespace — ${undef.join(", ")}`); }
  if (unused.length) console.log(`  · ${what}: defined but not used anywhere in the catalogue — ${unused.join(", ")}`);
  if (!undef.length && !unused.length) console.log(`  ✓ ${what}: ${defined.length}, definition and use agree`);
};
console.log(`\nChecked against ${catalog.metadata.title}, ${requirements} requirements:`);
compare("practices", practices, used.practices);
compare("target object categories", categories, used.categories);
compare("security levels", secLevel, used.secLevel);
compare("modal verbs", modalVerb, used.modalVerb);

// ── Write ────────────────────────────────────────────────────────────────
const q = (s) => JSON.stringify(s);
const list = (items, indent = "  ") => items.map((v) => `${indent}${q(v)},`).join("\n");
const grouped = catGroups.map((g) => `    // ${g.typ}\n${list(g.items, "    ")}`).join("\n");

const file = `// GENERATED by npm run vocab:sync — do not edit by hand.
//
// The BSI's published namespaces, re-derived from
// github.com/BSI-Bund/Stand-der-Technik-Bibliothek, documentation/namespaces/*.csv,
// and checked against the requirements of ${catalog.metadata.title}.
//
// Checked against catalogue version ${catalog.metadata.version}
// Written ${new Date().toISOString().slice(0, 10)}
//
// These are terms, in the publisher's order and grouping. A running installation can
// refresh them from the catalogue as well, without waiting for a new build: the fields
// that use them declare where their values come from (taxonomy.ts, rule 3).

export const VOCABULARY_SOURCE = {
  name: ${q(catalog.metadata.title)},
  version: ${q(catalog.metadata.version)},
  at: ${q(new Date().toISOString().slice(0, 10))},
};

export const VOCABULARY = {
  /** practices.csv — the ${practices.length} practices, in the BSI's numbering, without the test entry. */
  praktiken: [
${list(practices)}
  ],
  /** target_object_categories.csv — all ${categories.length}, in the BSI's own grouping. */
  zielobjektkategorien: [
${grouped}
  ],
  /** The category tree, child → parent. ${roots.length} roots, ${depth} levels deep.
   *  STM.2.1.4.1: every parent up to the root joins an asset's categories before its
   *  requirements are collected, and the inheritance is deterministic because this
   *  hierarchy is fixed. Without it the modelling step cannot be carried out. */
  parentCategory: {
${categories.filter((c) => parentOf[c]).map((c) => `    ${q(c)}: ${q(parentOf[c])},`).join("\n")}
  } as Record<string, string>,
  /** security_level.csv — the level from which a requirement applies. */
  secLevel: [
${list(secLevel)}
  ],
  /** modal_verbs.csv — ordered by how binding the verb is, not alphabetically. */
  modalVerb: [
${list(modalVerb)}
  ],
};
`;
writeFileSync(out, file);
console.log(`\nWritten ${out.replace(root, ".")} · ${practices.length} practices · ${categories.length} categories`);

// ── The ruleset itself ───────────────────────────────────────────────────
// Parsed rather than raw: the reader turns 5.4 MB of OSCAL into the 1.5 MB the product
// actually reads, and the same reader runs on an imported file, so what is bundled and
// what is imported cannot drift apart. Bundling the parse also means the requirements are
// there on first start, without a preparation step.
const entry = resolve(cache, "oscal-entry.mjs");
writeFileSync(entry, `export { parseOscalCatalog, parseOscalComponents, linkComponents } from ${JSON.stringify(resolve(root, "src/domain/oscal"))};\n`);
const bundled = resolve(cache, "oscal.mjs");
execFileSync("npx", ["esbuild", entry, "--bundle", "--format=esm", `--outfile=${bundled}`, "--log-level=error"], { cwd: root });
const { parseOscalCatalog, parseOscalComponents, linkComponents } = await import(pathToFileURL(bundled).href);

const fw = parseOscalCatalog(catalogJson, "Grundschutz++");
// alt-identifier looks like a UUID with no use, and was dropped here until the
// implementation layer showed what it is for: the component definitions reference
// requirements by exactly that UUID, not by the readable identifier. It is the join key
// between what must be achieved and what achieves it, and 304 of 305 references in the
// published components resolve through it. Kept.
// ── What the institution may already have done ──────────────────────────
// Each mapping becomes one property per requirement, named after the ruleset it comes
// from, so the taxonomy picks it up by declaring a field of that name — the same rule as
// every other property. Unmapped requirements simply carry nothing.
const mapCounts = [];
for (const m of MAPPINGS) {
  let raw;
  try { raw = await get(m.url); } catch (e) { console.log(`  · ${m.key}: ${e.message}`); continue; }
  let entries = 0, hit = 0;
  const byTarget = new Map();
  for (const one of JSON.parse(raw)["mapping-collection"]?.mappings ?? []) {
    for (const e of one.maps ?? []) {
      entries++;
      const rel = e.relationship ?? "";
      for (const src of e.sources ?? []) {
        for (const tgt of e.targets ?? []) {
          const id = tgt["id-ref"];
          if (!id || !src["id-ref"]) continue;
          const line = `${src["id-ref"]} (${rel})`;
          const seen = byTarget.get(id);
          if (seen) { if (!seen.includes(line)) seen.push(line); }
          else byTarget.set(id, [line]);
        }
      }
    }
  }
  for (const it of fw.items) {
    const lines = byTarget.get(it.ref_id);
    if (!lines?.length) continue;
    hit++;
    it.props = { ...(it.props ?? {}), [m.key]: lines.sort().join(", ") };
  }
  mapCounts.push(`${m.label}: ${entries} entries → ${hit} requirements`);
  console.log(`  · ${m.label}: ${entries} mapping entries, reaching ${hit} of ${fw.items.length} requirements`);
}

const payload = JSON.stringify(fw);

writeFileSync(outCatalog, `// GENERATED by npm run sync — do not edit by hand, and do not commit.
//
// ${fw.name}, as published by the BSI:
// github.com/BSI-Bund/Stand-der-Technik-Bibliothek
// ${fw.source}
// Fetched ${new Date().toISOString().slice(0, 10)} · ${fw.items.length} requirements
// Mappings carried with it — ${mapCounts.join(" · ") || "none reachable"}
//
// Licence: CC BY-SA 4.0. Parsed by src/domain/oscal.ts — the same reader that runs on a
// file the user imports, so a bundled and an imported catalogue cannot come out different.
import type { Framework } from "../../domain/frameworks";

export const GRUNDSCHUTZ_PP: Framework = ${payload};
`);
const mb = (n) => (n / 1e6).toFixed(2);
console.log(`Written ${outCatalog.replace(root, ".")} · ${fw.items.length} requirements · ${mb(payload.length)} MB parsed, from ${mb(catalogJson.length)} MB of OSCAL`);

// ── What implements it ──────────────────────────────────────────────────
const comps = [];
let refs = 0, open = [];
for (const c of COMPONENTS) {
  const [dir, file] = c.split("/");
  const url = `${RAW}/implementation_layer/${encodeURIComponent(dir)}/${encodeURIComponent(file)}-component_definition.json`;
  let raw;
  try { raw = await get(url); } catch (e) { console.log(`  · ${file}: ${e.message}`); continue; }
  const one = parseOscalComponents(raw, file);
  const { linked, unresolved } = linkComponents(one, fw, "alt-identifier");
  refs += linked.items.reduce((n, it) => n + (it.props?.implements ? it.props.implements.split(",").length : 0), 0);
  open.push(...unresolved);
  comps.push(...linked.items.map((it) => ({ ...it, section: linked.name })));
}
const componentsFw = {
  key: "gspp-components", name: "Grundschutz++ implementations, as published",
  source: `BSI Stand-der-Technik-Bibliothek, implementation layer · ${COMPONENTS.length} definitions`,
  items: comps,
};
writeFileSync(outComponents, `// GENERATED by npm run sync — do not edit by hand, and do not commit.
//
// The BSI's own component definitions: what implements which requirement, read from
// implementation_layer/ and resolved against the catalogue through alt-identifier.
// Fetched ${new Date().toISOString().slice(0, 10)} · ${comps.length} components · ${refs} requirement references
//
// Licence: CC BY-SA 4.0, as the catalogue.
import type { Framework } from "../../domain/frameworks";

export const GSPP_COMPONENTS: Framework = ${JSON.stringify(componentsFw)};
`);
console.log(`Written ${outComponents.replace(root, ".")} · ${comps.length} components · ${refs} requirement references${open.length ? ` · ${open.length} unresolved: ${[...new Set(open)].slice(0, 3).join(", ")}` : " · all resolved"}`);

if (complaints) { console.log("\nA term the catalogue uses is missing from the namespace — check before committing."); process.exit(1); }
