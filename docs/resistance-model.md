# What an attempt is up against — design note

Status: **implemented** · 2026-08-09 · main repo only

The analyst-facing account is [`method.md`](method.md) §5; this note keeps the reasoning
behind the design and the record of what was decided against.

Records the redesign of the **success side** of the quantification: what an attacker's
capability is compared against. The companion note
[`frequency-model.md`](frequency-model.md) covers how often the scenario is attempted at
all; the two are deliberately kept apart (see §8). The control channels and the chain
traversal that this note builds on are described in
[`control-effect-model.md`](control-effect-model.md).

---

## 1. What is wrong today

The simulation compares a sampled attacker **capability** against a resistance built from
two parts:

```
operational `difficulty`  → baseline resistance ─┐
modelled measures         → per-step uplift     ─┴→ the bar at each step
```

The baseline is a single ordinal note, 1..4, mapped onto `DIFF_BASE = [.20 .30 .40 .50]`.
It carries everything the chain itself makes hard, and it carries it as one number the
analyst types in.

Three problems follow.

**The note cannot see what the analyst already modelled.** The sample's ransomware chain
spans six distinct tactics, needs persistence and lateral movement, and requires credential
dumping. The insider chain is three tactics long, starts from legitimate credentials, and
needs nothing beyond copying files. The analyst modelled all of that in detail — and then
compressed it into `difficulty: 2` versus `difficulty: 1`.

**It double-counts with the measures.** An analyst rating difficulty naturally thinks about
the defences in place. Those defences then enter a second time as per-step uplift. The same
consideration moves the bar twice.

**It is the wrong side of the comparison.** Resistance should belong to what the
*organisation* does. How much skill the operation intrinsically requires is a property of
the *attack*, and belongs on the other side of the comparison, next to capability.

## 2. The decision

**Replace the `difficulty`-derived baseline with a demand derived from the chain itself.**
The resistance side then belongs solely to the modelled measures.

The pleasant part is that this is a substitution, not a rebuild. Today's traversal already
adds the baseline into every gate:

```
gate = around(ctlBase + K_PREV × prevention)       ← quantModel.ts:285
```

So the base is already applied throughout the chain, which is exactly the semantics a
demand needs: a demanding operation stays demanding at every step, and the measures stack
on top. Only the *source* of that number changes.

## 3. The derivation

```
demand = entry cost
       + W_TOOL  × tooling maturity      (max over the chain)
       + W_DEPTH × depth                 (distinct tactics)
       + W_DWELL × dwell requirement
```

**Entry cost** — from the entry step's technique: what it takes to get the first foothold.
Valid accounts cost almost nothing; phishing is commodity but needs a target to act; a
public-facing exploit needs a working exploit; a supply-chain compromise is rare and
bespoke. Where a stakeholder `provides_access_to` the entry asset, the cost drops further —
the access was granted, not taken.

**Tooling maturity** — each technique is classified commodity / practitioner / bespoke, and
the chain takes the **maximum**. The hardest thing you must be able to do is what gates
you; averaging would let a run of easy steps dilute one hard requirement.

**Depth** — the count of **distinct tactics**, not of steps. Six tactics is a full campaign;
three is a short reach. Saturates at six.

**Dwell requirement** — does the chain need Persistence, Defense Evasion or Lateral
Movement? Those mean staying inside a live environment without being thrown out, which asks
for more than a single opportunistic action.

### The constraint that shapes all four

**Decomposition invariance.** Splitting one step into two describes the same attack in more
detail; it must not change the answer. This is the same principle the traversal already
obeys, and it rules out the obvious formulations: no sum over steps, no step count, no
average. Hence *maximum* for tooling and *distinct* tactics for depth — both unchanged when
a step is split. Verified on the sample: splitting the lateral-movement step in two leaves
the demand bit-identical.

### What deliberately does not enter

**AND joins.** A step requiring all its predecessors is harder — but the traversal already
makes it harder mechanically, by requiring every branch to get through. Adding it to the
demand as well would count it twice.

