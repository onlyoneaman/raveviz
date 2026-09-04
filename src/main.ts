import { AudioEngine } from './audio/engine'
import { isLoopback, listInputs, openMic, openSystem } from './audio/source'
import { createContext } from './gl/context'
import { ResolutionGovernor } from './gl/governor'
import { Pipeline } from './gl/pipeline'
import { pickAccent, scenes as initialScenes, type Scene } from './scenes'
import { camera, show } from './config'
import type { TransitionMode } from './gl/pipeline'
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
let fromIndex: number | null = null
let blend = 1
let blendS = camera.blendMinS
let mode: TransitionMode = 'burn'
const MODES: TransitionMode[] = ['fade', 'burn', 'burn', 'flash', 'cut']
let locked = !show.autoCycle
let hue = 0
let trailBias = 1
let lastPhrase = -1
let fps = 60
let notes = ''
let accent = pickAccent(initialScenes, 0.3)

// Camera state, re-rolled each phrase so the motion keeps changing character
// instead of always being the same slow push-in.
let spin = 0.05
let spinRate = 0.05
let zoom = 1
let zoomTarget = 1

function setScene(next: number) {
  const target = ((next % scenes.length) + scenes.length) % scenes.length
  if (target === sceneIndex) return
  fromIndex = sceneIndex
  blend = 0
  mode = MODES[Math.floor(Math.random() * MODES.length)]
  blendS =
    mode === 'cut'
      ? 0.06
      : camera.blendMinS + Math.random() * (camera.blendMaxS - camera.blendMinS)
  sceneIndex = target
  hue += 0.25
  rollCamera()
}

/** Jump somewhere else in the set rather than stepping through it in order. */
function jumpScene() {
  if (scenes.length < 2) return
  let next = sceneIndex
  while (next === sceneIndex) next = Math.floor(Math.random() * scenes.length)
  setScene(next)
}

function rollCamera() {
  const dir = Math.random() < 0.5 ? -1 : 1
  spinRate = dir * (camera.spinMin + Math.random() * (camera.spinMax - camera.spinMin))
  zoomTarget = camera.zoomMin + Math.random() * (camera.zoomMax - camera.zoomMin)
  accent = pickAccent(scenes, Math.random())
}

async function pick(open: () => Promise<Awaited<ReturnType<typeof openMic>>>) {
  try {
    await engine.connect(await open())
    notes = ''
  } catch (err) {
    const message = (err as Error).message
    hud.say(message.includes('Permission') || message.includes('denied') ? 'Permission denied.' : message)
    await refreshSources()
    return
  }
  hud.say('')
  refreshSources()
}

// System audio first: it is the default, and the one that needs a click because
// getDisplayMedia requires a user gesture and cannot be opened on load.
const SOURCES = [
  { label: 'system audio', open: () => openSystem(engine.ctx) },
  { label: 'mic', open: () => openMic(engine.ctx) },
]

async function refreshSources() {
  // Loopback devices first: they are the no-picker route to system audio.
  const devices = (await listInputs().catch(() => [])).filter((d) => isLoopback(d.label))
  hud.setSources(
    [
      ...devices.map((d) => ({ label: d.label.replace(/\s*\(.*\)$/, ''), onPick: () => pick(() => openMic(engine.ctx, d.deviceId)) })),
      ...SOURCES.map((s) => ({ label: s.label, onPick: () => pick(s.open) })),
    ],
    engine.source?.label.replace(/\s*\(.*\)$/, '') ?? '',
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
  if (key === ' ') { jumpScene(); e.preventDefault() }
  else if (key >= '1' && key <= '9') setScene(Number(key) - 1)
  else if (key === '0') setScene(9)
  else if (e.key === 'ArrowLeft') { setScene(sceneIndex - 1); e.preventDefault() }
  else if (e.key === 'ArrowRight') { setScene(sceneIndex + 1); e.preventDefault() }
  else if (key === 'c') rollCamera()
  else if (key === 'f') document.fullscreenElement ? document.exitFullscreen() : canvas.requestFullscreen()
  else if (key === 'h') hud.root.classList.toggle('hidden')
  else if (key === 'l') locked = !locked
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
    if (lastPhrase >= 0 && !locked && !frame.silent) jumpScene()
    lastPhrase = frame.phrase
  }
  hue += dt * 0.008

  blend = Math.min(1, blend + dt / blendS)
  if (blend >= 1) fromIndex = null

  // Spin and zoom advance on the audio clock, so they stall with everything
  // else when nothing is playing.
  const beat = frame.impulse[1]
  spin += frame.dt * (spinRate + camera.kickSpin * beat) * (0.15 + 0.85 * frame.energy)
  zoom += (zoomTarget - zoom) * (1 - Math.exp(-dt / camera.zoomRateS))
  frame.camSpin = spin
  frame.camZoom = zoom * (1 - camera.kickZoom * beat)

  const scene = scenes[sceneIndex]
  const scale = governor.update(performance.now() - frameStart, dt, scene.resScale)
  pipeline.resize(canvas.width, canvas.height, scale)
  pipeline.render(frame, scene, sceneIndex, {
    hue,
    trailBias,
    accent,
    from: fromIndex !== null ? { scene: scenes[fromIndex], index: fromIndex } : null,
    blend,
    mode,
  })

  hud.update(frame, scene.name, fps, dt, notes, locked)
  requestAnimationFrame(loop)
}

hud.setKeys(scenes.length)
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
