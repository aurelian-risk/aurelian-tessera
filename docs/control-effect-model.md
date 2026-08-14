# Control-effect quantification — strategy

Status: **increments 1–4 implemented and calibrated** (2026-08-05), UI partly caught up ·
Scope: main repo only · Open: the coverage views still speak the retired language (§10)

This paper records the target model for how security measures affect the quantitative
result, why the previous model was wrong, and how we got from there to here. It is the
reference for the implementation increments in section 7.

**For the method itself, written for analysts rather than for implementers, see
[`method.md`](method.md).** This document is the working record: decisions, deviations,
measurements and the reasoning behind them.

---

## 1. The problem

The quantification derives its factors from the qualitative model, which is the right
idea. But every measure, whatever it does, is currently funnelled into **one** number:
the resistance of the scenario. Three consequences follow.

**Only one effect mechanism exists.** `security_measure.measure_type` already
distinguishes *Preventive / Detective / Corrective / Deterrent*, and the sample study
fills it in faithfully. Nothing reads it. All four act identically as resistance.

This produces visibly wrong statements in our own sample: *"Offline immutable backups"*
(Corrective, implemented, level 4) covers the encryption step and therefore raises the
resistance — the model claims backups make the attack **less likely to succeed**.
Backups do not prevent encryption. They make it cheaper. Symmetrically, a Deterrent
belongs on the number of attempts, not on the ability to withstand one.

**The chain structure is thrown away before the simulation.** `coverageOf` computes a
per-step defense-in-depth value and then averages it over all steps into one scalar,
which shifts one resistance number. The simulation performs a single capability-vs-
resistance comparison for the whole scenario. There is no traversal, no step, no
sequence. The predecessor DAG with its `all`/`any` joins — the structural asset of
v0.3.5 — contributes nothing to the numbers.

Averaging also inverts the meaning of the chain. A chain is a conjunction: the attacker
must pass every step. Adding a weakly defended step therefore adds a hurdle, but the
mean *drops* — the model reads a new obstacle as a weakening.

**The two ends of the chain are unreachable.** Nothing a measure does can move
`threatActivity`, `attackProbability`, `directImpact`, `cascadingLikelihood` or
`cascadingImpact`. The `withControls` toggle touches exactly one line. Frequency at the
front and magnitude at the back are closed to control influence.

---

## 2. Design principles

1. **The effect channel follows the mechanism, not the effort.** A measure is defined,
   for quantification purposes, by which factor it moves.
2. **Where a measure is anchored decides where it acts.** `covers → kill_chain_step`
   places it at a section of the chain; `protects → supporting_asset` places it at the
   asset. Both fields already exist and are already maintained.
3. **The result must be invariant to description depth.** Splitting one scenario into
   eight steps instead of three must not, by itself, change the risk.
4. **Derive, do not elicit.** Everything that can be read from the qualitative model is
   read from it. Only loss magnitudes stay analyst estimates.
5. **Every number keeps its provenance.** A factor that moved must be able to name the
   measures that moved it.

---

## 3. Target model

### 3.1 Effect channels

| `measure_type` | Anchor | Moves | Mechanism |
|---|---|---|---|
| **Deterrent** | chain (any step of the scenario) | `attackProbability` ↓ | fewer attempts are made |
| **Avoidance** *(new)* | asset via `protects` | `threatActivity` ↓ | the exposure itself is removed |
| **Preventive** | `covers` → step | gate at that step | the attacker must beat this step |
| **Detective** | `covers` → step | position-dependent: before impact → chain break; at impact → magnitude ↓ | detection acts through response |
| **Corrective** | `protects` → asset (or terminal step) | `directImpact` ↓, `cascadingLikelihood` ↓ | recovery and containment |

Efficacy per measure stays `measureEfficacyOf` — implementation level × lifecycle status
× ceiling — unchanged. What changes is that efficacies are now summed **per channel**
instead of into one pot. Within a channel and a step, layers still combine as
`stepCoverage` (`1 − ∏(1 − eff)`).

### 3.2 The loss-event definition — the pivot of the model

> **A loss event occurs when a terminal step of the chain is reached.** Initial
> compromise is not a loss event.

This single definition is what makes the detection channel sound. An attack broken at
lateral movement never became a loss event, so removing it from the frequency is not
double counting. If the loss event were defined at first compromise, detection could
only ever act on magnitude, and the chain would lose most of its analytical value.

