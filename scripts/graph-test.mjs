// What the de-overlap does, asserted rather than seen once on one screenshot.
//
// It is pure arithmetic on a list of points, so it needs no browser and no React. The
// properties below are the ones that cost something to get, and each would be plausible to
// break by accident: determinism first, because a layout that draws differently twice makes
// every screenshot, every check and every memory of it disagree with each other.
import { spreadOut } from "../node_modules/.cache/graph/graph.mjs";

let pass = 0, fail = 0;
const ok = (name, cond, detail) => {
  if (cond) { pass++; console.log(`✓ ${name}`); }
  else { fail++; console.log(`✗ ${name}${detail ? ` — ${detail}` : ""}`); }
};

/** Closest pair, measured in the flattened space the clearance is defined in. */
const closest = (pts, rx, ry) => {
  let m = Infinity;
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const dx = (pts[i].x - pts[j].x) / rx, dy = (pts[i].y - pts[j].y) / ry;
      m = Math.min(m, Math.hypot(dx, dy));
    }
  }
  return m;
};

const RX = 92, RY = 30;
/** A fan of neighbours crowded onto one arc: what the layout actually produces. */
const fan = (n, r = 40) => Array.from({ length: n }, (_, i) => ({
  id: `n${i}`, x: 500 + r * Math.cos((i * 2 * Math.PI) / n), y: 400 + r * Math.sin((i * 2 * Math.PI) / n),
}));

{
  const before = fan(26);
  const after = spreadOut(before, RX, undefined, 80, RY);
  ok("a crowded fan overlaps before", closest(before, RX, RY) < 2, String(closest(before, RX, RY).toFixed(2)));
  ok("...and does not after", closest(after, RX, RY) >= 1.99, String(closest(after, RX, RY).toFixed(2)));
  ok("...with every node still present", after.length === before.length);
}

{
  // Deterministic: the same input twice, including points exactly on top of each other,
  // which is where a random jitter would show.
  const same = [{ id: "a", x: 100, y: 100 }, { id: "b", x: 100, y: 100 }, { id: "c", x: 100, y: 100 }];
  const one = JSON.stringify(spreadOut(same, RX, undefined, 80, RY));
  const two = JSON.stringify(spreadOut(same, RX, undefined, 80, RY));
  ok("coincident points are separated", closest(JSON.parse(one), RX, RY) >= 1.99);
  ok("...and the same scene lays out identically twice", one === two);
}

{
  const items = [{ id: "f", x: 500, y: 400, fixed: true }, ...fan(12, 20)];
  const after = spreadOut(items, RX, undefined, 80, RY);
  const f = after.find((p) => p.id === "f");
  ok("a fixed node is never moved", f.x === 500 && f.y === 400, `${f.x},${f.y}`);
}

{
  const bounds = { x0: 90, y0: 40, x1: 900, y1: 700 };
  const after = spreadOut(fan(30, 10), RX, bounds, 80, RY);
  ok("nothing is pushed outside the bounds",
    after.every((p) => p.x >= bounds.x0 && p.x <= bounds.x1 && p.y >= bounds.y0 && p.y <= bounds.y1));
}

{
  // A corner cannot hold thirty nodes, and the rounds have to run out rather than spin.
  const tight = { x0: 0, y0: 0, x1: 120, y1: 60 };
  const t0 = Date.now();
  const after = spreadOut(fan(30, 5), RX, tight, 80, RY);
  ok("an impossible corner terminates instead of spinning", Date.now() - t0 < 2000 && after.length === 30);
}

{
  // Already clear: the arrangement the layout intended must survive untouched.
  const spaced = [{ id: "a", x: 100, y: 100 }, { id: "b", x: 400, y: 100 }, { id: "c", x: 700, y: 300 }];
  const after = spreadOut(spaced, RX, undefined, 80, RY);
  ok("a scene that already fits is returned unchanged",
    JSON.stringify(after) === JSON.stringify(spaced.map((p) => ({ ...p }))));
}

{
  // The clearance is flat, not round: this is the whole reason for radiusY. Two nodes one
  // above the other need 2*RY between them, two side by side need 2*RX.
  const stacked = spreadOut([{ id: "a", x: 300, y: 300 }, { id: "b", x: 300, y: 320 }], RX, undefined, 80, RY);
  const dy = Math.abs(stacked[0].y - stacked[1].y);
  ok("two nodes above one another are parted by the flat clearance", dy >= 2 * RY - 1, String(dy.toFixed(1)));
  const side = spreadOut([{ id: "a", x: 300, y: 300 }, { id: "b", x: 320, y: 300 }], RX, undefined, 80, RY);
  const dx = Math.abs(side[0].x - side[1].x);
  ok("...and two side by side by the wide one", dx >= 2 * RX - 1, String(dx.toFixed(1)));
  ok("...which is the point: a round clearance would have parted the dots and left the labels",
    2 * RX > 2 * RY);
}

console.log(`\n${pass}/${pass + fail} graph assertions passed · ${fail} failed`);
process.exit(fail ? 1 : 0);
