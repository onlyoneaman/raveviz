import wave from './wave.glsl?raw'
import kali from './kali.glsl?raw'
import droste from './droste.glsl?raw'
import metatron from './metatron.glsl?raw'
import mandelbulb from './mandelbulb.glsl?raw'
import strobe from './strobe.glsl?raw'

export type Rgb = readonly [number, number, number]

export type Scene = {
  name: string
  source: string
  /** Ramp endpoints. Near-black base plus two acid accents, never full rainbow. */
  palette: readonly [Rgb, Rgb]
  resScale: number
  /** Trail decay, plus the per-frame zoom and rotation of the feedback buffer. */
  feedback: { decay: number; scale: number; rotate: number }
}

const hex = (v: string): Rgb => [
  parseInt(v.slice(1, 3), 16) / 255,
  parseInt(v.slice(3, 5), 16) / 255,
  parseInt(v.slice(5, 7), 16) / 255,
]

export const scenes: Scene[] = [
  // First, so it is what you see on open: a flat line means no signal, and any
  // movement means the capture path is live.
  {
    name: 'wave',
    source: wave,
    palette: [hex('#00E5FF'), hex('#9FFF00')],
    resScale: 1.0,
    feedback: { decay: 0.34, scale: 1.0, rotate: 0.0 },
  },
  {
    name: 'kali',
    source: kali,
    palette: [hex('#7B2CFF'), hex('#9FFF00')],
    resScale: 1.0,
    feedback: { decay: 0.8, scale: 0.995, rotate: 0.002 },
  },
  {
    name: 'droste',
    source: droste,
    palette: [hex('#00E5FF'), hex('#FF00A8')],
    resScale: 1.0,
    feedback: { decay: 0.93, scale: 0.965, rotate: 0.02 },
  },
  {
    name: 'metatron',
    source: metatron,
    palette: [hex('#FF6A00'), hex('#FFD84D')],
    resScale: 1.0,
    feedback: { decay: 0.72, scale: 1.0, rotate: 0.0 },
  },
  {
    name: 'mandelbulb',
    source: mandelbulb,
    palette: [hex('#4A00E0'), hex('#C6FF00')],
    resScale: 0.7,
    feedback: { decay: 0.78, scale: 1.002, rotate: 0.001 },
  },
  {
    name: 'strobe',
    source: strobe,
    palette: [hex('#FFFFFF'), hex('#FF0080')],
    resScale: 1.0,
    feedback: { decay: 0.55, scale: 1.0, rotate: 0.0 },
  },
]