Every downstream rule depends on this definition. It must not be quietly changed.

- **Entry step**: has no predecessors within its scenario.
- **Terminal step**: no other step of the scenario lists it as a predecessor.
- **Legacy fallback**: if no step in a scenario declares predecessors, derive a linear
  chain from `step_order`. `tactic` order serves only as a tie-break for display.

### 3.3 Chain traversal

Per simulated threat event, the chain is walked once in topological order:

```
adv ~ PERT(capability)                    # ONE attacker capability for the whole attempt
RS_base ~ PERT(difficulty)                # scenario baseline, ONE entry gate
if adv <= RS_base: no loss event

for step in topological_order(scenario):
    reachable?  join="all" -> every predecessor reached
                join="any" -> at least one predecessor reached
                no predecessors -> entry step, reachable
    if not reachable: skip

    if prev(step) > 0:                    # only DEFENDED steps are gates
        RS ~ PERT(RS_base + K_PREV * prev(step))
        if adv <= RS: step not reached

    if det(step) > 0 and step is not terminal:
        if rand() < det(step) * response_readiness: chain broken here

    mark step reached

loss event iff any terminal step reached
```

Four properties this buys:

- **Decomposition invariance.** Only defended steps are gates; undefended steps are
  transparent. The baseline difficulty is charged once per attempt, not per step. The
  number of hurdles follows the analyst's *measures*, not the analyst's *prose*.
- **Joins become arithmetic.** `any` is an alternative route, `all` a true conjunction.
  No special-casing — the DAG is evaluated directly.
- **Depth is credited correctly.** Two gates on one route are better than one, because
  both resistance draws must come out low. Two gates on a route the attacker does not
  need are worth nothing.
- **The break point is observable.** The traversal knows *where* attacks stop. The
  distribution of break points is a by-product and answers the management question —
  where does my money work — better than any single loss figure.

`response_readiness` couples detection to response: it is derived from the Corrective
measures in the scenario (mean efficacy, capped). Detection without any corrective
capability approaches zero effect. This coupling is deliberate and non-negotiable.

### 3.4 Magnitude

Magnitude stays **scenario-level** in v1, derived from the feared event's severity as
today. What changes is that measures can now reach it:

```
recoverable   = RECOVERABLE_SHARE * corr(reached asset)
directImpact *= (1 - recoverable)
cascadingLikelihood *= (1 - K_CONTAIN * corr)
```

`RECOVERABLE_SHARE < 1` expresses that only part of a loss is reducible at all. Backups
shorten downtime and avoid ransom; they do not reduce regulatory fines or reputational
damage. Without this cap a fully implemented corrective control would drive the loss to
zero, which is not a defensible claim.

Detection at the terminal step that did **not** break the chain still shortens the
event's duration and therefore reduces magnitude by a small factor.

### 3.5 Preserved outputs

`tef`, `vuln` (empirical loss events / threat events), `lef`, the percentiles, the
exceedance curve and the log histogram keep their meaning and their shape, so the
existing visualisations continue to work. `coverageOf` is **not** removed — `treatment.ts`
and `MitigationCharts` depend on it. It is demoted from a simulation input to a display
figure.

---

## 4. Method congruence

The model follows the established frequency × magnitude quantitative-risk standard and
its controls-analytics companion. Terminology in this repository stays neutral by
policy — the concepts are used, the trademarked name is not, in code, comments, commits
or documents.

### 4.1 Factor mapping

| Standard factor | Our input | Source |
|---|---|---|
| Contact frequency | `threatActivity` | risk source `activity`, minus Avoidance |
| Probability of action | `attackProbability` | scenario `likelihood`, minus Deterrent |
| Threat capability | `adversaryStrength` | risk source `capability` |
| Resistance strength | `RS_base`, `RS_step` | scenario `difficulty` + Preventive per step |
| Vulnerability | empirical `lossEvents / threatEvents` | traversal outcome |
| Primary loss | `directImpact` | feared event `severity`, minus Corrective |
| Secondary risk | `cascadingLikelihood` × `cascadingImpact` | `severity`, containment from Corrective |

Two points where the new model is **stricter** than the current one: capability is drawn
once per attempt rather than per comparison (it is a property of the attacker, not of the
comparison), and that shared draw induces the positive correlation between gates that a
naive independent-multiplication model would miss.

