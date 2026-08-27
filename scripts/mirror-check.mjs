// SPDX-License-Identifier: MPL-2.0 · Copyright (c) Aurelian-Risk
// Every tracked path is declared private, mirrored or mirror-only. An undeclared path stops
// the sync by name.
//
// The procedure in docs/mirror.md is a list of rsync excludes, and a list of excludes only
// answers the paths somebody thought of. The v0.4.0 release found three it had not: the
// rsync overwrote files the mirror owned, it carried `.gitignore` across, and it published
// the private `samples/README.md`. Each was caught by reading the diff, which is not a
// check.
//
// So the question is turned round. Not "what is excluded" but "what is every path, and
// which of the three is it?" A file added tomorrow matches nothing and is named here, which
// is the only state this script treats as an error in its own right - the others are
// judgements somebody already made.
//
// Run: npm run mirror:check          before pushing the mirror, and after every rsync
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { dangling } from "./mirror-pkg.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// MIRROR= points it elsewhere - used to check the check itself against a tree that is
// known to hold private files.
const mirror = process.env.MIRROR ? resolve(process.env.MIRROR) : resolve(root, "public");

/** Never published. Each one says why, because "why not" is the part that gets forgotten. */
const PRIVATE = [
  [/^samples\/(?!test-corpus\.txt$)/, "licensed import fixtures - ISO, BSI, PCI subsets"],
  [/^docs\/media\/(?!demo\.webp$)/, "recorded video; only the still the README embeds goes"],
  [/^docs\/(method|frequency-model|resistance-model|control-effect-model)\.md$/,
    "the quantification and its design records - not this product's feature"],
  [/^docs\/mirror\.md$/, "this procedure"],
  [/^(CLAUDE|ROADMAP)\.md$/, "how the work is organised"],
  [/^harness\//, "local probes and model harness"],
  [/^viz-demo\.html$/, "scratch"],
  [/^scripts\/demo-video\.mjs$/, "recording script"],
  [/^scripts\/(mirror-push|mirror-sync)\.mjs$/, "the release and mirroring procedure, like docs/mirror.md"],
  // The mechanism says more about when this is worked on than the stamps it removes.
  [/^scripts\/(stamp|stamp-test)\.mjs$/, "when this is worked on"],
  [/^scripts\/hooks\//, "when this is worked on"],
  [/\.generated\.ts$/, "the ruleset - produced at build time, in neither repository"],
];

/** The same list as rsync arguments, so the sync and the check cannot drift apart.
 *
 *  They had. The excludes in docs/mirror.md were written by hand from the PRIVATE list and
 *  then the list grew: the timestamp hook, its script and its test, and the release
 *  procedure were all declared private and all copied into the mirror by a sync that had
 *  never heard of them. One list, read by both.
 *
 *      rsync -a --delete $(node scripts/mirror-check.mjs --excludes) ./ public/
 *
 *  Patterns that cannot be said as a glob are left out and named; they are the ones the
 *  check has to catch afterwards. */
export const EXCLUDES = [
  "samples/*", "docs/media/*", "docs/method.md", "docs/frequency-model.md",
  "docs/resistance-model.md", "docs/control-effect-model.md", "docs/mirror.md",
  "CLAUDE.md", "ROADMAP.md", "harness", "viz-demo.html",
  "scripts/demo-video.mjs", "scripts/mirror-push.mjs", "scripts/mirror-sync.mjs",
  "scripts/stamp.mjs", "scripts/stamp-test.mjs", "scripts/hooks",
  "src/profile/gspp/*.generated.ts",
  ".git", "node_modules", "dist", "public", ".gitignore",
];

// One pattern per line and no quoting, so it can only be used with --exclude-from. The
// quoted-argument form was tried and it does not survive word splitting: rsync received
// `'public'` with the quotes and excluded nothing. Prefer scripts/mirror-sync.mjs, which
// passes them as an array and never involves a shell.
if (process.argv.includes("--excludes")) {
  console.log(EXCLUDES.join("\n"));
  process.exit(0);
}

/** Every exclude has to correspond to something the classifier calls private, or the two
 *  are drifting again in the other direction. */
const excludesNotPrivate = () => EXCLUDES.filter((e) => {
  if (/^(\.git|node_modules|dist|public|\.gitignore)$/.test(e)) return false;   // build output, not secrets
  // An exclude may name a file, a glob, or a bare directory; the classifier matches paths.
  const probe = e.replace(/\/\*$/, "/x").replace(/\*/g, "x");
  return classifyRaw(probe) !== "private" && classifyRaw(`${probe}/x`) !== "private";
});

/** Present in the mirror and not here. */
const MIRROR_ONLY = [];

/** Everything else is published as it stands. Listed as prefixes rather than assumed, so a
 *  new top-level file is undeclared rather than quietly shared. */
const SHARED = [
  /^src\//, /^scripts\//, /^docs\//, /^samples\/test-corpus\.txt$/, /^docs\/media\/demo\.webp$/,
  /^(README|CHANGELOG|NOTICE|MATURITY|TRADEMARK|THIRD-PARTY-NOTICES)\.md$/, /^LICENSE$/,
  /^(package|package-lock|tsconfig)\.json$/, /^(vite\.config\.ts|index\.html|\.gitignore)$/,
];

/** Every path git knows about in `dir`, INCLUDING what is there but not yet added.
 *
 *  Reading only the tracked ones leaves this check blind at the one moment it is needed.
 *  The rsync puts files into the mirror untracked; the check then sees nothing; `git add -A`
 *  takes them in; the commit is made. On 2026-08-27 that carried four declared-private files
 *  across - the timestamp hook, its script and its test, and the release procedure - and the
 *  check had said "nothing leaked" ten seconds earlier. An exclude list answers the paths
 *  somebody thought of; this reads what is actually lying there. */
const present = (dir) =>
  execFileSync("git", ["-C", dir, "ls-files", "--cached", "--others", "--exclude-standard"],
    { encoding: "utf8" }).split("\n").filter(Boolean);

const tracked = (dir) =>
  execFileSync("git", ["-C", dir, "ls-files"], { encoding: "utf8" }).split("\n").filter(Boolean);

const classifyRaw = (p) => (PRIVATE.some(([re]) => re.test(p)) ? "private" : "other");

const classify = (p) => {
  for (const [re, why] of PRIVATE) if (re.test(p)) return { cls: "private", why };
  for (const re of SHARED) if (re.test(p)) return { cls: "shared" };
  return { cls: "undeclared" };
};

let problems = 0;
const say = (s) => console.log(s);

// ── this repository ────────────────────────────────────────────────────
const here = tracked(root);
const undeclared = here.filter((p) => classify(p).cls === "undeclared");
const priv = here.filter((p) => classify(p).cls === "private");
say(`${here.length} tracked here · ${priv.length} private · ${here.length - priv.length - undeclared.length} mirrored`);
if (undeclared.length) {
  problems += undeclared.length;
  say(`\n${undeclared.length} path${undeclared.length === 1 ? "" : "s"} declared neither private nor mirrored:`);
  for (const p of undeclared) say(`  ${p}`);
  say("  → add it to PRIVATE or SHARED in this file. A path nobody classified is a path");
  say("    the rsync decides about, which is how the private build reached three releases.");
}

// ── the mirror, if it is here ──────────────────────────────────────────
if (!existsSync(resolve(mirror, ".git"))) {
  say("\npublic/ is not a checkout here - the mirror half of this check did not run.");
} else {
  const there = present(mirror);
  const leaked = there.filter((p) => classify(p).cls === "private");
  const strays = there.filter((p) => classify(p).cls === "undeclared" && !MIRROR_ONLY.some((re) => re.test(p)));
  say(`\n${there.length} tracked in public/`);
  if (leaked.length) {
    problems += leaked.length;
    say(`\n${leaked.length} private path${leaked.length === 1 ? "" : "s"} are IN the mirror:`);
    for (const p of leaked) say(`  ${p}  - ${classify(p).why}`);
    say("  → rm them from public/, and add the exclude to the rsync in docs/mirror.md.");
    say("    (git -C public rm --cached <path> as well, where one is already committed.)");
  }
  if (strays.length) {
    problems += strays.length;
    say(`\n${strays.length} path${strays.length === 1 ? "" : "s"} in the mirror that this repository does not declare:`);
    for (const p of strays) say(`  ${p}`);
  }
  // The two the release checks by hand, asserted rather than remembered.
  const samples = there.filter((p) => p.startsWith("samples/"));
  const media = there.filter((p) => p.startsWith("docs/media/"));
  const ok = (name, cond, detail) => {
    if (cond) say(`✓ ${name}`);
    else { problems++; say(`✗ ${name}${detail ? ` — ${detail}` : ""}`); }
  };
  ok("the mirror's samples/ holds the test corpus and nothing else",
    samples.length === 1 && samples[0] === "samples/test-corpus.txt", samples.join(", ") || "empty");
  ok("the mirror's docs/media holds the still the README embeds and nothing else",
    media.length === 1 && media[0] === "docs/media/demo.webp", media.join(", ") || "empty");

  // The rsync copies this repository's package.json over verbatim, and it names work that
  // only exists here - the model harness, the mirroring machinery, the demo recording. A
  // starter without its script is quieter than a script without its starter: the second
  // breaks when it is called, the first is never called and nobody finds out. Nine of them
  // stood in the published package.json before this check existed.
  const mpkg = resolve(mirror, "package.json");
  const gone = existsSync(mpkg) ? dangling(JSON.parse(readFileSync(mpkg, "utf8")), mirror) : [];
  ok("every rsync exclude names something the classifier calls private",
    excludesNotPrivate().length === 0, excludesNotPrivate().join(", "));
  ok("every npm script in the mirror has the file it runs", gone.length === 0,
    gone.length ? `${gone.map((g) => g.name).join(", ")} → node scripts/mirror-pkg.mjs` : undefined);

  // The author of a mirror commit is the PROJECT ACCOUNT, by its GitHub noreply address -
  // the same one the main stream uses, and the only kind of address GitHub attributes to an
  // account at all. A personal address shows as no account; the machine's global identity
  // showed as a stranger's. Set per repository, never globally: the private repository goes
  // on committing under the personal address.
  const AUTHOR = "309364953+aurelian-risk@users.noreply.github.com";
  const AUTHOR_NAME = "aurelian-risk";
  const cfg = (k) => {
    try { return execFileSync("git", ["-C", mirror, "config", "--local", "--get", k], { encoding: "utf8" }).trim(); }
    catch { return ""; }
  };
  ok("the mirror commits under the project account, set in the mirror itself",
    cfg("user.email") === AUTHOR && cfg("user.name") === AUTHOR_NAME,
    `${cfg("user.name") || "no user.name"} <${cfg("user.email") || "no user.email - it would fall through to the global one"}>`);
  const strangers = [...new Set(execFileSync("git",
    ["-C", mirror, "log", "--format=%ae%n%ce", "HEAD"], { encoding: "utf8" })
    .split("\n").map((x) => x.trim()).filter(Boolean))].filter((e) => e !== AUTHOR);
  ok("...and every commit on the branch was written under it",
    strangers.length === 0, strangers.join(", "));
  // A tag is signed by whoever made it and that name stands on the release page.
  const tagged = execFileSync("git",
    ["-C", mirror, "for-each-ref", "refs/tags", "--format=%(refname:short) %(taggeremail)"],
    { encoding: "utf8" }).split("\n").map((x) => x.trim()).filter(Boolean)
    .filter((l) => l.includes(" <") && !l.endsWith(`<${AUTHOR}>`));
  ok("...and so was every tag on it", tagged.length === 0, tagged.join(", "));

  // What is published carries the hour it was written. This repository is worked on outside
  // office hours and the history should say so rather than the opposite; a stamp inside the
  // window is a statement about the author's week that nobody meant to publish. It is
  // checked here rather than remembered, because a commit cannot be re-dated after a push
  // without rewriting what is already out.
  const WINDOW = { from: 9 * 60, to: 17 * 60 + 30 };   // Mon-Fri, local time
  const inWindow = (iso) => {
    const d = new Date(iso);
    const day = d.getDay();
    if (day === 0 || day === 6) return false;
    const m = d.getHours() * 60 + d.getMinutes();
    return m >= WINDOW.from && m < WINDOW.to;
  };
  const stamped = [
    ...execFileSync("git", ["-C", mirror, "log", "--format=%h %aI %cI"], { encoding: "utf8" })
      .split("\n").filter(Boolean)
      .map((l) => { const [sha, a, c] = l.split(" "); return { what: sha, when: [a, c] }; }),
    ...execFileSync("git", ["-C", mirror, "for-each-ref", "refs/tags",
      "--format=%(refname:short) %(taggerdate:iso-strict)"], { encoding: "utf8" })
      .split("\n").filter(Boolean)
      .map((l) => { const [t, d] = l.split(" "); return { what: t, when: [d] }; }),
  ].filter((x) => x.when.some((w) => w && inWindow(w)));
  ok("nothing is stamped inside office hours on a weekday",
    stamped.length === 0,
    stamped.map((x) => `${x.what} ${new Date(x.when[0]).toLocaleString("de-DE")}`).join(", "));
}

say(problems ? `\n${problems} to answer before pushing` : "\nnothing undeclared, nothing leaked");
process.exit(problems ? 1 : 0);
