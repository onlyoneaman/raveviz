import { AudioEngine } from './audio/engine'
import { openMic, openSystem } from './audio/source'
import { createContext } from './gl/context'
import { ResolutionGovernor } from './gl/governor'
import { Pipeline } from './gl/pipeline'
import { scenes as initialScenes, type Scene } from './scenes'
import { show } from './config'
import { Hud } from './ui/hud'

const canvas = document.getElementById('stage') as HTMLCanvasElement
const gl = createContext(canvas)

let scenes: Scene[] = initialScenes
const engine = new AudioEngine()
const pipeline = new Pipeline(gl, scenes)
const governor = new ResolutionGovernor()
const hud = new Hud()
document.body.appendChild(hud.root)

let sceneIndex = 0
let autoCycle = show.autoCycle
let hue = 0
let trailBias = 1
let lastPhrase = -1
let fps = 60
let notes = ''

function setScene(next: number) {
  sceneIndex = ((next % scenes.length) + scenes.length) % scenes.length
  hue += 0.25
}

async function pick(open: () => Promise<Awaited<ReturnType<typeof openMic>>>) {
  try {
    await engine.connect(await open())
    notes = ''
  } catch (err) {
    notes = ` · ${(err as Error).message}`
  }
  refreshSources()
}

// System audio first: it is the default, and the one that needs a click because
// getDisplayMedia requires a user gesture and cannot be opened on load.
const SOURCES = [
  { label: 'system audio', open: () => openSystem(engine.ctx) },
  { label: 'mic', open: () => openMic(engine.ctx) },
]

function refreshSources() {
  hud.setSources(
    SOURCES.map((s) => ({ label: s.label, onPick: () => pick(s.open) })),
    engine.source?.kind === 'system' ? 'system audio' : engine.source ? 'mic' : '',
  )
}

function resize() {
  const dpr = Math.min(devicePixelRatio, 2)
  canvas.width = Math.round(innerWidth * dpr)
  canvas.height = Math.round(innerHeight * dpr)
}

addEventListener('resize', resize)
resize()

addEventListener('keydown', (event) => {
  const e = event as KeyboardEvent
  hud.wake()
  const key = e.key.toLowerCase()
  if (key === ' ') { setScene(sceneIndex + 1); e.preventDefault() }
  else if (key >= '1' && key <= '9') setScene(Number(key) - 1)
  else if (key === 'f') document.fullscreenElement ? document.exitFullscreen() : canvas.requestFullscreen()
  else if (key === 'h') hud.root.classList.toggle('hidden')
  else if (key === 'p') autoCycle = !autoCycle
  else if (key === 'd') engine.structure.fire()
  else if (key === 'b') engine.structure.enabled = !engine.structure.enabled
  else if (key === '[') trailBias = Math.max(0.6, trailBias - 0.04)
  else if (key === ']') trailBias = Math.min(1.12, trailBias + 0.04)
  else if (key === 's') cycleSource()
})

let sourceCursor = -1
async function cycleSource() {
  sourceCursor = (sourceCursor + 1) % SOURCES.length
  await pick(SOURCES[sourceCursor].open)
}

let last = performance.now()
let clock = 0

function loop(now: number) {
  const frameStart = now
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  clock += dt
  fps += (1 / Math.max(dt, 1e-4) - fps) * 0.05

  const frame = engine.tick(dt, clock)

  // Cycling while nothing is playing makes the app look like it is inventing
  // structure. Hold the scene until there is a signal.
  if (frame.phrase !== lastPhrase) {
    if (lastPhrase >= 0 && autoCycle && !frame.silent) setScene(sceneIndex + 1)
    lastPhrase = frame.phrase
  }
  hue += dt * 0.008

  const scene = scenes[sceneIndex]
  const scale = governor.update(performance.now() - frameStart, dt, scene.resScale)
  pipeline.resize(canvas.width, canvas.height, scale)
  pipeline.render(frame, scene, sceneIndex, { hue, trailBias })

  hud.update(frame, scene.name, fps, dt, notes)
  requestAnimationFrame(loop)
}

refreshSources()
requestAnimationFrame(loop)

if (import.meta.env.DEV) {
  Object.assign(window, {
    raveviz: {
      engine,
      get frame() { return engine.frame },
      get scene() { return scenes[sceneIndex] },
    },
  })
}

if (import.meta.hot) {
  import.meta.hot.accept('./scenes/index.ts', (mod) => {
    if (!mod) return
    scenes = (mod as unknown as { scenes: Scene[] }).scenes
    pipeline.loadScenes(scenes)
  })
}
