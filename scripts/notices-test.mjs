// Does the licence notice describe the file that is shipped?
//
// `THIRD-PARTY-NOTICES.md` is a statement about the distribution: these libraries are inside
// the single file you downloaded, under these terms. It is mirrored, so it is a published
// statement. It named `d3-force` from v0.4.1 to v0.5.1 - declared as a dependency, imported
// nowhere, and not once in the artefact. Nobody had reason to look, because nothing breaks
// when a notice is too generous.
//
// So it is asked of the built file, the way the language model's absence is: every package
// the notice names has to leave a trace in `dist/index.html`, and every runtime dependency
// in `package.json` has to be named by the notice.
//
//   npm run test:notices        (after npm run build)
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artefact = resolve(root, "dist/index.html");

let pass = 0, fail = 0;
const ok = (name, cond, detail) => {
  if (cond) { pass++; console.log(`✓ ${name}`); }
  else { fail++; console.log(`✗ ${name}${detail ? ` — ${detail}` : ""}`); }
};

if (!existsSync(artefact)) {
  console.log("✗ no dist/index.html — run npm run build first");
  process.exit(1);
}
const html = readFileSync(artefact, "utf8");
const notice = readFileSync(resolve(root, "THIRD-PARTY-NOTICES.md"), "utf8");
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));

/** A package leaves its own kind of trace: a bundled name is minified away, so each is
 *  looked for by something only that library puts in the file. */
const TRACE = {
  react: /createElement|useSyncExternalStore/,
  "react-dom": /react-dom|hydrateRoot|createRoot/,
  zustand: /getState|setState/,
  "js-yaml": /YAMLException|js-yaml/,
  "pdfjs-dist": /pdfjs|getDocument|PDFDocument/,
  "d3-force": /forceSimulation|forceCollide|d3-force/,
};

/** Named in the notice, under either heading. */
const named = [...notice.matchAll(/^\|\s*`([^`]+)`\s*\|/gm)].map((m) => m[1]);
ok("the notice names something", named.length > 0, named.join(", "));

// The generative branch is loaded on request and is not in the released build by design,
// so it is named under its own heading and is not asked of the artefact.
const ONLY_ON_REQUEST = new Set(["@huggingface/transformers"]);

for (const p of named) {
  if (ONLY_ON_REQUEST.has(p)) {
    ok(`${p} is named as loaded on request, not as bundled`,
      !html.includes("SmolLM2") && !html.includes("WebLLM"));
    continue;
  }
  const trace = TRACE[p];
  ok(`${p} is named by the notice and is in the artefact`,
    !!trace && trace.test(html),
    trace ? "no trace in dist/index.html" : "no trace pattern known for this package - add one");
}

// The other direction: a dependency that ships and is not named would be the licence
// omission that actually matters.
for (const p of Object.keys(pkg.dependencies ?? {})) {
  if (ONLY_ON_REQUEST.has(p)) continue;
  ok(`${p} is a dependency and the notice names it`, named.includes(p));
}

console.log(`\n${pass}/${pass + fail} notice assertions passed · ${fail} failed`);
process.exit(fail ? 1 : 0);
