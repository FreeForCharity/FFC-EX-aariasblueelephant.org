// MB.Audio — pure WebAudio synthesis, no external files.
// Gentle, kid-friendly sounds (ASD-friendly: nothing harsh, sudden, or loud).
window.MB = window.MB || {};

MB.Audio = (function () {
  'use strict';

  var ctx = null;
  var master = null;
  var tidyTimer = null;
  var bgmTimer = null;

  function makeCtx() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      return new AC();
    } catch (e) {
      return null;
    }
  }

  // init(): create the AudioContext lazily (call from a user gesture) and
  // resume it if the browser started it suspended.
  function init() {
    if (!ctx) {
      ctx = makeCtx();
      if (!ctx) return;
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
      ctx.resume().catch(function () {});
    }
  }

  // Everything below no-ops safely if there is no context yet, or if it
  // hasn't finished (re)starting.
  function ready() {
    return !!(ctx && master && ctx.state === 'running');
  }

  function now() {
    return ctx.currentTime;
  }

  function noiseBuffer(duration) {
    var rate = ctx.sampleRate;
    var length = Math.max(1, Math.floor(rate * duration));
    var buffer = ctx.createBuffer(1, length, rate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  // Short filtered burst of noise (clicks, pops, shutters, whooshes).
  function noiseBurst(opts) {
    opts = opts || {};
    var duration = opts.duration || 0.08;
    var startTime = opts.startTime != null ? opts.startTime : now();
    var attack = opts.attack != null ? opts.attack : 0.002;
    var peak = opts.peak != null ? opts.peak : 0.3;

    var src = ctx.createBufferSource();
    src.buffer = noiseBuffer(duration);

    var filter = ctx.createBiquadFilter();
    filter.type = opts.filterType || 'bandpass';
    filter.Q.value = opts.filterQ != null ? opts.filterQ : 1;
    var f0 = opts.filterFreq || 2000;
    filter.frequency.setValueAtTime(f0, startTime);
    if (opts.filterFreqEnd) {
      filter.frequency.exponentialRampToValueAtTime(Math.max(20, opts.filterFreqEnd), startTime + duration);
    }

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(peak, startTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start(startTime);
    src.stop(startTime + duration + 0.03);
  }

  // Short oscillator note with an attack/decay envelope. Optional freqEnd
  // makes it sweep (used for pops/whooshes).
  function tone(opts) {
    opts = opts || {};
    var startTime = opts.startTime != null ? opts.startTime : now();
    var duration = opts.duration || 0.15;
    var attack = opts.attack != null ? opts.attack : 0.005;
    var peak = opts.peak != null ? opts.peak : 0.2;
    var decayTo = opts.decayTo != null ? opts.decayTo : 0.0001;

    var osc = ctx.createOscillator();
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(opts.freq || 440, startTime);
    if (opts.freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.freqEnd), startTime + duration);
    }

    var gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(peak, startTime + attack);
    gain.gain.exponentialRampToValueAtTime(decayTo, startTime + duration);

    osc.connect(gain);
    gain.connect(master);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.03);
  }

  // ---- sound effects ----------------------------------------------------

  // snap(): THE hero sound — a satisfying magnetic click. Layers a short
  // filtered noise burst (the "click"), a low sine thump (the "clunk" of
  // magnets grabbing), and a tiny bright ping (the sparkle of success).
  function snap() {
    if (!ready()) return;
    var t = now();
    noiseBurst({ startTime: t, duration: 0.045, filterType: 'bandpass', filterFreq: 2600, filterQ: 1.3, peak: 0.35, attack: 0.001 });
    tone({ startTime: t, duration: 0.13, type: 'sine', freq: 90, freqEnd: 60, peak: 0.5, attack: 0.002, decayTo: 0.0001 });
    tone({ startTime: t + 0.006, duration: 0.07, type: 'sine', freq: 1900, peak: 0.13, attack: 0.001, decayTo: 0.0001 });
  }

  // pop(): a block detaching — quick upward pitch blip + tiny puff of noise.
  function pop() {
    if (!ready()) return;
    var t = now();
    tone({ startTime: t, duration: 0.09, type: 'sine', freq: 320, freqEnd: 700, peak: 0.28, attack: 0.001, decayTo: 0.0001 });
    noiseBurst({ startTime: t, duration: 0.03, filterType: 'highpass', filterFreq: 2500, peak: 0.14, attack: 0.001 });
  }

  // pick(): soft blip when picking up a block.
  function pick() {
    if (!ready()) return;
    tone({ duration: 0.08, type: 'triangle', freq: 620, freqEnd: 820, peak: 0.16, attack: 0.004, decayTo: 0.0001 });
  }

  // whoosh(): a block flying through the air — filtered noise sweep.
  function whoosh() {
    if (!ready()) return;
    var t = now();
    var duration = 0.35;
    noiseBurst({
      startTime: t, duration: duration, filterType: 'bandpass',
      filterFreq: 350, filterFreqEnd: 2200, filterQ: 0.7, peak: 0.2, attack: 0.05
    });
  }

  // sparkle(): magic twinkle — quick ascending pentatonic arpeggio.
  function sparkle() {
    if (!ready()) return;
    var t = now();
    var notes = [1046.5, 1174.66, 1318.51, 1567.98, 1760.0]; // C6 D6 E6 G6 A6
    for (var i = 0; i < notes.length; i++) {
      tone({ startTime: t + i * 0.06, duration: 0.18, type: 'sine', freq: notes[i], peak: 0.12, attack: 0.004, decayTo: 0.0001 });
    }
  }

  // fanfare(): short happy build-complete tune — rising melody + final chord.
  function fanfare() {
    if (!ready()) return;
    var t = now();
    var melody = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
    for (var i = 0; i < melody.length; i++) {
      tone({ startTime: t + i * 0.12, duration: 0.2, type: 'triangle', freq: melody[i], peak: 0.22, attack: 0.005, decayTo: 0.0001 });
    }
    var chordTime = t + melody.length * 0.12 + 0.02;
    var chord = [783.99, 1046.5, 1318.51]; // G5 C6 E6
    for (var j = 0; j < chord.length; j++) {
      tone({ startTime: chordTime, duration: 0.45, type: 'sine', freq: chord[j], peak: 0.14, attack: 0.01, decayTo: 0.0001 });
    }
  }

  // camera(): gentle photo shutter — two tiny high clicks.
  function camera() {
    if (!ready()) return;
    var t = now();
    noiseBurst({ startTime: t, duration: 0.02, filterType: 'highpass', filterFreq: 4000, peak: 0.22, attack: 0.001 });
    noiseBurst({ startTime: t + 0.05, duration: 0.015, filterType: 'highpass', filterFreq: 6000, peak: 0.16, attack: 0.001 });
  }

  // no(): a gentle, friendly "uh-uh" — two soft descending notes, never harsh.
  function no() {
    if (!ready()) return;
    var t = now();
    tone({ startTime: t, duration: 0.16, type: 'sine', freq: 330, peak: 0.18, attack: 0.015, decayTo: 0.02 });
    tone({ startTime: t + 0.19, duration: 0.24, type: 'sine', freq: 262, peak: 0.16, attack: 0.015, decayTo: 0.0001 });
  }

  // ---- loops --------------------------------------------------------------

  // tidy(on): cheerful tidy-up jingle loop (soft pentatonic melody) while
  // cleaning up. Calling tidy(true) twice never double-layers; tidy(false)
  // always cleans up the timer.
  var TIDY_NOTES = [523.25, 587.33, 659.25, 783.99, 880.0]; // C D E G A pentatonic
  var tidyStep = 0;

  function tidy(on) {
    if (on) {
      if (!ready()) return;
      if (tidyTimer) return; // already looping — don't stack another interval
      tidyStep = 0;
      var playStep = function () {
        if (!ready()) return;
        var note = TIDY_NOTES[tidyStep % TIDY_NOTES.length];
        tone({ duration: 0.18, type: 'triangle', freq: note, peak: 0.12, attack: 0.005, decayTo: 0.0001 });
        tidyStep++;
      };
      playStep();
      tidyTimer = setInterval(playStep, 260);
    } else if (tidyTimer) {
      clearInterval(tidyTimer);
      tidyTimer = null;
    }
  }

  // bgm(on): very soft ambient music-box loop — slow, quiet, pentatonic
  // random-walk notes with a faint bell overtone. Calling bgm(true) twice
  // never double-layers; bgm(false) always cleans up the timer.
  var BGM_SCALE = [523.25, 587.33, 659.25, 783.99, 880.0, 987.77, 1046.5]; // pentatonic, one octave

  function bgm(on) {
    if (on) {
      if (!ready()) return;
      if (bgmTimer) return; // already playing — don't stack another interval
      var playNote = function () {
        if (!ready()) return;
        var t = now();
        var freq = BGM_SCALE[Math.floor(Math.random() * BGM_SCALE.length)];
        tone({ startTime: t, duration: 1.1, type: 'sine', freq: freq, peak: 0.05, attack: 0.02, decayTo: 0.0001 });
        tone({ startTime: t, duration: 0.5, type: 'sine', freq: freq * 2, peak: 0.015, attack: 0.005, decayTo: 0.0001 });
      };
      playNote();
      bgmTimer = setInterval(playNote, 1400);
    } else if (bgmTimer) {
      clearInterval(bgmTimer);
      bgmTimer = null;
    }
  }

  return {
    init: init,
    snap: snap,
    pop: pop,
    pick: pick,
    whoosh: whoosh,
    sparkle: sparkle,
    fanfare: fanfare,
    camera: camera,
    no: no,
    tidy: tidy,
    bgm: bgm
  };
})();
