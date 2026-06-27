// ---------------------------------------------------------------------------
// Unified input. A single mutable object the render loop reads every frame, fed
// by both the keyboard and the on-screen touch joystick. Kept outside React
// state on purpose — input changes 60x/second and must never trigger re-renders.
// ---------------------------------------------------------------------------

export interface InputState {
  /** -1..1 left/right */
  moveX: number;
  /** -1..1 forward/back (forward = -1, i.e. away from camera / up the screen) */
  moveZ: number;
  /** edge-triggered jump request; the player controller consumes it */
  jumpQueued: boolean;
  /** edge-triggered interact request (E / tap action) */
  interactQueued: boolean;
}

export const input: InputState = {
  moveX: 0,
  moveZ: 0,
  jumpQueued: false,
  interactQueued: false,
};

const keys = new Set<string>();

function recompute() {
  let x = 0;
  let z = 0;
  if (keys.has('KeyW') || keys.has('ArrowUp')) z -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) z += 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
  // normalise diagonals so you don't move faster on the slant
  const len = Math.hypot(x, z);
  if (len > 0) {
    x /= len;
    z /= len;
  }
  // keyboard overrides joystick only when a key is actually pressed
  if (keys.size > 0) {
    input.moveX = x;
    input.moveZ = z;
  }
}

function onKeyDown(e: KeyboardEvent) {
  const code = e.code;
  if (
    code === 'KeyW' || code === 'KeyA' || code === 'KeyS' || code === 'KeyD' ||
    code === 'ArrowUp' || code === 'ArrowDown' || code === 'ArrowLeft' || code === 'ArrowRight'
  ) {
    if (!keys.has(code)) keys.add(code);
    recompute();
    e.preventDefault();
  } else if (code === 'Space') {
    input.jumpQueued = true;
    e.preventDefault();
  } else if (code === 'KeyE' || code === 'Enter') {
    input.interactQueued = true;
  }
}

function onKeyUp(e: KeyboardEvent) {
  const code = e.code;
  if (keys.delete(code)) {
    if (keys.size === 0) {
      input.moveX = 0;
      input.moveZ = 0;
    } else {
      recompute();
    }
    e.preventDefault();
  }
}

let attached = false;
export function attachKeyboard() {
  if (attached) return () => {};
  attached = true;
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  return () => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    keys.clear();
    input.moveX = 0;
    input.moveZ = 0;
    attached = false;
  };
}

/** Joystick feeds an analog vector. Magnitude already 0..1. */
export function setJoystick(x: number, z: number) {
  input.moveX = x;
  input.moveZ = z;
}
export function clearJoystick() {
  if (keys.size === 0) {
    input.moveX = 0;
    input.moveZ = 0;
  }
}
export function queueJump() {
  input.jumpQueued = true;
}
