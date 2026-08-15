# Aurelian Tessera++

**An ISMS tool for the BSI's Grundschutz++ method, in a single HTML file.**

Download it, double-click it, work. No server, no installation, no account, no network — and
the ruleset is already inside: all 1000 requirements of the Anwenderkatalog Grundschutz++.

[**Download the current build**](https://github.com/aurelian-risk/aurelian-tessera/releases/latest)
· 4 MB, one file, runs in Edge or Chrome from your own disk.

---

## What you do with it

**Describe your institution.** Which business processes matter, and how badly you would be
hurt if each lost its confidentiality, integrity or availability. Then the assets that
carry them — the control system, the network, the directory service, the maintenance
contract.

**Give each asset its target-object category** — the BSI's own classes: *IT-Systeme*,
*Netze*, *Externe Netzanschlüsse*, *Dienstleistungen*. That single choice is the work.

**The requirements appear.** Not a checklist you tick, but the package the method produces:
the categories are widened along the BSI's hierarchy, the requirements of each are
collected, duplicates are carried once, and the ISMS practices are added whole. Every
requirement says which asset brought it in and through which category, and every asset can
be asked what it carries — which is the question an auditor asks. Record another asset, run
the derivation again, and the package grows by exactly what that asset brought.

**Work the register.** 1000 requirements are there; the ones your assets pulled in are
live, the rest are greyed out until you decide they apply. Filter by scope, by modal verb,
by security level. Record each as implemented or not — the method knows no "partly", and a
requirement counts as met only when the ones it depends on are met too. Set its priority,
its owner and its date. Where you cannot implement one, record an exception: who authorised
it, why, until when.

**Coming from somewhere else?** Each requirement names what corresponds to it in the
IT-Grundschutz-Kompendium 2023 and in ISO/IEC 27001 Annex A, and how closely — the BSI's own
mapping, so what you have already done can be carried across rather than done again.

**Where the method sends you into a risk analysis** — a process with high protection needs,
a requirement you left open — you can model the attack chain: what an attacker would have
to do, step by step, which of your measures stop him where, and where the risk sits after
treatment. Grundschutz++ leaves that method open; this is one answer to it.

**Print the security concept.** Registers, figures, the decisions and their reasons, the
catalogue version you worked to, and the change history — every edit with who made it, when
and why, hash-chained so a later reader can verify nothing drifted.

## What comes with it

| | |
|---|---|
| Requirements | 1000, with modal verb, security level, effort level, security objectives, threats |
| Target-object categories | 39, as a hierarchy — 7 roots, 4 levels |
| Dependencies | 67 edges the catalogue states between its own requirements, plus 210 weaker relations |
| Mappings | IT-Grundschutz 2023 (1185 entries) and ISO/IEC 27001 Annex A (96), with the closeness of each correspondence |
| Published implementations | 35 components, each naming the requirements it answers |
| Kept current | the ruleset and the mappings are fetched from the BSI's repository at every build, and you can refresh a running copy yourself |

Everything stays on your machine. Nothing is uploaded, nothing is reported, no update is
fetched behind your back.

## Who it is for

Someone writing or maintaining a security concept to Grundschutz++ — in an institution
small enough that a server-based ISMS suite is out of proportion, or in an environment
where a tool that talks to the internet is not allowed to be installed at all.

It is not a certification. Whether a concept produced with it satisfies a scheme is decided
by the certification body.

## What it does not do yet

Nothing schedules the annual review of whether the package still fits your information
domain, and nothing records that it was done. Progress is kept per requirement, but the
reporting procedure around it is not modelled. The improvement plan exists as corrective
actions on individual findings rather than as a plan.
[`docs/method-conformance.md`](docs/method-conformance.md) lists the rest, measured against
the BSI's own machine-readable method catalogue.

## Build it yourself

```
npm install
npm run build      # fetches the current ruleset, then builds → dist/index.html
npm run test:e2e   # 219 checks against the built file, without network
```

## Licence

Software under [MPL-2.0](LICENSE). The ruleset is © Bundesamt für Sicherheit in der
Informationstechnik under CC BY-SA 4.0 and is carried with the changes made to it named —
[`NOTICE.md`](NOTICE.md).

"IT-Grundschutz", "Grundschutz++" and "BSI" are designations of the Federal Office for
Information Security, used here to identify the method implemented. Not affiliated with,
endorsed by or certified by the BSI.

Built on the Aurelian engine, shared with
[Aurelian Lite](https://github.com/aurelian-risk/aurelian-lite).
