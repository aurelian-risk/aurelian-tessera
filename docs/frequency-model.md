# How often is a scenario attempted — design note

Status: **implemented** · 2026-08-09 · main repo only

The analyst-facing account is [`method.md`](method.md) §4; this note keeps the reasoning
behind the design and the record of what was decided against.

Records the agreed redesign of the **frequency side** of the quantification: how often an
operational scenario is attempted at all. The success side (capability vs. resistance) is
a separate strand and is deliberately not touched here — see the closing section.

Companion documents: [`control-effect-model.md`](control-effect-model.md) (the control
channels and the chain traversal), [`method.md`](method.md) (the method as it stands for
analysts).

---

## 1. What is wrong today

Two ratings on the operational scenario feed the model:

```
risk source `activity`      → contact frequency        ─┐
operational `likelihood`    → probability of action    ─┴→ threat events / year
```

**The two factors are not separable with real data.** The decomposition into contact and
probability of action is only identifiable for exposure-driven attacks:

| | contact | probability of action |
|---|---|---|
| **Opportunistic / passive contact** | observable (scans and probes against an exposed surface) | observable (share of probes that become attempts) |
| **Targeted** | ≈ 1 — the contact *is* the decision | carries everything |
| **Insider** | continuous, ≈ 1 | carries everything |

Outside the first row, splitting the number in two produces a factor of one multiplied by
the real quantity, and presents it as two insights. That is invented precision.

**`likelihood` is a conclusion, not a factor.** In EBIOS RM the likelihood of an
operational scenario is a holistic judgement that already absorbs the actor, the effort,
the opportunity and the controls in place. Using it as one isolated input is circular: the
model then derives an event frequency that is partly an echo of what the analyst already
concluded, while the same considerations enter a second time through vulnerability.

**Six modelled signals go unused.** `risk_origin.category`, `.resources`, `.relevance`,
`target_objective.aims_at`, `stakeholder.provides_access_to` and
`business_asset.criticality` are all maintained by the analyst and read by nothing.

## 2. The decision

**Collapse the two factors into one derived quantity: attempts per year against this
scenario.** The probability of action is absorbed into it rather than standing beside it.

```
attempts / year = base rate (actor class, sector)     ← the one quantity that needs evidence
                × tempo        (activity)
                × throughput   (resources)
                × target pull  (aims_at / relevance, criticality)
                × reachability (entry kind)
                × deterrence   (deterrent measures - already implemented)
```

The shape is deliberate: **all the empirical burden sits in the base rate.** Everything
else is a *ratio*, and every ratio answers a question an analyst can actually defend —
"is this asset one the actor has declared an objective on, yes or no", "is the entry
surface reachable from outside, yes or no".

### The terms

**Base rate** — operations per year that an actor of this class mounts against an
organisation in this sector. Selected by `risk_origin.category` and the study's sector.

**Tempo** (`activity`) — is this particular actor more or less active than typical right
now? A multiplier, not a rate.

**Throughput** (`resources`) — a well-resourced actor runs more operations in parallel.
Mild multiplier. Note this is deliberately *not* skill: skill is `capability` and belongs
to the success side.

**Target pull** — the strongest study-specific lever, and the one that answers "why us".
If the chain reaches a business asset the actor has declared an objective on via
`target_objective.aims_at`, attempts are markedly more frequent; if the actor has
objectives and none of them match, markedly less. Where no objectives are modelled,
`relevance` stands in. Asset `criticality` is a weak secondary pull, with a caveat: it
records *our* loss, not the attacker's gain. The two correlate for extortion and theft and
diverge for actors seeking attention.

**Reachability** — from the classification of the chain's entry step. An exposed service
is contacted constantly; an attack needing physical presence is contacted rarely; an
insider's contact is continuous.

> The same entry classification also feeds the *demand* on the success side, but the two
> read different things from it: exposure drives how often contact happens, difficulty
> drives whether the attempt succeeds. One classification, two outputs — not double
> counting.

## 3. What becomes of `likelihood`

Not deleted — **inverted**. The model computes the frequency without it and maps the
result back onto the likelihood scale using the same calibration anchors. Where the two
diverge by more than one level, that is a quality check:

