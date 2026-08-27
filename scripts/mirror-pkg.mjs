// Take out of the mirror's package.json the scripts whose files the mirror does not carry.
//
// The rsync copies this repository's package.json over verbatim, and it names work that
// only exists here: the local model harness, the mirroring machinery, the demo recording.
// Whoever clones the published repository gets nine `npm run` entries that cannot run.
//
// A starter without a script is quieter than a script without a starter - the second breaks
// when it is called, the first is never called and nobody finds out. So it is derived and
// asserted rather than kept as a list: every script that names a file is checked against
// what is actually in the mirror, and `mirror-check` refuses a release where one dangles.
//
//   node scripts/mirror-pkg.mjs            prune public/package.json in place
//   node scripts/mirror-pkg.mjs --check    say what would go, change nothing
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const mirror = process.env.MIRROR ? resolve(process.env.MIRROR) : resolve(root, "public");

/** The repository-relative files a script command names. A command that names none - `vite`,
 *  `tsc -b && vite build` - is left alone: there is nothing to be missing. */
export function filesNamedBy(cmd) {
  return [...cmd.matchAll(/(?:^|[\s=])((?:\.\/)?(?:scripts|harness|src)\/[\w./-]+\.(?:mjs|ts|js))/g)]
    .map((m) => m[1].replace(/^\.\//, ""));
}

/** Which scripts of a package.json cannot run in `dir`, and what is missing from each. */
export function dangling(pkg, dir) {
  const out = [];
  for (const [name, cmd] of Object.entries(pkg.scripts ?? {})) {
    const missing = filesNamedBy(cmd).filter((f) => !existsSync(resolve(dir, f)));
    if (missing.length) out.push({ name, missing });
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const path = resolve(mirror, "package.json");
  if (!existsSync(path)) { console.log(`no ${path}`); process.exit(2); }
  const pkg = JSON.parse(readFileSync(path, "utf8"));
  const gone = dangling(pkg, mirror);
  if (!gone.length) { console.log("mirror package.json: every script has its file"); process.exit(0); }
  for (const g of gone) console.log(`  ${g.name}  → ${g.missing.join(", ")}`);
  if (process.argv.includes("--check")) process.exit(1);
  for (const g of gone) delete pkg.scripts[g.name];
  writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n");
  console.log(`${gone.length} script${gone.length === 1 ? "" : "s"} taken out of the mirror's package.json`);
}
