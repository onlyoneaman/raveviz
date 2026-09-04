import { BAND_COUNT, audio } from '../config'
import { BandSplitter, coeff } from './analyser'

/**
 * Per-band spectral flux with a median-based adaptive threshold.
 *
 * The threshold uses a median rather than a mean because a mean is dragged
 * upward by the onsets themselves, which makes the detector go deaf exactly
 * during the dense passages where it matters most.
 */
export class OnsetDetector {
  private readonly splitter: BandSplitter
  private readonly prevMag: Float32Array
  private readonly history: Float32Array[]
  private readonly scratch: Float32Array
  private readonly lastFireAt = new Float32Array(BAND_COUNT)
  private readonly prevFlux = new Float32Array(BAND_COUNT)
  private cursor = 0
  private filled = 0

  readonly flux = new Float32Array(BAND_COUNT)
  readonly impulse = new Float32Array(BAND_COUNT)
  events = 0

  constructor(sampleRate: number, fftSize: number) {
    this.splitter = new BandSplitter(sampleRate, fftSize)
    this.prevMag = new Float32Array(fftSize / 2)
    this.history = Array.from({ length: BAND_COUNT }, () => new Float32Array(audio.fluxWindow))
    this.scratch = new Float32Array(audio.fluxWindow)
    this.lastFireAt.fill(-Infinity)
  }

  process(mag: Float32Array, dt: number, now: number) {
    this.events = 0
    const decay = 1 - coeff(audio.impulseDecayMs, dt)

    for (let b = 0; b < BAND_COUNT; b++) {
      let f = 0
      for (let i = this.splitter.lo[b]; i < this.splitter.hi[b]; i++) {
        const d = mag[i] - this.prevMag[i]
        if (d > 0) f += d
      }
      f /= this.splitter.hi[b] - this.splitter.lo[b]
      this.flux[b] = f

      const threshold = this.median(b) * audio.fluxThresholdMul + audio.fluxThresholdAdd
      const rising = f > this.prevFlux[b]
      const past = now - this.lastFireAt[b] > audio.refractoryMs[b] / 1000

      if (this.filled >= audio.fluxWindow && f > threshold && rising && past) {
        this.lastFireAt[b] = now
        this.events |= 1 << b
        this.impulse[b] = 1
      } else {
        this.impulse[b] *= decay
      }

      this.history[b][this.cursor] = f
      this.prevFlux[b] = f
    }

    this.prevMag.set(mag)
    this.cursor = (this.cursor + 1) % audio.fluxWindow
    this.filled = Math.min(this.filled + 1, audio.fluxWindow)
  }

  private median(band: number) {
    const n = this.filled
    if (n === 0) return 0
    this.scratch.set(this.history[band])
    const view = this.scratch.subarray(0, n)
    view.sort()
    return view[n >> 1]
  }
}
