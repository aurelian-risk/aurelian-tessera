// SPDX-License-Identifier: MPL-2.0 · Copyright (c) Aurelian-Risk
// Which language the reader is shown, and where the words for it live.
//
// The contract is in docs/i18n.md; the part that matters here is one sentence:
//
//   Look the key up in the table for the chosen language; find nothing, show what was
//   authored.
//
// That covers both products built on this engine, which need it in opposite directions.
// Aurelian Lite authors its taxonomy in English and a German table translates it.
// Grundschutz++ stores the published German BSI vocabulary and an English table gives the
// reading — so ITS German interface needs no entries at all: nothing is found, the
// published value shows, which is what an auditor checks against.
//
// Nothing here translates a STORED value. A stored value is data - the engine matches on
// it, an export carries it, a seal hashes it. Only what is shown passes through.

/** A language tag as the browser gives it, cut to its primary subtag: "de-AT" → "de". */
export type Lang = string;

/** Keys are `type.<key>.label`, `group.<key>.description`, `field.<key>.label` and so on;
 *  see docs/i18n.md. A list-valued entry carries a whole scale or option vocabulary. */
export type Overlay = Record<string, string | string[]>;

const primary = (tag: string): Lang => tag.toLowerCase().split(/[-_]/)[0];

let current: Lang = "en";
const tables = new Map<Lang, Overlay>();

/** Register (or extend) the words for one language. A product calls this; the engine
 *  never ships a table of its own for taxonomy text. */
export function registerOverlay(lang: Lang, overlay: Overlay): void {
  const key = primary(lang);
  tables.set(key, { ...(tables.get(key) ?? {}), ...overlay });
}

export const getLanguage = (): Lang => current;

// A component that shows words has to be told when they change. Without this the choice
// below would only take effect at the next reload, which is a setting that appears not to
// work.
const listeners = new Set<() => void>();
export function onLanguageChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function setLanguage(lang: Lang): void {
  const next = primary(lang);
  if (next === current) return;
  current = next;
  try { document.documentElement.lang = next; } catch { /* no document in a test */ }
  for (const fn of listeners) fn();
}

/** The languages this build can actually show, in the order the product named them.
 *  Filled by `applyProductLanguage`; empty until then, which is what a test sees. */
let offered: Lang[] = [];
export const offeredLanguages = (): readonly Lang[] => offered;

// Where an explicit choice is kept. A choice is the reader's, not the study's: it belongs
// to this browser and travels with no export.
const CHOICE_KEY = "aurelian.language";

/** What the reader chose, or "" for "whatever the browser asks for". */
export function languageChoice(): Lang {
  try { return localStorage.getItem(CHOICE_KEY) || ""; } catch { return ""; }
}

/** Choose a language, or pass "" to hand the decision back to the browser.
 *
 *  The browser stays the DEFAULT: a reader who never opens this setting is answered by
 *  `navigator.languages`, as before. What this adds is the case the default cannot serve -
 *  a German-language browser reading the English wording, a shared machine, a screenshot
 *  for a reader elsewhere - without asking anyone to change a browser setting for it. */
export function chooseLanguage(lang: Lang, productLanguage: Lang = "en"): Lang {
  const wanted = primary(lang);
  const settled = lang === "" ? resolveLanguage(productLanguage, offered) : wanted;
  try { lang === "" ? localStorage.removeItem(CHOICE_KEY) : localStorage.setItem(CHOICE_KEY, settled); }
  catch { /* a browser that keeps nothing still switches for this session */ }
  setLanguage(settled);
  return settled;
}

/** Settle on a language once, at start-up: what the reader's browser asks for, if a table
 *  exists for it, and otherwise what this product is written in.
 *
 *  The browser decides unless the reader says otherwise: `chooseLanguage` records a choice
 *  and this function honours it at the next start. The two can disagree, and when they do
 *  the reader's own choice is the one that means something.
 *
 *  A LANGUAGE IS ON OFFER ONLY IF A TABLE NAMES IT — an empty one will do, and an empty
 *  one is often exactly right: a product authored in English needs no English entries,
 *  because a key nothing answers already shows English. It still has to be NAMED, or a
 *  reader asking for it is sent to the product's default instead. Found in the fork, at a
 *  product authored in German: an English browser got German, and the cause read like the
 *  opposite of a mistake. `{ en: {} }` is a declaration, not a placeholder. */
export function resolveLanguage(productDefault: Lang, offered: readonly string[] = []): Lang {
  const asked = typeof navigator !== "undefined" ? (navigator.languages ?? [navigator.language]) : [];
  // Only what the PRODUCT offers, plus its own language. Engine tables supply words for
  // whichever language is chosen; they do not put one on the menu, because the engine
  // does not know what a product ships.
  const known = new Set([...offered.map(primary), primary(productDefault)]);
  for (const tag of asked) { const p = primary(String(tag ?? "")); if (p && known.has(p)) return p; }
  return primary(productDefault);
}

