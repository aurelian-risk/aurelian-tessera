// This product's own appearance.
//
// Taken from the BSI's own publication rather than invented: "Leitfaden zur Methodik
// Grundschutz++" (March 2026) is set on white, in a serif, with hairline rules, bordered
// tables and no ornament. The five ISMS practices are drawn there in a blue ramp, the
// technical ones green, the organisational ones orange (Abbildung 4). A security concept
// is read by an auditor beside that document, so the tool should not look like a different
// trade to the paper it produces.
//
// Only tokens. src/styles/tokens.css stays identical to upstream; these values are written
// over it at startup (src/domain/theme.ts), which is what keeps the shared stylesheet from
// diverging between the two products on this engine.

/** Group accents. The engine's accent set is kept as it is — the logo draws on
 *  --color-workshop-2, and the guide itself uses three colour families rather than one
 *  (blue for the methodical practices, green for the technical, orange for the
 *  organisational, Abbildung 4). What makes this product look unlike its sibling is the
 *  paper ground, the square corners and the serif titles, not a drained palette. These
 *  names exist so the taxonomy can refer to a step by meaning instead of by number. */
const GROUP = {
  "--gs-governance": "var(--color-workshop-1)",       // blue
  "--gs-structure": "var(--color-workshop-2)",        // amber — also the logo's accent
  "--gs-risk": "var(--color-workshop-4)",             // red
  "--gs-implementation": "var(--color-workshop-5)",   // green
  "--gs-monitoring": "var(--color-workshop-3)",       // violet
  "--gs-improvement": "var(--violet)",
};

export const THEME = {
  base: {
    ...GROUP,

    // A document, not an app: square corners throughout, rules instead of drop shadows,
    // and labels that read as table cells rather than as capsules.
    "--radius": "3px",
    "--radius-sm": "2px",
    "--radius-lg": "4px",
    "--radius-pill": "2px",

    // Serif titles over a sans body — the guide's voice, without setting dense tables in
    // a serif, which costs more in legibility than it returns.
    "--font-display": '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, "Times New Roman", serif',
    "--font-sans": '"Segoe UI Variable", "Segoe UI", system-ui, -apple-system, Roboto, sans-serif',
  },

  light: {
    // White page. No ambient glow: the gradients are what make the sister product read as
    // a console, and this one should read as paper.
    "--bg-0": "oklch(1 0 0)",
    "--bg-1": "oklch(0.985 0.002 250)",
    "--app-glow-a": "transparent",
    "--app-glow-b": "transparent",

    // Opaque surfaces, so the translucency that carries the glass look has nothing to
    // show through.
    "--bg-raised": "oklch(1 0 0)",
    "--bg-panel": "oklch(1 0 0)",
    "--bg-input": "oklch(0.995 0.001 250)",
    "--bg-hover": "oklch(0.42 0.06 258 / 0.055)",
    "--bg-active": "oklch(0.42 0.06 258 / 0.09)",

    "--border": "oklch(0.42 0.02 258 / 0.22)",
    "--border-strong": "oklch(0.42 0.02 258 / 0.42)",
    "--hairline": "oklch(0.42 0.02 258 / 0.14)",

    "--fg": "oklch(0.21 0.012 258)",
    "--fg-muted": "oklch(0.42 0.012 258)",
    "--fg-subtle": "oklch(0.56 0.012 258)",

    "--primary": "var(--gs-governance)",
    "--primary-fg": "oklch(1 0 0)",
    "--primary-glow": "oklch(0.42 0.075 258 / 0.18)",

    // Rules carry the structure; shadows only where something genuinely floats.
    "--shadow-sm": "0 0 0 transparent",
    "--shadow-md": "0 1px 2px oklch(0.21 0.02 258 / 0.07)",
    "--shadow-lg": "0 6px 24px -10px oklch(0.21 0.02 258 / 0.22)",
    "--edge-top": "none",
  },

  dark: {
    // Kept usable, and pulled to the same neutral: a slate ground, no colour wash.
    "--bg-0": "oklch(0.17 0.008 258)",
    "--bg-1": "oklch(0.20 0.009 258)",
    "--app-glow-a": "transparent",
    "--app-glow-b": "transparent",

    "--bg-raised": "oklch(0.235 0.010 258)",
    "--bg-panel": "oklch(0.225 0.010 258)",
    "--bg-input": "oklch(0.185 0.009 258)",

    "--border": "oklch(1 0 0 / 0.14)",
    "--border-strong": "oklch(1 0 0 / 0.26)",
    "--hairline": "oklch(1 0 0 / 0.10)",

    "--primary": "oklch(0.72 0.075 250)",
    "--primary-fg": "oklch(0.17 0.01 258)",
    "--primary-glow": "oklch(0.72 0.075 250 / 0.28)",

    "--shadow-sm": "0 1px 2px oklch(0 0 0 / 0.3)",
    "--shadow-md": "0 4px 14px -8px oklch(0 0 0 / 0.5)",
    "--shadow-lg": "0 18px 46px -18px oklch(0 0 0 / 0.6)",
    "--edge-top": "none",
  },
};