### 4.2 Deliberate deviations

- **Baseline resistance is charged once per attempt, not per step.** A strict reading
  would give every step its own inherent resistance. We accept the deviation to buy
  decomposition invariance (principle 3), which we consider the more important property
  for a tool whose users choose their own level of detail.
- **Magnitude is not path-dependent in v1.** Strictly, routes terminating at different
  assets are different scenarios with different loss magnitudes. Merging them into one
  distribution would break that discipline, so it is deferred (section 9) rather than
  approximated.
- **Loss is a single figure, not decomposed into loss forms.** The standard separates
  productivity, response, replacement, fines, competitive advantage and reputation, and
  a corrective control only touches some of them. `RECOVERABLE_SHARE` is our stand-in
  for that distinction.

### 4.3 Known limitations

- **Correlated control failure is unmodelled.** Two measures depending on the same
  administrator, platform or bypass fail together; the model treats their resistance
  draws as independent. The shared capability draw covers correlation on the attacker
  side only.
- **The calibration constants are conventions, not findings.** They are anchored to give
  plausible ranges, not measured. They belong in one place, documented as such.
- **`implementation_level` × `status` is a proxy** for whether a control is actually
  operating. It stands in for a control-variance discipline we do not model.

---

## 5. Calibration

All constants live in `quantModel.ts`, documented at their definition:

| Constant | Meaning | Note |
|---|---|---|
| `CONTROL_CEILING` = 0.85 | no single control resists everything | unchanged |
| `STATUS_WEIGHT` | lifecycle discount on efficacy | recalibrated |
| `CAPAB`, `DIFF_BASE` | threat capability / baseline resistance bands | recalibrated |
| `K_PREV` | how far a step's coverage lifts its resistance | recalibrated |
| `K_DETER` | how far deterrence cuts probability of action | increment 4 |
| `K_AVOID` | how far avoidance cuts contact frequency | increment 4 |
| `RECOVERABLE_SHARE` | reducible share of a primary loss | increment 4, < 1 by design |
| `K_CONTAIN` | containment effect on secondary-risk likelihood | increment 4 |
| `K_LATE_DET` | duration gain from detection at the impact step | increment 4, small |

### 5.1 What the axis means

Everything on the frequency side lives on one axis from 0 to 1: **the share of the
overall attacker population**. A resistance of 0.78 means "holds off 78 % of attackers";
a capability of 0.70 means "outperforms 70 % of them". The attempt succeeds when the
drawn capability exceeds the drawn resistance. Keeping that reading intact is what makes
the comparison meaningful rather than an arbitrary contest of two invented numbers.

### 5.2 The failure that forced a recalibration (2026-08-05)

Measured after increment 2: **the model behaved as a threshold detector, not as a dial.**
One step on the 4-level difficulty scale moved the resistance by 0.14 while the whole
capability band was only 0.27 wide — a single click therefore jumped half-way across the
decision zone. Consequences, all measured:

- 7 of 16 inherent capability × difficulty cells sat at exactly 0 % or 100 %. In a
  saturated cell no measure can ever show an improvement.
- A top-tier actor facing a mature programme succeeded **0.6 %** of the time — a claim
  contradicted by every published account of advanced intrusions.
- A single fully implemented control removed 87 % of the risk (factor 7.8).
- A partly deployed control was worth 0.3 % of its full effect, i.e. nothing.

The root cause was not any single constant; it was **step size versus spread**. Narrow
bands are false precision, and false precision turns a comparison into a switch.

### 5.3 The rule that replaces guesswork

> A step on an ordinal scale must be small relative to the spread of the band it moves
> within. Otherwise one click of a coarse analyst judgement decides the analysis.

Applied: capability bands widened to roughly 0.5–0.8 with a heavy mode (`lambda`) so the
mass stays near the rating; difficulty levels compressed to steps of 0.10; the resistance
spread widened to ±0.25. Every capability band now reaches close to 1 — PERT has hard
bounds, so a band stopping short of a control's strength produces *exactly zero*
vulnerability, and "this control can never be beaten" is never a true statement.

### 5.4 Calibrated against reference situations, not against taste

The constants are fitted to five situations whose rough behaviour is not seriously
disputed, and the fit is **asserted in `test:quant`** so it cannot silently rot:

