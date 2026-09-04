import type { AudioFrame } from '../audio/frame'
import type { Scene } from '../scenes'
import type { Uniforms } from './context'

/** Everything a shader can see about the music, in one place. */
export function uploadAudio(
  u: Uniforms,
  f: AudioFrame,
  width: number,
  height: number,
  scene: Scene,
  hue: number,
) {
  u.v2('uRes', width, height)
  u.f('uTime', f.visualTime)
  u.f('uEnergy', f.energy)
  u.fv('uNorm', f.norm)
  u.fv('uImpulse', f.impulse)
  u.f('uRms', f.rms)
  u.f('uCentroid', f.centroid)
  u.f('uFlatness', f.flatness)
  u.f('uBpm', f.bpm)
  u.f('uPhase', f.phase)
  u.f('uBeat', f.beat)
  u.f('uBar', f.bar)
  u.f('uPhrase', f.phrase)
  u.f('uConf', f.confidence)
  u.f('uBuild', f.build)
  u.f('uDrop', f.drop)
  u.f('uHue', hue)
  u.v3('uPalA', scene.palette[0][0], scene.palette[0][1], scene.palette[0][2])
  u.v3('uPalB', scene.palette[1][0], scene.palette[1][1], scene.palette[1][2])
}
