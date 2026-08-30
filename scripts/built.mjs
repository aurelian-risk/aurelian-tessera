// Is dist/index.html the build of the sources beside it?
//
// Eight files here read that artefact and nothing else - the e2e run, the notice check,
// the seal-import and perf harnesses, the white-page check, the flow measurement, the demo
// recording, and the release push. A build that FAILS leaves the previous artefact in
// place, so every one of them keeps working and reports on a file nobody asked for.
//
// That is not hypothetical. Proving a button check worked, this suite reported 364/364
// twice against the wording the check had just been written to reject: tsc had refused the
// build over an unused import and dist was the good file from before. Nothing in a run
// said which build it had seen.
//
// The release push is the expensive one. It already refuses an asset that does not report
// the version being released - but a stale artefact of the SAME version passes that, and
// what goes out is then code nobody reviewed under a number that says otherwise.
//
// Compared against src/ recursively plus the two files outside it that change what is
// built. A file's mtime is a weak signal in general; here it is the right one, because the
// question is only ever "did the build run after the edit".
import { statSync, readdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

/** The newest mtime under a directory, in ms. Missing directory reads as 0. */
function newest(dir) {
  if (!existsSync(dir)) return 0;
  let t = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    t = Math.max(t, e.isDirectory() ? newest(full) : statSync(full).mtimeMs);
  }
  return t;
}

/** What the artefact would have to be newer than, and how much newer it is (ms). */
export function buildAge(root) {
  const art = resolve(root, "dist/index.html");
  if (!existsSync(art)) return { art, missing: true };
  let src = newest(resolve(root, "src"));
  for (const f of ["index.html", "vite.config.ts", "package.json"]) {
    const p = resolve(root, f);
    if (existsSync(p)) src = Math.max(src, statSync(p).mtimeMs);
  }
  return { art, missing: false, behind: src - statSync(art).mtimeMs };
}

/** Stop the caller unless dist/index.html is the build of the sources beside it, and hand
 *  back the path to it. Exit code 2, so a runner can tell "did not measure" from "measured
 *  and failed".
 *
 *  Returning the path is Aurelian Lite's addition, made when they adopted this: their flow
 *  matrix writes `const dist = requireFreshBuild(process.cwd())`, which reads as one act
 *  rather than a guard and then a path assembled again beside it. Their rewrite dropped
 *  buildAge, which the release push here reads, so only the return value comes back. */
export function requireFreshBuild(root, what = "this check") {
  const r = buildAge(root);
  if (r.missing) {
    console.log(`✗ no ${r.art} - ${what} reads the built artefact and there is none.`
      + " Run npm run build.");
    process.exit(2);
  }
  if (r.behind > 0) {
    console.log(`✗ dist/index.html is ${Math.round(r.behind / 1000)}s older than the newest`
      + ` source file - the build did not run, or it failed. ${what} would have measured the`
      + " previous build. Run npm run build and read its output.");
    process.exit(2);
  }
  return r.art;
}