**The measures.** They are the other side of the comparison. Keeping them out is the whole
point of the change.

## 4. Measured on the sample

Both figures below are computed, not asserted:

| | entry | tooling | depth | dwell | **demand** | before |
|---|---|---|---|---|---|---|
| Ransomware via maintenance access | 0.100 | 0.075 | 6 tactics → 0.200 | 0.120 | **0.495** | 0.30 |
| Insider exfiltration | 0.050 | 0.000 | 3 tactics → 0.080 | 0.000 | **0.130** | 0.20 |

The ransomware entry cost is 0.100 rather than the 0.150 a phish costs on its own: the
scenario enters through a stakeholder that `provides_access_to` the entry step's asset, so
the granted-access discount applies. That term was specified here before it had a case to
prove itself on; the sample turned out to be exactly that case.

Rated, the two chains sat at 0.30 and 0.20 — a note that can express barely more than
"somewhat harder". Derived, they sit at 0.495 and 0.130: a genuinely demanding campaign
against an attack that needs a login and a USB port.

**State plainly what this does to the numbers:** the insider scenario lands *below* the old
floor of 0.20 and therefore becomes more vulnerable, not less. That is the intended
consequence — an insider with valid credentials really is up against very little except the
controls. It does mean the insider risk moves after the change, and the sample study will
show it.

## 5. Where the judgement sits — and why it must be editable

**Tooling maturity is the contestable part.** Whether `T1021 Remote Services` is commodity
or practitioner work is arguable, and reasonable analysts will disagree. So it belongs in
the same inspectable, editable, saveable parameterisation as the frequency side's base
rates — the curated techniques ship with a default classification that can be overridden,
and both sides sit in the same table set on the study.

The other three contributions are mechanical — count the tactics, look for persistence,
check whether a stakeholder grants access. They need weights, not judgements, and the
weights are in the same tables.

## 6. Two fallbacks it needs

**No chain modelled.** A scenario with no steps has nothing to derive from, so the
`difficulty` note carries on. The tool has to produce numbers for half-finished studies.

**Technique not recognisable.** The field is free text with typeahead. `T1566 Phishing`
parses; prose or a blank does not. Then the tactic's default applies, and where even that is
missing the contribution stays neutral. No crash, and no invented precision either.

## 7. `difficulty` becomes an override

Derived by default, overridable like any other factor, with its provenance shown ("from the
chain" versus "set by you"). The note stays useful for the cases the derivation cannot see,
without bringing the double-counting back — it now replaces the *demand*, not the
resistance.

## 8. Kept separate from the frequency side

A demanding operation plausibly deters opportunistic actors, which would argue for feeding
the demand into the attempt rate. **Decided against, for simplicity of the model.**

The reason is worth recording: coupling would make every frequency figure depend on the
chain modelling, so refining a kill chain would silently move the attempt rate without
anything having changed about the actor. Two sides, two inputs, each checkable on its own.

## 9. The calibration consequence

The seven reference situations in `test:quant` set `difficulty` **directly**. Once it is
derived, they would be testing the derivation as well — and their fixtures are bare steps
with no tactic and no technique, which would derive a near-minimal demand.

So the two calibrations must be separated:

| | what it pins | status |
|---|---|---|
| **Comparison** | given a demand and a set of measures, what share of attempts succeeds | the existing seven cases, unchanged — they keep setting the demand explicitly |
| **Derivation** | a phishing-led ransomware campaign with persistence and lateral movement should land around X; an insider path from valid accounts around Y | **new, does not exist yet** |

That keeps apart whether the arithmetic is right and whether the classification is right.

## 10. Open points

- The weights (0.15 / 0.20 / 0.12) and the entry-cost table are first settings. The
  derivation reference cases from §9 now exist and hold, but they were written alongside
  the settings rather than before them - they pin the behaviour against future drift, they
  do not independently confirm it.
- Demand is currently a point value fed into `around()`. Whether the spread should itself
  widen for less certain chains is open.