/** The shown form of one key, or `authored` when this language says nothing about it. */
export function t(key: string, authored: string): string {
  const v = tables.get(current)?.[key];
  return typeof v === "string" && v ? v : authored;
}

/** The same for a whole vocabulary - a scale's rungs, an enum's readings. Returns
 *  `authored` unless the table holds a list of exactly the same length: a vocabulary that
 *  has gained a rung since the table was written is better shown as authored than shown
 *  shifted by one. */
export function tList(keys: string | string[], authored: string[] | undefined): string[] | undefined {
  // The keys are tried IN ORDER, here, rather than by the caller chaining calls with `??`.
  // Chained, the first call answers with `authored` on a miss — never undefined — so the
  // second key is unreachable, and a vocabulary written under the shared key is silently
  // never shown. Found in the fork: 13 scale entries written, 0 displayed, no complaint.
  for (const key of typeof keys === "string" ? [keys] : keys) {
    const v = tables.get(current)?.[key];
    if (Array.isArray(v) && (!authored || v.length === authored.length)) return v;
  }
  return authored;
}

/** A phrase whose wording depends on a count.
 *
 *  Seven places here built the plural by adding "s" — which is a rule about English, not
 *  about counting. German has no such rule ("Schritt" / "Schritte", "Datensatz" /
 *  "Datensätze"), so both forms are written out and the number chooses between them.
 *
 *  Two forms, deliberately, not the full ICU set: two cover both languages this engine
 *  ships, and the rest would be built for languages nobody has asked for. The number is
 *  put in with `{0}`, so a language may place it where it belongs.
 *
 *      tn("ui.entitysection.currently-in-use", 3,
 *         "Currently in use by {0} record", "Currently in use by {0} records")
 *
 *  The example names a key that EXISTS: the check reads call sites off the source, a
 *  comment included, and an invented one there reads to it as a table entry nobody
 *  wrote. */
export function tn(key: string, n: number, one: string, many: string): string {
  const form = n === 1 ? t(`${key}.one`, one) : t(`${key}.many`, many);
  return form.replace(/\{0\}/g, String(n));
}

/** One sentence, split at its placeholders, so a caller can put something INTO it.
 *
 *  A sentence interrupted by markup — "Residual = position after treatment, <b>derived</b>
 *  from the decision" — is three fragments in the source, and three fragments cannot be
 *  translated: German puts the emphasised word somewhere else, and fixed fragment order
 *  forbids that. Written as one string with `{0}` in it, the sentence is whole and the
 *  placeholder travels to wherever the language wants it.
 *
 *  Returns the literal pieces around the placeholders, plus the index each gap wants:
 *  `["Residual = position after treatment, ", 0, " from the decision"]`. The caller
 *  decides what a gap is made of, which is how a React node fits through a string. */
export function tParts(key: string, authored: string): (string | number)[] {
  const text = t(key, authored);
  const out: (string | number)[] = [];
  let at = 0;
  for (const m of text.matchAll(/\{(\d+)\}/g)) {
    if (m.index! > at) out.push(text.slice(at, m.index));
    out.push(Number(m[1]));
    at = m.index! + m[0].length;
  }
  if (at < text.length) out.push(text.slice(at));
  return out;
}

/** For tests and for a product that rebuilds its tables. */
export function clearOverlays(): void { tables.clear(); }

/** Settle the language once, before the first paint — beside the theme, and for the same
 *  reason: a reader should never see one language replaced by another. The product's own
 *  tables are registered first, so a browser asking for a language this build actually
 *  carries gets it, and any other request falls to what the product is authored in. */
export function applyProductLanguage(
  productLanguage: string,
  words: Record<string, Overlay> = {},
  engineWords: Record<string, Overlay> = {},
): Lang {
  // The engine first, the product second: a later registration wins, so a product can
  // overrule any word the engine has for the same key without having to repeat the rest.
  for (const [lang, overlay] of Object.entries(engineWords)) registerOverlay(lang, overlay);
  for (const [lang, overlay] of Object.entries(words)) registerOverlay(lang, overlay);
  offered = Object.keys(words).map(primary);
  // An explicit choice wins over the browser, and only if this build can still show it:
  // a table can be dropped between two releases, and a stored tag naming it would leave
  // the reader with a language nothing answers.
  const stored = primary(languageChoice());
  const chosen = stored && offered.includes(stored)
    ? stored
    : resolveLanguage(productLanguage, offered);
  current = "";                       // so setLanguage sees a change and settles the tag
  setLanguage(chosen);
  return chosen;
}
