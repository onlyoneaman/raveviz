import { BAND_COUNT } from '../config'

export type AudioFrame = {
  bands: Float32Array
  norm: Float32Array
  impulse: Float32Array
  events: number

  rms: number
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
  /** Wall clock scaled by energy, so the image nearly freezes in silence. */
  visualTime: number

  silent: boolean
  dt: number
  time: number
}

export function createFrame(): AudioFrame {
  return {
    bands: new Float32Array(BAND_COUNT),
    norm: new Float32Array(BAND_COUNT),
    impulse: new Float32Array(BAND_COUNT),
    events: 0,
    rms: 0,
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
    visualTime: 0,
    silent: true,
    dt: 0,
    time: 0,
  }
}

export const hasEvent = (f: AudioFrame, band: number) => (f.events & (1 << band)) !== 0
