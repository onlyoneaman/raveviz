import { render as cfg } from '../config'

/**
 * Holds 60fps on whatever display is attached by trading internal resolution,
 * so scenes never need per-machine tuning.
 */
export class ResolutionGovernor {
  private average = 16
  private slowFor = 0
  private fastFor = 0

  scale = cfg.resScaleDefault

  update(frameMs: number, dt: number, sceneMax: number) {
    this.average += (frameMs - this.average) * 0.1

    this.slowFor = this.average > cfg.governorSlowMs ? this.slowFor + dt : 0
    this.fastFor = this.average < cfg.governorFastMs ? this.fastFor + dt : 0

    if (this.slowFor > cfg.governorSlowHoldS) {
      this.scale = Math.max(cfg.resScaleMin, this.scale - cfg.governorStep)
      this.slowFor = 0
    } else if (this.fastFor > cfg.governorFastHoldS && this.scale < sceneMax) {
      this.scale = Math.min(sceneMax, this.scale + cfg.governorStep)
      this.fastFor = 0
    }
    return Math.min(this.scale, sceneMax)
  }
}
