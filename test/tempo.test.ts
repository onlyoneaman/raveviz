import { describe, expect, test } from 'bun:test'
import { TempoTracker, estimatePeriod, foldPeriod } from '../src/audio/tempo'
import { StructureTracker } from '../src/audio/structure'
import { BAND_COUNT, SUB, tempo as cfg } from '../src/config'

const BPM = 145
const BEAT = 60 / BPM

describe('foldPeriod', () => {
  test('leaves an in-range interval alone', () => {
    expect(foldPeriod(BEAT)).toBeCloseTo(BEAT, 6)
  })

  // A missed kick reads as a double interval and a ghost onset as a half one.
  // Both must still vote for the same tempo.
  test('folds a missed beat back to the true period', () => {
    expect(foldPeriod(BEAT * 2)).toBeCloseTo(BEAT, 6)
  })

  test('folds a doubled onset back to the true period', () => {
    expect(foldPeriod(BEAT / 2)).toBeCloseTo(BEAT, 6)
  })

  test('rejects a non-positive interval', () => {
    expect(foldPeriod(0)).toBe(0)
  })
})

describe('estimatePeriod', () => {
  test('ignores outliers in favour of the largest agreeing cluster', () => {
    const { period, agree } = estimatePeriod([0.41, 0.414, 0.418, 0.412, 0.9, 0.33])
    expect(period).toBeCloseTo(0.4135, 2)
    expect(agree).toBe(4)
  })
})

describe('TempoTracker', () => {
  /** 60fps clock with a kick every beat, optionally jittered. */
  function drive(seconds: number, jitter = 0) {
    const t = new TempoTracker()
    const dt = 1 / 60
    let next = BEAT
    const phaseAtKick: number[] = []

    for (let i = 0; i * dt < seconds; i++) {
      const now = i * dt
      if (now >= next) {
        phaseAtKick.push(t.phase)
        t.onKick(now)
        next += BEAT + (Math.random() - 0.5) * 2 * jitter
      }
      t.update(dt, 120)
    }
    return { t, phaseAtKick }
  }

  test('locks onto 145 bpm', () => {
    const { t } = drive(20)
    expect(t.bpm).toBeGreaterThan(BPM - 2)
    expect(t.bpm).toBeLessThan(BPM + 2)
  })

  test('survives timing jitter', () => {
    const { t } = drive(20, 0.012)
    expect(Math.abs(t.bpm - BPM)).toBeLessThan(4)
  })

  test('phase converges so kicks land on the beat', () => {
    const { phaseAtKick } = drive(30)
    const late = phaseAtKick.slice(-12)
    for (const p of late) {
      const distance = Math.min(p, 1 - p)
      expect(distance).toBeLessThan(0.12)
    }
  })

  test('advances bar and phrase counters at the right ratio', () => {
    const { t } = drive(60)
    expect(t.bar).toBe(Math.floor(t.beat / 4))
    expect(t.phrase).toBe(Math.floor(t.beat / cfg.beatsPerPhrase))
  })

  test('free-runs on the fallback tempo before any onset arrives', () => {
    const t = new TempoTracker()
    for (let i = 0; i < 120; i++) t.update(1 / 60, 120)
    // Two seconds at 120bpm is four beats, give or take one accumulation step.
    expect(t.beat).toBeGreaterThanOrEqual(3)
    expect(t.beat).toBeLessThanOrEqual(4)
    expect(t.bpm).toBe(0)
  })
})

describe('StructureTracker', () => {
  const norm = new Float32Array(BAND_COUNT)
  const dt = 1 / 60

  function feed(s: StructureTracker, t0: number, seconds: number, shape: (u: number) => {
    sub: number
    centroid: number
    rms: number
  }) {
    const steps = Math.round(seconds / dt)
    for (let i = 0; i < steps; i++) {
      const { sub, centroid, rms } = shape(i / steps)
      norm.fill(0.3)
      norm[SUB] = sub
      s.update(norm, centroid, rms, dt, t0 + i * dt)
    }
    return t0 + seconds
  }

  test('a riser raises build: brighter and louder while the bass leaves', () => {
    const s = new StructureTracker()
    let t = feed(s, 0, 4, () => ({ sub: 0.7, centroid: 900, rms: 0.05 }))
    feed(s, t, 4, (u) => ({ sub: 0.7 - 0.6 * u, centroid: 900 + 2600 * u, rms: 0.05 + 0.09 * u }))
    expect(s.build).toBeGreaterThan(0.4)
  })

  // The discriminator. A rolling track that simply gets louder is not a build.
  test('louder alone does not count as a build', () => {
    const s = new StructureTracker()
    let t = feed(s, 0, 4, () => ({ sub: 0.7, centroid: 1200, rms: 0.05 }))
    feed(s, t, 4, (u) => ({ sub: 0.7 + 0.2 * u, centroid: 1200, rms: 0.05 + 0.09 * u }))
    expect(s.build).toBeLessThan(0.15)
  })

  test('the bass slamming back in after a riser fires a drop', () => {
    const s = new StructureTracker()
    let t = feed(s, 0, 3, () => ({ sub: 0.7, centroid: 900, rms: 0.05 }))
    t = feed(s, t, 4, (u) => ({ sub: 0.7 - 0.65 * u, centroid: 900 + 2600 * u, rms: 0.05 + 0.09 * u }))
    t = feed(s, t, 1, () => ({ sub: 0.05, centroid: 3600, rms: 0.14 }))
    feed(s, t, 0.2, () => ({ sub: 0.98, centroid: 1500, rms: 0.16 }))
    expect(s.drop).toBeGreaterThan(0.5)
  })

  test('disabling the detector silences both outputs', () => {
    const s = new StructureTracker()
    s.enabled = false
    let t = feed(s, 0, 3, () => ({ sub: 0.7, centroid: 900, rms: 0.05 }))
    t = feed(s, t, 4, (u) => ({ sub: 0.7 - 0.65 * u, centroid: 900 + 2600 * u, rms: 0.05 + 0.09 * u }))
    feed(s, t, 0.2, () => ({ sub: 0.98, centroid: 1500, rms: 0.16 }))
    expect(s.build).toBeLessThan(0.05)
    expect(s.drop).toBe(0)
  })

  test('the manual trigger always fires', () => {
    const s = new StructureTracker()
    s.fire()
    expect(s.drop).toBe(1)
  })
})
