// SPDX-License-Identifier: MPL-2.0 · Copyright (c) Aurelian-Risk
// Self-contained headless verification of the PORTABLE build (no extension).
// Loads dist/index.html over file://, loads the sample study, walks every workshop and
// the diagram views, and asserts that what the engine derives is actually on screen.
// Screenshots go to /tmp/gspp-e2e/. Exits non-zero on any console error or failed check.
//
// HOW THIS SCRIPT ADDRESSES THE PRODUCT
//
// Workshops are selected by POSITION in the taxonomy's group list, never by their label:
// the labels are product wording and change with the profile, the order is the method's.
// The constants below name the positions; `taxonomy order is the method's order` checks
// them once, so a reordered taxonomy fails in one place instead of thirty.
//
// Within a workshop, tables are addressed through the panel that heads them
// (`section("Requirements")`), not by "the first table on the page" - which table comes
// first is layout, and layout moves.
//
// Text that IS asserted falls into two kinds, and the difference matters when a check
// fails: German strings come from the sample study in src/profile/gspp/sample.ts, English
// ones are the engine's own wording from src/domain and src/components. A failing German
// assertion means the sample changed; a failing English one means the engine did.
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { mkdirSync, readFileSync } from "node:fs";
import { requireFreshBuild } from "./built.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const built = resolve(here, "../dist/index.html");
const file = "file://" + built;
// One script for both builds. The generative branch is a build flag (VITE_LLM), so the
// artefact itself says which one this is - and it says it the only way that cannot be
// wrong, by whether the model names are in the file at all. A released build must carry
// none of them, and that absence is asserted rather than assumed; a development build
// carries the branch and its checks run instead. Reading the source would prove nothing:
// a guard on a state variable leaves every string in the bundle.
const LLM = /SmolLM2|Qwen2\.5|WebLLM/.test(readFileSync(built, "utf8"));
requireFreshBuild(resolve(here, ".."), "the e2e run");

const shots = "/tmp/gspp-e2e";
mkdirSync(shots, { recursive: true });

const errors = [];
const checks = [];
const ok = (name, cond) => { checks.push({ name, cond }); console.log(`${cond ? "✓" : "✗"} ${name}`); };

// The workshops, by position in DEFAULT_TAXONOMY.groups. The keys behind them are
// gc / stm / risk / ums / perf / vrb. There is no quantification workshop: the
// monetary loss expectation belongs to Aurelian Lite, and the taxonomy here declares
// no "quant" group.
const WS = { GC: 0, STM: 1, RISK: 2, UMS: 3, PERF: 4, VRB: 5 };
// What each position is, for the one check that pins the order down.
const WS_LABELS = ["Scope and Planning", "Requirements Analysis", "Risk Consideration",
  "Implementation", "Monitoring", "Improvement"];

/** A single-page PDF with an uncompressed text layer, built here so the check needs no
 *  network and no file in the repository. It exists to prove one thing: that a chosen
 *  PDF is extracted rather than read as bytes. The real catalogues are measured
 *  separately, by scripts/corpus-test.mjs. */
function makePdf(lines) {
  const body = `BT /F1 10 Tf 12 TL 1 0 0 1 40 750 Tm\n`
    + lines.map((l) => `(${l.replace(/([()\\])/g, "\\$1")}) Tj T*\n`).join("") + "ET";
  const objs = [
    "<</Type/Catalog/Pages 2 0 R>>",
    "<</Type/Pages/Kids[3 0 R]/Count 1>>",
    "<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>",
    `<</Length ${body.length}>>\nstream\n${body}\nendstream`,
    "<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>",
  ];
  let out = "%PDF-1.4\n";
  const off = [];
  objs.forEach((o, i) => { off.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`
    + off.map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("")
    + `trailer\n<</Size ${objs.length + 1}/Root 1 0 R>>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out, "latin1");
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
// The model-file auto-detect fetch is expected to fail on Chromium file:// (it
// blocks local fetches) - tryLoadLocalPack catches it and falls back. Benign.
const benign = (t) => /aurelian-model\.bin/.test(t) || /scheme "file" is not supported/.test(t);
page.on("console", (m) => { if (m.type() === "error" && !benign(m.text())) errors.push(m.text()); });
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));

/** The i-th workshop tab. The Flow / Graph / Checks tabs carry .plain and are excluded,
 *  so the index is the group's position in the taxonomy and nothing else. */
const wsTab = (i) => page.locator(".ws-tabs .ws-tab:not(.plain)").nth(i);
const openWs = async (i, wait = 250) => { await wsTab(i).click(); await page.waitForTimeout(wait); };
/** The panel a table sits in, addressed through its heading. */
const section = (heading) => page.locator(".panel", { has: page.locator(".panel-head h3", { hasText: heading }) });

