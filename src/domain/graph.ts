// SPDX-License-Identifier: MPL-2.0 · Copyright (c) Aurelian-Risk
// Derives a node/edge graph from a study's generic entities, using the
// taxonomy's ref/multiref fields as relationships.
import type { EntityRecord, Study, Taxonomy } from "./types";
import { fieldRelation, getType, recordTitle, refFields } from "./taxonomy";

export interface GNode {
  id: string;
  label: string;
  type: string;
  group: string;
  color: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GLink {
  source: string;
  target: string;
  rel: string;
}

export function buildGraph(tax: Taxonomy, study: Study): { nodes: GNode[]; links: GLink[] } {
  const groupColor = new Map(tax.groups.map((g) => [g.key, g.color]));
  const nodes: GNode[] = [];
  const byId = new Map<string, EntityRecord>();

  for (const r of study.entities) {
    const t = getType(tax, r.type);
    if (!t) continue;
    byId.set(r.id, r);
    nodes.push({
      id: r.id,
      label: recordTitle(t, r),
      type: r.type,
      group: t.group,
      color: groupColor.get(t.group) ?? "var(--primary)",
    });
  }

  const ids = new Set(nodes.map((n) => n.id));
  const links: GLink[] = [];
  for (const r of study.entities) {
    const t = getType(tax, r.type);
    if (!t) continue;
    for (const f of refFields(t)) {
      // Through the lookup, not off the declaration: this is the word on every edge of
      // the graph and in its legend, and read raw it stayed English in a German study.
      const rel = fieldRelation(f, t);
      const v = r.values[f.key];
      const targets = f.type === "multiref" ? (Array.isArray(v) ? v : []) : v ? [v] : [];
      for (const target of targets) {
        if (typeof target === "string" && ids.has(target)) {
          links.push({ source: r.id, target, rel });
        }
      }
    }
  }
  return { nodes, links };
}

/** A node with a place. `fixed` is never moved: the foci carry the structure. */
export interface Placed { id: string; x: number; y: number; fixed?: boolean }

/** Push overlapping nodes apart, in place, until nothing overlaps or the rounds run out.
 *
 *  The layout above places neighbours on arcs and does not know how many an arc can hold, so
 *  past a certain count they land on top of one another - measured at one focus of the
 *  sample: 100 nodes, closest centres 20.8px, and 117 overlapping LABEL pairs against a
 *  single overlapping node pair. Relieving the crowding afterwards keeps the arrangement the
 *  layout intended and removes only the overlap.
 *
 *  Three properties it has to have, and each cost something to get:
 *
 *  - **Deterministic.** No randomness: pairs in index order, and two points exactly on top
 *    of each other are separated along a direction derived from their order. The same scene
 *    draws the same twice, or a screenshot, a check and a memory of it can disagree.
 *    `d3-force`'s `forceCollide` jitters coincident points with `Math.random`, which is why
 *    this is forty lines rather than a dependency.
 *  - **The foci stay put.** They carry the structure; only neighbours give way.
 *  - **The clearance is FLAT, not round.** A node is a point with a label beside it, so it
 *    is wide: `radiusY` makes the free space an ellipse. A round clearance separates the
 *    dots and leaves the labels colliding, which is the thing a reader actually sees. */
export function spreadOut(items: Placed[], radius: number,
  bounds?: { x0: number; y0: number; x1: number; y1: number }, rounds = 80, radiusY?: number): Placed[] {
  const out = items.map((p) => ({ ...p }));
  const ry = radiusY ?? radius;
  // Measure where the ellipse is a circle: scale y, solve the plain circular case, scale the
  // push back on the way out.
  const ky = radius / ry;
  const min = radius * 2, min2 = min * min;
  const clamp = (p: Placed) => {
    if (!bounds) return;
    p.x = Math.min(bounds.x1, Math.max(bounds.x0, p.x));
    p.y = Math.min(bounds.y1, Math.max(bounds.y0, p.y));
  };
  for (let r = 0; r < rounds; r++) {
    let moved = false;
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const a = out[i], b = out[j];
        if (a.fixed && b.fixed) continue;
        let dx = b.x - a.x, dy = (b.y - a.y) * ky;
        let d2 = dx * dx + dy * dy;
        if (d2 >= min2) continue;
        if (d2 === 0) { dx = Math.cos(i + j); dy = Math.sin(i + j); d2 = 1; }
        const d = Math.sqrt(d2);
        const push = (min - d) / d / 2;
        const ax = dx * push, ay = (dy * push) / ky;
        if (a.fixed) { b.x += ax * 2; b.y += ay * 2; }
        else if (b.fixed) { a.x -= ax * 2; a.y -= ay * 2; }
        else { a.x -= ax; a.y -= ay; b.x += ax; b.y += ay; }
        clamp(a); clamp(b);
        moved = true;
      }
    }
    if (!moved) break;   // nothing overlaps: further rounds cannot change anything
  }
  for (const p of out) clamp(p);
  return out;
}
