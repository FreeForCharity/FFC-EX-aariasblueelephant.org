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
