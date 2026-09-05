import wave from './wave.glsl?raw'
import radial from './radial.glsl?raw'
import vortex from './vortex.glsl?raw'
import mandala from './mandala.glsl?raw'
import girder from './girder.glsl?raw'
import moire from './moire.glsl?raw'
import beams from './beams.glsl?raw'
import sunset from './sunset.glsl?raw'
import discoball from './discoball.glsl?raw'
import prism from './prism.glsl?raw'
import sonar from './sonar.glsl?raw'
import liquid from './liquid.glsl?raw'
import neon from './neon.glsl?raw'
import burst from './burst.glsl?raw'
import yantra from './yantra.glsl?raw'
import deity from './deity.glsl?raw'
import hexgrid from './hexgrid.glsl?raw'
import chrome from './chrome.glsl?raw'
import kali from './kali.glsl?raw'
import droste from './droste.glsl?raw'
import metatron from './metatron.glsl?raw'
import mandelbulb from './mandelbulb.glsl?raw'
import strobe from './strobe.glsl?raw'

export type Rgb = readonly [number, number, number]

export type Genre = 'psy' | 'techno' | 'house'

export const pickAccent = (scenes: Scene[], seed: number): Rgb =>
  scenes[Math.floor(seed * scenes.length) % scenes.length].palette[seed > 0.5 ? 0 : 1]

