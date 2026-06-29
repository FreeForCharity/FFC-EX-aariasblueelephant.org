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