| Situation | Target | Now |
|---|---|---|
| No controls at all, competent crew | 85–100 % | 98 % |
| Baseline hygiene (3 of 5 steps controlled) | 15–45 % | 36 % |
| Mature programme, every step controlled | 3–15 % | 4 % |
| Top-tier actor vs that same programme | 20–60 % | 29 % |
| Low-skill opportunist vs baseline hygiene | 1–15 % | 1.4 % |

Plus four behavioural guardrails: no inherent situation written off as impossible; no
control configuration reducing a top-tier actor to zero (**12 % still get through when
everything money can buy is in place**); one difficulty step never swinging the result by
more than 3× (now 1.3×); a single control worth a factor of 2–4 (now 2.6×) and a
half-deployed one keeping a visible but partial share (now 19 %).

The bands are engineering judgements, deliberately wide. They do not claim precision —
they rule out answers no practitioner would sign.

---

## 6. Data-model changes

- **`measure_type` gains `Avoidance`** as a fifth option. This requires a taxonomy
  migration for existing studies; it is worth doing in this change and not separately.
- **Untyped measures default to Preventive** — today's behaviour, so nothing silently
  shifts. Catalog-seeded measures are affected: `measureValues` in `frameworks.ts` sets
  only name, description and status, so every imported control arrives untyped.
- **New lint rule: "measure without effect class".** The default must be visible, not
  silent. This is the mechanism that gets existing studies classified.
- **No new entity type, no new field.** The model runs on `measure_type`, `covers`,
  `protects`, `predecessors` and `join` — all present.

Two decisions taken while implementing this:

- **The migration is version-gated, not repeated.** `Taxonomy.schemaVersion` becomes the
  generation marker of the default vocabulary (`TAXONOMY_SCHEMA_VERSION`, now 3) and
  `reconcileTaxonomy` runs at most once per stored taxonomy. Without the gate, an option
  a user deliberately deleted would come back on every load. A vocabulary that no longer
  overlaps the default one at all is treated as user-owned and left untouched.
- **The curated library classifies only what is unambiguous.** Governance and support
  controls (asset inventory, third-party assessment, change management) have no direct
  effect channel in this model and are seeded **unclassified** on purpose, so the linter
  asks the analyst to decide in context instead of the catalog asserting an effect the
  control does not have. External framework catalogs stay unclassified throughout.

---

## 7. Implementation increments

Each is independently shippable and leaves the build green.

1. **Classification groundwork — DONE (2026-08-05).** `src/domain/controls.ts` holds the
   effect-class vocabulary and the `declaredClass` / `effectClassOf` split (declared vs.
   defaulted), so the fallback is never invisible. `Avoidance` added to the taxonomy with
   field help explaining each channel; `reconcileTaxonomy` migrates stored and imported
   taxonomies additively; the linter reports unclassified measures; the curated library
   carries per-item classes; the sample study now exercises all five classes, including a
   deterrent and an avoidance measure at the ends of the chain. *No maths change* — the
   quantification still reads none of this. Verified: build green, e2e 91/91,
   `test:catalog` 61/61, new `test:taxonomy` 16/16.
2. **Chain traversal — DONE (2026-08-05).** `ChainStep` in `montecarlo.ts`; `simulate()`
   takes the chain as a separate argument (it is part of the model, not of the sampled
   factors, so `QuantInputs` and the override machinery stay untouched). `chainOf()` in
   `quantModel.ts` builds the topologically sorted chain — Kahn's algorithm, cycles
   tolerated by dropping back-edges, cross-scenario predecessors excluded, legacy data
   without predecessors read as a line in step order. `controlStrength` is now the
   scenario baseline only; the coverage moved onto the individual gates (`K_PREV`).
   `blockedAtBaseline` + per-step `breaks` are emitted. Verified by a new `test:quant`
   (36 assertions) that asserts the model's promises directly: decomposition invariance,
   AND/OR semantics, depth being credited, and a gate on a bypassable route being worth
   nothing.

   **Deviation from the plan, deliberate:** the increment was specified as "preventive
   channel only", which would have left detective and corrective controls counting for
   *nothing* until increments 3–4 — a fidelity regression in the middle of the sequence.
   Instead every covering measure still feeds its step's gate, exactly as before; what
   changed here is only the *structure* (traversal instead of average). Increments 3 and
   4 then move the non-preventive classes out of the gate and into their own channels.

   **Effect on the sample study** (inherent → old model → new model, expected annual loss):
   ransomware €3.71M → €1.74M → €222k; insider €504k → €399k → €12.6k. The drop is not a
   bug: averaging diluted a fully implemented control sitting on the chain's single entry
   step, and the traversal stops 88.8 % of attempts right there. But it does mean the
   calibration constants now bite far harder than when they were applied once to an
   averaged figure — the deferred calibration review (section 9) is no longer optional.
   Part of this will come back in increments 3–4, when detective and corrective controls
   stop acting as resistance.