try {
  await page.goto(file);
  await page.waitForSelector("#root .app", { timeout: 10000 });
  // Fresh profile → empty dashboard. Documents is reachable even without a study
  // (importing a corpus bootstraps one); the nav must be enabled.
  ok("documents nav enabled without a study", await page.locator(".sidebar .nav-item:not(:disabled)", { hasText: "Documents" }).count() > 0);
  await page.locator(".sidebar .nav-item", { hasText: "Documents" }).click();
  await page.waitForTimeout(150);
  ok("documents import CTA without a study", (await page.locator(".empty", { hasText: "Import a document corpus" }).count()) > 0);
  await page.locator(".sidebar .nav-item", { hasText: "Studies" }).click();
  await page.waitForTimeout(150);
  await page.getByText("Load sample study").click();
  await page.waitForSelector(".ws-tabs", { timeout: 10000 });

  const title = await page.locator(".topbar .title").first().textContent();
  ok("sample study opened", !!title && title.includes("Riverbend Municipal Utilities"));
  ok("...and it is marked as an example, not as BSI content", !!title && /example/i.test(title));

  // The one place the workshop order is pinned down. Everything below drives by index;
  // if the taxonomy is reordered or a group is added, this check says so by name.
  const tabTitles = await page.locator(".ws-tabs .ws-tab:not(.plain) .t-title").allInnerTexts();
  ok(`taxonomy order is the method's order (${WS_LABELS.length} workshops)`,
    tabTitles.length === WS_LABELS.length && WS_LABELS.every((l, i) => tabTitles[i] === l));
  ok("the diagram views sit apart from the workshops",
    (await page.locator(".ws-tabs .ws-tab.plain").count()) === 3);

  // Every workshop holds the records the method puts there. The needles are sample data.
  const wsExpect = [
    [WS.GC, "Grid control"],
    [WS.STM, "Control system (SCADA)"],
    [WS.STM, "Mehr-Faktor-Authentifizierung"],
    [WS.STM, "Redundant telecoms connection at the legacy stations"],
    [WS.RISK, "Organised cybercrime"],
    [WS.RISK, "Entry through the manufacturer's remote maintenance"],
    [WS.RISK, "Takeover of the maintenance access"],
    [WS.UMS, "Multi-factor authentication for remote-maintenance access"],
    [WS.PERF, "Share of MUSS requirements implemented"],
    [WS.PERF, "Internal audit of remote maintenance"],
    [WS.PERF, "Management report on information security"],
    [WS.VRB, "Maintenance sessions are recorded but never read"],
  ];
  for (const [ws, needle] of wsExpect) {
    await openWs(ws);
    const body = await page.locator(".content").innerText();
    ok(`workshop ${ws + 1} (${WS_LABELS[ws]}) → shows "${needle}"`, body.includes(needle));
    await page.screenshot({ path: `${shots}/WS${ws + 1}_${WS_LABELS[ws].replace(/\W+/g, "_")}.png` });
  }

  // The sector is the attack-rate exception list, and that list exists only with the
  // quantification. This taxonomy declares no quant group, so the choice would change
  // nothing - and a control that changes nothing is worse than none. Asserted at every
  // surface it used to appear on, because removing it from one and leaving it on the others
  // is the state this replaced.
  await openWs(WS.GC, 350);
  ok("the first workshop offers no sector to pick",
    (await page.locator(".panel.ws-accent .panel-head h3", { hasText: /^Sector$/ }).count()) === 0);
  // The sample's sector is "Energy & utilities", and the institution is "Riverbend Municipal
  // Utilities" - so the word alone proves nothing, and the value has to be asked for.
  ok("...and the study's subtitle does not carry one either",
    !/Energy & utilities/i.test(await page.locator(".topbar .sub").first().innerText()));

  // Row click expands inline detail; clicking a linked item opens the popup.
  await page.locator(".tbl tbody tr.row-clickable").first().locator(".name").click();
  await page.waitForTimeout(200);
  ok("row expands inline detail", await page.locator(".detail").count() > 0);
  // What points at a record is grouped by who points and through which relation, so a
  // record a hundred others name reads as a sentence with a count, not a wall of chips.
  ok("what points at the record is grouped by kind and relation",
    (await page.locator(".detail .d-rel-group").count()) >= 1
    && (await page.locator(".detail .d-rel-head .badge").count()) >= 1);
  await page.screenshot({ path: `${shots}/RowDetail.png` });
  const link = page.locator(".detail .chip.link").first();
  ok("the detail lists what points at this record", (await page.locator(".detail .chip.link").count()) >= 3);
  await link.click();
  await page.waitForTimeout(250);
  ok("linked item opens popup", await page.locator(".modal-lg").count() > 0);
  ok("popup has editable fields", await page.locator(".modal-lg .form-grid input").count() > 0);
  await page.screenshot({ path: `${shots}/EntityModal.png` });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);

  // Change history (hash-chained audit trail): editing records who/what + verifies.
  await page.locator(".detail .btn", { hasText: "Edit" }).first().click();
  await page.waitForSelector(".modal-lg");
  await page.locator('.modal-lg input[placeholder="your name"]').fill("e2e");
  await page.locator('.modal-lg input[placeholder="why this change"]').fill("audit check");
  const _hta = page.locator(".modal-lg textarea").first();
  await _hta.fill((await _hta.inputValue()) + " .");
  await page.locator(".modal-lg .btn.primary", { hasText: "Save" }).click();
  await page.waitForTimeout(200);
  ok("change history button shown after edit", (await page.locator(".hist-btn").count()) > 0);
  ok("change-history integrity verified", (await page.locator(".hist-btn .hist-chain.ok").count()) > 0);
  await page.locator(".hist-btn").click();
  await page.waitForSelector(".modal-lg .hist-item");
  ok("change history popup lists entries", (await page.locator(".modal-lg .hist-item").count()) > 0);
  await page.locator('.modal-lg .btn.ghost[aria-label="Close"]').click();
  await page.waitForTimeout(150);

  // Structural modelling: protection needs per target object, and the requirement side.
  // The Zielobjektkategorie is one of the BSI's 39 published categories - a value outside
  // that namespace would not come back from the enum on the next edit.
  await openWs(WS.STM, 350);
  const zo = section("Assets");
  await zo.locator("tbody tr").filter({ has: page.locator(".name", { hasText: "Control system (SCADA)" }) }).locator(".name").click();
  await page.waitForTimeout(250);
  const zoDetail = await zo.locator(".detail").innerText();
  ok("an asset carries a category from the BSI's namespace", /IT-Systeme/.test(zoDetail));
  ok("...and the reason it was mapped there, which decides its requirements",
    /operated as a system in its own right/i.test(zoDetail));
  // The package is built the way STM.2.1 says: categories widened up the hierarchy, the
  // ISMS practices added whole, every requirement carrying the rule that put it there.
  const reqCount = Number((await section("Requirements").locator(".panel-head .badge").first().innerText()).trim());
  ok(`the requirement package is modelled, not typed (${reqCount} requirements)`, reqCount > 300);
  // STM.2.1.5: what the catalogue classifies nowhere is not derived and not dropped - it
  // is put up for a decision, by the chapter it sits in.
  {
    const m = page.locator(".panel", { has: page.locator(".panel-head h3", { hasText: "Derived from the catalogue" }) });
    ok("the derivation is shown before it is applied", (await m.count()) === 1);
    const txt = await m.innerText();
    ok("...naming the assets it read and what they inherited", /Dial-up access at the legacy stations/.test(txt) && /Networks/.test(txt));
    ok("...and what the catalogue classifies nowhere", /name no class at all/.test(txt) && /364/.test(txt));
    ok("...recorded and set back rather than left out",
      /recorded and set back until someone says they apply/.test(txt));
  }
  // The whole ruleset is in the register; what no rule reached is present and dimmed, which
  // is what makes it possible to bring one in by hand (STM.2.1.5).
  {
    const sec = section("Requirements");
    const rows = await sec.locator("tbody tr.row-clickable").count();
    const dim = await sec.locator("tbody tr.row-dim").count();
    // 1000 published requirements plus the one this institution took on out of its own
    // compliance obligations (STM.2.1.7) - an own requirement is a member of the package,
    // not a note beside it.
    ok(`the whole ruleset is recorded, plus what the institution added (${rows})`, rows === 1001);
    ok(`...with what no rule reached set back (${dim} of ${rows})`, dim === 609);
    // Bringing one in by hand is one press, and the press is what an audit sees: it goes
    // through the change record like any other edit.
    // The filter is a row of menus, not a wall of chips - a register of a thousand rows
    // would otherwise carry more filter than table.
    ok("the filter is one line of menus", (await sec.locator(".tbl-tools").count()) === 1
      && (await sec.locator(".tbl-tools .facet-menu").count()) >= 3);
    const scopeMenu = sec.locator(".facet-menu", { hasText: "In scope" }).first();
    await scopeMenu.locator(".facet-btn").click();
    await page.waitForTimeout(250);
    const opts = await scopeMenu.locator(".facet-opt").allInnerTexts();
    ok("scope is offered as a filter, with both counts",
      opts.some((o) => /in scope/i.test(o)) && opts.some((o) => /out of scope/i.test(o)));
    await page.mouse.click(4, 4);
    await page.waitForTimeout(150);
    ok("every row carries the switch, engaged where the reading reached it",
      (await sec.locator(".cell-toggle").count()) === 1001
      && (await sec.locator(".cell-toggle.on").count()) === 392);
    const off = sec.locator("tbody tr.row-dim .cell-toggle").first();
    await off.click();
    await page.waitForTimeout(500);
    ok("...and one press brings a requirement into scope",
      (await sec.locator("tbody tr.row-dim").count()) === dim - 1
      && (await sec.locator(".cell-toggle.on").count()) === 393);
    // The question the register is read with: which asset put this requirement here.
    // It is a column, and it is empty exactly where the method says it should be.
    ok("the register shows which asset brought a requirement in",
      /Applies to assets/i.test(await sec.locator("thead").innerText()));
    // Addressed by its heading, not by counting from the end: a filler column at the right
    // of every register was removed, and a position-counted selector silently moved one
    // column over rather than failing.
    const assetCells = await sec.evaluate((el) => {
      const heads = [...el.querySelectorAll("thead th")].map((h) => h.textContent.trim());
      const i = heads.findIndex((h) => /Applies to assets/i.test(h));
      if (i < 0) return [];
      return [...el.querySelectorAll("tbody tr.row-clickable")]
        .map((tr) => (tr.children[i]?.textContent ?? "").trim());
    }).catch(() => []);
    ok("...filled for what an asset reached, empty for the practices that reach the whole domain",
      assetCells.some((c) => /SCADA|network|provider|Directory|Billing|Dial-up/i.test(c)));
    ok("...what the reading reached is in scope, saying through which asset",
      /In scope: Control system \(SCADA\) - IT-Systeme/.test(
        await sec.locator("tbody tr", { hasText: "BER.1.1" }).first().innerText().catch(() => "")) || dim < rows);
  }
  // The migration path: the BSI's own mapping travels with the ruleset, so an institution
  // arriving from the 2023 compendium can see what it has already done.
  {
    const sec = section("Requirements");
    await sec.locator("tbody tr", { hasText: "ARCH.1.1" }).first().locator(".name").click();
    await page.waitForTimeout(300);
    const d = await sec.locator(".detail").first().innerText();
    ok("a requirement names what it corresponds to in the 2023 compendium",
      /IT-Grundschutz 2023/i.test(d) && /\bA\d+/.test(d));
    ok("...with the closeness the mapping states, not merely that there is one",
      /(equal-to|subset-of|superset-of|intersects-with|equivalent-to)/.test(d));
    await sec.locator("tbody tr", { hasText: "ARCH.1.1" }).first().locator(".name").click();
    await page.waitForTimeout(150);
  }
  // A workshop with several registers of a thousand rows is unreadable laid out in full.
  {
    const sec = section("Requirements");
    const before = await sec.locator("tbody tr").count();
    await sec.locator(".panel-fold").click();
    await page.waitForTimeout(200);
    ok("a register folds away by its own heading",
      (await sec.locator("tbody tr").count()) === 0 && before > 100);
    ok("...and the head still says how many are in it",
      /1001/.test(await sec.locator(".panel-head").innerText()));
    await sec.locator(".panel-fold").click();
    await page.waitForTimeout(300);
    ok("...and comes back with its rows", (await sec.locator("tbody tr").count()) === before);
  }
  // A published implementation names the requirements it answers, and that arrives as a
  // relation - but only what is actually in use counts as fulfilling one. The sample
  // records 35 published components set back, so the coverage must NOT show their 291.
  {
    const fw = section("Framework coverage");
    const txt = await fw.innerText();
    const covered = Number((/(\d+)\/\d+/.exec(txt.replace(/\s+/g, " ")) ?? [0, "999"])[1]);
    ok("coverage counts only the measures actually in use", covered <= 10,
      `${covered} covered - the 35 published components are set back and must not count`);
  }

  // The coverage matrix carries the same filter, and the question it exists to answer -
  // what nothing fulfils - is one press. Against a package of a thousand it is the only
  // way the view says anything at all.
  {
    const cov = section("Coverage & traceability");
    ok("the coverage matrix carries the same filter as a table", (await cov.locator(".tbl-tools").count()) === 1);
    const before = await cov.locator(".panel-head .badge").innerText();
    await cov.locator(".facet-btn", { hasText: "Gaps only" }).click();
    await page.waitForTimeout(400);
    const after = await cov.locator(".panel-head .badge").innerText();
    ok("...and can show only what no measure fulfils",
      /\d+ \/ \d+/.test(after) && Number(after.split("/")[0]) < Number(before), `${before} -> ${after}`);
    await cov.locator(".facet-btn", { hasText: "Gaps only" }).click();
    await page.waitForTimeout(300);
  }
  ok("coverage and traceability are shown for the requirement side",
    (await section("Coverage & traceability").count()) === 1 && (await section("Framework coverage").count()) === 1);
  await page.screenshot({ path: `${shots}/Anforderungen.png` });

  // Risk analysis. The matrix belongs to the strategic-scenario workshop only.
  await openWs(WS.GC);
  ok("no risk matrix in the first workshop", (await page.locator(".risk-matrix").count()) === 0);
  await openWs(WS.RISK, 400);
  ok("risk matrix in the risk workshop", (await page.locator(".risk-matrix").count()) > 0);
  // inherent↔residual toggle, fed by the Risikobehandlung records
  ok("risk matrix has residual toggle", await page.locator(".panel:has(.risk-matrix) .seg-btn", { hasText: "Residual" }).count() > 0);
  await page.locator(".panel:has(.risk-matrix) .seg-btn", { hasText: "Residual" }).click();
  await page.waitForTimeout(150);
  ok("residual mode marks the treated risks", (await page.locator(".rm-treated").count()) === 2);
  await page.locator(".panel:has(.risk-matrix) .seg-btn", { hasText: "Inherent" }).click();
  await page.waitForTimeout(150);
  ok("kill-chain steps table has draggable rows", (await section("Attack steps").locator("tbody tr.row-drag").count()) > 0);
  // expand the attack-scenario row to reveal its embedded kill-chain lane
  await section("Attack scenarios").locator("tbody tr.row-clickable").first().locator(".name").click();
  await page.waitForTimeout(250);
  ok("kill-chain tiles inside the scenario row", (await page.locator(".kc-tile").count()) > 5);
  ok("kill-chain steps placed on tiles", (await page.locator(".kc-tile .kc-step").count()) > 0);
  await page.screenshot({ path: `${shots}/KillChain.png` });

  // Attack paths: both chains of the study projected onto the target objects they cross.
  await page.waitForSelector(".ap-toolbar", { timeout: 5000 });
  ok("attack paths is a sub-section of the risk workshop", (await page.locator(".panel:has(.ap-head) .panel-head h3", { hasText: "Attack paths" }).count()) > 0);
  ok("attack paths expanded by default with scenarios hidden", (await page.locator(".ap-body .empty").count()) > 0 && (await page.locator(".ap-chip.off").count()) === 2 && (await page.locator(".ap-graph").count()) === 0);
  for (const c of await page.locator(".ap-chip").all()) await c.click(); // toggle every scenario on
  await page.waitForSelector(".ap-graph", { timeout: 5000 });
  await page.locator(".ap-graph").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  ok("attack paths has a choke-point explanation box", (await page.locator(".ap-note").count()) > 0);
  const apSteps = await page.locator(".ap-node.step").count();
  ok(`attack paths render ${apSteps} step nodes`, apSteps === 7);
  ok("attack paths reach target objects", (await page.locator(".ap-node.asset, .ap-node.biz").count()) >= 2);
  ok("target objects sit in a dedicated zone", (await page.locator(".ap-zone-label").count()) > 0);
  // Two chains run through the control system and the telecontrol network; a step both
  // chains need is what the projection is for.
  ok("the shared route is marked as a choke point",
    /Control system|Telecontrol network/.test(await page.locator(".ap-node.choke").first().innerText()));
  ok("leaf business-process targets are NOT choke points", (await page.locator(".ap-node.biz.choke").count()) === 0);
  ok("attack paths draw edges", (await page.locator(".ap-edges path").count()) > 10);
  ok("attack paths list one toggle chip per chain", (await page.locator(".ap-chip").count()) === 2);
  await page.screenshot({ path: `${shots}/AttackPaths.png` });
  // toggling a scenario off removes its nodes
  const apBefore = await page.locator(".ap-node").count();
  await page.locator(".ap-chip").last().click();
  await page.waitForTimeout(250);
  ok("toggling a scenario off removes its nodes", (await page.locator(".ap-node").count()) < apBefore);
  await page.locator(".ap-chip").last().click();
  await page.waitForTimeout(200);
  // clicking a node opens the underlying step
  await page.locator(".ap-node.step", { hasText: "Move into the control system" }).click();
  await page.waitForTimeout(250);
  ok("attack-path node click opens entity popup", (await page.locator(".modal-lg").count()) > 0);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);

  // B+ predecessors: the candidate list is constrained and grouped. Driven from the third
  // step of the second chain, which has both an earlier step of its own and a step of the
  // first chain among its prerequisites.
  const stepSec = section("Attack steps");
  await stepSec.locator("tbody tr", { hasText: "Injection of altered" }).locator(".name").click();
  await page.waitForTimeout(250);
  // Scoped to this section: the scenario row above is still expanded and carries an Edit
  // button of its own, which would open the wrong record.
  await stepSec.locator(".detail .btn", { hasText: "Edit" }).first().click();
  await page.waitForSelector(".modal-lg");
  const predGroups = await page.evaluate(() => {
    for (const s of document.querySelectorAll(".modal-lg .multi select")) {
      const gs = [...s.querySelectorAll("optgroup")].map((g) => g.label);
      if (gs.some((l) => /This scenario|Cascade from/.test(l))) {
        const opts = [...s.querySelectorAll("option")].map((o) => o.textContent || "");
        return { intra: gs.includes("This scenario"), cross: gs.some((l) => l.startsWith("Cascade from")),
          offersLaterSameScenario: opts.some((t) => /Injection of altered/.test(t)) };
      }
    }
    return null;
  });
  ok("predecessors dropdown groups intra + cross-scenario candidates", !!predGroups && predGroups.intra && predGroups.cross);
  ok("predecessors dropdown hides later same-scenario steps (forward-only)", !!predGroups && predGroups.offersLaterSameScenario === false);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);

  // Realisation. The analytics have to speak the model's language: an outcome ring
  // (blocked / caught / through) instead of an averaged "coverage" figure, and a chain
  // counted as defended only where something actually resists or watches.
  await openWs(WS.UMS);
  await page.waitForSelector(".mc-ring", { timeout: 15000 });
  const mc = await page.locator(".panel:has(.mc-ring)").innerText();
  ok("realisation shows what becomes of an attempt", /blocked/i.test(mc) && /detected in time/i.test(mc) && /reaches the objective/i.test(mc));
  ok("the ring counts attempts, not coverage", /attempts stopped/i.test(mc) && !/residual gap/i.test(mc));
  ok("the ring says how many steps block and how many detect", /steps block an attacker/i.test(mc) && /detect him/i.test(mc));
  ok("kill-chain mitigation counts defended steps, not merely covered ones",
    (await page.locator(".tbl .badge", { hasText: /\d+\/\d+ defended/ }).count()) === 2);
  ok("the tactic heatmap carries a colour key", (await page.locator(".hm-key .hm-key-bar i").count()) >= 4);
  ok("the heatmap scrolls instead of clipping its columns", (await page.locator(".hm-scroll").count()) > 0);
  // All five effect classes are recorded in the sample; the model treats them differently
  // and the table has to show which one a measure belongs to.
  const clsCells = await page.locator(".tbl .badge").allInnerTexts();
  ok("every effect class the model knows is exercised by the sample",
    ["Preventive", "Detective", "Corrective", "Deterrent", "Avoidance"].every((c) => clsCells.includes(c)));
  await page.locator(".mc-ring").scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${shots}/ChainDefence.png` });
  // Every percentage has to be able to explain itself.
  await page.locator("button.hm-cell").first().click();
  await page.waitForSelector(".ft-card", { timeout: 5000 });
  const tp = await page.locator(".ft-card").innerText();
  ok("a heatmap tile shows the working as a calculation", (await page.locator(".ft-card .tx-formula").count()) === 1
    && /average of \d+ step/i.test(tp));
  ok("the explanation lists the steps that go into the average", (await page.locator(".ft-card .tx-row").count()) >= 2);
  ok("...naming the measures on them and what class each is", /PREVENTIVE/.test(tp) && /DETERRENT/.test(tp));
  ok("the explanation says which classes are not counted", /corrective, deterrent and avoidance measures are not counted/i.test(tp));
  // Saying only what those classes DON'T do left the analyst none the wiser, and "they act
  // elsewhere" named no place. The text has to say WHICH factor each of them acts on.
  ok("the explanation names the factor each excluded class acts on",
    /act on .{0,12}the loss/i.test(tp) && /damage control/i.test(tp) && /the number of attacks/i.test(tp));
  ok("the explanation says they still count towards the risk", /both move the risk figures/i.test(tp));
  ok("the explanation separates being defended from being safe", /how consistently the tactic's steps are defended/i.test(tp));
  await page.screenshot({ path: `${shots}/TacticExplain.png` });
  await page.locator('.ft-card button[aria-label="Close"]').click();
  await page.waitForTimeout(150);

  // The parameters that decide what a measure is worth belong in the workshop where the
  // measures are, directly below the chart that shows their combined effect.
  // A measure on an attack step is in use by that fact, so the switch that would set it
  // back is refused and says why. Everything else stays switchable.
  {
    const sec = section("Measures");
    const locked = sec.locator("tbody tr .cell-toggle.locked");
    ok("a measure on the chain cannot be taken out of use", (await locked.count()) > 0,
      `${await locked.count()} locked switches`);
    // Naming what holds it, not counting it: "(1)" left the reader to go and find which one.
  ok("...and the switch names what holds it",
    /In use: acts on .+\. Take it off there first\./i.test(await locked.first().getAttribute("title") ?? ""),
    await locked.first().getAttribute("title") ?? "");
    ok("...while a measure on no step stays switchable",
      (await sec.locator("tbody tr .cell-toggle:not(.locked)").count()) > 0);
  }
  ok("realisation has a control-parameter panel", (await page.locator(".cal").count()) === 1);
  const order = await page.locator(".main .panel .panel-head h3").allInnerTexts();
  ok("...directly below Chain defence, where its effect is shown",
    order[0] === "Chain defence" && order[1] === "Control parametrization");
  ok("...shut by default", !(await page.locator(".cal-body").count()));
  await page.locator(".cal .panel-head .btn").click();
  await page.waitForTimeout(300);
  const scoped = await page.locator(".cal-table h3").allInnerTexts();
  ok("...showing only the measure tables, not the whole calibration",
    scoped.length === 2 && /Defence in depth/.test(scoped[0]));
  ok("...with dials and the depth curve, not bare number boxes",
    (await page.locator(".cal .dial-track").count()) > 5 && (await page.locator(".cal .depth-svg").count()) === 1);
  // The strengths are grouped by the class they belong to, with the channel each acts
  // through - a flat list of nine gave no clue which control type a figure was about.
  const classes = await page.locator(".cal-class-h b").allInnerTexts();
  ok("effect strengths are grouped by control class",
    ["Detective", "Corrective", "Deterrent", "Avoidance"].every((c) => classes.includes(c)));
  ok("...each naming the channel it acts through",
    /reduces the number of attempts made/i.test(await page.locator(".cal-class").nth(2).innerText()));

  // The measure catalogue: no ruleset ships with this build, so the picker has to say
  // where a catalogue comes from instead of presenting an empty list.
  ok("measure catalog picker present", (await page.getByRole("button", { name: /^Measure$/ }).count()) > 0);
  await page.getByRole("button", { name: /^Measure$/ }).first().click();
  await page.waitForTimeout(250);
  const pick = await page.locator(".modal-lg").innerText();
  ok("the picker offers a custom measure and names the import route",
    /Create custom/i.test(pick) && /Import a framework file in Documents/i.test(pick));
  // A number on a button states what pressing it does. Nothing is selected here, so the
  // button does nothing, and there is nothing to state - "Add 0 selected" offers an action
  // that is not on offer, and on a destructive control ("Disable 4", greyed) it reads as a
  // threat. The other direction of the same rule is asserted on the import dialog further
  // down, which is where a selection can be built up: "Add 1 selected".
  {
    const add = page.locator(".modal-lg-foot .btn.primary").first();
    ok("a button that refuses carries no count", /^Add selected$/.test((await add.innerText()).trim()));
    ok("...and it does refuse", await add.isDisabled());
  }
  await page.locator('.modal-lg .btn.ghost[aria-label="Close"]').click().catch(() => {});
  await page.waitForTimeout(150);

  // A control is chosen where it is missing: the catalogue is one press away at the step
  // itself, and what is chosen arrives already covering that step.
  {
    const row = page.locator(".tbl .row-clickable").filter({ hasText: /\d+\/\d+ defended/ }).first();
    if (await row.count()) {
      await row.click();
      await page.waitForTimeout(350);
      // Everything already recorded is in the list - the catalogue is imported into that
      // same list - so the last entry writes the one that does not exist yet, as a full
      // form with the step it acts on already filled in.
      const sel = page.locator(".kcc-card .multi select").first();
      const opts = await sel.locator("option").allInnerTexts();
      ok("the measure list ends with making a new one",
        opts.some((o) => /Create a measure/i.test(o)));
      await sel.selectOption({ label: "Create a measure…" });
      await page.waitForTimeout(400);
      ok("...opening the full form, with the step it acts on already filled in",
        (await page.locator(".modal-lg .form-grid input").count()) > 0
        && (await page.locator(".modal-lg .chip").count()) > 0);
      await page.keyboard.press("Escape");
      await page.waitForTimeout(250);
      await row.click();
      await page.waitForTimeout(200);
    }
  }

  // No quantification. The method leaves the risk method open (STM.4.1) and this
  // product answers it qualitatively; the monetary loss expectation stays in Aurelian
  // Lite. Absence is checked, not assumed - the engine still carries the code.
  ok("no quantification workshop is offered", (await page.locator(".ws-tabs .ws-tab:not(.plain)").count()) === WS_LABELS.length);
  ok("...and no workshop is named for it",
    !/quantification/i.test(await page.locator(".ws-tabs").innerText()));
  for (const ws of [WS.RISK, WS.UMS]) {
    await openWs(ws);
    const body = await page.locator(".content").innerText();
    ok(`workshop ${ws + 1} shows no annual loss expectation`,
      !/expected annual loss|\bALE\b|Monte.Carlo/i.test(body));
  }
  ok("...and no quantification view is rendered anywhere", (await page.locator(".qt-top, .qt-acc, .qt-break").count()) === 0);

  // What a measure is worth stays: it is what the coverage and the treatment matrix
  // read. It sits in the implementation workshop as its own panel, under its own name.
  await openWs(WS.UMS, 400);
  await page.locator(".cal .panel-head .btn").click();
  await page.waitForTimeout(250);
  ok("...and the panel that stays promises no quantification",
    !/quantification/i.test(await page.locator(".cal").innerText()));
  const grades = await page.locator(".cal-grade").allInnerTexts();
  ok("every table still declares how much it rests on", grades.length >= 2
    && grades.every((g) => /measured|derived|judgement/i.test(g)));
  await page.screenshot({ path: `${shots}/Calibration.png` });

  // Values are dials with the default marked, and an exact figure has to be typeable.
  const dial = page.locator(".cal-table").first().locator(".dial-v").first();
  const before = await dial.innerText();
  ok("every value sits on a track with its default marked",
    (await page.locator(".cal-table").first().locator(".dial-track").count()) >= 3
    && (await page.locator(".cal-table").first().locator(".dial-dflt").count()) >= 3);
  await dial.click();
  await page.locator(".dial-v.editing").fill("0.9");
  await page.locator(".dial-v.editing").press("Enter");
  await page.waitForTimeout(250);
  ok("an edited value is kept", /0\.9/.test(await page.locator(".cal-table").first().locator(".dial-v").first().innerText()));
  ok("...and the table itself is marked", (await page.locator(".cal-edited").count()) >= 1);
  await page.waitForTimeout(700);          // let the debounced write reach storage
  await page.reload();
  await page.waitForTimeout(900);
  if (!(await page.locator(".ws-tabs").count())) {
    await page.locator(".study-card, .card").first().click();
    await page.waitForTimeout(400);
  }
  await openWs(WS.UMS, 500);
  await page.locator(".cal .panel-head .btn").click();
  await page.waitForTimeout(250);
  ok("an edited parameter survives a reload, stored with the study",
    /0\.9/.test(await page.locator(".cal-table").first().locator(".dial-v").first().innerText()));
  ok("...and the changed value is marked against its default",
    (await page.locator(".cal-table").first().locator(".dial-v.moved").count()) >= 1);
  await page.locator(".cal-reset").first().click();
  await page.waitForTimeout(250);
  ok("resetting one table restores its default",
    (await page.locator(".cal-table").first().locator(".dial-v").first().innerText()) === before);

  // Defence in depth: one curve, switchable by implementation level, so the saturation
  // and the trade between many weak measures and one strong one are both visible. The
  // level switch has to use the scale the profile declares, not a fixed set of words.
  const depth = page.locator(".cal-table", { hasText: "Defence in depth" });
  await depth.scrollIntoViewIfNeeded();
  ok("the stacking relationship is drawn, not described", (await depth.locator(".depth-svg").count()) === 1);
  ok("...in attempts getting through, not in an intermediate",
    /how many get through/i.test(await depth.locator(".depth-key").innerText()));
  ok("weights read as multipliers, not as shares of attacks",
    /×0\.33/.test(await depth.innerText()) || /x0\.33/.test(await depth.innerText()));
  ok("...and the level switch uses the scale's own labels",
    /none/.test(await depth.locator(".depth-switch").innerText())
    && /full/.test(await depth.locator(".depth-switch").innerText()));
  const atFull = await depth.locator(".depth-note").innerText();
  await depth.locator(".depth-switch .cal-seg-b").nth(1).click();
  await page.waitForTimeout(200);
  ok("switching the level redraws the curve", (await depth.locator(".depth-note").innerText()) !== atFull);
  await depth.locator(".depth-switch .cal-seg-b").first().click();
  await page.waitForTimeout(200);
  ok("a measure implemented at the lowest level counts for nothing",
    /counts for nothing/i.test(await depth.locator(".depth-note").innerText()));
  await depth.locator(".depth-switch .cal-seg-b").last().click();
  await page.waitForTimeout(150);

  // The report follows the product, not the engine: no quantitative section, no money.
  await page.locator(".btn.sm", { hasText: "Report" }).click();
  await page.waitForTimeout(200);
  // STM.2.1.6 ends with "dem BSI zugestellt", and the delivery sits here rather than in the
  // export menu: to a reader "what can I get out of this study" is one question, and the
  // export menu is one of the five files the mirror takes from the parent, so nothing of
  // this product may live there. Checked while the menu is open - it holds a fixed overlay
  // that swallows every later click, and only using an entry takes it down.
  {
    const own = page.locator(".menu-item", { hasText: "own requirements to the BSI" });
    ok("the method's own delivery is offered beside the report", (await own.count()) === 1);
    // The sample carries an own requirement out of a compliance obligation (STM.2.1.7) and
    // none for an asset the catalogue misses (STM.2.1.6). Only .6 names a delivery, so the
    // entry says there is nothing to send rather than writing an empty document.
    ok("...and says there is nothing to deliver rather than writing an empty file",
      await own.first().isDisabled());
    ok("...naming the requirement it would answer",
      /STM\.2\.1\.6/.test((await own.first().innerText()) + (await own.first().getAttribute("title") ?? "")));
    // The BSI has published no certification scheme for Grundschutz++, so the seven
    // reference documents are the classic set, named as that set. Beside the report, not
    // instead of it - the report stays the security concept the method itself names.
    const refs = page.locator(".menu-item", { hasText: "Reference documents" });
    ok("the reference documents are offered beside the report", (await refs.count()) === 1);
    ok("...enabled, because this study fills them", !(await refs.first().isDisabled()));
    ok("...as a page to read and print", /new tab/.test(await refs.first().innerText()));
    // Not a document: the file an institution submits, in the publisher's own format. The
    // hint carries the reason while the entry is disabled, so the LABEL is what has to say
    // that this is a sending rather than something to read.
    ok("...and the delivery is labelled as a sending, not as a document",
      /Send own requirements to the BSI/.test(await own.first().innerText()));
  }
  const [report] = await Promise.all([
    page.context().waitForEvent("page"),
    page.locator(".menu-item.stacked", { hasText: "Open in browser" }).click(),
  ]);
  await report.waitForLoadState("domcontentloaded");
  const rep = await report.locator("body").innerText();
  ok("the report is produced", rep.length > 2000 && /Riverbend/.test(rep));
  ok("...with no quantitative-risk section", !/Quantitative risk|Monte.Carlo|Expected annual loss/i.test(rep));
  ok("...and no monetary figures at all", !/[\u20ac$]\s?\d|\d\s?(EUR|USD)\b/.test(rep));
  await report.close();

  // Driven end to end: the set is opened, read back, and asked whether it is what it claims
  // to be. A.1 and A.2 are the SAME register read twice - the objects, then their protection
  // need - which is the whole reason the renderer takes a field selection.
  const [refPage] = await Promise.all([
    page.context().waitForEvent("page"),
    page.locator(".btn.sm", { hasText: "Report" }).click().then(() => page.waitForTimeout(200))
      .then(() => page.locator(".menu-item.stacked", { hasText: "Reference documents" }).click()),
  ]);
  await refPage.waitForLoadState("domcontentloaded");
  const refText = await refPage.locator("body").innerText();
  ok("the reference set opens as a page", refText.length > 2000);
  ok("...saying the BSI published no scheme for this method",
    /kein Zertifizierungsschema veröffentlicht/.test(refText));
  ok("...and that this is the classic set, named as that set",
    /klassischen IT-Grundschutz-Zertifizierung/.test(refText));
  // The delivery goes to a German federal office, so the document is written in German and
  // says so - hyphenation and a screen reader both read that attribute.
  ok("...written in German, and declaring it",
    (await refPage.evaluate(() => document.documentElement.lang)) === "de");
  ok("...naming its columns and its own words in German",
    /Kennung/.test(refText) && /Sicherheitsniveau/.test(refText)
    && /Umsetzungsstatus/.test(refText) && /Quellen und Lizenzbedingungen/.test(refText));
  // The values the BSI publishes stay as published; this product's own get a German
  // reading, and the stored value behind it is untouched - treatment.ts compares on it.
  ok("...with the published values as published, and ours read in German",
    /MUSS/.test(refText) && /normal-SdT/.test(refText)
    && /Prozess/.test(refText) && !/Statutory task/.test(refText));
  for (const [id, title] of [["A.0", "Leitlinie"], ["A.1", "Strukturanalyse"],
    ["A.2", "Schutzbedarfsfeststellung"], ["A.3", "Modellierung"],
    ["A.4", "Ergebnis des Grundschutz-Checks"], ["A.5", "Risikoanalyse"],
    ["A.6", "Realisierungsplan"]]) {
    ok(`...carrying ${id} ${title}`,
      (await refPage.locator("h2", { hasText: `${id} ${title}` }).count()) === 1);
  }
  {
    // Each name stands twice - once in the contents, once as the heading - so the LAST
    // occurrence is the section itself.
    const a1 = refText.slice(refText.lastIndexOf("A.1 Strukturanalyse"), refText.lastIndexOf("A.2 Schutzbedarfsfeststellung"));
    const a2 = refText.slice(refText.lastIndexOf("A.2 Schutzbedarfsfeststellung"), refText.lastIndexOf("A.3 Modellierung"));
    // innerText is the RENDERED text and a register heading is set in capitals, so the
    // comparison is on the words, not on their case.
    const reg = /geschäftsprozesse und informationen \(/i;
    ok("A.1 reads the processes without their protection need",
      reg.test(a1) && !/Schutzbedarf/i.test(a1));
    ok("...and A.2 reads the same register for exactly that",
      reg.test(a2) && /Schutzbedarf/i.test(a2));
  }
  ok("...and it carries the licence notice the ruleset asks for",
    /Quellen und Lizenzbedingungen/.test(refText) && /CC BY-SA 4\.0/.test(refText));
  ok("...with the catalogue version a reader can compare, not to the microsecond",
    !/Version \d{4}-\d{2}-\d{2}T/.test(refText));
  // Past a dozen records a register is a table, and past twenty rows it is set dense -
  // 393 requirements as a headed block each ran to several thousand lines.
  ok("...printing the big registers as tables rather than a block per record",
    (await refPage.locator("table tr").count()) > 700);
  ok("...set dense, so a long register fits a page",
    (await refPage.locator("table.dense").count()) >= 2
    && (await refPage.locator("table:not(.dense)").count()) >= 1);
  // The residual risk of UMS.1.2 is a sentence each: wanted in the document, not as a
  // column, and printed where it is read.
  ok("...and keeping paragraphs out of the columns",
    (await refPage.locator("th", { hasText: "Restrisiko bei Nichtumsetzung" }).count()) === 0
    && /Restrisiko bei Nichtumsetzung/.test(refText));
  // The defect this replaces was invisible to scrollWidth: a transform pulled the register
  // out of the sheet, hanging over both edges of the page it is meant to be printed on, and
  // scrollWidth does not count transformed boxes. So this measures the boxes themselves.
  ok("...with nothing written past the edges of the sheet",
    (await refPage.evaluate(() => {
      const rep = document.querySelector(".report");
      const cs = getComputedStyle(rep), r = rep.getBoundingClientRect();
      const l = r.left + parseFloat(cs.paddingLeft), rt = r.right - parseFloat(cs.paddingRight);
      return [...document.querySelectorAll("table, pre, div[align]")]
        .filter((e) => { const b = e.getBoundingClientRect(); return b.left < l - 1 || b.right > rt + 1; })
        .length;
    })) === 0);
  ok("...and the sheet grew to hold the register rather than the register leaving it",
    (await refPage.evaluate(() => {
      const t = document.querySelector("table.dense");
      return t.getBoundingClientRect().width / document.querySelector(".report").clientWidth;
    })) > 0.8);
  // A set whose parts are called A.0 to A.6 must not be numbered a second time on top.
  ok("...numbered once, by the names the set already carries",
    !/^\s*\d+\s+A\.\d/m.test(refText)
    && (await refPage.locator(".report.numbered").count()) === 0);
  // Tables on one sheet share both edges. They did not: the small ones were capped at the
  // prose measure and stood 400px short of the wide ones, all on the same left edge, which
  // reads as a mistake rather than as two kinds of object.
  ok("...with every table on the same two edges",
    (await refPage.evaluate(() => {
      const t = [...document.querySelectorAll("table")].map((x) => x.getBoundingClientRect());
      if (t.length < 2) return 999;
      const l = t.map((b) => Math.round(b.left)), r = t.map((b) => Math.round(b.right));
      return Math.max(...l) - Math.min(...l) + Math.max(...r) - Math.min(...r);
    })) <= 2);
  // Two registers read from the same records sit under one another; their shared leading
  // columns have to line up rather than land a few pixels apart.
  ok("...and the registers read from one record lined up with each other",
    (await refPage.evaluate(() => {
      const rows = [...document.querySelectorAll("table.dense tbody tr:first-child")]
        .map((tr) => [...tr.children].slice(0, 3).map((td) => Math.round(td.getBoundingClientRect().left)));
      if (rows.length < 2) return 999;
      return Math.max(...rows.map((r) => Math.max(...r.map((x, i) => Math.abs(x - rows[0][i])))));
    })) <= 1);
  ok("...fetching nothing from anywhere",
    (await refPage.locator("link[href^='http'], script[src^='http'], img[src^='http']").count()) === 0);
  await refPage.close();

  // VRB, the improvement practice: a nonconformity is examined for its cause and for
  // whether it can recur (VRB.2.1), and the corrections and improvements against it are a
  // register of their own with priorities (VRB.5.1) and a test of whether they worked
  // (VRB.6.1) - not a sentence in a text field, which cannot carry any of that.
  await openWs(WS.VRB, 500);
  {
    const act = section("Corrective and improvement actions");
    ok("corrections and improvements are one register", (await act.count()) === 1);
    const rows = await act.locator("tbody tr.row-clickable").count();
    ok("...carrying both kinds", rows === 2, `${rows} rows`);
    const txt = await act.innerText();
    ok("...with a priority on each, which VRB.5.1 requires of both", /1 - first/.test(txt) && /2/.test(txt));
    ok("...and a verdict on whether the carried-out one worked", /Partly effective/.test(txt));
    const nc = section("Nonconformities");
        await nc.locator("tbody tr.row-clickable").first().locator(".name").click();
    await page.waitForTimeout(300);
    ok("a nonconformity records what let it happen, not only what happened",
      /never given to anyone as a task/.test(await nc.locator(".detail").first().innerText()));
  }

  // GC.4 and GC.5: who expects something of information security here, and the policy that
  // answers them. Five MUSS in the policy alone, and the one that carries the document's
  // whole force - GC.5.1.4, the authorisation, which the method requires to be documented
  // rather than merely to have happened.
  await openWs(WS.GC, 500);
  {
    const parties = section("Interested parties");
    ok("the interested parties are analysed, not listed", (await parties.count()) === 1);
    const pt = await parties.innerText();
    ok("...external and internal, as GC.4.1 and GC.4.2 split them",
      /External/.test(pt) && /Internal/.test(pt) && /Bundesnetzagentur/.test(pt));
    ok("...none of them missing what it needs or what it weighs",
      (await page.locator(".lint-card .lint-title", { hasText: "without their needs" }).count()) === 0);

    const pol = section("Security policy and strategy");
    ok("the policy is a record of its own", (await pol.count()) === 1);
    await pol.locator("tbody tr.row-clickable").first().locator(".name").click();
    await page.waitForTimeout(300);
    const d = await pol.locator(".detail").first().innerText();
    ok("...naming its measurable objectives as the metrics that measure them",
      /Share of MUSS requirements implemented/.test(d) && /second factor/.test(d));
    ok("...and who authorised it, and when", /Managing director/.test(d) && /2026-02-14/.test(d));
    ok("an authorised policy in force is not a finding",
      (await page.locator(".lint-card .lint-title", { hasText: "no documented authorisation" }).count()) === 0);
  }

  // GC.9.1 and its six sub-requirements: the security organisation. Eight MUSS about roles,
  // committees and the interfaces to neighbouring disciplines - and about the ISB in
  // particular, whose standing is what the method spends three requirements on.
  await openWs(WS.GC, 500);
  {
    const roles = section("Roles and responsibilities");
    ok("the security organisation is a register", (await roles.count()) === 1);
    const rows = await roles.locator("tbody tr.row-clickable").count();
    const owed = await roles.locator("tbody tr.row-dim").count();
    ok(`...holding what is established and what is owed (${rows}, of which ${owed} owed)`, rows === 4 && owed === 1);
    const txt = await roles.innerText();
    ok("...roles, a committee and an interface to another discipline, as GC.9.1 asks",
      /Committee/.test(txt) && /Interface to another discipline/.test(txt));
    ok("...every established one naming a deputy",
      (await page.locator(".lint-card .lint-title", { hasText: "no deputy" }).count()) === 0);
    // The three the method asks of the ISB alone: answerable to the management directly, a
    // direct right of audience, and resources to act with.
    await roles.locator("tbody tr", { hasText: "Information security officer" }).first().locator(".name").click();
    await page.waitForTimeout(300);
    const d = await roles.locator(".detail").first().innerText();
    ok("the information security officer carries the standing the method requires",
      /Directly to the managing director/.test(d) && /Yes/.test(d) && /FTE/.test(d));
  }

  // Fifteen MUSS requirements of the method ask for a PROCEDURE to be anchored rather than
  // for a record to be kept. A tool cannot anchor one; it can hold the statement that one
  // exists, what it says, where it is written down and who owns it - and it can show the
  // ones still owed, switched off, which is the gap nobody notices otherwise.
  await openWs(WS.GC, 500);
  {
    const proc = section("Procedures and rules");
    ok("the procedures the method asks to be anchored are a register", (await proc.count()) === 1);
    const rows = await proc.locator("tbody tr.row-clickable").count();
    const owed = await proc.locator("tbody tr.row-dim").count();
    ok(`...holding what is in force and what is still owed (${rows}, of which ${owed} owed)`, rows === 3 && owed === 1);
    ok("...each naming the method requirement it answers",
      /VRB\.1\.1/.test(await proc.innerText()) && /PERF\.3\.1/.test(await proc.innerText()));
    ok("a procedure in force with a document and an owner is not a finding",
      (await page.locator(".lint-card .lint-title", { hasText: "in force with nothing behind them" }).count()) === 0);
  }

  // Completeness checks. The sample leaves real gaps and the checks have to name them;
  // the ones it does not leave have to show up among the PASSING checks, not vanish.
  await page.locator(".ws-tab", { hasText: "Checks" }).click();
  await page.waitForTimeout(250);
  ok("checks view lists gaps", (await page.locator(".lint-card").count()) > 0);
  ok("uncovered kill-chain step flagged", (await page.locator(".lint-card .lint-title", { hasText: "Kill-chain steps with no security measure" }).count()) > 0);
  // Effect classification: the linter surfaces measures whose effect class is unset
  // (they would be quantified as preventive by default). The sample leaves none, so
  // the rule has to show up among the PASSING checks, not the failing ones.
  ok("effect-class check passes on the sample", (await page.locator(".lint-pass", { hasText: "Security measures with no effect class" }).count()) > 0);
  ok("effect-class check is not failing", (await page.locator(".lint-card .lint-title", { hasText: "Security measures with no effect class" }).count()) === 0);
  // Every risk carries a treatment decision, and the decision values are the engine's -
  // a translated value would silently take the reduction path. If that regressed, this
  // rule would report reduction with nothing reducing.
  ok("every risk carries a treatment decision", (await page.locator(".lint-pass", { hasText: "Risks with no treatment decision" }).count()) > 0);
  ok("the reduction decisions are backed by measures on the chain",
    (await page.locator(".lint-pass", { hasText: "Risks treated as 'Reduce' with nothing reducing them" }).count()) > 0);
  // Model-aware rules: a chain can be fully "covered" and still stop nobody. The sample's
  // sabotage chain is watched but never barred, which the quantification confirms above.
  const dOnly = page.locator(".lint-card:has(.lint-title:text-is('Kill chains defended by detection alone'))");
  ok("detection-only chains are flagged as a high finding", (await dOnly.count()) === 1
    && /high/i.test(await dOnly.locator(".lint-sev").innerText()));
  ok("...and it names the sabotage chain", /Mis-operation through altered switching commands/.test(await dOnly.innerText()));
  ok("monitored chains with nothing to respond with are flagged",
    (await page.locator(".lint-card .lint-title", { hasText: "Monitored chains with no way to respond" }).count()) === 1);
  // STM.2.1.4.2: the package is a relation, not a sentence, so an asset can be asked what
  // it carries. Read from the asset's end - the end an auditor reads it from.
  await openWs(WS.STM, 350);
  const scada = section("Assets").locator("tbody tr")
    .filter({ has: page.locator(".name", { hasText: "Control system (SCADA)" }) });
  await scada.locator(".name").click();
  await page.waitForTimeout(400);
  const scadaDetail = section("Assets").locator(".detail").first();
  // Grouped: the count is on the group head, the first twelve are shown and the rest are
  // one press away - ninety-three chips in a row said nothing.
  const group = scadaDetail.locator(".d-rel-group").filter({ hasText: "Requirements" }).first();
  const carried = Number((await group.locator(".badge").innerText()).replace(/\D/g, ""));
  ok("an asset says how many requirements it carries", carried > 20, `${carried} requirements point at it`);
  ok("...naming the relation the method uses", /applies to/i.test(await group.innerText()));
  ok("...showing the first of them and folding the rest away",
    (await group.locator(".chip.link").count()) <= 12
    && /\+\d+ more/.test(await group.innerText()));
  await scada.locator(".name").click();
  await page.waitForTimeout(200);

  // The other direction, and the one a thousand-row register is opened for: from the
  // Requirements table, which of them apply to THAT asset. The facets are derived from
  // the data, so a reference is offered only because the derivation filled it in.
  {
    const req = section("Requirements");
    const menu = req.locator(".facet-menu").filter({ has: page.locator(".facet-btn", { hasText: "Applies to assets" }) }).first();
    ok("the requirements table offers the asset a requirement applies to", (await menu.count()) === 1);
    await menu.locator(".facet-btn").click();
    await page.waitForTimeout(200);
    const first = menu.locator(".facet-opt").first();
    const named = (await first.innerText()).replace(/\s+/g, " ").trim();
    const counted = Number(named.replace(/.*?(\d+)$/, "$1"));
    ok("...each asset with the number of requirements pointing at it", counted > 20, named);
    await first.click();
    await page.waitForTimeout(500);
    ok("...and picking one narrows the table to them",
      (await req.locator(".tbl-count").innerText()).startsWith(`${counted} of `),
      await req.locator(".tbl-count").innerText());
    await first.click();
    await page.waitForTimeout(300);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    await req.locator(".tbl-group").selectOption({ label: "by applies to assets" });
    await page.waitForTimeout(900);
    const heads = await req.locator(".group-row th").allInnerTexts();
    ok("grouping by the asset lays the register out under each of them", heads.length >= 3, `${heads.length} groups`);
    ok("...saying that a row appears under each asset it names",
      /under each asset it names/.test(await req.locator(".tbl-note").innerText()));
    ok("...and the requirements naming none form a group of their own, not a gap",
      heads.some((h) => /no asset named/.test(h)), heads.slice(-1)[0]);
    await req.locator(".tbl-group").selectOption({ label: "no grouping" });
    await page.waitForTimeout(500);
  }

  await page.locator(".ws-tab", { hasText: "Checks" }).click();
  await page.waitForTimeout(250);

  // PERF.3: an audit is planned before it is held and documented after it. The sample
  // holds one carried out and one still planned, so both rules have something to say.
  ok("an audit held without a report is a finding",
    (await page.locator(".lint-card, .lint-pass").filter({ hasText: "held with no report" }).count()) === 1);
  ok("an audit with no objective, scope or team is a finding",
    (await page.locator(".lint-card, .lint-pass").filter({ hasText: "no objective, scope or team" }).count()) === 1);
  ok("...and the audit still to be held is the one it names",
    (await page.locator(".lint-card", { has: page.locator(".lint-title", { hasText: "no objective, scope or team" }) }).count()) === 0);

  // UMS.6.1 / UMS.6.2: the tracking round. The sample holds one run and one still on the
  // calendar, and the one that was run answers all four rules - so each has to be OFFERED
  // and each has to pass. A rule that fires on nothing and a rule that fires on everything
  // are the same mistake, and this is where the difference shows.
  for (const [name, needle] of [
    ["a target and an actual", "target and an actual"],
    ["who the result was told to", "told to nobody"],
    ["the procedure it runs under", "outside any procedure"],
    ["what the cause changed in the plan", "changed nothing in the plan"],
  ]) {
    ok(`a tracking round is asked for ${name}`,
      (await page.locator(".lint-card, .lint-pass").filter({ hasText: needle }).count()) === 1, needle);
    ok(`...and the round that was run answers it`,
      (await page.locator(".lint-card", { has: page.locator(".lint-title", { hasText: needle }) }).count()) === 0, needle);
  }

  // Four rules that pass could equally be four rules that fire on nothing - the failure
  // CLAUDE.md warns about, where a declaration is read by nobody and says so without one
  // error. So take the answer away from the round that was run and see the finding appear.
  {
    await openWs(WS.UMS, 500);
    const round = section("Tracking rounds").locator("tbody tr")
      .filter({ has: page.locator(".name", { hasText: "Q3/2026" }) }).first();
    await round.locator(".name").click();
    await page.waitForTimeout(300);
    await section("Tracking rounds").locator(".detail .btn", { hasText: "Edit" }).first().click();
    await page.waitForSelector(".modal-lg", { timeout: 8000 });
    // By its label, not by position - the form's order is not this check's business.
    const fld = page.locator(".modal-lg .field", { has: page.locator("label", { hasText: "Communicated to" }) })
      .locator("input").first();
    const kept = await fld.inputValue();
    ok("the sample round says who it was told", kept.length > 0, JSON.stringify(kept));
    await fld.fill("");
    await page.locator(".modal-lg .btn.primary", { hasText: "Save" }).click();
    await page.waitForTimeout(400);
    await page.locator(".ws-tab", { hasText: "Checks" }).click();
    await page.waitForTimeout(500);
    ok("...and taking that away makes the rule fire, so it is read",
      (await page.locator(".lint-card", { has: page.locator(".lint-title", { hasText: "told to nobody" }) }).count()) === 1);

    await openWs(WS.UMS, 500);
    if (!(await section("Tracking rounds").locator(".detail").count())) {
      await section("Tracking rounds").locator("tbody tr")
        .filter({ has: page.locator(".name", { hasText: "Q3/2026" }) }).first().locator(".name").click();
      await page.waitForTimeout(300);
    }
    await section("Tracking rounds").locator(".detail .btn", { hasText: "Edit" }).first().click();
    await page.waitForSelector(".modal-lg", { timeout: 8000 });
    await page.locator(".modal-lg .field", { has: page.locator("label", { hasText: "Communicated to" }) })
      .locator("input").first().fill(kept);
    await page.locator(".modal-lg .btn.primary", { hasText: "Save" }).click();
    await page.waitForTimeout(400);
    await page.locator(".ws-tab", { hasText: "Checks" }).click();
    await page.waitForTimeout(500);
    ok("...and putting it back clears it again",
      (await page.locator(".lint-card", { has: page.locator(".lint-title", { hasText: "told to nobody" }) }).count()) === 0);
  }
  // PERF.1.3, and the one condition no value comparison can express: a date that has
  // passed. The sample's next reading is not due yet, so nothing fires - move its date
  // behind us and it must, then put it back.
  {
    await openWs(WS.PERF, 500);
    const rev = section("Package reviews").locator("tbody tr")
      .filter({ has: page.locator(".name", { hasText: "2027" }) }).first();
    await rev.locator(".name").click();
    await page.waitForTimeout(300);
    await section("Package reviews").locator(".detail .btn", { hasText: "Edit" }).first().click();
    await page.waitForSelector(".modal-lg", { timeout: 8000 });
    const due = page.locator(".modal-lg .field", { has: page.locator("label", { hasText: "Due on" }) })
      .locator("input").first();
    const kept = await due.inputValue();
    ok("a reading not yet due raises nothing", kept === "2027-03-31", kept);
    await due.fill("2025-03-31");
    await page.locator(".modal-lg .btn.primary", { hasText: "Save" }).click();
    await page.waitForTimeout(400);
    await page.locator(".ws-tab", { hasText: "Checks" }).click();
    await page.waitForTimeout(500);
    ok("...and a date behind us makes the reading overdue",
      (await page.locator(".lint-card", { has: page.locator(".lint-title", { hasText: "were due and have not been held" }) }).count()) === 1);

    await openWs(WS.PERF, 500);
    if (!(await section("Package reviews").locator(".detail").count())) {
      await section("Package reviews").locator("tbody tr")
        .filter({ has: page.locator(".name", { hasText: "2027" }) }).first().locator(".name").click();
      await page.waitForTimeout(300);
    }
    await section("Package reviews").locator(".detail .btn", { hasText: "Edit" }).first().click();
    await page.waitForSelector(".modal-lg", { timeout: 8000 });
    await page.locator(".modal-lg .field", { has: page.locator("label", { hasText: "Due on" }) })
      .locator("input").first().fill(kept);
    await page.locator(".modal-lg .btn.primary", { hasText: "Save" }).click();
    await page.waitForTimeout(400);
    await page.locator(".ws-tab", { hasText: "Checks" }).click();
    await page.waitForTimeout(500);
    ok("...and moving it forward again clears it",
      (await page.locator(".lint-card", { has: page.locator(".lint-title", { hasText: "were due and have not been held" }) }).count()) === 0);
  }

  // The reading that was held answers what the method asks of it.
  ok("a package reading is asked what it found and who it was agreed with",
    (await page.locator(".lint-card, .lint-pass").filter({ hasText: "agreed with" }).count()) === 1);
  ok("...and the reading that was held answers it",
    (await page.locator(".lint-card", { has: page.locator(".lint-title", { hasText: "agreed with" }) }).count()) === 0);
  ok("a reading that adjusted the selection says whether it was derived again",
    (await page.locator(".lint-card, .lint-pass").filter({ hasText: "derived again" }).count()) === 1);

  // Everything below reads the checks page, so leave it where it was found.
  await page.locator(".ws-tab", { hasText: "Checks" }).click();
  await page.waitForTimeout(400);

  // STM.2.1.6/.7: the package may be extended by the institution's own requirements. Both
  // rules have to be offered, and the sample's compliance requirement has to satisfy its.
  ok("an own requirement has to say why the catalogue does not suffice",
    (await page.locator(".lint-card, .lint-pass").filter({ hasText: "why the catalogue does not suffice" }).count()) === 1);
  ok("a compliance requirement has to name its obligation",
    (await page.locator(".lint-pass", { hasText: "no obligation named" }).count()) === 1);
  ok("assets the catalogue reaches with nothing are checked for",
    (await page.locator(".lint-card, .lint-pass").filter({ hasText: "no requirement of the catalogue reaches" }).count()) === 1);

  // STM.3.1 with STM.4.1: lowering a level from erhöht to normal-SdT is the fourth risk
  // trigger, and the one that was a change rather than a state until the review made it
  // one. The sample records it complete, so the rule has to pass rather than vanish.
  ok("lowering a security level is checked against the risk trigger",
    (await page.locator(".lint-pass", { hasText: "lowered without a risk consideration" }).count()) === 1);
  ok("...and the sample's review is not a finding",
    (await page.locator(".lint-card .lint-title", { hasText: "lowered without a risk consideration" }).count()) === 0);

  // What the method requires a decision to carry (STM.2.1.5, UMS.3.1, UMS.4.1) - and what
  // it does NOT require, which is the harder half.
  //
  // These three rules used to report 95, 269 and 389 of 392 requirements. A finding that
  // names almost every record in the register is not a finding: it describes the register's
  // normal content and buries the handful that point somewhere. Each is now asked at the
  // moment the method actually asks it.
  {
    const finding = (t) => page.locator(".lint-card", { has: page.locator(".lint-title", { hasText: t }) });
    const passing = (t) => page.locator(".lint-pass", { hasText: t });

    // The reading records why it did NOT reach a requirement, the same way it records why
    // it did, so the justification STM.2.1.5 wants is on the record rather than demanded.
    ok("what the reading struck carries its own reason", (await finding("struck from the package with no reason").count()) === 0);
    ok("...and the rule is still there, passing", (await passing("struck from the package with no reason").count()) === 1);

    // STM.2.1.1 models the 95 ISMS practices onto the whole domain "ohne Auswahl". They
    // name no business process because the method says they apply to all of them.
    const judged = finding("brought in by judgement");
    const jn = (await judged.count()) ? Number((/(\d+)/.exec(await judged.locator(".lint-count").first().innerText()) ?? [0,0])[1]) : 0;
    console.log(`   brought-in-by-judgement: ${await judged.count()} Karte(n), ${jn} betroffen`);
    ok("the 95 ISMS practices are not asked for a business process", jn < 10, `${jn} affected`);

    // UMS.2.2/3.1/4.1 are about the implementation PLAN. Nothing in the sample carries a
    // priority yet, so nothing has entered the plan and nothing is owed an owner or a date.
    ok("an owner and a date are asked once a requirement is planned", (await finding("no one answerable or no date").count()) === 0);

    // And the ones that do point somewhere are still there.
    const cards = await page.locator(".lint-card").count();
    ok(`the checks name a readable number of findings (${cards})`, cards > 0 && cards <= 12, `${cards} findings`);
    ok("...including the chain that nothing blocks",
      (await finding("no security measure").count()) + (await finding("nothing blocks or detects").count()) >= 1);
  }

  // UMS.1.1: the catalogue's own dependency edges, followed. The rule has to be offered
  // at all - passing or failing - because a register that cannot see them reports a
  // requirement as met while what it rests on is open.
  ok("the dependency between requirements is checked",
    (await page.locator(".lint-card, .lint-pass").filter({ hasText: "while what they rest on is not" }).count()) === 1);
  ok("the checks cover the effect model, not just missing links",
    (await page.locator(".lint-card, .lint-pass").count()) >= 19);
  // A check written for another method is declared off rather than left to report the
  // whole ruleset as a finding: here, requirements are tracked by their own status.
  ok("a check this method does not use is not offered at all",
    (await page.locator(".lint-card, .lint-pass").filter({ hasText: "not fulfilled by any measure" }).count()) === 0);
  await page.screenshot({ path: `${shots}/Checks.png` });

  // Copy-for-LLM button present on a workshop
  await openWs(WS.STM, 150);
  ok("copy-for-LLM button present", await page.locator(".group-toolbar button", { hasText: "Copy for LLM" }).count() > 0);

  // Flow (event-flow swimlane)
  await page.locator(".ws-tab", { hasText: "Flow" }).click();
  await page.waitForTimeout(300);
  ok("flow lanes present", await page.locator(".flow-lane").count() > 5);
  ok("flow nodes present", await page.locator(".flow-node").count() > 5);
  await page.screenshot({ path: `${shots}/Flow.png` });
  await page.locator(".flow-node").filter({ hasText: "Loss of network control" }).first().click({ force: true });
  await page.waitForTimeout(600);
  ok("flow highlights path (dims others)", await page.locator(".flow-node.ef-dimmed, .flow-node.ef-orphan").count() > 0);
  ok("flow lane headers fly with their columns", await page.locator(".lane-header.ef-lane-flown").count() > 0);
  ok("flow docks info panel under the flow", await page.locator(".detail-dock .info-panel .ip-title").count() > 0);
  ok("ribbon paths drawn", await page.locator(".ribbons path").evaluateAll((ps) => ps.some((p) => (p.getAttribute("d") || "").length > 5)));
  await page.screenshot({ path: `${shots}/FlowPath.png` });
  // multi-select: add another node on the same chain → narrows scope
  await page.locator(".flow-node").filter({ hasText: "Organised cybercrime" }).first().click({ force: true });
  await page.waitForTimeout(400);
  ok("multi-select keeps ≥2 selected", await page.locator(".flow-node.selected").count() >= 2);
  await page.keyboard.press("Escape"); // Escape clears the selection
  await page.waitForTimeout(200);
  ok("Escape clears the flow selection", (await page.locator(".flow-node.selected").count()) === 0);
  // Where the reader is scrolled to survives a selecting click - the FIRST one too.
  //
  // Two things this has to get right, both found by measuring. The position is captured on
  // POINTER-DOWN, so the click has to be a real one: a synthetic el.click() fires no
  // pointerdown and the check would pass or fail for the wrong reason. And the node has to
  // be one the reader can SEE from there - clicking one that is off-screen is a different
  // case, where the browser scrolls it into view and rightly so.
  //
  // The window is narrowed for this: at 1280 the lanes fit and there is nothing to lose.
  // 800, not less: below that the scroller is narrower than one lane and no card sits
  // wholly inside it, so there is no node the reader could be said to see.
  {
    await page.setViewportSize({ width: 1000, height: 900 });
    await page.waitForTimeout(400);
    const sc = page.locator(".flow-scroll");
    const over = await sc.evaluate((el) => el.scrollWidth - el.clientWidth);
    ok("the swimlane overflows, so there is a position to lose", over > 600, `overflow ${over}`);
    await sc.evaluate((el) => { el.scrollLeft = 200; });
    await page.waitForTimeout(250);
    // A node the reader can SEE from there, AND whose selection leaves the swimlane still
    // overflowing. Most selections narrow the tree to a single lane, and then 0 is the only
    // position there is - the browser clamps for a good reason and the assertion would be
    // about nothing. Try the visible ones until one keeps something to lose.
    const seen = await page.evaluate(() => {
      const el = document.querySelector(".flow-scroll");
      const r = el.getBoundingClientRect();
      return [...document.querySelectorAll(".flow-node")]
        .filter((x) => { const b = x.getBoundingClientRect(); return b.left >= r.left && b.right <= r.right; })
        .map((x) => x.getAttribute("data-nk"));
    });
    ok("a node is visible from a scrolled position", seen.length > 0);
    let left = null, kept = 0;
    for (const nk of seen.reverse()) {
      await sc.evaluate((el) => { el.scrollLeft = 200; });
      await page.waitForTimeout(200);
      await page.locator(`[data-nk="${nk}"]`).click();
      await page.waitForTimeout(900);
      const st = await sc.evaluate((el) => ({ left: el.scrollLeft, over: el.scrollWidth - el.clientWidth }));
      if (st.over > 100) { left = st.left; kept = st.over; break; }
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    }
    ok("...a selection that leaves the swimlane overflowing", left !== null);
    if (left !== null && left !== 200) console.log(`   left=${left} overflow-after=${kept}`);
    ok("...and the first selecting click keeps the reader where they were", left === 200);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.waitForTimeout(400);
  }
  await page.locator(".flow-node").filter({ hasText: "Organised cybercrime" }).first().click({ force: true });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${shots}/FlowNarrow.png` });
  // Robustness: a non-scenario node still shows connections + free multi-select.
  // A business process is used here, not a target object. CanvasView builds its chains
  // from a strategic-scenario root by following out-edges and in-edges SEPARATELY
  // (src/components/CanvasView.tsx, the generic branch that runs when the taxonomy is not
  // EBIOS's). A target object is reached only across a change of direction - a step points
  // at it, and it points at the process - so it lands in no chain and draws no ribbon.
  // That is an engine limitation, not a property of this sample; it is not asserted here.
  await page.getByText(/^Clear \(/).click({ force: true });
  await page.waitForTimeout(200);
  await page.locator(".flow-node").filter({ hasText: "Grid control" }).first().click({ force: true });
  await page.waitForTimeout(300);
  ok("non-scenario node shows ribbons", await page.locator(".ribbons path").evaluateAll((ps) => ps.some((p) => (p.getAttribute("d") || "").length > 5)));
  // The second node has to share a chain with the first - selecting one that shares none
  // empties the intersection, which the view reads as "start again".
  await page.locator(".flow-node").filter({ hasText: "Offline backup" }).first().click({ force: true });
  await page.waitForTimeout(200);
  ok("free multi-select works", await page.locator(".flow-node.selected").count() >= 2);
  await page.screenshot({ path: `${shots}/FlowOrphan.png` });

  // Graph - focus / ego-network (a centred node + its direct neighbours)
  await page.locator(".ws-tab", { hasText: "Graph" }).click();
  await page.waitForTimeout(700);
  ok('focus graph index lists all entities grouped', (await page.locator('.graph-index .gi-group').count()) > 1 && (await page.locator('.graph-index .gi-e').count()) > 5);
  ok('...under the workshop names of this taxonomy',
    /REQUIREMENTS ANALYSIS/.test(await page.locator('.graph-index').innerText()));
  ok('focus graph names the current focus', (await page.locator('.graph-index .gi-e.active').count()) === 1 && (await page.locator('.graph-legend b').count()) > 0);
  ok('focus graph shows centre + neighbour labels', (await page.locator('.graph-wrap svg text').count()) > 5);
  ok('focus graph draws directional edges', (await page.locator('.graph-wrap svg line[marker-end], .graph-wrap svg line[marker-start]').count()) > 3);
  await page.screenshot({ path: `${shots}/Graph.png` });
  // no node clicked yet → no detail box on the default view
  ok('no detail box until a node is clicked', (await page.locator('.detail-dock').count()) === 0);
  // search filters the index; focusing FROM the index must NOT open the detail box
  await page.locator('.graph-search').fill('Control system');
  await page.waitForTimeout(200);
  ok('focus graph search filters the index', (await page.locator('.graph-index .gi-list .gi-e').count()) > 0);
  await page.locator('.graph-index .gi-list .gi-e').first().click();
  await page.waitForTimeout(250);
  ok('focusing from the index shows no detail box', (await page.locator('.detail-dock').count()) === 0);
  // clicking a NODE inspects it: the box appears, with a ring, WITHOUT moving the focus
  const legendBefore = (await page.locator('.graph-legend').first().innerText()).trim();
  // force: the node under the pointer may be overlapped by a neighbour once the study
  // grows - what is being checked is the click handler, not the layout.
  await page.locator('.graph-wrap svg g[transform^="translate"]').first().locator('circle,rect,path').first().click({ force: true });
  await page.waitForTimeout(200);
  ok('clicking a node opens the box (inspect) without re-centring',
    (await page.locator('.detail-dock .info-panel .ip-title').count()) > 0
    && (await page.locator('.graph-wrap svg circle[stroke-dasharray]').count()) > 0
    && ((await page.locator('.graph-legend').first().innerText()).trim() === legendBefore));
  await page.screenshot({ path: `${shots}/GraphInfo.png` });
  // the detail box close button hides it again
  await page.locator('.detail-dock .info-panel button[aria-label="Close"]').click();
  await page.waitForTimeout(150);
  ok('detail box close button hides the dock', (await page.locator('.detail-dock').count()) === 0);
  // Shift-click builds a multi-focus selection (index clicks still open no box); "Clear extra" collapses back
  await page.locator('.graph-search').fill('');
  await page.waitForTimeout(150);
  // Shift-click TOGGLES, so the entries added here must not be the one already focused -
  // otherwise the second click takes a focus away instead of adding one.
  await page.locator('.graph-index .gi-e:not(.active)').first().click({ modifiers: ['Shift'] });
  await page.waitForTimeout(200);
  ok('shift-click builds a multi-focus selection', (await page.locator('.graph-index .gi-e.active').count()) >= 2 && (await page.locator('.graph-legend', { hasText: 'focuses' }).count()) > 0 && (await page.locator('.detail-dock').count()) === 0);
  await page.locator('.graph-index .gi-e:not(.active)').first().click({ modifiers: ['Shift'] });
  await page.waitForTimeout(200);
  ok('...and each shift-click adds one', (await page.locator('.graph-index .gi-e.active').count()) === 3);
  await page.screenshot({ path: `${shots}/GraphMulti.png` });
  await page.locator('.graph-legend button', { hasText: 'Clear extra' }).click();
  await page.waitForTimeout(150);
  ok('clear extra returns to a single focus', (await page.locator('.graph-index .gi-e.active').count()) === 1);

  // Import dialog: additive/destructive + paste source
  await page.locator(".topbar button", { hasText: "Export / Import" }).click();
  await page.waitForTimeout(150);
  await page.locator(".menu-item", { hasText: "Import data" }).click();
  await page.waitForTimeout(200);
  ok("import dialog has paste textarea", (await page.locator(".modal-lg textarea").count()) > 0);
  // Import diff / merge: preview a demo revision → added / changed / removed diff
  await page.locator(".modal-lg button", { hasText: "Preview a demo revision" }).click();
  await page.waitForTimeout(200);
  ok("import diff summary shows counts", (await page.locator(".idiff-summary .idiff-c").count()) >= 3);
  ok("import diff lists entity changes", (await page.locator(".idiff-ent").count()) > 0);
  ok("import diff offers additive + destructive apply", (await page.locator(".modal-lg-foot .import-modes-inline .seg-btn").count()) === 2);
  ok("a sound incoming file is vouched for before it is confirmed",
    /change log is complete and matches its data/i.test(await page.locator(".modal-lg").innerText()));
  // A file whose chain does not hold up must say so BEFORE it is confirmed - confirming
  // re-establishes the chain, so a blind confirmation would launder a tampered file.
  await page.locator(".modal-lg-foot .btn.ghost", { hasText: "Back" }).click().catch(() => {});
  await page.waitForTimeout(200);
  await page.locator(".modal-lg textarea").first().fill(JSON.stringify({
    kind: "ebios-data", version: 2, studies: [{
      id: "peer-study", name: "Peer review copy", organization: "", scope: "",
      createdAt: "2026-02-01T10:00:00.000Z", updatedAt: "2026-02-01T10:00:00.000Z",
      entities: [{ id: "x1", type: "business_asset", values: { name: "Billing run", criticality: 3 },
        createdAt: "2026-02-01T10:00:00.000Z", updatedAt: "2026-02-01T10:00:00.000Z" }],
      log: [{ seq: 1, ts: "2026-02-01T10:00:00.000Z", editor: "Reviewer X", kind: "create", entity: "x1",
        entityType: "business_asset", title: "Billing run", state: "deadbeef", prevHash: "", hash: "not-a-real-hash" }],
    }],
  }));
  await page.locator(".modal-lg button", { hasText: "Preview pasted" }).click();
  await page.waitForTimeout(400);
  const audit = await page.locator(".modal-lg .guide.warn").first().innerText();
  ok("a tampered incoming file is flagged before confirmation", /does not hold up/i.test(audit));
  ok("...naming where the chain fails", /broken at entry 1/i.test(audit));
  ok("...and stating what the chosen mode does with the chain", /folded into this study's chain/i.test(audit));
  // The verdict must be there in BOTH modes, and say what each one does.
  await page.locator(".import-modes-inline .seg-btn", { hasText: "Destructive" }).click();
  await page.waitForTimeout(200);
  const destr = await page.locator(".modal-lg .guide.warn").first().innerText();
  ok("the chain verdict is shown for a destructive import too", /does not hold up/i.test(destr));
  ok("...saying the study's own chain is kept and continues", /own chain is kept and continues/i.test(destr));
  ok("...and that missing records become deletions", /recorded as deletions/i.test(destr));
  await page.locator(".import-modes-inline .seg-btn", { hasText: "Additive" }).click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${shots}/ImportAudit.png` });
  await page.locator(".modal-lg-foot .btn.ghost", { hasText: "Back" }).click().catch(() => {});
  await page.waitForTimeout(200);
  await page.locator(".modal-lg button", { hasText: "Preview a demo revision" }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${shots}/Import.png` });
  await page.locator(".modal-lg-foot .btn.ghost", { hasText: "Back" }).click().catch(() => {});
  await page.waitForTimeout(100);
  await page.locator(".overlay").click({ position: { x: 5, y: 5 } }).catch(() => {});
  await page.waitForTimeout(150);

  // Semi-deterministic framework import. The import targets are named by the taxonomy,
  // so the toggle reads Requirement / Measure rather than a pair fixed in the engine.
  await page.locator(".sidebar .nav-item", { hasText: "Documents" }).click();
  await page.waitForTimeout(200);
  ok("documents offers framework import", (await page.getByRole("button", { name: /Import framework/ }).count()) > 0);
  await page.getByRole("button", { name: /Import framework/ }).click();
  await page.waitForSelector(".modal-lg");

  // The ruleset is published, not shipped: the dialog has to say where it comes from and
  // fetch it only when asked. The download itself is NOT driven here - this check must
  // pass on a machine with no network, which is the deployment this product is for.
  {
    const pub = await page.locator(".modal-lg .pub-cat").allInnerTexts();
    ok("the published ruleset is offered for download, named and sized",
      pub.length === 1 && /Anwenderkatalog Grundschutz\+\+/.test(pub[0]) && /5,4 MB/.test(pub[0]));
    const dlg = await page.locator(".modal-lg").innerText();
    ok("...naming publisher, format and licence before anything is fetched",
      /BSI, Stand-der-Technik-Bibliothek/.test(dlg) && /OSCAL 1\.1\.3/.test(dlg) && /CC BY-SA 4\.0/.test(dlg));
    ok("...and stating that nothing is fetched on its own",
      /fetched when you press this and not\s+otherwise/i.test(dlg) && /works without ever\s+asking/i.test(dlg));
  }

  // The vocabularies the taxonomy offers belong to the BSI, and a catalogue that declares
  // them can bring them up to date. Driven from a pasted OSCAL fixture rather than the
  // published file, so the check needs no network: an invented practice and an invented
  // target-object category have to show up as additions to the fields that name those
  // sources, and a value the sample study holds must not be dropped.
  {
    const fixture = JSON.stringify({
      catalog: {
        uuid: "00000000-0000-4000-8000-000000000000",
        metadata: { title: "Prüfkatalog", version: "2026-08-14", "oscal-version": "1.1.3" },
        groups: [{
          id: "ZZZ", title: "Prüfpraktik",
          controls: [{
            id: "ZZZ.1", title: "Prüfanforderung",
            props: [{ name: "sec_level", value: "normal-SdT" }, { name: "effort_level", value: "1" }],
            parts: [{ name: "statement", prose: "Prüfpraktik MUSS etwas festlegen.",
              props: [{ name: "modal_verb", value: "MUSS" },
                { name: "target_object_categories", value: "Netze, Prüfkategorie" }] }],
          }],
        }],
      },
    });
    await page.locator(".modal-lg textarea").fill(fixture);
    await page.locator(".modal-lg button", { hasText: "Parse" }).click();
    await page.waitForTimeout(400);
    ok("an OSCAL catalogue reports which of its properties this taxonomy takes",
      /taken into fields/.test(await page.locator(".modal-lg .guide.warn").first().innerText()));
    const vocab = page.locator(".panel", { has: page.locator(".panel-head h3", { hasText: "Vocabularies this catalogue defines" }) });
    ok("a catalogue that defines vocabularies offers to bring them up to date", (await vocab.count()) === 1);
    const rows = await vocab.locator(".ex-cand").allInnerTexts();
    ok("...for the fields that name this catalogue as their source, by their product names",
      rows.some((r) => /Requirement · Practice/.test(r)) && rows.some((r) => /Asset · Target-object category/.test(r)));
    ok("...naming what the catalogue adds", rows.some((r) => /ZZZ Prüfpraktik/.test(r)) && rows.some((r) => /Prüfkategorie/.test(r)));
    ok("...and that extending keeps what this catalogue does not mention",
      rows.some((r) => /not in this catalogue/.test(r) && /\(kept\)/.test(r)));
    ok("extending is the mode offered first", (await vocab.locator(".seg-btn.on").innerText()) === "Extend");
    // Replacing is the dangerous reading, so it has to say what it would drop.
    await vocab.locator(".seg-btn", { hasText: "Replace" }).click();
    await page.waitForTimeout(200);
    ok("replacing says what it would drop", /\(dropped\)/.test(await vocab.innerText()));
    ok("...and that records keep the values they hold", /records hold them/.test(await vocab.innerText()));
    await vocab.locator(".seg-btn", { hasText: "Extend" }).click();
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${shots}/VocabularyUpdate.png` });
    await vocab.locator(".vocab-apply").click();
    await page.waitForTimeout(300);
    ok("taking the change reports what was done",
      /Extended \d+ vocabular/.test(await page.locator(".modal-lg .guide.warn").first().innerText()));
    ok("...and the panel closes because there is nothing left to add", (await vocab.count()) === 0);
  }
  const segs = await page.locator(".modal-lg .seg-btn").allInnerTexts();
  ok("the import target toggle is named by the taxonomy",
    segs.includes("Requirement") && segs.includes("Measure"));
  await page.locator(".modal-lg .seg-btn", { hasText: "Measure" }).click();
  ok("import target toggle switches colour (.seg-btn.on)", (await page.locator(".modal-lg .seg-btn.on", { hasText: "Measure" }).count()) > 0);
  await page.locator(".modal-lg textarea").fill("Control ID,Requirement,Domain,Guidance\nX-1,Just-in-time admin,Access,Grant admin temporarily\nX-2,Immutable backups,Resilience,Keep an offline copy");
  await page.locator(".modal-lg button", { hasText: "Parse" }).click();
  await page.waitForTimeout(300);
  ok("table import maps columns via header aliases", (await page.locator(".modal-lg .panel-head h3", { hasText: "Map columns" }).count()) > 0);
  ok("import lists parsed rows as a selectable catalog", (await page.locator(".modal-lg .ex-cand").count()) === 2 && (await page.locator(".modal-lg .ex-cand input[type=checkbox]").count()) === 2);
  // A PDF chosen through the file picker must go through text extraction. Reading the
  // file as text instead put the compressed streams into the preview and made every
  // document look like it had no text layer.
  {
    const pdf = makePdf([
      "ZZZ.1 Catalogue for the extraction check",
      "",
      ...Array.from({ length: 12 }, (_, k) => [
        `ZZZ.1.A${k + 1} Invented requirement number ${k + 1} (${k % 2 ? "S" : "B"})`,
        `Body text belonging to requirement ${k + 1}, long enough to count as substance.`,
        "",
      ]).flat(),
    ]);
    await page.locator('.modal-lg input[type=file]').setInputFiles({ name: "check.pdf", mimeType: "application/pdf", buffer: pdf });
    await page.waitForTimeout(1200);
    const preview = await page.locator(".modal-lg textarea").inputValue();
    ok("a chosen PDF is extracted, not read as bytes", /Invented requirement number 1/.test(preview));
    ok("the extracted document is read as a list", /Read as a list: 12 entries/.test(await page.locator(".modal-lg .guide.warn").innerText().catch(() => "")));
    ok("its levels are derived from the document", (await page.locator(".modal-lg .ex-cand").count()) === 12);
    // back to the table case the rest of this block asserts on
    await page.locator(".modal-lg textarea").fill("Control ID,Requirement,Domain,Guidance\nX-1,Just-in-time admin,Access,Grant admin temporarily\nX-2,Immutable backups,Resilience,Keep an offline copy");
    await page.locator(".modal-lg button", { hasText: "Parse" }).click();
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: `${shots}/CatalogImport.png` });
  await page.locator(".modal-lg .ex-cand input[type=checkbox]").first().uncheck();
  await page.waitForTimeout(150);
  ok("unchecking an item excludes it (Add 1 selected)", (await page.locator(".modal-lg-foot .btn.primary", { hasText: "Add 1 selected" }).count()) > 0);
  await page.locator(".modal-lg .ex-cand input[type=checkbox]").first().check();
  await page.waitForTimeout(100);
  await page.locator(".modal-lg-foot .btn.primary").click();
  await page.waitForTimeout(300);
  ok("only selected rows are added to the study", (await page.locator(".modal-lg .guide.warn", { hasText: "Added 2 measures" }).count()) > 0);
  ok("added rows re-render as 'in study' in the preview", (await page.locator(".modal-lg .ex-cand .badge", { hasText: "in study" }).count()) >= 1);
  await page.locator('.modal-lg .btn.ghost[aria-label="Close"]').click().catch(() => {});
  await page.waitForTimeout(150);

  // A record taken from a catalogue is present, not adopted, and that state is WRITTEN on
  // it rather than left as an empty field. An empty field is silence, and an engine that
  // reads silence as "in use" would count everything ever imported in the coverage matrix,
  // the radar and the checks from the moment it arrived, with nobody having adopted it.
  // The cell cannot show the difference, rendering the first option either way, so the
  // stored value is read instead.
  await page.locator(".sidebar .nav-item", { hasText: "Studies" }).click();
  await page.waitForTimeout(150);
  if (!(await page.locator(".ws-tabs").count())) {
    await page.getByText("Riverbend Municipal Utilities").first().click();
    await page.waitForSelector(".ws-tabs", { timeout: 10000 });
  }
  await openWs(WS.UMS, 350);
  {
    const sec = section("Measures");
    const row = sec.locator("tbody tr", { hasText: "Just-in-time admin" }).first();
    ok("a measure imported from a catalogue reaches the register", (await row.count()) === 1);
    ok("...showing as not in use", (await row.locator(".cell-toggle").first().innerText()).trim() === "not in use");
    await row.locator(".name").click();
    await page.waitForTimeout(250);
    await sec.locator(".detail .btn", { hasText: "Edit" }).first().click();
    await page.waitForSelector(".modal-lg");
    const written = await page.evaluate(() => {
      for (const s of document.querySelectorAll(".modal-lg select")) {
        const vals = [...s.querySelectorAll("option")].map((o) => o.value);
        if (vals.includes("not in use") && vals.includes("in use")) return s.value;
      }
      return null;
    });
    ok("...because the state stands on the record, not left to silence", written === "not in use",
      `the switch reads ${JSON.stringify(written)}`);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
  }

  // The refreshed vocabulary has to reach the picker the analyst actually uses, not just
  // the taxonomy behind it - that is the whole point of refreshing it.
  await page.locator(".sidebar .nav-item", { hasText: "Studies" }).click();
  await page.waitForTimeout(150);
  if (!(await page.locator(".ws-tabs").count())) {
    await page.getByText("Riverbend Municipal Utilities").first().click();
    await page.waitForSelector(".ws-tabs", { timeout: 10000 });
  }
  await openWs(WS.STM, 350);
  await section("Assets").locator("tbody tr.row-clickable").first().locator(".name").click();
  await page.waitForTimeout(200);
  await section("Assets").locator(".detail .btn", { hasText: "Edit" }).first().click();
  await page.waitForSelector(".modal-lg");
  const catOptions = await page.locator(".modal-lg select").first().locator("option").allInnerTexts();
  // A term the build has no English wording for shows as the publisher wrote it - which
  // is also how a newly arrived one is recognised as needing one.
  ok("a category taken from a catalogue is offered in the editor", catOptions.includes("Prüfkategorie"));
  ok("...alongside the ones this build was made with, read in English",
    catOptions.includes("IT systems") && catOptions.length >= 40);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(150);

  // Timeline (global change history) - left-nav view; the sample seeds history
  await page.locator(".sidebar .nav-item", { hasText: "Timeline" }).click();
  await page.waitForTimeout(250);
  ok("timeline grouped by day with entries", (await page.locator(".tl-day-h").count()) > 0 && (await page.locator(".tl-item").count()) >= 5);
  ok("timeline shows change stats", (await page.locator(".tl-stats strong").count()) >= 3);
  // The log has to account for the WHOLE study, not just the records someone happened to
  // annotate - otherwise the untracked ones read as having been added from outside.
  const tlItems = await page.locator(".tl-item").count();
  ok("every record in the study is accounted for in the log", tlItems >= 45);
  ok("the study log verifies as a whole", /integrity verified/i.test(await page.locator(".tl-stats").innerText()));
  ok("no drift warning on an untouched sample", (await page.locator(".tl-warn").count()) === 0);
  // Seals: the half the hash chain cannot do. The chain proves a log is consistent with
  // itself; anyone holding the file can recompute it, so it catches accident rather than
  // intent. A seal signs the head, so rewriting the past needs a private key.
  {
    const panel = page.locator(".panel.sp");
    ok("the timeline offers seals", (await panel.count()) === 1);
    ok("...refusing to seal before there is a key", await panel.locator(".panel-head .btn.primary").isDisabled());
    // The explanation is a dialog, not a wall on the page: the panel says the verdict, and
    // what a signature does and does not prove is one click away for whoever wants it.
    await panel.locator("button", { hasText: "What does a seal prove" }).click();
    await page.waitForSelector(".sp-modal", { timeout: 5000 });
    const proves = await page.locator(".sp-modal").innerText();
    ok("...and explains itself in a dialog rather than on the page",
      /does not prove when/i.test(proves) && /does not prove who/i.test(proves));
    await page.locator(".sp-modal button", { hasText: "Close" }).click();
    await page.waitForTimeout(250);

    await panel.locator("button", { hasText: "Keys" }).click();
    await page.waitForSelector(".sp-modal", { timeout: 5000 });
    await page.locator(".sp-modal button", { hasText: "Create a key" }).click();
    await page.waitForTimeout(700);
    const keysDlg = await page.locator(".sp-modal").innerText();
    ok("a signing key is made in the keys dialog", /Save public key/.test(keysDlg));
    ok("...and the public half can be saved as a file too", /Save public key/.test(keysDlg) && /Save private key/.test(keysDlg));
    // Close by the overlay only: the last ghost button in this dialog is the "forget this
    // key" bin, and clicking it emptied the ring the next assertion is about.
    await page.locator(".overlay").click({ position: { x: 5, y: 5 } });
    await page.waitForTimeout(300);

    await panel.locator(".panel-head .btn.primary").click();
    await page.waitForSelector(".sp-modal", { timeout: 5000 });
    await page.locator(".sp-modal input").first().fill("M. Westerberg");
    await page.locator(".sp-modal .btn.primary").click();
    await page.waitForTimeout(900);
    const sealed = await panel.locator(".sp-seal").first().innerText().catch(() => "");
    ok("the study can be sealed from a dialog", (await panel.locator(".sp-seal").count()) === 1, sealed);
    // The seal's own key was named when it was created, so it reads as verified rather
    // than merely valid.
    if ((await panel.locator(".sp-seal.sp-verified").count()) !== 1) console.log("   seal row:", sealed.replace(/\n/g, " | "));
    ok("...and reads as verified, because the key is one you named",
      (await panel.locator(".sp-seal.sp-verified").count()) === 1);
    ok("...saying what it covers, and that nothing followed it",
      /covers entries 1–\d+/.test(sealed) && /records unchanged since/.test(sealed), sealed);
    ok("...while the chain itself still verifies",
      /integrity verified/i.test(await page.locator(".tl-stats").innerText()));
  }
  await page.screenshot({ path: `${shots}/Timeline.png` });
  // A study-scope entry - a seal, an import - is not about one record and opens nothing.
  await page.locator(".tl-item:not(.tl-scope)").first().click();
  await page.waitForSelector(".modal-lg .hist-item");
  ok("timeline item opens change-history popup", (await page.locator(".modal-lg .hist-item").count()) > 0);
  await page.locator('.modal-lg .btn.ghost[aria-label="Close"]').click();
  await page.waitForTimeout(120);

  // A deletion has to survive the record it removed: the entry outlives it, keeps its
  // title, and shows up in the timeline. A requirement is the leaf to take: nothing in
  // the sample depends on it except the deviation that cites it.
  await page.locator(".sidebar .nav-item", { hasText: "Studies" }).click();
  await page.waitForTimeout(150);
  // "Studies" lands on the dashboard - re-open the study to get the workshop tabs back.
  if (!(await page.locator(".ws-tabs").count())) {
    await page.getByText("Riverbend Municipal Utilities").first().click();
    await page.waitForSelector(".ws-tabs", { timeout: 10000 });
  }
  await openWs(WS.STM, 350);
  const reqRow = section("Requirements").locator("tbody tr.row-clickable").first();
  const reqName = (await reqRow.locator(".name").innerText()).trim();
  await reqRow.click();
  await page.waitForTimeout(200);
  page.once("dialog", (d) => d.accept());
  await page.locator(".detail-actions button", { hasText: "Delete" }).first().click();
  await page.waitForTimeout(300);
  ok("the deleted record is gone from its table",
    (await section("Requirements").locator(".name", { hasText: reqName }).count()) === 0);
  await page.locator(".sidebar .nav-item", { hasText: "Timeline" }).click();
  await page.waitForTimeout(300);
  ok("the deletion is recorded in the timeline", (await page.locator(".tl-kind.del").count()) >= 1);
  ok("...naming the record that no longer exists",
    (await page.locator(".tl-item.tl-gone").first().innerText()).includes(reqName));
  ok("the log still verifies after a deletion", /integrity verified/i.test(await page.locator(".tl-stats").innerText())
    && (await page.locator(".tl-warn").count()) === 0);
  await page.screenshot({ path: `${shots}/TimelineDelete.png` });

  // Taxonomy view - the product's own vocabulary, and the engine keys behind it.
  // "Schema" edits the shape; the product-named item beside it reads the method's structure.
  // Both used to read as "the model", which is how a reader picks the wrong one.
  await page.locator(".sidebar .nav-item", { hasText: "Schema" }).click();
  await page.waitForTimeout(300);
  // Asking the publisher whether its lists have changed is a question about the
  // publication, so it is not here, beside "add a field" and "reset to default".
  ok("the schema editor carries no download from a standards body",
    (await page.locator(".vocab-check").count()) === 0);
  await page.waitForTimeout(250);
  const taxBody = await page.locator(".content").innerText();
  ok("taxonomy lists the entity types under their product names",
    taxBody.includes("Business process") && taxBody.includes("Asset") && taxBody.includes("Attack step"));
  ok("...including the types this product adds", taxBody.includes("Practice") && taxBody.includes("Metric") && taxBody.includes("Nonconformity"));
  await page.screenshot({ path: `${shots}/Taxonomy.png` });

  // The model, seen rather than edited - a page of its own. Here the class reading has the
  // BSI's own tree behind it, so it can say what a category costs once inheritance runs.
  await page.locator(".sidebar .nav-item", { hasText: "Grundschutz++" }).click();
  await page.waitForTimeout(300);
  ok("the reading view carries the method's name, not \"Explore\"",
    (await page.locator(".sidebar .nav-item", { hasText: "Grundschutz++" }).count()) === 1);
  ok("...and is where the publisher's own lists are checked for changes",
    (await page.locator(".vocab-check").count()) >= 1);
  {
    const vp = page.locator(".panel").filter({ has: page.locator(".vocab-check") }).first();
    const t = await vp.innerText();
    // The stamp follows the last publication whose lists were taken, not the one the build
    // shipped with - which is why this run sees the fixture applied earlier and not the
    // bundled catalogue. That is the useful behaviour: it says what the lists ARE, not what
    // they were.
    ok("...saying which publication the lists came from and when it was read",
      /From .+, version \d{4}-\d\d-\d\d, taken \d{4}-\d\d-\d\d/.test(t));
    ok("...and following the catalogue whose vocabularies were taken", /Prüfkatalog/.test(t));
    // The four sentences it used to carry said three things the reader already knows.
    ok("...and not restating what the button and the documentation already say",
      !/belong to the publisher|never taken away|Nothing is fetched/.test(t));
  }
  ok("the explorer is reachable from the navigation", (await page.locator(".tx-explorer").count()) === 1);
  ok("the outline lists the five process steps and what each holds",
    (await page.locator(".tx-row-g").count()) === 6);
  await page.locator(".tx-row-t").filter({ hasText: "Requirements" }).first().click();
  await page.waitForTimeout(200);
  ok("a type opens onto its fields, with what each one is",
    (await page.locator(".tx-row-f").count()) > 20
    && /enum|text|list/.test(await page.locator(".tx-row-f .tx-spec").first().innerText()));

  // Which fields the publication itself fills, and which this application keeps beside
  // them. Reading them as one thing makes the register look either more official than it is
  // or less, and which it is is the first thing an auditor asks.
  {
    const marked = await page.locator(".tx-row-f").filter({ has: page.locator(".tx-pub") }).locator(".tx-key").allInnerTexts();
    ok(`the outline says which fields the publication fills (${marked.length})`, marked.length >= 20);
    ok("...the BSI's own property names among them",
      marked.includes("modal_verb") && marked.includes("sec_level") && marked.includes("target_object_categories"));
    ok("...and the institution's own decisions not among them",
      !marked.includes("scope") && !marked.includes("umsetzung") && !marked.includes("verantwortlich"));
  }

  // The records themselves are one level below the fields, and a search reaches all three
  // readings at once.
  await page.locator(".tx-row-r-head").first().click();
  await page.waitForTimeout(250);
  ok("the outline opens onto the records themselves", (await page.locator(".tx-rec").count()) > 5);
  await page.locator(".tx-explorer .tbl-search input").fill("telecontrol");
  await page.waitForTimeout(350);
  ok("a search reaches into the records", (await page.locator(".tx-rec").count()) > 0
    && (await page.locator(".tx-rec").allInnerTexts()).every((t) => /telecontrol/i.test(t)));
  await page.locator(".tx-explorer .tbl-search input").fill("");
  await page.waitForTimeout(300);


  await page.locator(".tx-seg .seg-btn", { hasText: "Classes" }).click();
  await page.waitForTimeout(400);
  const cls = page.locator(".tx-explorer");
  // Not pinned to 39: a check above takes a category out of a published catalogue into the
  // vocabulary, which is the point of that mechanism. The depth is the fixed part.
  ok("the class reading shows the BSI's own hierarchy", (await page.locator(".tx-class").count()) >= 39);
  ok("...over the four levels the catalogue defines", /\d+ classes over 4 levels/i.test(await cls.innerText()));
  const netze = page.locator(".tx-class").filter({ hasText: "Networks" }).first();
  ok("...saying what a class carries by itself and what it inherits",
    (await netze.locator(".tx-num").count()) >= 4
    && Number((await netze.locator(".tx-num").nth(0).innerText()).replace(/\D/g, "")) > 0);
  ok("...and which classes this study actually uses",
    (await page.locator(".tx-class.used").count()) >= 5);
  await page.screenshot({ path: `${shots}/TaxonomyClasses.png` });

  await page.locator(".tx-seg .seg-btn", { hasText: "Relations" }).click();
  await page.waitForTimeout(300);
  // Pinned on purpose: a type appearing or vanishing is a change to what the product IS,
  // and it should be noticed here rather than discovered in a screenshot.
  ok("the relations reading draws a node per type and an edge per relationship",
    (await page.locator(".tx-graph .tx-node").count()) === 24
    && (await page.locator(".tx-graph .tx-edge").count()) >= 20);
  // A box in the graph opens onto what the model says about that type.
  await page.locator(".tx-graph .tx-node-g").first().click();
  await page.waitForSelector(".tx-detail", { timeout: 5000 });
  const det = await page.locator(".tx-detail").innerText();
  ok("a type opens onto its fields and both directions of its relationships",
    /fields \(/i.test(det) && /points at \(/i.test(det) && /pointed at by \(/i.test(det));
  await page.locator('.tx-detail .btn.ghost[aria-label="Close"]').click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${shots}/TaxonomyExplorer.png` });



  // Documents section
  await page.locator(".sidebar .nav-item", { hasText: "Documents" }).click();
  await page.waitForTimeout(200);
  const docBody = await page.locator(".content").innerText();
  ok("documents section renders", docBody.includes("Documents") && docBody.toLowerCase().includes("reference"));
  await page.screenshot({ path: `${shots}/Documents.png` });

  // Extraction dialog (UI only - the model download needs network)
  await page.locator(".page-head button", { hasText: "Extract" }).click();
  await page.waitForTimeout(200);
  ok("extraction dialog opens", (await page.locator(".overlay .modal-lg").count()) > 0);
  ok("extraction offers the embedding engine", (await page.locator(".modal-lg .seg-btn", { hasText: "embeddings" }).count()) > 0);
  ok(LLM ? "...and the language-model engine beside it" : "...and no language-model engine, this build has none",
    (await page.locator(".modal-lg .seg-btn", { hasText: "local LLM" }).count()) > 0 === LLM);
  ok("extraction defers model loading to the Model section", (await page.locator(".modal-lg", { hasText: "managed in the" }).count()) > 0);
  ok("extract disabled until a model is loaded", await page.locator(".modal-lg button", { hasText: "Extract" }).isDisabled());
  // Nothing has been extracted, so nothing can be added, and the button that adds says so
  // by refusing - without also claiming a quantity. This is the reading that used to be
  // "Add 0 to study"; the same rule is asserted on the measure picker further up.
  {
    const add = page.locator(".modal-lg-foot .btn.primary").filter({ hasText: /to study/ });
    ok("the add button offers no count while there is nothing to add",
      (await add.count()) === 1 && /^Add to study$/.test((await add.innerText()).trim()));
    ok("...and refuses", await add.isDisabled());
  }
  await page.screenshot({ path: `${shots}/Extraction.png` });
  await page.keyboard.press("Escape").catch(() => {});
  await page.locator(".overlay").click({ position: { x: 5, y: 5 } }).catch(() => {});

  // Two ways to protect an export, answering different problems: a password has to reach
  // the recipient somehow, a key does not. The second is only offered once a key has been
  // named, because encrypting to nobody is an unopenable file.
  await page.locator(".sidebar .nav-item", { hasText: "Studies" }).click();
  await page.waitForTimeout(250);
  {
    if (!(await page.locator(".ws-tabs").count())) {
      await page.getByText("Riverbend Municipal Utilities").first().click();
      await page.waitForSelector(".ws-tabs", { timeout: 10000 });
    }
    await page.locator("button", { hasText: "Export / Import" }).first().click();
    await page.waitForSelector(".menu-pop", { timeout: 8000 });
    const menu = page.locator(".menu-pop").first();
    const body = await menu.innerText().catch(() => "");
    // Escape closes a drop-down. Without it the backdrop takes the click and nothing else,
    // and a reader reaching for the habitual way out finds the page apparently stuck -
    // which then fails a later, unrelated interaction.
    await page.keyboard.press("Escape");
    await page.waitForTimeout(250);
    ok("Escape closes the export menu", (await page.locator(".menu-pop").count()) === 0);
    await page.locator("button", { hasText: "Export / Import" }).first().click();
    await page.waitForSelector(".menu-pop", { timeout: 8000 });
    if (!(/Password/.test(body) && /Key/.test(body))) console.log("   menu:", body.replace(/\n/g, " | ").slice(0, 160));
    ok("the export offers both kinds of protection", /Password/.test(body) && /\bKey\b/.test(body));
    await menu.locator(".seg-btn", { hasText: /^Key$/ }).click();
    await page.waitForTimeout(250);
    const rows = await menu.locator(".menu-to-row").count();
    ok("...listing the keys that have been named", rows >= 1, `${rows} recipients`);
    ok("...and saying the recipient list is readable in the file",
      /readable in the file/i.test(await menu.innerText()));
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    await page.locator("body").click({ position: { x: 5, y: 5 } }).catch(() => {});
    await page.waitForTimeout(200);
  }

  // Model configuration section
  await page.locator(".sidebar .nav-item", { hasText: "Model" }).click();
  await page.waitForTimeout(200);
  const modelBody = await page.locator(".content").innerText();
  ok("model section renders", modelBody.includes("Model") && modelBody.includes("all-MiniLM"));
  ok("model section lists options", (await page.locator(".model-row").count()) >= 2);
  // The one check the released build most needs to make about itself.
  if (LLM) {
    ok("model section manages the language models too", modelBody.includes("Language model") && modelBody.includes("SmolLM2") && modelBody.includes("Qwen2.5"));
    ok("model section offers Qwen-3B (WebLLM, level-2 default)", modelBody.includes("Qwen2.5-3B"));
  } else {
    ok("model section is embedding-only", !modelBody.includes("Language model")
      && !modelBody.includes("SmolLM2") && !modelBody.includes("Qwen2.5"));
  }
  console.log(`\n  build: ${LLM ? "with the generative branch (VITE_LLM=1)" : "released - embedding only"}`);
  await page.screenshot({ path: `${shots}/Model.png` });

  // ── the page must survive being worked in and navigated ────────────────
  //
  // Reported from use: switching back and forth leaves a white page, most often on
  // Implementation. Measured against the released v0.4.2 artefact, this sequence blanks it
  // after 7 steps with React error #310 - a component returned early on one render and ran
  // its hooks on the next, React counts hooks per render, and the whole tree goes with it.
  // No message, no view, nothing to go back to.
  //
  // Navigation alone does not do it: the table tools have to be USED first. Every check
  // above visits a view once and in order, which is why none of them ever saw it.
  const blank = async () => (await page.evaluate(
    () => (document.querySelector("#root")?.textContent || "").trim().length < 40));
  const goTab = async (t) => {
    await page.locator(".ws-tabs .ws-tab").filter({ hasText: t }).first().click().catch(() => {});
    await page.waitForTimeout(350);
  };
  await page.locator(".sidebar .nav-item", { hasText: "Studies" }).click();
  await page.waitForTimeout(150);
  if (!(await page.locator(".ws-tabs").count())) {
    await page.getByText("Riverbend Municipal Utilities").first().click();
    await page.waitForSelector(".ws-tabs", { timeout: 10000 });
  }
  const errorsBefore = errors.length;
  let survived = 0, blanked = "";
  for (let round = 0; round < 3 && !blanked; round++) {
    await goTab("Implementation"); survived++;
    for (const sel of [".tbl-search input", ".facet-btn", ".panel-fold", ".seg-btn"]) {
      const el = page.locator(sel).first();
      if (!(await el.count())) continue;
      if (sel.endsWith("input")) await el.fill("mfa").catch(() => {});
      else await el.click().catch(() => {});
      await page.waitForTimeout(200); survived++;
      if (await blank()) { blanked = `after ${sel}`; break; }
    }
    if (blanked) break;
    await goTab("Requirements Analysis"); survived++;
    await goTab("Risk Consideration"); survived++;
    await goTab("Implementation"); survived++;
    if (await blank()) { blanked = "on returning to Implementation"; break; }
    await page.locator(".sidebar .nav-item", { hasText: "Grundschutz++" }).first().click().catch(() => {});
    await page.waitForTimeout(250);
    await page.locator(".sidebar .nav-item", { hasText: "Studies" }).first().click().catch(() => {});
    await page.waitForTimeout(250); survived++;
    if (!(await page.locator(".ws-tabs").count())) {
      await page.getByText("Riverbend Municipal Utilities").first().click().catch(() => {});
      await page.waitForSelector(".ws-tabs", { timeout: 8000 }).catch(() => {});
    }
    if (await blank()) { blanked = "on coming back to the study"; break; }
  }
  // Text a reader has to be able to read, measured where it actually sits.
  //
  // Three ways to get this wrong, all of which produced a number that looked like a finding:
  //  - A computed style stays in the space it was authored in. `oklch(0.8 0.13 78)` parsed as
  //    rgb gives "r=0.8, g=0.13, b=78", and the first attempt reported 1.00:1 for everything.
  //    The colour is drawn on a canvas and read back instead.
  //  - The background-color chain does not find a gradient, and this page's ground IS one, so
  //    the chain falls through to white. The ground is taken from a photograph of the page
  //    with the text made invisible - the pixel under the run is the ground.
  //  - `color: transparent` does not hide an SVG glyph, which is painted with `fill`. Those
  //    then measure against themselves at 1:1. Both are set.
  //  - And a sample point below the photograph reads as transparent black, which looks like
  //    the worst finding on the page and is the measurement missing it. Points outside are
  //    skipped rather than counted.
  //
  // Aurelian Lite reported the warning colour as unreadable and measured their own call sites
  // to a different answer than ours: their state colours pass because they are barely text
  // there, and ours did not because a lint severity is a word. The difference is the method,
  // which is why it is this one.
  {
    const sweep = async () => {
      const runs = await page.evaluate(() => {
        const out = [];
        for (const el of document.querySelectorAll(".app *")) {
          if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
          const r = el.getBoundingClientRect();
          if (r.width < 4 || r.height < 4 || r.bottom < 2 || r.top > innerHeight - 2) continue;
          if (r.right < 2 || r.left > innerWidth - 2) continue;
          const cs = getComputedStyle(el);
          if (cs.visibility === "hidden" || cs.opacity === "0") continue;
          out.push({ x: Math.round(Math.min(innerWidth - 2, Math.max(2, r.x + 6))),
            y: Math.round(r.y + r.height / 2), color: cs.color,
            size: parseFloat(cs.fontSize), weight: Number(cs.fontWeight),
            txt: el.textContent.trim().slice(0, 18), cls: (el.className || "").toString().split(" ")[0] });
        }
        return out;
      });
      const hide = await page.addStyleTag({ content:
        "*, *::before, *::after { color: transparent !important; } text, tspan { fill: transparent !important; }" });
      await page.waitForTimeout(120);
      const png = (await page.screenshot({ clip: { x: 0, y: 0, width: 1280, height: 900 } })).toString("base64");
      await hide.evaluate((n) => n.remove());
      return page.evaluate(async ({ runs, png }) => {
        const img = new Image(); img.src = "data:image/png;base64," + png; await img.decode();
        const cv = document.createElement("canvas"); cv.width = img.width; cv.height = img.height;
        const g = cv.getContext("2d"); g.drawImage(img, 0, 0);
        const c2 = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
        const toRgb = (c) => { c2.fillStyle = "#fff"; c2.fillRect(0, 0, 1, 1); c2.fillStyle = c; c2.fillRect(0, 0, 1, 1);
          const d = c2.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]]; };
        const lum = ([r, gg, b]) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
          return 0.2126 * f(r) + 0.7152 * f(gg) + 0.0722 * f(b); };
        const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
        const out = [];
        for (const q of runs) {
          if (q.x < 0 || q.y < 0 || q.x >= cv.width || q.y >= cv.height) continue;
          const d = g.getImageData(q.x, q.y, 1, 1).data;
          if (d[3] === 0) continue;
          const need = (q.size >= 24 || (q.size >= 18.66 && q.weight >= 700)) ? 3 : 4.5;
          const v = ratio(toRgb(q.color), [d[0], d[1], d[2]]);
          if (v < need) out.push(`${q.cls || "?"} ${v.toFixed(2)}:1 "${q.txt}"`);
        }
        return { n: runs.length, bad: [...new Set(out)] };
      }, { runs, png });
    };
    let seen = 0; const poor = [];
    for (const t of ["Checks", "Graph"]) {
      await page.locator(".ws-tabs .ws-tab.plain", { hasText: t }).click();
      await page.waitForTimeout(700);
      const r = await sweep(); seen += r.n; poor.push(...r.bad);
    }
    await openWs(0, 600);
    const r = await sweep(); seen += r.n; poor.push(...r.bad);
    ok(`every run of text was measured where it sits (${seen})`, seen > 150, String(seen));
    ok("...and each carries its own contrast", poor.length === 0, poor.slice(0, 6).join(" · "));
  }

  // Every table in the product, counted rather than looked at. Three shapes of the same
  // fault, and all three are invisible: a column with no heading AND nothing in it is a
  // filler somebody left; a header row and a data row of different lengths mean a cell was
  // removed on one side only - that is how a 96px strip survived the column it belonged to;
  // and columns that do not add up to the table leave width nobody owns, which a fixed
  // layout does not redistribute. Aurelian Lite found the first in two of their components
  // after we reported ours, which is why this asks it of all of them rather than of one.
  {
    await page.locator(".sidebar .nav-item", { hasText: "Studies" }).click();
    await page.waitForTimeout(250);
    // "Studies" lands on the dashboard - re-open the study to get the workshop tabs back.
    if (!(await page.locator(".ws-tabs").count())) {
      await page.getByText("Riverbend Municipal Utilities").first().click();
      await page.waitForSelector(".ws-tabs", { timeout: 10000 });
    }
    const wsCount = await page.locator(".ws-tabs .ws-tab:not(.plain)").count();
    const faults = { filler: [], ragged: [], slack: [] };
    let seen = 0;
    for (let i = 0; i < wsCount; i++) {
      await openWs(i, 400);
      const found = await page.evaluate(() => {
        const out = { filler: [], ragged: [], slack: [], n: 0 };
        for (const t of document.querySelectorAll("table")) {
          const head = t.querySelector("thead tr");
          const rows = [...t.querySelectorAll("tbody tr")]
            .filter((r) => !r.querySelector("[colspan]") && !r.classList.contains("group-row"));
          if (!head || !rows.length) continue;
          out.n++;
          const name = (t.closest(".panel")?.querySelector(".panel-head h3")?.textContent
            ?? head.textContent.trim().slice(0, 24)) || "?";
          const heads = [...head.children];
          heads.forEach((th, i) => {
            if (th.textContent.trim()) return;
            const empty = rows.every((r) => !(r.children[i]?.textContent ?? "").trim()
              && !r.children[i]?.firstElementChild);
            if (empty) out.filler.push(`${name} col ${i + 1}`);
          });
          for (const r of rows) {
            if (r.children.length !== heads.length) {
              out.ragged.push(`${name}: ${heads.length} th vs ${r.children.length} td`);
              break;
            }
          }
          const sum = heads.reduce((w, th) => w + th.getBoundingClientRect().width, 0);
          const slack = Math.round(t.getBoundingClientRect().width - sum);
          if (slack > 2) out.slack.push(`${name}: ${slack}px`);
        }
        return out;
      });
      seen += found.n;
      for (const k of ["filler", "ragged", "slack"]) faults[k].push(...found[k]);
    }
    ok(`every table across ${wsCount} workshops was counted (${seen})`, seen > 20, String(seen));
    ok("...no column is both headerless and empty", faults.filler.length === 0, faults.filler.join(", "));
    ok("...a header row and a data row hold the same number of cells", faults.ragged.length === 0, faults.ragged.join(", "));
    ok("...and the columns add up to the table", faults.slack.length === 0, faults.slack.join(", "));

    // The workshops are not where every table lives: Documents hangs off the sidebar and
    // was outside the sweep. Aurelian Lite found that gap in their own version of this
    // check after we described ours.
    //
    // In this run it holds no table at all - a document only enters through the file
    // picker, which is `test:corpus`, not this suite. Rather than manufacture one so the
    // assertion has something to chew on, both admissible states are named: a table that
    // passes the three questions, or the empty state that says why there is none. What is
    // not admissible is neither, which is a broken view passing quietly.
    await page.locator(".sidebar .nav-item", { hasText: "Documents" }).click();
    await page.waitForTimeout(300);
    const docs = await page.evaluate(() => {
      const t = document.querySelector(".panel table, .content table");
      if (!t) return { table: false, empty: !!document.querySelector(".empty") };
      const head = t.querySelector("thead tr");
      const rows = [...t.querySelectorAll("tbody tr")].filter((r) => !r.querySelector("[colspan]"));
      const heads = [...(head?.children ?? [])];
      const filler = heads.filter((th, i) => !th.textContent.trim()
        && rows.every((r) => !(r.children[i]?.textContent ?? "").trim() && !r.children[i]?.firstElementChild)).length;
      const ragged = rows.some((r) => r.children.length !== heads.length);
      const slack = Math.round(t.getBoundingClientRect().width
        - heads.reduce((w, th) => w + th.getBoundingClientRect().width, 0));
      return { table: true, filler, ragged, slack };
    });
    ok("the documents view is either a table that holds up, or an empty state that says why",
      docs.table ? (docs.filler === 0 && !docs.ragged && docs.slack <= 2) : docs.empty,
      JSON.stringify(docs));
  }

  // ── what a narrower window does to a register table ─────────────────────────
  //
  // Reported as "the columns squeeze unevenly". Measured rather than looked at: the value
  // columns used to hold their exact pixel width at every window size while the name column
  // gave up the whole reduction alone, 983px to 319. A width on a col is a floor as much as
  // a preference. The property asserted is the one that was missing - every column of a
  // table gives up the SAME fraction - which needs two widths to say anything at all.
  {
    await page.goto(file);
    await page.waitForTimeout(800);
    const shape = async () => page.evaluate(() => {
      const t = [...document.querySelectorAll("table.tbl-share")]
        .find((x) => x.querySelectorAll("thead th").length >= 4);
      if (!t) return null;
      const w = [...t.querySelectorAll("thead th")].map((th) => th.getBoundingClientRect().width);
      const total = w.reduce((a, b) => a + b, 0);
      return { share: w.map((x) => x / total), total };
    });
    await page.setViewportSize({ width: 1600, height: 1000 });
    await page.waitForTimeout(500);
    const wide = await shape();
    await page.setViewportSize({ width: 1180, height: 1000 });
    await page.waitForTimeout(500);
    const narrow = await shape();
    await page.setViewportSize({ width: 1600, height: 1000 });
    await page.waitForTimeout(400);
    ok("a register table is measurable at two window widths",
      !!wide && !!narrow && narrow.total < wide.total, `${wide?.total} → ${narrow?.total}`);
    const drift = wide && narrow
      ? Math.max(...wide.share.map((s, i) => Math.abs(s - narrow.share[i]))) : 1;
    ok("...and every column keeps its share of it, so the squeeze is shared",
      drift < 0.02, `worst column moved ${(drift * 100).toFixed(1)}% of the table`);
  }

  // ── the flight, while the dock is still opening ─────────────────────────────
  //
  // Clicking a card flies its whole ego net into a tree, a 0.55s transition. The detail
  // dock opens on the same click and animates max-height 0 → 40vh over 0.32s, so the
  // scroller the flight is aimed at keeps shrinking underneath it. Aiming at the live
  // height made every card take eleven corrections, spread over 155.5px - the first half
  // of the flight spent chasing. Counted here rather than looked at: the eye reads that as
  // "the cards jump", which does not say what to change.
  {
    // As with the block below: by here the navigation checks have left the page somewhere
    // that is not the app. Reloading brings it back with the study still open.
    await page.goto(file);
    await page.waitForTimeout(900);
    await page.locator("button, a").filter({ hasText: /^Flow$/ }).first().click();
    await page.waitForTimeout(1400);
    await page.evaluate(() => {
      window.__fw = [];
      const t0 = performance.now();
      window.__fo = new MutationObserver((ms) => {
        for (const m of ms) {
          const el = m.target;
          if (!el.dataset?.nk || !el.style?.transform) continue;
          window.__fw.push({ k: el.dataset.nk, at: performance.now() - t0, tr: el.style.transform });
        }
      });
      window.__fo.observe(document.querySelector(".flow-lanes"),
        { attributes: true, attributeFilter: ["style"], subtree: true });
    });
    await page.locator(".flow-node").filter({ hasText: /Grid control/ }).first().click();
    await page.waitForTimeout(2200);
    const f = await page.evaluate(() => {
      window.__fo.disconnect();
      const by = new Map();
      for (const e of window.__fw) { if (!by.has(e.k)) by.set(e.k, []); by.get(e.k).push(e); }
      let targets = 0, spread = 0;
      for (const [, list] of by) {
        // The initial placement is one target; every later DISTINCT one is a correction,
        // and corrections are what the running transition has to chase.
        const ys = list.map((e) => parseFloat(/,\s*(-?[\d.]+)px/.exec(e.tr)?.[1] ?? "0"));
        const d = [];
        for (const y of ys) if (!d.length || Math.abs(d[d.length - 1] - y) > 0.5) d.push(y);
        const corr = d.slice(1);
        if (!corr.length) continue;
        targets = Math.max(targets, corr.length);
        spread = Math.max(spread, Math.max(...corr) - Math.min(...corr));
      }
      return { cards: by.size, flown: document.querySelectorAll(".ef-floating").length,
        targets, spread: Math.round(spread * 10) / 10 };
    });
    ok("clicking a card flies its whole ego net", f.flown > 20 && f.cards === f.flown,
      `${f.cards} written / ${f.flown} flying`);
    ok("...aimed once, not re-aimed at every frame of the dock opening", f.targets <= 3,
      `${f.targets} corrections`);
    ok("...so nothing is chasing a target that moves", f.spread < 20, `${f.spread}px`);
  }

  // ── the attack-path sheet, on a study bigger than the sample ────────────────
  //
  // The sample draws thirteen boxes and says nothing about what happens at ninety. Two
  // properties are asserted on a study grown for the purpose: boxes at the same depth do
  // not overlap, and the sheet does not grow past what can be read as one diagram. The
  // second is why the boxes compress: 91 boxes drew 4278px before, 2022px now.
  {
    const now = "2026-02-01T10:00:00.000Z";
    const ents = [];
    const push = (id, type, values) => ents.push({ id, type, values, createdAt: now, updatedAt: now });
    push("ba1", "business_asset", { name: "Billing run", criticality: 3 });
    push("sa1", "supporting_asset", { name: "Billing host", business_asset: "ba1" });
    const CHAINS = 30, DEPTH = 3;
    for (let c = 0; c < CHAINS; c++) {
      push(`op${c}`, "operational_scenario", { name: `Scenario ${c + 1}`, likelihood: 3, difficulty: 2 });
      let prev = null;
      for (let st = 0; st < DEPTH; st++) {
        const id = `st${c}_${st}`;
        push(id, "kill_chain_step", { name: `Step ${st + 1} of chain ${c + 1}`, operational_scenario: `op${c}`,
          step_order: st + 1, tactic: "Initial access",
          ...(st === DEPTH - 1 ? { targets_asset: "sa1" } : {}), ...(prev ? { predecessors: [prev] } : {}) });
        prev = id;
      }
    }
    // The run ends wherever the last check left it, and by here that is not the app: the
    // navigation checks above leave the page elsewhere. Reloading brings it back with the
    // study still open, which is what the persistence is for.
    await page.goto(file);
    await page.waitForTimeout(900);
    await page.locator(".topbar button", { hasText: "Export / Import" }).first().click({ timeout: 15000 });
    await page.waitForTimeout(250);
    await page.locator(".menu-item", { hasText: "Import data" }).click();
    await page.waitForTimeout(400);
    await page.locator(".modal-lg textarea").first().fill(JSON.stringify({
      kind: "ebios-data", version: 2, studies: [{ id: "grown", name: "Grown study",
        organization: "", scope: "", createdAt: now, updatedAt: now, entities: ents, log: [] }] }));
    await page.locator(".modal-lg button", { hasText: "Preview pasted" }).click();
    await page.waitForTimeout(700);
    await page.locator(".modal-lg-foot .btn", { hasText: "Apply changes" }).first().click();
    await page.waitForTimeout(900);
    // The dialog leaves a fixed overlay over the page; while it stands every later click
    // lands on it rather than on what was aimed at.
    await page.locator('.modal-lg .btn.ghost[aria-label="Close"]').click().catch(() => {});
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(300);
    await page.locator(".topbar .brand, .topbar a, .topbar button").first().click().catch(() => {});
    await page.waitForTimeout(500);
    await page.locator(".card.clickable", { hasText: "Grown study" }).first().click();
    await page.waitForTimeout(700);
    await page.locator("button, a").filter({ hasText: /Risk Consideration/ }).first().click();
    await page.waitForSelector(".ap-toolbar", { timeout: 15000 });
    for (const c of await page.locator(".ap-chip").all()) await c.click();
    await page.waitForSelector(".ap-graph", { timeout: 20000 });
    await page.waitForTimeout(500);
    const m = await page.evaluate(() => {
      const g = document.querySelector(".ap-graph");
      const boxes = [...g.querySelectorAll(".ap-node")].map((n) => n.getBoundingClientRect());
      let ov = 0;
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], c = boxes[j];
        if (a.left < c.right && c.left < a.right && a.top < c.bottom && c.top < a.bottom) ov++;
      }
      return { n: boxes.length, ov, h: g.offsetHeight, dense: g.querySelectorAll(".ap-node.dense").length };
    });
    await page.screenshot({ path: `${shots}/AttackPathsGrown.png`, fullPage: false });
    ok("a grown study draws every box it was given", m.n === CHAINS * DEPTH + 1, String(m.n));
    ok("...with none of them overlapping", m.ov === 0, String(m.ov));
    ok("...compressed, because one depth holds more than nine", m.dense === m.n, `${m.dense}/${m.n}`);
    ok("...to a sheet that can still be read as one diagram", m.h < 2400, `${m.h}px`);
    ok("...and the sheet says it compressed them rather than dropping the tactic silently",
      (await page.locator(".ap-dense-note").count()) === 1);
  }

  ok(`the page survives ${survived} steps of working in it and navigating away`,
    !blanked && errors.length === errorsBefore,
    blanked || errors.slice(errorsBefore).join(" | "));
} catch (e) {
  errors.push("exception: " + (e?.message ?? String(e)));
} finally {
  await browser.close();
}

const failed = checks.filter((c) => !c.cond).length;
if (errors.length) { console.log("\nConsole/page errors:"); errors.forEach((e) => console.log("  ! " + e)); }
console.log(`\n${checks.length - failed}/${checks.length} checks passed · ${errors.length} errors · shots in ${shots}`);
process.exit(failed || errors.length ? 1 : 0);
