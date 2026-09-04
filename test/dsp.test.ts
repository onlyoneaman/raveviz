import { describe, expect, test } from 'bun:test'
import { AdaptiveNorm, BandSplitter, Envelopes, coeff, spectralFlatness } from '../src/audio/analyser'
import { OnsetDetector } from '../src/audio/onset'
import { BAND_COUNT, BASS, SUB, audio } from '../src/config'

const SR = 48000
const FFT = 4096

function spectrum(size: number, fill: (hz: number) => number) {
  const mag = new Float32Array(size / 2)
  for (let i = 0; i < mag.length; i++) mag[i] = fill((i * SR) / size)
  return mag
}

describe('BandSplitter', () => {
  test('places energy in the band that contains it', () => {
    const out = new Float32Array(BAND_COUNT)
    new BandSplitter(SR, FFT).split(
      spectrum(FFT, (hz) => (hz > 40 && hz < 55 ? 1 : 0)),
      out,
    )
    expect(out[SUB]).toBeGreaterThan(0)
    for (let b = 1; b < BAND_COUNT; b++) expect(out[b]).toBe(0)
  })

  test('bands are contiguous and ascending', () => {
    const s = new BandSplitter(SR, FFT)
    for (let b = 1; b < BAND_COUNT; b++) {
      expect(s.lo[b]).toBeGreaterThanOrEqual(s.lo[b - 1])
      expect(s.hi[b]).toBeGreaterThan(s.lo[b])
    }
  })
})

describe('Envelopes', () => {
  test('coefficient matches the analytic one-pole', () => {
    expect(coeff(100, 0.1)).toBeCloseTo(1 - Math.exp(-1), 6)
  })

  test('settles to the same value at 30fps and 60fps', () => {
    const input = new Float32Array(BAND_COUNT).fill(1)
    const run = (dt: number, steps: number) => {
      const env = new Envelopes()
      const out = new Float32Array(BAND_COUNT)
      for (let i = 0; i < steps; i++) env.process(input, dt, out)
      return out[BASS]
    }
    expect(run(1 / 60, 120)).toBeCloseTo(run(1 / 30, 60), 4)
  })

  test('attacks faster than it releases', () => {
    const env = new Envelopes()
    const out = new Float32Array(BAND_COUNT)
    const hot = new Float32Array(BAND_COUNT).fill(1)
    const cold = new Float32Array(BAND_COUNT)

    env.process(hot, 1 / 60, out)
    const afterOneAttack = out[BASS]
    for (let i = 0; i < 200; i++) env.process(hot, 1 / 60, out)
    env.process(cold, 1 / 60, out)
    const droppedBy = 1 - out[BASS]

    expect(afterOneAttack).toBeGreaterThan(droppedBy)
  })
})

describe('AdaptiveNorm', () => {
  // The whole point: identical response from a quiet laptop speaker and a hot
  // line input, four orders of magnitude apart.
  test.each([1e-3, 1e-2, 1e-1, 1])('reaches full scale at amplitude %p', (amp: number) => {
    const norm = new AdaptiveNorm()
    const input = new Float32Array(BAND_COUNT)
    const out = new Float32Array(BAND_COUNT)
    let peak = 0

    for (let i = 0; i < 600; i++) {
      input.fill(amp * (0.5 + 0.5 * Math.sin(i * 0.25)))
      norm.process(input, 1 / 60, out)
      if (i > 200) peak = Math.max(peak, out[BASS])
    }
    expect(peak).toBeGreaterThan(0.9)
  })

  test('stays in range and reports nothing on silence', () => {
    const norm = new AdaptiveNorm()
    const out = new Float32Array(BAND_COUNT)
    for (let i = 0; i < 300; i++) norm.process(new Float32Array(BAND_COUNT), 1 / 60, out)
    for (const v of out) expect(v).toBe(0)
  })
})

describe('spectralFlatness', () => {
  test('separates a tone from noise', () => {
    const tone = spectrum(1024, (hz) => (hz > 430 && hz < 470 ? 1 : 1e-6))
    const noise = spectrum(1024, () => 0.5)
    expect(spectralFlatness(tone)).toBeLessThan(spectralFlatness(noise))
    expect(spectralFlatness(noise)).toBeGreaterThan(0.9)
  })
})

describe('OnsetDetector', () => {
  const FFT_ON = 1024
  const bins = FFT_ON / 2

  /** Steady bass floor, with a wideband spike every `period` frames. */
  function run(periodFrames: number, frames: number, spikeGain: number, floor: 'modulated' | 'random' | 'flat' = 'modulated') {
    const det = new OnsetDetector(SR, FFT_ON)
    const mag = new Float32Array(bins)
    const dt = 1 / 60
    const fired = [0, 0, 0, 0, 0]
    const at: number[] = []

    for (let i = 0; i < frames; i++) {
      const spike = periodFrames > 0 && i % periodFrames === 0 && i > 0
      for (let k = 0; k < bins; k++) {
        const hz = (k * SR) / FFT_ON
        const inBass = hz > 60 && hz < 150
        mag[k] =
          floor === 'flat' ? 0.02
          : floor === 'random' ? 0.02 * Math.random()
          : 0.02 * (0.5 + 0.5 * Math.sin(k * 0.7 + i))
        if (spike && inBass) mag[k] += spikeGain
      }
      det.process(mag, dt, i * dt)
      for (let b = 0; b < BAND_COUNT; b++) if (det.events & (1 << b)) fired[b]++
      if (det.events & (1 << BASS)) at.push(i)
    }
    return { fired: fired[BASS], perBand: fired, at }
  }

  test('fires once per impulse and not between them', () => {
    const period = 25
    const frames = 400
    const { fired } = run(period, frames, 1.5)
    const expected = Math.floor((frames - audio.fluxWindow) / period)
    expect(fired).toBeGreaterThanOrEqual(expected - 1)
    expect(fired).toBeLessThanOrEqual(expected + 1)
  })

  test('never fires on a spectrum that is not changing', () => {
    expect(run(0, 400, 0, 'flat').fired).toBe(0)
  })

  // Sub is excluded deliberately: it is a single bin at the onset FFT size, so
  // its flux is dominated by noise. Nothing downstream consumes sub onsets.
  test('does not fire on stationary random noise', () => {
    const { perBand } = run(0, 900, 0, 'random')
    for (const band of [BASS, 2, 3, 4]) expect(perBand[band] / 900).toBeLessThan(0.02)
  })

  test('stays quiet during the warm-up window', () => {
    const { at } = run(10, 200, 1.5)
    for (const frame of at) expect(frame).toBeGreaterThanOrEqual(audio.fluxWindow)
  })

  test('impulse decays between hits rather than latching', () => {
    const det = new OnsetDetector(SR, 1024)
    const mag = new Float32Array(bins).fill(0.01)
    for (let i = 0; i < 60; i++) det.process(mag, 1 / 60, i / 60)
    const before = det.impulse[BASS]
    for (let i = 0; i < 30; i++) det.process(mag, 1 / 60, (60 + i) / 60)
    expect(det.impulse[BASS]).toBeLessThanOrEqual(before)
  })
})