> *Ransomware via maintenance access* is rated **likely**. The model arrives at roughly one
> loss event every 30 years, which corresponds to **low**. Either the rating is pessimistic
> or the model is missing something.

The circularity becomes a validation feature. **Built:** the boundaries between levels are
a calibration table, the comparison runs on the residual result, and a gap of more than one
level is shown next to the annual-loss figure. A gap of exactly one is not reported - the
bands are too coarse for that to mean anything.

On the sample study the two agree within one level in both scenarios, which is the
uninteresting and correct outcome for a study whose ratings were set by hand from the same
picture the model reads.

## 4. The parameterisation

The heart is the **base-rate table**, kept small: one ground rate per actor class, plus
explicit exceptions where a sector attracts a class disproportionately. The shipped
defaults are in [`method.md`](method.md) §8, which reproduces the whole parameterisation.

The figures first sketched here were roughly twice as high across the board. They came
down while the reference cases were being written, for one reason worth recording: the
multipliers are not centred, they **compound**. A persistent, well-resourced actor with a
declared objective against an exposed service carries a product of about ×3.4, so a base
rate chosen to look right on its own lands far too high once the ratios are applied. The
base rate has to be the rate for a *typical* case, not a plausible-sounding number.

Alongside it, the multiplier bands for tempo, throughput, target pull and reachability.

### Inspect, edit, save — a first-class requirement

The parameterisation is not a constant buried in the source. It has to be **visible,
editable and saveable**, because that is what makes the numbers arguable instead of
authoritative. Concretely, four things, all following the taxonomy's existing pattern:

| | |
|---|---|
| **Inspect** | its own view: every table and band, with the question each answers and where the default came from |
| **Edit** | change any rate, multiplier or band in place, with a reset to default per table and as a whole |
| **Save** | persisted with the app state, exactly like the taxonomy — survives a reload, no re-entry |
| **Travel** | part of the study, so it is exported and imported with it |

**Built as a field on the study, not app-level.** A standalone bundle kind was tried first
and removed as unnecessary machinery: putting the calibration in the study means the
existing export, import, diff and encryption paths carry it with no new code, and two
studies covering different organisations can hold different parameterisations.

**Consequence to state plainly:** changing the parameterisation changes every figure, and
like taxonomy changes it is **not** recorded in the study's change log. If that matters
later it needs its own level - the log is per study, the parameterisation is per app.

## 5. What the existing fields become

| Field | today | after |
|---|---|---|
| `risk_origin.activity` | contact frequency | tempo multiplier |
| `risk_origin.category` | unused | **selects the base rate** |
| `risk_origin.resources` | unused | throughput multiplier |
| `risk_origin.relevance` | unused | target pull, where no objectives are modelled |
| `target_objective.aims_at` | unused | **target pull** |
| `operational.likelihood` | probability of action | **cross-check**, no longer an input |
| *(new)* `Study.sector` | — | selects the base-rate column |

`Study.sector` is a new field: base rates genuinely differ by sector, and the study today
carries only free-text `organization` and `scope`.

## 6. The honest price

The base rate is **hard to evidence** and varies by sector, size and exposure. That
uncertainty does not go away. What changes is that it becomes visible and sits in *one*
place, instead of being spread over two constants nobody questions.

So the table must carry its own provenance: where the number comes from and that it is a
setting. An organisation with its own incident data replaces it — that is the point of
making it inspectable.

**Sequencing caveat.** The current calibration guardrails in `test:quant` cover
vulnerability only; every reference situation asks "what share of attempts succeed", none
asks "how often is it attempted". The frequency side is effectively uncalibrated today.
Moving it onto several derived ratios without first extending the reference cases would
trade one guessed number for several — more structure, not more support. **Reference cases
for the frequency side come first.**

## 7. Not in this strand

The success side — what the capability is compared against — is a separate strand and now
has its own note: [`resistance-model.md`](resistance-model.md) replaces the
`difficulty`-derived baseline resistance with a **demand** derived from the chain itself,
so that the resistance side belongs solely to the modelled controls.

The two sides are deliberately **not coupled**. A demanding chain plausibly deters
opportunistic actors, which would argue for feeding the demand into the attempt rate, but
that would make every frequency figure depend on the chain modelling — refining a kill
chain would move the attempt rate without anything having changed about the actor.
