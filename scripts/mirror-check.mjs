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
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

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
  [/\.generated\.ts$/, "the ruleset - produced at build time, in neither repository"],
];

/** Present in the mirror and not here. */
const MIRROR_ONLY = [];

/** Everything else is published as it stands. Listed as prefixes rather than assumed, so a
 *  new top-level file is undeclared rather than quietly shared. */
const SHARED = [
  /^src\//, /^scripts\//, /^docs\//, /^samples\/test-corpus\.txt$/, /^docs\/media\/demo\.webp$/,
  /^(README|CHANGELOG|NOTICE|MATURITY|TRADEMARK|THIRD-PARTY-NOTICES)\.md$/, /^LICENSE$/,
  /^(package|package-lock|tsconfig)\.json$/, /^(vite\.config\.ts|index\.html|\.gitignore)$/,
];

const tracked = (dir) =>
  execFileSync("git", ["-C", dir, "ls-files"], { encoding: "utf8" }).split("\n").filter(Boolean);

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
  const there = tracked(mirror);
  const leaked = there.filter((p) => classify(p).cls === "private");
  const strays = there.filter((p) => classify(p).cls === "undeclared" && !MIRROR_ONLY.some((re) => re.test(p)));
  say(`\n${there.length} tracked in public/`);
  if (leaked.length) {
    problems += leaked.length;
    say(`\n${leaked.length} private path${leaked.length === 1 ? "" : "s"} are IN the mirror:`);
    for (const p of leaked) say(`  ${p}  - ${classify(p).why}`);
    say("  → git -C public rm --cached <path>, and add the exclude to docs/mirror.md.");
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
}

say(problems ? `\n${problems} to answer before pushing` : "\nnothing undeclared, nothing leaked");
process.exit(problems ? 1 : 0);
