// ---------------------------------------------------------------------------
// Shared live player state. The Player controller writes Belu's world position
// here every frame; the embodied quest system reads it to detect when Belu
// walks into an answer orb or up to a quest friend. Kept as a module-level
// mutable (like input.ts) so it never triggers React re-renders at 60fps.
// ---------------------------------------------------------------------------

import * as THREE from 'three';

/** Belu's current world position, updated each frame by the Player controller. */
export const beluPos = new THREE.Vector3(0, 0.4, 6);

/** Is Belu currently standing on the ground (not mid-jump)? */
export const beluState = { grounded: true };

/** One-shot vertical impulse for the player (e.g. the Rainbow bouncy dome).
 *  A layer writes `vy` > 0; the Player controller consumes it next frame. */
export const playerImpulse = { vy: 0 };

/** Continuous horizontal push (units/second) applied to the player this frame
 *  (e.g. the Rainbow slide). Layers write it every frame; Player consumes and
 *  clears it, so it never lingers. */
export const playerBoost = { x: 0, z: 0 };

export interface Solid {
  x: number;
  z: number;
  r: number;
}

// Moving / per-island solids Belu can't walk through (animals, friends). Each
// layer (StoryLayer, QuestLayer) writes its own keyed slice every frame; the
// Player controller pushes Belu out of all of them. Static solids (mountain,
// hut, trees) live in worldConfig.OBSTACLES.
export const dynamicSolids: Record<string, Solid[]> = {};
