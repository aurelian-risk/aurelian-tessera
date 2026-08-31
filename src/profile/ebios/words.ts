// SPDX-License-Identifier: MPL-2.0 · Copyright (c) Aurelian-Risk
// What this product calls things, per language.
//
// Empty, and that is not an oversight: Aurelian Lite is authored in English, so English
// needs no table — a key nothing answers shows what the taxonomy itself says, which is
// already English. A second language is added by giving it a table here; nothing in
// src/domain is touched to do it. See docs/i18n.md for the key scheme.
//
// A sibling product built on this engine fills this differently. Grundschutz++ stores the
// published German BSI vocabulary, so ITS German table is empty for the same reason and
// its English one carries the readings.
import type { Overlay } from "../../domain/i18n";

export const WORDS: Record<string, Overlay> = {};