export type Scene = {
  name: string
  source: string
  /** Grouping for scene changes, so a switch stays in the same world. */
  genre: Genre
  /** 1 calm to 5 relentless. Matched against the live audio when picking. */
  energy: number
  /** Ramp endpoints. Near-black base plus two acid accents, never full rainbow. */
  palette: readonly [Rgb, Rgb]
  resScale: number
  /** Trail decay, plus the per-frame zoom and rotation of the feedback buffer. */
  feedback: { decay: number; scale: number; rotate: number }
  /**
   * Whether the global camera spin and zoom apply. The readable scenes opt out:
   * a rotating waveform is just a diagonal line.
   */
  camera?: boolean
  /** Bloom multiplier. Techno wants hard edges; glow is a psy tell. Default 1. */
  bloom?: number
  /** Whether the borrowed third palette stop applies. Off keeps a scene monochrome. */
  accent?: boolean
  /**
   * Strength of the shared ambient backdrop. Scenes that are one centred object
   * need it or a wide screen is mostly empty; scenes that already fill the
   * frame leave it at 0.
   */
  fill?: number
  /** Whether a random mirror or kaleidoscope fold may be applied. */
  mirror?: boolean
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
    genre: 'techno',
    energy: 1,
    mirror: false,
    source: wave,
    palette: [hex('#00E5FF'), hex('#9FFF00')],
    resScale: 1.0,
    feedback: { decay: 0.34, scale: 1.0, rotate: 0.0 },
    camera: false,
  },
  {
    name: 'radial',
    genre: 'house',
    energy: 2,
    mirror: false,
    source: radial,
    palette: [hex('#00E5FF'), hex('#FF2D95')],
    resScale: 1.0,
    feedback: { decay: 0.55, scale: 1.0, rotate: 0.0 },
    camera: false,
    fill: 0.9,
  },
  {
    name: 'vortex',
    genre: 'psy',
    energy: 4,
    source: vortex,
    palette: [hex('#FF2D95'), hex('#7B2CFF')],
    resScale: 1.0,
    feedback: { decay: 0.86, scale: 0.985, rotate: 0.006 },
  },
  {
    name: 'droste',
    genre: 'psy',
    energy: 3,
    source: droste,
    palette: [hex('#00E5FF'), hex('#FF00A8')],
    resScale: 1.0,
    feedback: { decay: 0.93, scale: 0.965, rotate: 0.02 },
  },
  {
    name: 'mandala',
    genre: 'psy',
    energy: 3,
    source: mandala,
    palette: [hex('#B026FF'), hex('#39FF14')],
    resScale: 1.0,
    feedback: { decay: 0.74, scale: 0.997, rotate: 0.004 },
    fill: 1.0,
  },
  {
    name: 'metatron',
    genre: 'psy',
    energy: 2,
    source: metatron,
    palette: [hex('#FF6A00'), hex('#FFD84D')],
    resScale: 1.0,
    feedback: { decay: 0.72, scale: 1.0, rotate: 0.0 },
    fill: 1.0,
  },
  {
    name: 'kali',
    genre: 'psy',
    energy: 4,
    source: kali,
    palette: [hex('#7B2CFF'), hex('#9FFF00')],
    resScale: 1.0,
    feedback: { decay: 0.8, scale: 0.995, rotate: 0.002 },
  },
  {
    name: 'mandelbulb',
    genre: 'psy',
    energy: 3,
    source: mandelbulb,
    palette: [hex('#4A00E0'), hex('#C6FF00')],
    resScale: 0.7,
    feedback: { decay: 0.78, scale: 1.002, rotate: 0.001 },
    fill: 0.8,
  },
  {
    name: 'girder',
    genre: 'techno',
    energy: 4,
    mirror: false,
    source: girder,
    palette: [hex('#E8F0F5'), hex('#6E8FA6')],
    resScale: 1.0,
    feedback: { decay: 0.30, scale: 1.0, rotate: 0.0 },
    camera: false,
    bloom: 0.25,
    accent: false,
  },
  {
    name: 'moire',
    genre: 'techno',
    energy: 3,
    mirror: false,
    source: moire,
    palette: [hex('#FFFFFF'), hex('#AEBCC4')],
    resScale: 1.0,
    feedback: { decay: 0.20, scale: 1.0, rotate: 0.0 },
    camera: false,
    bloom: 0.1,
    accent: false,
  },
  {
    name: 'beams',
    genre: 'techno',
    energy: 4,
    mirror: false,
    source: beams,
    palette: [hex('#FFFFFF'), hex('#FF2A1A')],
    resScale: 1.0,
    feedback: { decay: 0.45, scale: 1.0, rotate: 0.0 },
    camera: false,
    bloom: 0.7,
    accent: false,
  },
  {
    name: 'sunset',
    genre: 'house',
    energy: 1,
    mirror: false,
    source: sunset,
    palette: [hex('#FF7A18'), hex('#AF2896')],
    resScale: 1.0,
    feedback: { decay: 0.42, scale: 1.0, rotate: 0.0 },
    camera: false,
    accent: false,
  },
  {
    name: 'discoball',
    genre: 'house',
    energy: 2,
    source: discoball,
    palette: [hex('#FFD166'), hex('#06D6F0')],
    resScale: 1.0,
    feedback: { decay: 0.62, scale: 1.0, rotate: 0.0 },
    fill: 0.7,
  },
  {
    name: 'prism',
    genre: 'house',
    energy: 3,
    source: prism,
    palette: [hex('#FF4FD8'), hex('#35E8FF')],
    resScale: 1.0,
    feedback: { decay: 0.58, scale: 0.998, rotate: 0.002 },
  },
  {
    name: 'sonar',
    genre: 'techno',
    energy: 2,
    mirror: false,
    source: sonar,
    palette: [hex('#2B3BFF'), hex('#8FD4FF')],
    resScale: 1.0,
    feedback: { decay: 0.50, scale: 1.0, rotate: 0.0 },
    camera: false,
    bloom: 0.5,
    accent: false,
    fill: 0.85,
  },
  {
    name: 'liquid',
    genre: 'psy',
    energy: 3,
    source: liquid,
    palette: [hex('#FF2D95'), hex('#25E7FF')],
    resScale: 0.85,
    feedback: { decay: 0.55, scale: 1.0, rotate: 0.0 },
  },
  {
    name: 'neon',
    genre: 'techno',
    energy: 4,
    mirror: false,
    source: neon,
    palette: [hex('#FF1E56'), hex('#3B6BFF')],
    resScale: 1.0,
    feedback: { decay: 0.52, scale: 1.0, rotate: 0.0 },
    camera: false,
    accent: false,
  },
  {
    name: 'burst',
    genre: 'psy',
    energy: 5,
    source: burst,
    palette: [hex('#FF4FD8'), hex('#35E8FF')],
    resScale: 1.0,
    feedback: { decay: 0.72, scale: 0.99, rotate: 0.003 },
    fill: 0.5,
  },
  {
    name: 'yantra',
    genre: 'psy',
    energy: 3,
    source: yantra,
    palette: [hex('#FFB000'), hex('#FF2D55')],
    resScale: 1.0,
    feedback: { decay: 0.66, scale: 0.998, rotate: 0.002 },
    fill: 1.0,
  },
  {
    name: 'deity',
    source: deity,
    genre: 'psy',
    energy: 4,
    mirror: false,
    camera: false,
    palette: [hex('#12E5FF'), hex('#8CFF4F')],
    resScale: 1.0,
    feedback: { decay: 0.60, scale: 0.999, rotate: 0.0 },
    fill: 0.9,
  },
  {
    name: 'hexgrid',
    source: hexgrid,
    genre: 'techno',
    energy: 3,
    palette: [hex('#FF8A00'), hex('#FFE45E')],
    resScale: 1.0,
    feedback: { decay: 0.38, scale: 1.0, rotate: 0.0 },
    bloom: 0.45,
  },
  {
    name: 'chrome',
    source: chrome,
    genre: 'house',
    energy: 3,
    mirror: false,
    palette: [hex('#C9D6FF'), hex('#FF5FA2')],
    resScale: 1.0,
    feedback: { decay: 0.55, scale: 1.0, rotate: 0.0 },
  },
  {
    name: 'strobe',
    genre: 'techno',
    energy: 5,
    source: strobe,
    palette: [hex('#FFFFFF'), hex('#FF0080')],
    resScale: 1.0,
    feedback: { decay: 0.55, scale: 1.0, rotate: 0.0 },
  },
]
