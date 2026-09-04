import { BAND_COUNT, SPECTRUM_SIZE, WAVE_SIZE } from '../config'

export type AudioFrame = {
  /** Raw time-domain samples, 128 = zero. Never gated: this is literal input. */
  wave: Uint8Array<ArrayBuffer>
  /** Byte FFT magnitudes, linear in frequency. Shaders log-map it. */
  spectrum: Uint8Array<ArrayBuffer>
  nyquist: number
  bands: Float32Array
  norm: Float32Array
  impulse: Float32Array
  events: number

  rms: number
  /** Time-domain RMS amplitude, 0..1. The honest loudness measure. */
  level: number
  centroid: number
  flatness: number

  bpm: number
  phase: number
  beat: number
  bar: number
  phrase: number
  confidence: number

  build: number
  drop: number

  /** 0..1 overall audible level. Drives global brightness and time advance. */
  energy: number
  /** Global camera, re-rolled each phrase so motion keeps changing character. */
  camSpin: number
  camZoom: number
  /** Wall clock scaled by energy, so the image nearly freezes in silence. */
  visualTime: number

  silent: boolean
  dt: number
  time: number
}

export function createFrame(): AudioFrame {
  return {
    wave: new Uint8Array(WAVE_SIZE).fill(128),
    spectrum: new Uint8Array(SPECTRUM_SIZE),
    nyquist: 24000,
    bands: new Float32Array(BAND_COUNT),
    norm: new Float32Array(BAND_COUNT),
    impulse: new Float32Array(BAND_COUNT),
    events: 0,
    rms: 0,
    level: 0,
    centroid: 0,
    flatness: 0,
    bpm: 0,
    phase: 0,
    beat: 0,
    bar: 0,
    phrase: 0,
    confidence: 0,
    build: 0,
    drop: 0,
    energy: 0,
    camSpin: 0,
    camZoom: 1,
    visualTime: 0,
    silent: true,
    dt: 0,
    time: 0,
  }
}

export const hasEvent = (f: AudioFrame, band: number) => (f.events & (1 << band)) !== 0
