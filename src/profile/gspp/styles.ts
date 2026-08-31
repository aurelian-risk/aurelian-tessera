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
/* 1180 was a reading width, and this product's pages are registers rather than prose. The
   widest one - Requirements, with the security level, the implementation state, the scope
   and the assets it applies to - measures 1276px, so at 1180 the last two columns sat
   outside the panel at every window size and could only be reached by a scrollbar inside
   it. 1380 fits the widest register with slack; beyond that a line of body text gets long
   enough to lose. 1420, not 1356: between .content and the table body another 44px go to
   the panel and the scrollbar gutter, which is only visible by measuring. */
.content { padding: 34px 40px 60px; max-width: 1420px; }

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
  font-style: italic; text-align: center; padding: 6px 8px;
  /* The engine keeps a heading on one line and ends it in an ellipsis. That fits a language
     whose words are short: at 1280px four English headings ran out of their column and
     fifteen German ones, and the column is a fixed share of the table, so the room does not
     grow. "Eintrittswahrscheinlichkeit" has no shorter synonym - it read
     "Eintrittswahrscheinl…" - so the line has to break instead. Hyphenation splits a
     compound where the language allows; the page carries lang="de", which is what the
     browser reads to know where that is. */
  white-space: normal; overflow: visible; text-overflow: clip;
  overflow-wrap: break-word; hyphens: auto; vertical-align: bottom; }
.tbl td { border: 1px solid var(--hairline); padding: 6px 8px; }
/* A wide register scrolls inside its own section. The engine clips the panel to round its
   corners; with square corners there is nothing to round, and the clip was what cut the
   last columns off silently - worse than a scrollbar. */
.panel { overflow: visible; }
.panel-body { overflow-x: auto; }
.tbl tbody tr:hover td { background: var(--bg-hover); }
.tbl .name { font-weight: 600; }
/* A chip carries a record's name - arbitrary text, often long - and may break anywhere
   rather than push the column out. A badge carries a VALUE from a fixed vocabulary, and
   "anywhere" lets its word shrink to one character: inside the flex badge that put the
   scale bars beside "hoc h" and "kriti sch". "break-word" keeps the word whole and breaks
   only one that genuinely does not fit. English never showed it - "high" fits. */
/* max-width is what makes the break rule bite. A pill sizes itself to its content, so a
   long word never "does not fit" - the pill simply grows, and at 1500px the German reading
   of the ISB role stood 242px wide in a 138px cell, over the column beside it. Held to the
   cell, the same word wraps. */
.tbl td .chip { white-space: normal; overflow-wrap: anywhere; max-width: 100%; }
/* "break-word" breaks at render but leaves a flex item's min-content width at the whole
   word, so the pill grew instead: the German reading of the ISB role stood 242px wide in a
   138px cell. "anywhere" is the one that lets it shrink - and the rung's name is held whole
   by .scale-lbl, which is why it can be used here now. */
.tbl td .badge { white-space: normal; overflow-wrap: anywhere; hyphens: auto; max-width: 100%; }

/* ── Notes and labels ───────────────────────────────────────────────── */
/* A note is set as a marginal remark with a rule, not as a tinted box. */
.guide { background: none; border: 0; border-left: 3px solid var(--border-strong);
  border-radius: 0; padding: 6px 0 6px 14px; }
.guide.warn { border-left-color: var(--color-state-warning); }
/* Round, and stated in pixels rather than through --radius-pill, which this theme squares
   off to 2px along with everything else. Squared, a value in a column reads as a button, and
   every one being a different width then reads as a fault; round it reads as a value, and
   the difference in width stops being the thing you see. The rest of the product stays
   squared - this is the one place where the shape carries meaning. */
.badge, .chip, .lint-pill, .cal-grade, .ap-chip, .di-preset {
  border-radius: 999px; font-family: var(--font-sans); font-size: 11px; }
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
/* The voice of this product's papers. Two typefaces and nothing fetched: the application
   must render without a network, so every family here is one the machine already has.

   The pairing is the point. Prose is set in a serif, because a security concept is read in
   sentences; everything that carries DATA - the tables, the meta block, the figures, the
   counts - is set in the sans, because a column of values is scanned, not read. A reader
   can tell at a glance which of the two they are looking at, and that is what makes a
   document of many registers legible rather than uniform. */
