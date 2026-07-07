/* Aaria's Block Craft 3D — Modern skin library boot (three.js r170, ES modules).
   Loaded ONLY when the 'modern' skin is active. Exposes the r170 namespace on
   window.THREE (same global the classic game code expects) plus the postprocessing
   / geometry addons on window.ABC_MODERN_LIB for the renderer-tuning stage.
   The bare specifier 'three' resolves via the import map in index.html. */
import * as THREE from 'three';
import { EffectComposer } from '../lib/modern/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../lib/modern/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from '../lib/modern/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from '../lib/modern/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from '../lib/modern/jsm/postprocessing/OutputPass.js';
import { GTAOPass } from '../lib/modern/jsm/postprocessing/GTAOPass.js';
import { RoundedBoxGeometry } from '../lib/modern/jsm/geometries/RoundedBoxGeometry.js';

/* Keep r128 color semantics: every hex color in the game (materials, lights,
   fog, sky grading, all entity files) was authored/tuned with hex treated as
   raw linear values. r170's ColorManagement would re-interpret them as sRGB
   (darker/more saturated in linear) and visibly shift the whole palette —
   e.g. the 0x4a4036 horizon base plane turns from white haze to a brown band.
   .enabled only gates Color conversions; sRGB texture decode and the sRGB
   output transfer still apply. A later polish stage may enable this and
   re-author the palette deliberately. */
THREE.ColorManagement.enabled = false;

/* Every animal/pet/shop/sign/avatar in the game builds from MeshLambertMaterial.
   On the modern skin, quietly upgrade that to a matte MeshStandardMaterial so
   entities react to the sun, env light and shadows like the PBR terrain does
   (all Lambert params used in the game — color/map/transparent/opacity/emissive
   — are valid Standard params). Smooth/Classic load r128 and are untouched. */
class LambertAsStandard extends THREE.MeshStandardMaterial {
  constructor(params) {
    super(Object.assign({ roughness: 0.9, metalness: 0 }, params));
  }
}
// the ESM namespace is frozen — publish a mutable copy with the shim applied
const T = Object.assign({}, THREE);
T.MeshLambertMaterial = LambertAsStandard;
T.ABC_REAL_LAMBERT = THREE.MeshLambertMaterial;   // escape hatch for a later stage

window.THREE = T;
window.ABC_MODERN_LIB = {
  EffectComposer,
  RenderPass,
  ShaderPass,
  UnrealBloomPass,
  OutputPass,
  GTAOPass,
  RoundedBoxGeometry,
};