3. + 4. **All effect channels — DONE (2026-08-05), merged.** Kept together because the
   response readiness that gates detection is derived from the corrective measures, so
   splitting them would have had Corrective play two contradictory roles for one
   increment. `StepCov` now carries `prevention` and `detection` beside the plain
   `coverage`; only preventive measures build gates, detective measures set a per-step
   `interrupt` (zero on terminal steps), and the scenario-level classes act at the ends
   of the chain: Deterrent on probability of action, Avoidance on contact frequency,
   Corrective on primary loss and follow-on likelihood. `RESPONSE_FLOOR` grants that some
   reaction always happens. New constants `K_DETECT`, `K_DETER`, `K_AVOID`,
   `RECOVERABLE_SHARE`, `K_CONTAIN`, `K_LATE_DET`, all calibrated (below). The result
   reports `detected` — attempts stopped by being caught rather than by resistance.

   Verified by 18 further assertions in `test:quant` (66 total) that hold each class to
   its own factor: a deterrent cuts attempts but builds no barrier and does not change
   the loss; a corrective control cuts the loss but not the chance of success, and never
   to zero; detection interrupts but is worth far more once someone can respond; the
   inherent view is free of every channel.

   **Calibration extended:** `K_DETECT` = 0.35, fitted to two further reference
   situations — "monitoring without barriers helps but is not a wall" (30–70 %) and
   "detection nobody can act on is worth far less" (55–90 %). At the first value tried
   (0.5) a single detective control stopped 56 % of attempts at its step, which the
   published dwell times do not support.

   **What it revealed in the sample:** the insider chain has **no preventive control at
   all** — it is defended purely by monitoring, so 78.5 % of attempts now reach the
   objective, and its expected annual loss (€278k) overtakes the ransomware scenario
   (€231k) despite the lower severity. The old averaged model hid this completely.
5. **UI.** Factor tree shows one branch per channel; `FactorTrace` names the measures
   behind each factor; break-point visualisation.

   **Pulled forward, partly DONE (2026-08-05).** Leaving all UI work until last was a
   mistake: after increment 2 the interface described a model that no longer existed.
   Two defects, both introduced by increment 2 and both fixed:

   - `FactorTrace` explained control strength as *"N/M steps mitigated · avg
     implementation → coverage → control strength"* — the retired derivation, and in the
     one feature whose whole purpose is to show where a number comes from. It now states
     the baseline the attacker must beat once, then walks the chain in traversal order
     with each step's hurdle, its measures and their effect class, marking undefended
     steps as free and saying why (decomposition invariance).
   - The "what the controls buy" panel compared control strength with and without
     controls. Those are now identical by construction, so it claimed "30 % → 30 %" while
     the loss visibly fell. Replaced by `ChainBreak`: a stacked bar over all attempts
     showing the share stopped by the scenario baseline, the share stopped at each step,
     and the share that gets through — the insight the traversal makes available and the
     averaged model never could.

   e2e covers both, including a negative assertion that the retired wording is gone.
   Remaining for this increment: one branch per channel in the factor tree, once the
   channels exist (increments 3–4).
6. **Verification and reporting.** e2e coverage for the new panels, report sections
   updated, calibration note in the report footer.

Increment 2 is the substantial one; 1 and 3–4 are contained; 5 is the usual iteration.

---

## 8. Compatibility and communication

- **Results will move.** Unlike the 1..N scale work, this is not a byte-identical
  refactor — existing studies get different loss figures. This belongs in the CHANGELOG
  and in a footnote of the generated report, not only in a commit message.
- **The generic meta-schema must keep working.** A taxonomy without a chain, or without
  `measure_type`, must still quantify. The scalar path is the fallback, not dead code.