:root {
  --doc-ink: #16181c;
  --doc-quiet: #5b6472;
  --doc-rule: #c8cfd9;
  --doc-hair: #dfe4ea;
  --doc-accent: #1f4f8f;
  --doc-serif: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman", serif;
  --doc-sans: "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif;
}
body { background: #f2f3f5; }
.report { font-family: var(--doc-serif); color: var(--doc-ink);
  max-width: 210mm; border-radius: 0; box-shadow: 0 2px 14px -6px rgba(20,30,50,0.35);
  padding: 30mm 24mm; font-size: 15px; line-height: 1.58; }
.report p { margin: 9px 0; hyphens: auto; }

/* ── The title block ───────────────────────────────────────────────────────
   The name of the document, then what it is about. The subtitle is the first
   paragraph after h1, set in the sans so the two do not read as one sentence. */
.report h1 { font-family: var(--doc-serif); font-size: 32px; font-weight: 600; line-height: 1.15;
  letter-spacing: -0.01em; margin: 0 0 4px; padding: 0; border: 0; }
.report h1 + h2, .report h1 + p {
  font-family: var(--doc-sans); font-size: 15px; font-weight: 400; color: var(--doc-quiet);
  letter-spacing: 0.01em; margin: 0 0 4px; padding: 0; border: 0; }
.report h1 + h2::before { content: none; }
.report h1 + h2 + p, .report h1 + p + p {
  border-top: 2px solid var(--doc-ink); padding-top: 14px; margin-top: 14px; }

/* ── Sections ──────────────────────────────────────────────────────────────
   A rule above rather than under: it opens the section instead of underlining
   its name, and the eye finds the start of a part on a long page. */
.report h2 { font-size: 21px; font-weight: 600; letter-spacing: -0.005em;
  margin: 34px 0 4px; padding-top: 12px; border: 0; border-top: 1px solid var(--doc-rule); }
.report h3 { font-family: var(--doc-sans); font-size: 12px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.09em; color: var(--doc-quiet);
  margin: 24px 0 6px; }
.report h4 { font-size: 15px; font-weight: 700; margin: 16px 0 4px; }
.report hr { border: 0; border-top: 1px solid var(--doc-hair); margin: 26px 0 0; }
/* A section opens with a rule of its own, so a separator before it would draw two. */
.report hr + h2 { border-top: 0; padding-top: 0; margin-top: 20px; }

/* Only a document whose sections have no numbers of their own gets counted. */
.report.numbered { counter-reset: sec fig; }
.report.numbered h2 { counter-increment: sec; counter-reset: sub; }
.report.numbered h2::before { content: counter(sec) "  "; color: var(--doc-quiet);
  font-variant-numeric: tabular-nums; }
.report.numbered h3 { counter-increment: sub; }
.report.numbered h3::before { content: counter(sec) "." counter(sub) "  ";
  font-variant-numeric: tabular-nums; }

/* ── The lede ──────────────────────────────────────────────────────────────
   The sentence under a section heading says what the part is for. It is not body
   text and should not read as the first paragraph of it. */
.report h2 + p em, .report h2 + p > em:only-child {
  display: block; font-family: var(--doc-sans); font-style: normal; font-size: 13.5px;
  line-height: 1.5; color: var(--doc-quiet); border-left: 2px solid var(--doc-accent);
  padding: 2px 0 2px 12px; margin: 10px 0 16px; }

/* ── Tables ────────────────────────────────────────────────────────────────
   Data, so the sans, and hairlines rather than a grid: the rows should carry the
   eye across without every cell being boxed. Figures line up in columns. */
.report table { font-family: var(--doc-sans); border-collapse: collapse; width: 100%;
  margin: 10px 0 20px; font-size: 12.5px; font-variant-numeric: tabular-nums; }
/* Not set in capitals: a German compound in capitals with letterspacing is half again as
   wide as the values under it, and it broke mid-word - "ZIELOBJEKTKATEGORI / EN". Small,
   bold and quiet says "this is the head of a column" just as clearly, in half the room. */
.report th { border: 0; border-bottom: 1.5px solid var(--doc-ink); background: transparent;
  font-style: normal; font-weight: 700; font-size: 11px; letter-spacing: 0.01em;
  color: var(--doc-quiet); text-align: left; padding: 4px 10px 5px;
  overflow-wrap: normal; hyphens: none; }
.report td { border: 0; border-bottom: 1px solid var(--doc-hair); padding: 5px 10px;
  vertical-align: top; }
.report tbody tr:nth-child(even) td { background: transparent; }
.report tbody tr:last-child td { border-bottom: 1px solid var(--doc-rule); }
/* The dense register keeps the engine's size; only the voice is this product's. */
.report table.dense th { text-align: left; font-style: normal; text-transform: none;
  letter-spacing: 0.01em; }
.report table.dense td { hyphens: auto; }

/* The meta block at the head of a document: two columns, the label quiet and small. A share
   of the sheet put 400px of nothing between a one-word label and its value; the label column
   is only as wide as the longest label needs. */
.report h1 ~ table:first-of-type td:first-child {
  font-family: var(--doc-sans); font-size: 11px; text-transform: uppercase;
  letter-spacing: 0.07em; color: var(--doc-quiet); width: 15em; white-space: nowrap;
  padding-top: 7px; }

/* ── Lists ─────────────────────────────────────────────────────────────────
   The contents of a set is a list of its parts, not prose. */
.report ul, .report ol { margin: 8px 0 16px; padding-left: 20px; }
.report li { margin: 3px 0; }
.report ul > li > strong:first-child { font-family: var(--doc-sans); font-weight: 600; }

/* ── Figures ───────────────────────────────────────────────────────────────
   Drawings are data: they keep the sans, centred with room around them. */
.report svg { font-family: var(--doc-sans); max-width: 100%; height: auto; }
.report div[align="center"] { margin: 20px 0 26px; }

.report code, .report pre { font-family: ui-monospace, "Cascadia Mono", Menlo, Consolas, monospace;
  font-size: 0.88em; }
.report a { color: var(--doc-accent); }

@media print {
  @page { size: A4; margin: 20mm 18mm 18mm; }
  body { background: #fff; }
  .report { box-shadow: none; padding: 0; max-width: none; font-size: 10.5pt; }
  .report h1 { font-size: 22pt; }
  .report h2 { font-size: 14pt; }
  .report h2, .report h3, .report h4 { break-after: avoid; }
  .report div[align="center"] { break-inside: avoid; }
  .report a { color: inherit; text-decoration: none; }
}
`;
