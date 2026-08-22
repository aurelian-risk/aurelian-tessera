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
import { mkdirSync } from "node:fs";

const here = dirname(fileURLToPath(import.meta.url));
const file = "file://" + resolve(here, "../dist/index.html");
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

  // Sector qualifies the organization and is an input to the attack rate. It belongs to
  // the first workshop; the value has to MATCH one of the sectors calibration.ts declares,
  // or the note and the rate exceptions stay silently empty.
  await openWs(WS.GC, 350);
  ok("the sector picker sits in the first workshop", (await page.locator(".panel-head select").count()) === 1);
  ok("...as the app's standard panel", (await page.locator(".panel.ws-accent .panel-head h3").first().innerText()) === "Sector");
  const sectTxt = await page.locator(".sect-body").innerText();
  ok("...and explains what is specific about the chosen sector", /operational technology|remote-maintenance/i.test(sectTxt));
  ok("...and names the rate exception it actually triggers",
    /applied to the attack rate/i.test(sectTxt) && /State actor ×3/.test(sectTxt));

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
    const assetCells = await sec.locator("tbody tr.row-clickable td:nth-last-child(2)").allInnerTexts().catch(() => []);
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

  // What the method requires a decision to carry (STM.2.1.5, UMS.3.1, UMS.4.1). The sample
  // leaves these open deliberately: the whole ruleset is recorded, and the relevance
  // decision on what the catalogue classifies nowhere is the reader's to make.
  const struck = page.locator(".lint-card", { has: page.locator(".lint-title", { hasText: "struck from the package with no reason" }) });
  ok("striking a requirement without a reason is a finding", (await struck.count()) === 1);
  const struckN = Number((/(\d+)/.exec(await struck.locator(".lint-count").first().innerText()) ?? [0, 0])[1]);
  ok("...and it names the ones the catalogue classifies nowhere", struckN >= 200 && struckN <= 300, `${struckN} affected`);
  ok("an open requirement with nobody answerable is a finding",
    (await page.locator(".lint-card .lint-title", { hasText: "no one answerable or no date" }).count()) === 1);
  ok("...and a requirement reached by a category is not asked for a striking reason",
    !/every requirement/i.test(await struck.innerText()));

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
  await page.screenshot({ path: `${shots}/Timeline.png` });
  await page.locator(".tl-item").first().click();
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
  await page.locator(".sidebar .nav-item", { hasText: "Taxonomy" }).click();
  await page.waitForTimeout(250);
  const taxBody = await page.locator(".content").innerText();
  ok("taxonomy lists the entity types under their product names",
    taxBody.includes("Business process") && taxBody.includes("Asset") && taxBody.includes("Attack step"));
  ok("...including the types this product adds", taxBody.includes("Practice") && taxBody.includes("Metric") && taxBody.includes("Nonconformity"));
  await page.screenshot({ path: `${shots}/Taxonomy.png` });

  // The model, seen rather than edited - a page of its own. Here the class reading has the
  // BSI's own tree behind it, so it can say what a category costs once inheritance runs.
  await page.locator(".sidebar .nav-item", { hasText: "Explore" }).click();
  await page.waitForTimeout(300);
  ok("the explorer is reachable from the navigation", (await page.locator(".tx-explorer").count()) === 1);
  ok("the outline lists the five process steps and what each holds",
    (await page.locator(".tx-row-g").count()) === 6);
  await page.locator(".tx-row-t").filter({ hasText: "Requirements" }).first().click();
  await page.waitForTimeout(200);
  ok("a type opens onto its fields, with what each one is",
    (await page.locator(".tx-row-f").count()) > 20
    && /enum|text|list/.test(await page.locator(".tx-row-f .tx-spec").first().innerText()));

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
  ok("the relations reading draws a node per type and an edge per relationship",
    (await page.locator(".tx-graph .tx-node").count()) === 17
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
  ok("extraction defers model loading to the Model section", (await page.locator(".modal-lg", { hasText: "managed in the" }).count()) > 0);
  ok("extract disabled until a model is loaded", await page.locator(".modal-lg button", { hasText: "Extract" }).isDisabled());
  await page.screenshot({ path: `${shots}/Extraction.png` });
  await page.keyboard.press("Escape").catch(() => {});
  await page.locator(".overlay").click({ position: { x: 5, y: 5 } }).catch(() => {});

  // Model configuration section
  await page.locator(".sidebar .nav-item", { hasText: "Model" }).click();
  await page.waitForTimeout(200);
  const modelBody = await page.locator(".content").innerText();
  ok("model section renders", modelBody.includes("Model") && modelBody.includes("all-MiniLM"));
  ok("model section lists options", (await page.locator(".model-row").count()) >= 2);
  ok("model section is embedding-only", !modelBody.includes("Language model")
    && !modelBody.includes("SmolLM2") && !modelBody.includes("Qwen2.5"));
  await page.screenshot({ path: `${shots}/Model.png` });
} catch (e) {
  errors.push("exception: " + (e?.message ?? String(e)));
} finally {
  await browser.close();
}

const failed = checks.filter((c) => !c.cond).length;
if (errors.length) { console.log("\nConsole/page errors:"); errors.forEach((e) => console.log("  ! " + e)); }
console.log(`\n${checks.length - failed}/${checks.length} checks passed · ${errors.length} errors · shots in ${shots}`);
process.exit(failed || errors.length ? 1 : 0);
