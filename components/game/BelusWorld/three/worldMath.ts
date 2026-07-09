// ---------------------------------------------------------------------------
// Ground sampling + bridge geometry.
// Instead of a physics engine we use a lightweight height-field: given an XZ
// position we figure out which island top or bridge plank the player is over
// and return its height. This is cheap, deterministic and — importantly for an
// ASD audience — completely predictable. No tunnelling, no jitter.
// ---------------------------------------------------------------------------

import { ISLAND_LIST, BRIDGES, ISLANDS, isZoneFormed, type ZoneId } from './worldConfig';

export interface GroundSample {
  /** ground height at this point */
  y: number;
  /** is the point actually over a walkable surface? */
  onSurface: boolean;
  /** the zone whose island we're standing on, if any */
  zone: ZoneId | null;
}

interface Segment {
  ax: number;
  az: number;
  ay: number;
  bx: number;
  bz: number;
  by: number;
  halfWidth: number;
  to: ZoneId;
}

// Precompute bridge segments (island-edge to island-edge) once.
export const BRIDGE_SEGMENTS: Segment[] = BRIDGES.map((b) => {
  const A = ISLANDS[b.from];
  const B = ISLANDS[b.to];
  const dx = B.cx - A.cx;
  const dz = B.cz - A.cz;
  const len = Math.hypot(dx, dz) || 1;
  const ux = dx / len;
  const uz = dz / len;
  // Pull the endpoints in to each island's rim so the plank meets the grass.
  const ax = A.cx + ux * (A.radius - 1.5);
  const az = A.cz + uz * (A.radius - 1.5);
  const bx = B.cx - ux * (B.radius - 1.5);
  const bz = B.cz - uz * (B.radius - 1.5);
  return { ax, az, ay: A.top, bx, bz, by: B.top, halfWidth: b.halfWidth, to: b.to };
});

const EDGE_FALLOFF = 1.4; // soft margin past the rim before you actually fall

/** Smooth dome so island centres sit slightly higher than rims — feels natural. */
function islandHeightAt(distFromCentre: number, radius: number, top: number): number {
  const t = Math.min(distFromCentre / radius, 1);
  // gentle dome: +0.6 at centre easing to 0 at rim
  return top + 0.6 * (1 - t * t);
}

/** Sample the ground at an XZ position. Returns the highest surface under it. */
export function sampleGround(x: number, z: number): GroundSample {
  let best: GroundSample = { y: -Infinity, onSurface: false, zone: null };

  // Islands
  for (const isl of ISLAND_LIST) {
    if (!isZoneFormed(isl.id)) continue; // locked islands haven't formed yet
    const d = Math.hypot(x - isl.cx, z - isl.cz);
    if (d <= isl.radius + EDGE_FALLOFF) {
      const y = islandHeightAt(Math.min(d, isl.radius), isl.radius, isl.top);
      if (y > best.y) best = { y, onSurface: d <= isl.radius + EDGE_FALLOFF, zone: isl.id };
    }
  }

  // Bridges
  for (const s of BRIDGE_SEGMENTS) {
    if (!isZoneFormed(s.to)) continue; // bridge to a locked island hasn't formed
    const dx = s.bx - s.ax;
    const dz = s.bz - s.az;
    const len2 = dx * dx + dz * dz || 1;
    let t = ((x - s.ax) * dx + (z - s.az) * dz) / len2;
    t = Math.max(0, Math.min(1, t));
    const px = s.ax + dx * t;
    const pz = s.az + dz * t;
    const perp = Math.hypot(x - px, z - pz);
    if (perp <= s.halfWidth + 0.3) {
      // gentle arch on the bridge: lift the middle a touch
      const arch = Math.sin(t * Math.PI) * 0.8;
      const y = s.ay + (s.by - s.ay) * t + arch;
      if (y > best.y) best = { y, onSurface: true, zone: best.zone };
    }
  }

  if (best.y === -Infinity) return { y: -8, onSurface: false, zone: null };
  return best;
}

/** Distance from an XZ point to the centre of a zone island. */
export function distToIsland(x: number, z: number, zone: ZoneId): number {
  const isl = ISLANDS[zone];
  return Math.hypot(x - isl.cx, z - isl.cz);
}
