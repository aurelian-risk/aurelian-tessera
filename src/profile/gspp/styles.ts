// This product, set as a document.
//
// Tokens carry a palette. They do not carry a different KIND of page, and that is what
// separates this build from its sibling: the engine assembles cards on a tinted ground,
// the BSI's "Leitfaden zur Methodik Grundschutz++" is a printed page - one measure, rules
// instead of frames, tables with real cell borders and a caption underneath, section
// numbers rather than tabs, and no ornament anywhere.
//
// Everything below restates engine rules to that end. It is deliberately small and only
// touches appearance; nothing here changes behaviour, and src/styles/*.css stays identical
// to upstream so the two products keep merging cleanly.
export const STYLES = `
/* ── The page ───────────────────────────────────────────────────────── */
body { font-family: var(--font-display); font-size: 13.5px; line-height: 1.5; }
.content { padding: 34px 40px 60px; max-width: 1180px; }

/* Sidebar: a spine, not a floating panel. Set at reading size - a caption is still text,
   and 11px under a 15px name is a label nobody reads. */
.sidebar { background: var(--bg-1); border-right: 1px solid var(--border-strong); padding: 22px 16px; }
.sidebar .nav-item { border-radius: 0; font-size: 13.5px; padding: 9px 10px; }
.nav-section { font-size: 11.5px; letter-spacing: 0.08em; }
/* The mark sits on the first line of the name, not on the middle of the block. */
.brand { align-items: flex-start; gap: 11px; padding: 2px 6px 16px;
  border-bottom: 1px solid var(--border-strong); margin-bottom: 12px; }
.brand .logo-mark { margin-top: -5px; }
.brand .name { font-size: 16.5px; line-height: 1.25; letter-spacing: 0; }
.brand .tag { font-size: 12.5px; line-height: 1.35; color: var(--fg-muted); margin-top: 2px; }
.sidebar > :last-child { font-size: 11.5px; }

/* Running head: the issuer's line above a rule, as on every page of the guide. */
.topbar { background: none; border-bottom: 2px solid var(--fg); padding-bottom: 10px; }
.topbar .title { font-size: 19px; font-weight: 600; letter-spacing: 0; }

/* ── Sections ───────────────────────────────────────────────────────── */
/* A numbered section list, not a row of tabs. */
.ws-tabs { background: none; border: 0; border-bottom: 1px solid var(--border-strong);
  border-radius: 0; padding: 0 0 2px; gap: 2px; box-shadow: none; }
.ws-tab { border-radius: 0; background: none; border: 0; border-bottom: 3px solid transparent;
  padding: 9px 13px; font-family: var(--font-display); font-size: 13.5px; box-shadow: none; }
/* A section number, set as a number: no dot, no shadow, no colour fill. */
.ws-tab .num { width: auto; height: auto; border-radius: 0; background: none; box-shadow: none;
  text-shadow: none; display: inline; color: var(--fg-subtle); font-weight: 600; font-size: 12.5px;
  font-variant-numeric: tabular-nums; }
.ws-tab:hover .num, .ws-tab.plain .num, .ws-tab.plain.active .num {
  background: none; box-shadow: none; }
.ws-tab.plain .num { width: 15px; height: 15px; display: grid; }
.ws-tab.active { background: none; border-color: transparent; border-bottom: 3px solid var(--ws, var(--fg));
  color: var(--fg); font-weight: 700; box-shadow: none; }
.ws-tab.active .num { color: var(--ws, var(--fg)); background: none; box-shadow: none; text-shadow: none; }
.ws-tab:hover { background: none; transform: none; color: var(--fg); }
.ws-sep { border-left: 1px solid var(--border-strong); margin: 0 8px; }

/* ── Panels: headed sections on the page, not cards ─────────────────── */
.panel { border-radius: 0; border: 0; border-top: 1px solid var(--border-strong);
  background: none; box-shadow: none; backdrop-filter: none; margin-bottom: 26px; }
.panel-head { padding: 12px 0 8px; border-bottom: 1px solid var(--hairline); }
.panel-head h3 { font-size: 15px; font-weight: 700; letter-spacing: 0; }
.panel-body { padding: 0; }
/* The engine marks a workshop with a coloured bar down the left edge. Here the colour
   belongs to the section rule, which is where a document carries it. */
.ws-accent::before { left: 0; right: 0; bottom: auto; top: -1px; width: auto; height: 2px; }

/* ── Tables, as the guide sets them ─────────────────────────────────── */
.tbl { border: 1px solid var(--border-strong); font-family: var(--font-display); font-size: 12.5px; }
.tbl th { border: 1px solid var(--border-strong); border-bottom-color: var(--fg-subtle); background: var(--bg-hover);
  text-transform: none; letter-spacing: 0; font-size: 12px; font-weight: 700;
  font-style: italic; text-align: center; padding: 6px 8px; }
.tbl td { border: 1px solid var(--hairline); padding: 6px 8px; }
/* A wide register scrolls inside its own section. The engine clips the panel to round its
   corners; with square corners there is nothing to round, and the clip was what cut the
   last columns off silently - worse than a scrollbar. */
.panel { overflow: visible; }
.panel-body { overflow-x: auto; }
.tbl tbody tr:hover td { background: var(--bg-hover); }
.tbl .name { font-weight: 600; }
.tbl td .chip, .tbl td .badge { white-space: normal; overflow-wrap: anywhere; }

/* ── Notes and labels ───────────────────────────────────────────────── */
/* A note is set as a marginal remark with a rule, not as a tinted box. */
.guide { background: none; border: 0; border-left: 3px solid var(--border-strong);
  border-radius: 0; padding: 6px 0 6px 14px; }
.guide.warn { border-left-color: var(--color-state-warning); }
.badge, .chip, .lint-pill, .cal-grade, .ap-chip, .di-preset {
  border-radius: 2px; font-family: var(--font-sans); font-size: 11px; }
.btn { border-radius: 2px; font-family: var(--font-display); box-shadow: none; }
.btn.primary { box-shadow: none; }

/* Figures keep the sans: a chart is a drawing, and the serif costs legibility there. */
svg text, .tbl .badge, .hm-cell, .kc-tile, .flow-node, .ap-node, .qb-row, .ft-card,
.cal-table, .dial-v, .mono { font-family: var(--font-sans); }
`;

