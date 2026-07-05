// ---------------------------------------------------------------------------
// Shared live player state. The Player controller writes Nilu's world position
// here every frame; the embodied quest system reads it to detect when Nilu
// walks into an answer orb or up to a quest friend. Kept as a module-level
// mutable (like input.ts) so it never triggers React re-renders at 60fps.
// ---------------------------------------------------------------------------

import * as THREE from 'three';

/** Nilu's current world position, updated each frame by the Player controller. */
export const beluPos = new THREE.Vector3(0, 0.4, 6);

/** Is Nilu currently standing on the ground (not mid-jump)? */
export const beluState = { grounded: true };

/** One-shot vertical impulse for the player (e.g. the Rainbow bouncy dome).
 *  A layer writes `vy` > 0; the Player controller consumes it next frame. */
export const playerImpulse = { vy: 0 };

/** Continuous horizontal push (units/second) applied to the player this frame
 *  (e.g. the Rainbow slide). Layers write it every frame; Player consumes and
 *  clears it, so it never lingers. */
export const playerBoost = { x: 0, z: 0 };

/** Camera zoom channel (1 = default). UI buttons / mouse wheel write it; the
 *  Player controller's follow-camera reads it and lerps its offset distance.
 *  Module-level (not React state) so 60fps camera code never re-renders. */
export const camZoom = { v: 1 };
export const CAM_ZOOM_MIN = 0.55;
export const CAM_ZOOM_MAX = 2.0;
export const CAM_ZOOM_STEP = 0.15;
export function nudgeZoom(delta: number) {
  camZoom.v = Math.min(CAM_ZOOM_MAX, Math.max(CAM_ZOOM_MIN, camZoom.v + delta));
}
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as unknown as { __camZoom?: typeof camZoom }).__camZoom = camZoom;
}

export interface Solid {
  x: number;
  z: number;
  r: number;
}

// Moving / per-island solids Nilu can't walk through (animals, friends). Each
// layer (StoryLayer, QuestLayer) writes its own keyed slice every frame; the
// Player controller pushes Nilu out of all of them. Static solids (mountain,
// hut, trees) live in worldConfig.OBSTACLES.
export const dynamicSolids: Record<string, Solid[]> = {};
