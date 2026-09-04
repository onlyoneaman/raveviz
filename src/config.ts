export const BAND_EDGES_HZ = [20, 60, 150, 800, 3000, 16000]
export const BAND_COUNT = BAND_EDGES_HZ.length - 1

export const SUB = 0
export const BASS = 1
export const LOMID = 2
export const MID = 3
export const AIR = 4

export const audio = {
  fftBands: 4096,
  fftOnset: 1024,

  attackMs: [8, 10, 14, 18, 22],
  releaseMs: [90, 120, 140, 160, 200],

  peakDecayS: 2.0,
  floorRiseS: 4.0,
  normFloorGate: 1e-4,

  fluxWindow: 43,
  fluxThresholdMul: 1.5,
  fluxThresholdAdd: 0.008,
  refractoryMs: [90, 60, 50, 45, 40],
  impulseDecayMs: 160,

  silenceRms: 2e-3,
  silenceHoldS: 3,
  idleBpm: 145,
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
