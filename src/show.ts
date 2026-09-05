import { camera, show } from './config'
import type { AudioFrame } from './audio/frame'
import type { TransitionMode } from './gl/pipeline'
import { type Genre, type Rgb, type Scene, pickAccent } from './scenes'

const MODES: TransitionMode[] = ['fade', 'burn', 'burn', 'flash', 'cut']
const rand = (a: number, b: number) => a + Math.random() * (b - a)

/**
 * Decides what is on screen: which scene, how it arrives, and how the camera
 * moves. Scenes are grouped by genre and rated for energy, so a change lands on
 * something that belongs next to what was already playing rather than a random
 * jump from a mandala to a concrete corridor.
 */
export class Director {
  index = 0
  from: number | null = null
  blend = 1
  mode: TransitionMode = 'burn'
  locked = !show.autoCycle
  hue = 0
  accent: Rgb
  spin = 0
  zoom = 1
  mirror = 0

  private blendS = camera.blendMinS
  private spinRate = 0.05
  private zoomTarget = 1
  private nextChangeBeat = 0
  private genre: Genre
  private sinceGenreChange = 0

  constructor(private scenes: Scene[]) {
    this.genre = scenes[0].genre
    this.accent = pickAccent(scenes, 0.3)
    this.rollCamera()
  }

  setScenes(scenes: Scene[]) {
    this.scenes = scenes
    this.index = Math.min(this.index, scenes.length - 1)
  }

  get scene() {
    return this.scenes[this.index]
  }

  get fromScene() {
    return this.from !== null ? this.scenes[this.from] : null
  }

  pick(next: number) {
    const target = ((next % this.scenes.length) + this.scenes.length) % this.scenes.length
    if (target === this.index) return
    this.from = this.index
    this.index = target
    this.blend = 0
    this.mode = MODES[Math.floor(Math.random() * MODES.length)]
    this.blendS = this.mode === 'cut' ? 0.06 : rand(camera.blendMinS, camera.blendMaxS)
    this.hue = rand(-0.3, 0.3)
    this.nextChangeBeat = 0
    this.rollCamera()
    this.rollMirror()
  }

  step(delta: number) {
    this.pick(this.index + delta)
  }

  /** Energy the visuals should be carrying right now, on the 1-5 scene scale. */
  private targetEnergy(f: AudioFrame) {
    return 1 + 4 * Math.min(1, f.energy * 0.85 + f.build * 0.45)
  }

  jump(f: AudioFrame) {
    if (this.scenes.length < 2) return

    this.sinceGenreChange++
    if (f.drop > 0.4 || this.sinceGenreChange > show.scenesPerGenre) {
      const others = [...new Set(this.scenes.map((s) => s.genre))].filter((g) => g !== this.genre)
      if (others.length) this.genre = others[Math.floor(Math.random() * others.length)]
      this.sinceGenreChange = 0
    }

    const target = this.targetEnergy(f)
    const pool = this.scenes
      .map((s, i) => ({ i, s }))
      .filter(({ i, s }) => i !== this.index && s.genre === this.genre)
    if (!pool.length) return

    // Closer in energy is likelier, but nothing is ruled out.
    const weights = pool.map(({ s }) => 1 / (1 + (s.energy - target) ** 2))
    let roll = Math.random() * weights.reduce((a, b) => a + b, 0)
    for (let k = 0; k < pool.length; k++) {
      roll -= weights[k]
      if (roll <= 0) return this.pick(pool[k].i)
    }
    this.pick(pool[pool.length - 1].i)
  }

  rollCamera() {
    this.spinRate = (Math.random() < 0.5 ? -1 : 1) * rand(camera.spinMin, camera.spinMax)
    this.zoomTarget = rand(camera.zoomMin, camera.zoomMax)
    this.accent = pickAccent(this.scenes, Math.random())
  }

  private rollMirror() {
    this.mirror = this.scene.mirror === false ? 0 : Math.floor(Math.random() * 6)
  }

  update(f: AudioFrame, dt: number) {
    this.blend = Math.min(1, this.blend + dt / this.blendS)
    if (this.blend >= 1) this.from = null

    if (f.silent) {
      this.nextChangeBeat = f.beat + rand(show.beatsPerSceneMin, show.beatsPerSceneMax)
    } else if (f.beat >= this.nextChangeBeat) {
      if (this.nextChangeBeat > 0 && !this.locked) this.jump(f)
      this.nextChangeBeat = f.beat + rand(show.beatsPerSceneMin, show.beatsPerSceneMax)
    }

    this.hue += dt * 0.005
    // Camera runs on the audio clock, so it stalls with everything else.
    this.spin += dt * (this.spinRate + camera.kickSpin * f.impulse[1]) * (0.15 + 0.85 * f.energy)
    this.zoom += (this.zoomTarget - this.zoom) * (1 - Math.exp(-dt / camera.zoomRateS))

    f.camSpin = this.spin
    f.camZoom = this.zoom * (1 - camera.kickZoom * f.impulse[1])
  }
}
