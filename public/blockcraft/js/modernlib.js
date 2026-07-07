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

window.THREE = THREE;
window.ABC_MODERN_LIB = {
  EffectComposer,
  RenderPass,
  ShaderPass,
  UnrealBloomPass,
  OutputPass,
  GTAOPass,
  RoundedBoxGeometry,
};
