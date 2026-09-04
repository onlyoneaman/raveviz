import { BAND_COUNT, BASS, audio as cfg, visual } from '../config'
import {
  AdaptiveNorm,
  coeff,
  BandSplitter,
  Envelopes,
  dbToLinear,
  rms,
  spectralCentroid,
  spectralFlatness,
} from './analyser'
import { type AudioFrame, createFrame } from './frame'
import { OnsetDetector } from './onset'
import { StructureTracker } from './structure'
import { TempoTracker } from './tempo'
import type { Source } from './source'

/**
 * A single FFT size cannot serve both jobs: band levels want frequency
 * resolution in the sub range, onset detection wants time resolution. Both run
 * with the browser's own smoothing off, since it is a fixed exponential that
 * destroys spectral flux.
 */
export class AudioEngine {
  readonly ctx: AudioContext
  private readonly bandNode: AnalyserNode
  private readonly onsetNode: AnalyserNode
  private readonly bandDb: Float32Array<ArrayBuffer>
  private readonly bandMag: Float32Array<ArrayBuffer>
  private readonly onsetDb: Float32Array<ArrayBuffer>
  private readonly onsetMag: Float32Array<ArrayBuffer>
  private readonly splitter: BandSplitter
  private readonly envelopes = new Envelopes()
  private readonly norm = new AdaptiveNorm()
  private readonly onsets: OnsetDetector
  private readonly raw = new Float32Array(BAND_COUNT)

  readonly tempo = new TempoTracker()
  readonly structure = new StructureTracker()
  readonly frame: AudioFrame = createFrame()

  source: Source | null = null
  private silentFor = 0
  private energy = 0
  private visualClock = 0

  constructor() {
    this.ctx = new AudioContext({ latencyHint: 'interactive' })

    this.bandNode = this.ctx.createAnalyser()
    this.bandNode.fftSize = cfg.fftBands
    this.bandNode.smoothingTimeConstant = 0

    this.onsetNode = this.ctx.createAnalyser()
    this.onsetNode.fftSize = cfg.fftOnset
    this.onsetNode.smoothingTimeConstant = 0

    this.bandDb = new Float32Array(this.bandNode.frequencyBinCount)
    this.bandMag = new Float32Array(this.bandNode.frequencyBinCount)
    this.onsetDb = new Float32Array(this.onsetNode.frequencyBinCount)
    this.onsetMag = new Float32Array(this.onsetNode.frequencyBinCount)

    this.splitter = new BandSplitter(this.ctx.sampleRate, cfg.fftBands)
    this.onsets = new OnsetDetector(this.ctx.sampleRate, cfg.fftOnset)
  }

  async connect(source: Source) {
    this.disconnect()
    this.source = source
    source.node.connect(this.bandNode)
    source.node.connect(this.onsetNode)
    if (this.ctx.state === 'suspended') await this.ctx.resume()
  }

  disconnect() {
    this.source?.stop()
    this.source = null
  }

  tick(dt: number, now: number): AudioFrame {
    const f = this.frame
    f.dt = dt
    f.time = now

    this.onsetNode.getByteTimeDomainData(f.wave)
    this.bandNode.getByteFrequencyData(f.spectrum)
    f.nyquist = this.ctx.sampleRate * 0.5
    this.bandNode.getFloatFrequencyData(this.bandDb)
    this.onsetNode.getFloatFrequencyData(this.onsetDb)
    dbToLinear(this.bandDb, this.bandMag)
    dbToLinear(this.onsetDb, this.onsetMag)

    f.rms = rms(this.bandMag)
    f.centroid = spectralCentroid(this.bandMag, this.ctx.sampleRate, cfg.fftBands)
    f.flatness = spectralFlatness(this.bandMag)

    // The hold stops a quiet passage of real audio flapping into idle. With no
    // source connected there is nothing to flap, so do not make a fresh load
    // sit dead for three seconds before anything moves.
    this.silentFor = f.rms < cfg.silenceRms ? this.silentFor + dt : 0
    f.silent = this.source === null || this.silentFor > cfg.silenceHoldS

    this.splitter.split(this.bandMag, this.raw)
    this.envelopes.process(this.raw, dt, f.bands)
    this.norm.process(f.bands, dt, f.norm)

    this.onsets.process(this.onsetMag, dt, now)
    f.impulse.set(this.onsets.impulse)
    f.events = this.onsets.events

    if (f.events & (1 << BASS)) this.tempo.onKick(now)
    this.tempo.update(dt, cfg.idleBpm)
    f.bpm = this.tempo.bpm
    f.phase = this.tempo.phase
    f.beat = this.tempo.beat
    f.bar = this.tempo.bar
    f.phrase = this.tempo.phrase
    f.confidence = this.tempo.confidence

    this.structure.update(f.norm, f.centroid, f.rms, dt, now)
    f.build = this.structure.build
    f.drop = this.structure.drop

    if (f.silent) this.idle(f, now)

    let loudest = 0
    for (let b = 0; b < BAND_COUNT; b++) loudest = Math.max(loudest, f.norm[b])
    const rising = loudest > this.energy
    this.energy +=
      (loudest - this.energy) * coeff(rising ? visual.energyAttackMs : visual.energyReleaseMs, dt)
    f.energy = this.energy

    const t = Math.min(
      1,
      Math.max(0, (this.energy - visual.energyKnee) / (visual.energyFull - visual.energyKnee)),
    )
    const speed = visual.idleTimeScale + (1 - visual.idleTimeScale) * (t * t * (3 - 2 * t))
    this.visualClock += dt * speed
    f.visualTime = this.visualClock

    return f
  }

  /**
   * A slow ambient drift so the screen is not black, deliberately far below the
   * level real audio produces. Silence must look like silence.
   */
  private idle(f: AudioFrame, now: number) {
    const beat = (now * cfg.idleBpm) / 60
    const pulse = Math.pow(1 - (beat % 1), 8) * cfg.idleDepth
    for (let b = 0; b < BAND_COUNT; b++) {
      const wob = 0.5 + 0.5 * Math.sin(now * (0.3 + b * 0.17) + b)
      f.norm[b] = cfg.idleDepth * wob + (b <= BASS ? pulse : pulse * 0.3)
      f.impulse[b] = b <= BASS ? pulse : pulse * 0.4
    }
    // Reported as unknown, not as a measurement. The HUD shows "idle".
    f.bpm = 0
    f.confidence = 0
    f.centroid = 1200 + 400 * Math.sin(now * 0.2)
    f.build = 0
    f.drop = 0
  }
}
