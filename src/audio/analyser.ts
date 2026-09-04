import { BAND_COUNT, BAND_EDGES_HZ, audio } from '../config'

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

/** Frame-rate independent one-pole coefficient for a time constant in ms. */
export const coeff = (tauMs: number, dt: number) =>
  tauMs <= 0 ? 1 : 1 - Math.exp(-dt / (tauMs / 1000))

/** Maps FFT bins onto the log-spaced band edges once, at construction. */
export class BandSplitter {
  readonly lo: Int32Array
  readonly hi: Int32Array

  constructor(sampleRate: number, fftSize: number) {
    const bins = fftSize / 2
    const hzPerBin = sampleRate / fftSize
    this.lo = new Int32Array(BAND_COUNT)
    this.hi = new Int32Array(BAND_COUNT)
    for (let b = 0; b < BAND_COUNT; b++) {
      const lo = Math.floor(BAND_EDGES_HZ[b] / hzPerBin)
      const hi = Math.ceil(BAND_EDGES_HZ[b + 1] / hzPerBin)
      this.lo[b] = Math.max(1, Math.min(lo, bins - 1))
      this.hi[b] = Math.max(this.lo[b] + 1, Math.min(hi, bins))
    }
  }

  /** RMS magnitude within each band. `mag` is linear, not dB. */
  split(mag: Float32Array, out: Float32Array): Float32Array {
    for (let b = 0; b < BAND_COUNT; b++) {
      let sum = 0
      const lo = this.lo[b]
      const hi = this.hi[b]
      for (let i = lo; i < hi; i++) sum += mag[i] * mag[i]
      out[b] = Math.sqrt(sum / (hi - lo))
    }
    return out
  }
}

/** Fast attack, slow release, per band. */
export class Envelopes {
  private readonly state = new Float32Array(BAND_COUNT)

  process(input: Float32Array, dt: number, out: Float32Array): Float32Array {
    for (let b = 0; b < BAND_COUNT; b++) {
      const rising = input[b] > this.state[b]
      const tau = rising ? audio.attackMs[b] : audio.releaseMs[b]
      this.state[b] += (input[b] - this.state[b]) * coeff(tau, dt)
      out[b] = this.state[b]
    }
    return out
  }
}

/**
 * Rescales each band to 0..1 against its own recent dynamic range, so the
 * visuals respond identically to a quiet laptop speaker and a hot line input.
 * The peak decays slowly; the floor drops instantly and recovers slowly.
 */
export class AdaptiveNorm {
  private readonly peak = new Float32Array(BAND_COUNT)
  private readonly floor = new Float32Array(BAND_COUNT)

  process(input: Float32Array, dt: number, out: Float32Array): Float32Array {
    const peakKeep = Math.exp(-dt / audio.peakDecayS)
    const floorRise = coeff(audio.floorRiseS * 1000, dt)
    for (let b = 0; b < BAND_COUNT; b++) {
      const v = input[b]
      this.peak[b] = Math.max(v, this.peak[b] * peakKeep)
      this.floor[b] = Math.min(v, this.floor[b] + (v - this.floor[b]) * floorRise)
      const span = this.peak[b] - this.floor[b]
      out[b] = span > audio.normFloorGate ? clamp01((v - this.floor[b]) / span) : 0
    }
    return out
  }
}

/** dB spectrum from an AnalyserNode into linear magnitude. */
export function dbToLinear(db: Float32Array, out: Float32Array): Float32Array {
  for (let i = 0; i < db.length; i++) {
    out[i] = db[i] <= -140 ? 0 : Math.pow(10, db[i] / 20)
  }
  return out
}

export function spectralCentroid(mag: Float32Array, sampleRate: number, fftSize: number) {
  let num = 0
  let den = 0
  const hzPerBin = sampleRate / fftSize
  for (let i = 1; i < mag.length; i++) {
    num += i * hzPerBin * mag[i]
    den += mag[i]
  }
  return den > 0 ? num / den : 0
}

/** Geometric mean over arithmetic mean. Near 1 for noise, near 0 for tones. */
export function spectralFlatness(mag: Float32Array) {
  let logSum = 0
  let sum = 0
  let n = 0
  for (let i = 1; i < mag.length; i++) {
    const v = mag[i] + 1e-10
    logSum += Math.log(v)
    sum += v
    n++
  }
  if (n === 0 || sum === 0) return 0
  return Math.exp(logSum / n) / (sum / n)
}

/** True signal amplitude, 0..1, from byte time-domain samples (128 = zero). */
export function waveRms(wave: Uint8Array) {
  let sum = 0
  for (let i = 0; i < wave.length; i++) {
    const x = (wave[i] - 128) / 128
    sum += x * x
  }
  return Math.sqrt(sum / Math.max(1, wave.length))
}

/**
 * How much of the signal to let through, 0..1. This is what stops the
 * normalizer amplifying room noise to full scale when the music stops.
 */
export function audibility(level: number) {
  return clamp01((level - audio.quietRms) / (audio.loudRms - audio.quietRms))
}

export function rms(mag: Float32Array) {
  let sum = 0
  for (let i = 1; i < mag.length; i++) sum += mag[i] * mag[i]
  return Math.sqrt(sum / Math.max(1, mag.length - 1))
}
