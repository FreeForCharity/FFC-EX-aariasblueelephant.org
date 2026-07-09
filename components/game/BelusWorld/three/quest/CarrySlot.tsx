// ---------------------------------------------------------------------------
// A glowing pad in the world Nilu walks onto to deliver (or step through) a
// round. Two faces, same component:
//   • numbered mode  — a big numeral (1/2/3…) for carry-in-order slots and
//                       stepping-stone paths.
//   • sign mode      — a big emoji + caption card for sort-round tables/bins.
// Reuses makeLabelTexture from emojiTexture.ts for sign mode; numeral mode
// paints its own tiny canvas texture locally (no shared-file edits needed).
// ---------------------------------------------------------------------------

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { makeLabelTexture } from './emojiTexture';
import { queueWalkTo } from '../input';

export type SlotStatus = 'idle' | 'next' | 'filled' | 'wrong';

interface Props {
  position: [number, number, number];
  status: SlotStatus;
  color: string;
  reduceMotion: boolean;
  /** numbered mode */
  number?: number;
  /** numbered mode: override the plain numeral with a short caption */
  label?: string;
  /** sign mode: a table/bin shows an emoji + caption instead of a number */
  emoji?: string;
  caption?: string;
}

const numberTexCache = new Map<string, THREE.CanvasTexture>();

/** A big bold numeral (or short word) painted on its own canvas — local to
 *  this file so we never need to touch the shared emojiTexture.ts. */
function makeNumberTexture(text: string): THREE.CanvasTexture {
  const hit = numberTexCache.get(text);
  if (hit) return hit;
  const W = 256;
  const H = 256;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  const big = text.length <= 2;
  ctx.font = `900 ${big ? 150 : 56}px Inter, system-ui, sans-serif`;
  ctx.lineWidth = 16;
  ctx.strokeStyle = 'rgba(20,20,32,0.85)';
  ctx.strokeText(text, W / 2, H / 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, W / 2, H / 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  numberTexCache.set(text, tex);
  return tex;
}

export default function CarrySlot({
  position, status, color, reduceMotion, number, label, emoji, caption,
}: Props) {
  const grp = useRef<THREE.Group>(null);
  const t = useRef((number ?? 0) * 0.6);
  const isSign = !!emoji;
  const numTex = useMemo(() => makeNumberTexture(label ?? String(number ?? '')), [label, number]);
  const signTex = useMemo(
    () => (isSign ? makeLabelTexture(emoji!, caption, true, color) : null),
    [isSign, emoji, caption, color],
  );

  useFrame((_, dt) => {
    t.current += dt;
    const g = grp.current;
    if (!g) return;
    let x = position[0];
    let scale = 1;
    if (status === 'wrong') {
      if (!reduceMotion) x += Math.sin(t.current * 40) * 0.12;
      scale = 0.98;
    } else if (status === 'next') {
      scale = reduceMotion ? 1.06 : 1 + Math.sin(t.current * 2.2) * 0.07;
    } else if (status === 'filled') {
      scale = 1.05;
    }
    g.position.x = x;
    g.scale.setScalar(scale);
  });

  const glow =
    status === 'filled' ? '#ffe066' : status === 'wrong' ? '#ff8a80' : status === 'next' ? color : color;
  const padOpacity = status === 'idle' ? 0.55 : 0.9;
  const emissive = status === 'idle' ? 0.4 : status === 'wrong' ? 1.3 : 1.1;

  return (
    <group ref={grp} position={position}>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={(e) => {
          e.stopPropagation();
          // a tap walks Nilu to the pad/table precisely — the delivery itself
          // still only happens via the normal walk-in proximity check
          queueWalkTo(position[0], position[2]);
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <cylinderGeometry args={[isSign ? 0.85 : 0.62, isSign ? 0.95 : 0.7, 0.14, 24]} />
        <meshStandardMaterial
          color={glow}
          emissive={glow}
          emissiveIntensity={emissive}
          roughness={0.35}
          transparent
          opacity={padOpacity}
        />
      </mesh>
      <sprite position={[0, isSign ? 1.0 : 0.5, 0]} scale={isSign ? [1.7, 1.7, 1] : [1.1, 1.1, 1]} renderOrder={9}>
        <spriteMaterial map={isSign ? signTex! : numTex} transparent depthWrite={false} depthTest={false} />
      </sprite>
      {status === 'filled' && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
          <ringGeometry args={[isSign ? 1.0 : 0.72, isSign ? 1.15 : 0.86, 28]} />
          <meshBasicMaterial color="#ffe066" transparent opacity={0.55} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}