- **Structural type detection stays structural.** The traversal must recognise its step
  and measure types the way the rest of the app does, not by hard-coded keys.
- The report generator renders its own charts; any new visualisation needs its second
  implementation there.

---

## 9. Deferred

- **Path-dependent magnitude** (loss determined by the asset a route actually reaches).
  Analytically attractive, but it merges what the method treats as separate scenarios.
  Revisit once the traversal is in place and its behaviour is understood.
- **Loss-form decomposition** (productivity / response / replacement / fines /
  competitive advantage / reputation), which would replace `RECOVERABLE_SHARE` with a
  real per-form model.
- **Control-failure correlation.**
- ~~Calibration against reference cases~~ — **done 2026-08-05, see section 5.**

---

## 10. The coverage views — RESOLVED (2026-08-05)

Raised while implementing increments 3–4, fixed the same day. The model now distinguishes
resisting, watching and recovering; three places still merge them into one "coverage"
figure, and one of them contradicts the quantification outright.

**`treatment.ts` → the residual risk matrix (the real problem).** `residualPos` moves a
risk down the matrix by `coverageOf().value` — the all-class average over all steps. For
the sample's insider scenario that average is respectable, so the matrix shows the risk
as reduced, while the quantification of the same scenario says 78.5 % of attempts reach
the objective because nothing on that chain resists anything. **The same study answers
"how well is this protected" two different ways.** Whatever else is decided, these two
have to be reconciled — the traversal is the better basis.

**`MitigationCharts` coverage ring.** `overall = Σ step.coverage / steps` is exactly the
averaging the model abandoned, over exactly the classes the model now separates. A
backup on a step raises the ring. Either re-base it on the model's own picture (share
resisted / watched / open, or the break-point distribution) or relabel it honestly as a
*completeness* figure — "how much of the chain has measures attached" — which is a
legitimate thing to show, just not a protection claim.

**`MitigationCharts` per-step defense-in-depth bars.** Sound in principle, but they stack
layers of different classes into one bar. They should split by class.

**The TTP tactic heatmap is fine** — it is a completeness view over tactics, and never
claimed to quantify protection.

**`KillChainMitigation` stays, and matters more than before.** It is the only place to
link a measure to a step, and that link now drives the whole model. What it needs is to
show the *role* a measure plays on that step (resists / watches / recovers) instead of a
bare covered-or-not, so the analyst sees a chain defended only by monitoring for what it
is.

### What was done

- **`treatment.ts` now reads the traversal.** `treatmentEffect` runs the chain with and
  without the controls and returns the effect **split across the two axes**: the drop in
  loss-event frequency drives the likelihood axis, the drop in loss magnitude drives the
  gravity axis. A treatment that only buys recovery therefore moves the risk *down*, not
  left — which is what recovery does, and something the old single coverage figure could
  not express at all. Also fixed on the way: the old code moved the chip by a fixed
  factor of 2, silently assuming a 1..4 scale; it is now scale-aware.
- **The ring is now an outcome, not an average.** Three arcs — blocked / detected in time
  / reaches the objective — from the same `simulate()` call the risk figures use.
- **The tactic heatmap** shows *defence* (blocking + detecting, recovery excluded), no
  longer an all-class coverage blend.
- **The per-step bars** stack blocking layers first, then detecting ones; measures acting
  on another factor are listed with their class struck through and contribute no bar.
- **`KillChainMitigation`** counts *defended* steps rather than merely covered ones, and
  labels a step whose only measures are corrective or deterrent as "damage control only".
- **Performance:** `residualPos` was being called once per grid cell, so a 4×4 matrix
  simulated each risk sixteen times over. Positions are now resolved once per render.

Verified on the sample — the two views agree where they used to contradict:

| | matrix (inherent → residual) | quantification |
|---|---|---|
| Ransomware | L3,G4 → **L1,G2** (freq 85 %, mag 56 %) | 18 % get through |
| Insider | L2,G3 → **L1,G3** (freq 28 %, mag 4 %) | 79 % get through |

The insider risk no longer slides down the matrix on the strength of measures that never
resisted anything. `test:quant` holds this in place (76 assertions), including "a
recovery-only treatment moves the risk down, not left" and "a chain defended only by
monitoring is not treated as resisted".