/** The generated document, set the way the BSI sets its own: a serif on white, numbered
 *  sections, ruled tables with a caption line, and a footer naming the issuer on every
 *  printed page. The report is read beside the guide it works to; it should not look like
 *  a different trade to the paper it cites. */
export const REPORT_STYLES = `
body { background: #f2f3f5; }
.report { font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman", serif;
  max-width: 210mm; color: #16181c; border-radius: 0; box-shadow: 0 2px 14px -6px rgba(20,30,50,0.35);
  padding: 30mm 24mm; counter-reset: sec fig; }
.report h1 { font-size: 27px; font-weight: 600; letter-spacing: 0; line-height: 1.25;
  border-bottom: 2px solid #16181c; padding-bottom: 10px; margin-bottom: 6px; }
.report h2 { counter-increment: sec; counter-reset: sub; font-size: 19px; font-weight: 700;
  margin: 32px 0 10px; border-bottom: 1px solid #b9c0cb; padding-bottom: 5px; }
.report h2::before { content: counter(sec) "  "; color: #6a7382; font-variant-numeric: tabular-nums; }
.report h3 { counter-increment: sub; font-size: 15.5px; font-weight: 700; margin: 22px 0 6px; }
.report h3::before { content: counter(sec) "." counter(sub) "  "; color: #6a7382; font-variant-numeric: tabular-nums; }
.report h4 { font-size: 14px; font-weight: 700; margin: 14px 0 4px; }
.report hr { border: 0; border-top: 1px solid #d5dae2; margin: 26px 0; }

/* Tables as the guide sets them: full rules, an italic centred head, zebra off. */
.report table { border-collapse: collapse; width: 100%; margin: 10px 0 20px; font-size: 12.5px; }
.report th { border: 1px solid #8d97a5; border-bottom-width: 1.5px; background: #eceff3; font-style: italic; font-weight: 700;
  text-align: center; padding: 6px 9px; }
.report td { border: 1px solid #ccd3dc; padding: 6px 9px; vertical-align: top; }
.report tbody tr:nth-child(even) td { background: transparent; }

/* Figures are drawings: they keep the sans, and they are centred with room around them. */
.report svg { font-family: "Segoe UI", system-ui, sans-serif; max-width: 100%; height: auto; }
.report div[align="center"] { margin: 18px 0 24px; }

@media print {
  @page { size: A4; margin: 20mm 18mm 18mm; }
  body { background: #fff; }
  .report { box-shadow: none; padding: 0; max-width: none; }
  .report h2, .report h3 { break-after: avoid; }
  .report table, .report div[align="center"] { break-inside: avoid; }
}
`;
