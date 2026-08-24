# Remembering how a table was arranged

Status: **built and measured**, 2026-08-22 · Scope: main repo and mirror

A reader who folds a long table away, goes to another workshop and comes back should find
the table as they left it. The feature is small; the ways it goes wrong are not, and this
paper is mostly about those.

---

## 1. The decision that shapes everything else: it is not study data

A fold belongs to whoever is reading, not to the analysis. Put it in the study and it:

- travels in every export, so a colleague inherits your fold state;
- turns up in an import diff as a change to review;
- **lands in the hash-chained log** — so collapsing a group would be recorded as an edit to
  the assessment, and would move the head a seal covers.

That last one settles it. It lives in `localStorage` under its own keys, and nothing in
`viewstate.ts` touches a study. `scripts/viewstate-test.mjs` asserts the separation from the
other side too: there is no API for remembering a filter, and the test fails if one appears.

---

## 2. Arrangement is remembered; selection is not

| remembered | not remembered |
|---|---|
| which groups are folded away | the search text |
| which field the table is grouped by | which facet values are picked |
| whether the attack-paths panel is folded | which row's detail is open |

**Grouping changes how rows are laid out. A facet changes which rows exist.** Coming back to
a table that silently holds fewer records than it has — with no visible cause — is a trap,
and the fold state would be meaningless against a different set of rows anyway.

Grouping had to be included for a reason found by measurement rather than by design: the
first version remembered folds but not grouping, and the folds appeared to be forgotten. They
were not — the *scope* had changed, because a table grouped by a different field is a
different layout and gets its own memory. With the grouping reset on every visit, the folds
were being looked up under a name that no longer existed.

---

## 3. Three things keep it from becoming a burden

**Only the deviation is stored.** Groups are open by default, so the payload is the size of
what somebody folded, not of what they have. A table of 1200 requirements with nothing folded
costs nothing at all, and unfolding everything deletes the entry rather than storing an empty
one.

**Writes are coalesced.** `localStorage` is synchronous; a write per click is a stall per
click. Folds are written 400 ms after the last change, so clicking through ten groups writes
once. Measured: 40 folds in a burst produce **exactly one** write.

**It is bounded and self-evicting.** At most 60 tables and 200 folded keys per table. Beyond
that the least recently *used* scope goes.

That word was earned. The first version ordered eviction by `Date.now()`, and a test that
created 120 scopes in a loop failed intermittently — because they all landed in the same
millisecond and the sort had nothing to work with. It now counts touches: a logical clock,
initialised from the highest value already stored, which orders exactly. The test that found
it was itself rewritten to wait for the write rather than for a length of time, since a fixed
sleep against a debounce is a race that passes on an idle machine and fails on a busy one.

---

## 4. What it costs

`npm run test:perf`, sample study, median of repeated runs:

| | Chromium | Firefox |
|---|---|---|
| fold a group | 74 ms | 231 ms |
| **expand a row (control, no storage at all)** | **74 ms** | **268 ms** |
| return to a folded table | 103 ms | 337 ms |
| switch workshop tab (baseline) | 206 ms | 406 ms |

The control is the point. Expanding a row re-renders the same table and touches no storage;
in Firefox it is *slower* than folding. So what these numbers measure is the table
re-rendering, not the fold memory — which costs nothing measurable in either engine. The
performance harness asserts that as a relative claim, because an absolute budget cannot
express "adds nothing".

Firefox re-renders this table roughly three times as slowly as Chromium. That is a
pre-existing property of the table, unrelated to this work, and worth writing down because
the first budget was set from Chromium numbers and wrongly accused this feature.

---

## 5. Where it lives

| | |
|---|---|
| `src/domain/viewstate.ts` | the whole of it; no React, no store |
| `EntitySection` | reads folds on mount, writes on toggle, and names the scope |
| `TableTools` / `useTableFilter` | optional `scope`: remembers the grouping |
| `AttackPathsView` | the panel's own fold |
| `store.deleteStudy` | calls `forgetStudy`, so folds do not outlive the study |

A scope is `studyId | typeKey | groupBy`. The grouping is part of the name on purpose (§2).

---

## 6. Deliberately not done

**Remembering the open row.** It is a cursor, not a layout, and re-opening a record on return
is surprising rather than helpful.

**Remembering filters.** See §2.

**Syncing it into the study so it travels between machines.** That is precisely the thing §1
rules out. Someone who wants a shared layout wants a saved view, which is a different feature
with a different name.
