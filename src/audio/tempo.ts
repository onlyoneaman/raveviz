import { tempo as cfg } from '../config'

const MIN_PERIOD = 60 / cfg.maxBpm
const MAX_PERIOD = 60 / cfg.minBpm

/** Folds an interval into the tracked period range by octave, so a missed or
 *  doubled kick still votes for the correct tempo. */
export function foldPeriod(interval: number) {
  let p = interval
  if (p <= 0) return 0
  while (p < MIN_PERIOD) p *= 2
  while (p > MAX_PERIOD) p /= 2
  return p >= MIN_PERIOD ? p : 0
}

/** Largest cluster of mutually-agreeing intervals, and its mean. */
export function estimatePeriod(intervals: number[]) {
  let best = { period: 0, agree: 0 }
  for (const candidate of intervals) {
    let sum = 0
    let agree = 0
    for (const other of intervals) {
      if (Math.abs(other - candidate) / candidate <= cfg.ioiToleranceRatio) {
        sum += other
        agree++
      }
    }
    if (agree > best.agree) best = { period: sum / agree, agree }
  }
  return best
}

/**
 * Tempo from inter-onset intervals, plus a phase-locked loop.
 *
 * BPM alone is not enough. Rotation and pulse need phase or they drift out of
 * alignment within a few bars, so each kick nudges the phase rather than
 * snapping it.
 */
export class TempoTracker {
  private onsetTimes: number[] = []
  private period = 0

  bpm = 0
  phase = 0
  beat = 0
  bar = 0
  phrase = 0
  confidence = 0

  onKick(now: number) {
    this.onsetTimes.push(now)
    if (this.onsetTimes.length > cfg.ioiHistorySize) this.onsetTimes.shift()
    this.reestimate()
    if (this.period > 0) {
      const err = this.phase > 0.5 ? this.phase - 1 : this.phase
      this.phase -= cfg.pllGain * err
      if (this.phase < 0) this.phase += 1
    }
  }

  private reestimate() {
    const intervals: number[] = []
    for (let i = 1; i < this.onsetTimes.length; i++) {
      const p = foldPeriod(this.onsetTimes[i] - this.onsetTimes[i - 1])
      if (p > 0) intervals.push(p)
    }
    if (intervals.length < cfg.minAgreeingIntervals) return

    const { period, agree } = estimatePeriod(intervals)
    if (agree < cfg.minAgreeingIntervals) return

    this.period = period
    this.bpm = 60 / period
    this.confidence = Math.min(1, agree / intervals.length)
  }

  update(dt: number, fallbackBpm: number) {
    const period = this.period > 0 ? this.period : 60 / fallbackBpm
    this.phase += dt / period
    while (this.phase >= 1) {
      this.phase -= 1
      this.beat++
      this.bar = Math.floor(this.beat / 4)
      this.phrase = Math.floor(this.beat / cfg.beatsPerPhrase)
    }
    this.confidence *= Math.pow(0.5, dt / cfg.confidenceHalfLifeS)
  }
}
