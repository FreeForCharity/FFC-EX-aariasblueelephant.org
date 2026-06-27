// ---------------------------------------------------------------------------
// Player controller. Owns Belu's transform and the follow-camera.
// Movement is world-relative against a FIXED-angle camera — deliberately
// predictable for ASD players: "up on screen" is always the same direction,
// the camera never spins on its own. Up/down comes from jumping + the islands
// sitting at different heights. Falling off is impossible to "lose" at: you
// gently float back to home.
// ---------------------------------------------------------------------------

import { useImperativeHandle, useRef, forwardRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import Belu3D, { type MotionRef } from './Belu3D';
import { sampleGround } from './worldMath';
import { input } from './input';
import { ISLANDS, ZONE_ISLANDS, INTERACT_RADIUS, PLAYER_SPAWN, type ZoneId } from './worldConfig';
import type { BeluEmotion } from '../BeluCharacter';

const SPEED = 7.5;
const GRAVITY = 24;
const JUMP_V = 9;
const FALL_LIMIT = -5;
const CAM_OFFSET = new THREE.Vector3(0, 13.5, 17);

export interface PlayerHandle {
  position: THREE.Vector3;
  respawn: () => void;
}

interface Props {
  emotion: BeluEmotion;
  paused: boolean;
  onProximity: (zone: ZoneId | null) => void;
  onEnter: (zone: ZoneId) => void;
  reduceMotion: boolean;
  growthScale: number;
  growthStage: number;
}

const Player = forwardRef<PlayerHandle, Props>(function Player(
  { emotion, paused, onProximity, onEnter, reduceMotion, growthScale, growthStage },
  ref,
) {
  const group = useRef<THREE.Group>(null);
  const motion = useRef<MotionRef>({ speed: 0, airborne: false, vy: 0 });
  const vel = useRef(new THREE.Vector3());
  const pos = useRef(new THREE.Vector3(PLAYER_SPAWN.x, PLAYER_SPAWN.y, PLAYER_SPAWN.z));
  const vy = useRef(0);
  const grounded = useRef(true);
  const facing = useRef(0);
  const nearZone = useRef<ZoneId | null>(null);
  const camInit = useRef(false);

  const { camera } = useThree();

  useImperativeHandle(ref, () => ({
    position: pos.current,
    respawn: () => {
      pos.current.set(PLAYER_SPAWN.x, PLAYER_SPAWN.y, PLAYER_SPAWN.z);
      vy.current = 0;
      vel.current.set(0, 0, 0);
    },
  }));

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05); // clamp big frame gaps

    // ---- consume interact edge ----
    if (input.interactQueued) {
      input.interactQueued = false;
      if (nearZone.current) onEnter(nearZone.current);
    }

    if (paused) {
      motion.current.speed = 0;
      // keep camera trained on Belu while a panel is open
      followCamera(0.06);
      input.jumpQueued = false;
      return;
    }

    // ---- horizontal movement (world-relative, camera is fixed-angle) ----
    const ix = input.moveX;
    const iz = input.moveZ;
    const target = new THREE.Vector3(ix, 0, iz);
    if (target.lengthSq() > 1) target.normalize();
    vel.current.x = target.x * SPEED;
    vel.current.z = target.z * SPEED;

    pos.current.x += vel.current.x * dt;
    pos.current.z += vel.current.z * dt;

    // ---- jump + gravity ----
    if (input.jumpQueued) {
      input.jumpQueued = false;
      if (grounded.current) {
        vy.current = JUMP_V;
        grounded.current = false;
      }
    }
    vy.current -= GRAVITY * dt;
    pos.current.y += vy.current * dt;

    // ---- ground collision ----
    const g = sampleGround(pos.current.x, pos.current.z);
    const footY = g.y + 0.05;
    if (pos.current.y <= footY) {
      pos.current.y = footY;
      vy.current = 0;
      grounded.current = true;
    } else {
      grounded.current = false;
    }

    // ---- off-world: gentle float-home, never a fail ----
    if (pos.current.y < FALL_LIMIT) {
      pos.current.set(PLAYER_SPAWN.x, sampleGround(PLAYER_SPAWN.x, PLAYER_SPAWN.z).y + 0.5, PLAYER_SPAWN.z);
      vy.current = 0;
    }

    // ---- facing direction ----
    const speed2 = Math.hypot(vel.current.x, vel.current.z);
    if (speed2 > 0.3) {
      const want = Math.atan2(vel.current.x, vel.current.z);
      let diff = want - facing.current;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      facing.current += diff * Math.min(1, dt * 12);
    }

    // ---- write transform + motion for the model ----
    if (group.current) {
      group.current.position.copy(pos.current);
      group.current.rotation.y = facing.current;
    }
    motion.current.speed = Math.min(1, speed2 / SPEED);
    motion.current.airborne = !grounded.current;
    motion.current.vy = vy.current;

    // ---- zone proximity for the "Play!" prompt ----
    let found: ZoneId | null = null;
    let bestD = INTERACT_RADIUS;
    for (const z of ZONE_ISLANDS) {
      const isl = ISLANDS[z];
      const d = Math.hypot(pos.current.x - isl.cx, pos.current.z - isl.cz);
      if (d < bestD) {
        bestD = d;
        found = z;
      }
    }
    if (found !== nearZone.current) {
      nearZone.current = found;
      onProximity(found);
    }

    // ---- camera ----
    followCamera(reduceMotion ? 0.12 : 0.08);
  });

  function followCamera(lerp: number) {
    const desired = pos.current.clone().add(CAM_OFFSET);
    if (!camInit.current) {
      camera.position.copy(desired);
      camInit.current = true;
    } else {
      camera.position.lerp(desired, lerp);
    }
    camera.lookAt(pos.current.x, pos.current.y + 1.4, pos.current.z);
  }

  return (
    <group ref={group}>
      <Belu3D motion={motion} emotion={emotion} growthScale={growthScale} growthStage={growthStage} />
    </group>
  );
});

export default Player;
