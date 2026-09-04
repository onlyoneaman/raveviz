export const BAND_EDGES_HZ = [20, 60, 150, 800, 3000, 16000]
export const BAND_COUNT = BAND_EDGES_HZ.length - 1

export const BAND_NAMES = ['sub', 'bass', 'low', 'mid', 'air']

export const SUB = 0
export const BASS = 1
export const LOMID = 2
export const MID = 3
export const AIR = 4

export const WAVE_SIZE = 1024
export const SPECTRUM_SIZE = 2048

export const audio = {
  fftBands: 4096,
  fftOnset: 1024,

  attackMs: [8, 10, 14, 18, 22],
  releaseMs: [70, 85, 100, 115, 140],

  peakDecayS: 2.0,
  floorRiseS: 4.0,
  // Guards against a divide by zero only. Anything larger is another absolute
  // FFT-magnitude constant, and it silently killed mid and air at low volume.
  normFloorGate: 1e-7,
  // Audibility is judged on time-domain RMS, which is a real 0..1 amplitude.
  // Judging it on FFT magnitudes needs a different constant per band (the air
  // band spreads its energy over ~300 bins, the sub over ~2), so a single
  // threshold there silently gated the upper bands off at every volume.
  quietRms: 0.003,
  loudRms: 0.025,

  fluxWindow: 43,
  fluxThresholdMul: 3.0,
  // Relative to each band's own recent peak flux. A fixed additive term cannot
  // work here: the air band spreads its energy over ~300 bins and the sub over
  // ~2, so one constant is either deaf up top or trigger-happy down low.
  // Detection of real onsets is flat across a wide range of these two, so they
  // are set where false positives vanish rather than where detection peaks.
  // Sub stays noisy at ~10% regardless: it is one bin at the onset FFT size.
  // Nothing consumes sub onsets (tempo uses bass, the shaders use bass/mid/air).
  fluxThresholdRatio: 0.5,
  fluxThresholdFloor: 1e-6,
  fluxPeakDecayS: 2.0,
  refractoryMs: [90, 60, 50, 45, 40],
  impulseDecayMs: 125,

  silenceLevel: 0.0015,
  silenceHoldS: 3,
  idleBpm: 145,
  idleDepth: 0.05,
}

export const tempo = {
  minBpm: 118,
  maxBpm: 180,
  ioiHistorySize: 48,
  ioiToleranceRatio: 0.06,
  pllGain: 0.12,
  confidenceHalfLifeS: 6,
  minAgreeingIntervals: 6,
  beatsPerPhrase: 64,
}

export const structure = {
  centroidRiseWindowS: 2.0,
  buildAttackS: 1.2,
  buildReleaseS: 2.5,
  dropLookbackS: 8,
  dropSubRatio: 0.85,
  dropDecayMs: 900,
}

export const visual = {
  // With no audio the scenes still animated on wall-clock time and rendered at
  // 30-50% brightness, so silence looked identical to music. Motion and
  // brightness are now driven by the signal itself.
  idleTimeScale: 0.03,
  idleDim: 0.35,
  // Below `energyKnee` the clock is idle-slow; above `energyFull` it runs at
  // full speed. A linear ramp left the scenes visibly drifting on silence.
  energyKnee: 0.1,
  energyFull: 0.55,
  // How hard a kick punches the whole frame, on top of whatever a scene does.
  kickZoom: 0.05,
  kickFlash: 0.4,
  energyAttackMs: 60,
  energyReleaseMs: 400,
}

export const render = {
  resScaleDefault: 1.0,
  resScaleMin: 0.5,
  governorSlowMs: 20,
  governorFastMs: 10,
  governorSlowHoldS: 1,
  governorFastHoldS: 3,
  governorStep: 0.1,
}

export const camera = {
  /** Crossfade length, drawn fresh per transition so cuts do not feel metronomic. */
  blendMinS: 0.7,
  blendMaxS: 2.4,
  /** Per-phrase spin rate is drawn from this range, sign included. */
  spinMin: 0.02,
  spinMax: 0.20,
  /** Zoom drifts in or out between these, so motion is not always a push-in. */
  zoomMin: 0.72,
  zoomMax: 1.45,
  zoomRateS: 26,
  /** Extra spin and zoom the kick adds on top. */
  kickSpin: 0.05,
  kickZoom: 0.10,
}

export const show = {
  // Changes used to land on the 64-beat phrase, about 26s at 145bpm, which is
  // an age. Drawn fresh each time so the set does not feel scheduled.
  beatsPerSceneMin: 12,
  beatsPerSceneMax: 40,
  autoCycle: true,
  hudIdleMs: 3000,
}
