import type { AudioFrame } from '../audio/frame'
import { visual } from '../config'
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
  accent: readonly [number, number, number],
) {
  u.v2('uRes', width, height)
  u.f('uTime', f.visualTime)
  u.f('uEnergy', f.energy)
  u.f('uNyquist', f.nyquist)
  u.f('uKickZoom', visual.kickZoom)
  u.f('uKickFlash', visual.kickFlash)
  u.f('uBloom', scene.bloom ?? 1)
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
  // A monochrome scene must not have its accent hue-rotated into something else.
  u.f('uHue', scene.accent === false ? 0 : hue)
  u.v3('uPalA', scene.palette[0][0], scene.palette[0][1], scene.palette[0][2])
  u.v3('uPalB', scene.palette[1][0], scene.palette[1][1], scene.palette[1][2])
  const c = scene.accent === false ? scene.palette[1] : accent
  u.v3('uPalC', c[0], c[1], c[2])
  const moves = scene.camera !== false
  u.f('uCamSpin', moves ? f.camSpin : 0)
  u.f('uCamZoom', moves ? f.camZoom : 1)
}
