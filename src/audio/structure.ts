import { SUB, structure as cfg } from '../config'
import { coeff } from './analyser'

class Ema {
  value = 0
  constructor(private readonly tauMs: number) {}
  push(v: number, dt: number) {
    this.value += (v - this.value) * coeff(this.tauMs, dt)
    return this.value
  }
}

/**
 * Build and drop detection.
 *
 * The discriminating condition for a build is that sub-bass is FALLING while
 * brightness and loudness rise. A psy riser pulls the bass out and replaces it
 * with a snare roll and a climbing synth, so "getting louder" on its own fires
 * constantly on a rolling track.
 */
export class StructureTracker {
  private readonly centroidFast = new Ema(300)
  private readonly centroidSlow = new Ema(cfg.centroidRiseWindowS * 1000)
  private readonly rmsFast = new Ema(400)
  private readonly rmsSlow = new Ema(cfg.centroidRiseWindowS * 1000)
  private readonly subFast = new Ema(250)
  private readonly subSlow = new Ema(1500)

  private subLowFor = 0
  private lastBuildAt = -Infinity

  build = 0
  drop = 0
  enabled = true

  update(norm: Float32Array, centroid: number, rmsValue: number, dt: number, now: number) {
    const cf = this.centroidFast.push(centroid, dt)
    const cs = this.centroidSlow.push(centroid, dt)
    const rf = this.rmsFast.push(rmsValue, dt)
    const rs = this.rmsSlow.push(rmsValue, dt)
    const sf = this.subFast.push(norm[SUB], dt)
    const ss = this.subSlow.push(norm[SUB], dt)

    const brightening = cf > cs * 1.08
    const louder = rf > rs * 1.05
    const bassLeaving = sf < ss * 0.8

    const building = this.enabled && brightening && louder && bassLeaving
    const tau = building ? cfg.buildAttackS : cfg.buildReleaseS
    this.build += ((building ? 1 : 0) - this.build) * coeff(tau * 1000, dt)
    if (building) this.lastBuildAt = now

    const wasLowFor = this.subLowFor
    this.subLowFor = norm[SUB] < 0.2 ? this.subLowFor + dt : 0
    const recentBuild = now - this.lastBuildAt < cfg.dropLookbackS
    const slammed = wasLowFor > 0.3 && norm[SUB] > cfg.dropSubRatio

    this.drop *= 1 - coeff(cfg.dropDecayMs, dt)
    if (this.enabled && recentBuild && slammed && this.drop < 0.2) this.fire()
  }

  fire() {
    this.drop = 1
    this.build = 0
    this.lastBuildAt = -Infinity
  }
}
