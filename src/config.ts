export const BAND_EDGES_HZ = [20, 60, 150, 800, 3000, 16000]
export const BAND_COUNT = BAND_EDGES_HZ.length - 1

export const SUB = 0
export const BASS = 1
export const LOMID = 2
export const MID = 3
export const AIR = 4

export const WAVE_SIZE = 1024

export const audio = {
  fftBands: 4096,
  fftOnset: 1024,

  attackMs: [8, 10, 14, 18, 22],
  releaseMs: [90, 120, 140, 160, 200],

  peakDecayS: 2.0,
  floorRiseS: 4.0,
  normFloorGate: 1e-4,
  // Absolute audibility floor. Without it the normalizer happily amplifies room
  // noise to full scale the moment the music stops, and the visuals keep raging.
  normQuietPeak: 6e-4,
  normLoudPeak: 4e-3,

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
  impulseDecayMs: 160,

  silenceRms: 2e-3,
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

export const show = {
  phrasesPerScene: 1,
  autoCycle: true,
  hudIdleMs: 3000,
}
