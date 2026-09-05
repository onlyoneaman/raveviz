import { AudioEngine } from './audio/engine'
import { isLoopback, listInputs, openMic, openSystem } from './audio/source'
import { createContext } from './gl/context'
import { ResolutionGovernor } from './gl/governor'
import { Pipeline } from './gl/pipeline'
import { scenes as initialScenes, type Scene } from './scenes'
import { Director } from './show'
import { detect } from './ui/capabilities'
import { Hud } from './ui/hud'
import { Welcome } from './ui/welcome'

const canvas = document.getElementById('stage') as HTMLCanvasElement
const gl = createContext(canvas)

let scenes: Scene[] = initialScenes
const engine = new AudioEngine()
const pipeline = new Pipeline(gl, scenes)
const governor = new ResolutionGovernor()
const director = new Director(scenes)
const hud = new Hud()
document.body.appendChild(hud.root)

const caps = detect()
const welcome = new Welcome(caps, (kind) =>
  pick(kind === 'system' ? SOURCES[0].open : SOURCES[1].open),
)
document.body.appendChild(welcome.root)

let trailBias = 1
let fps = 60

const SOURCES = [
  { label: 'system audio', open: () => openSystem(engine.ctx) },
  { label: 'mic', open: () => openMic(engine.ctx) },
]

async function pick(open: () => Promise<Awaited<ReturnType<typeof openMic>>>) {
  try {
    await engine.connect(await open())
  } catch (err) {
    const message = (err as Error).message
    hud.say(message.includes('Permission') || message.includes('denied') ? 'Permission denied.' : message)
    await refreshSources()
    return
  }
  hud.say('')
  welcome.dismiss()
  await refreshSources()
}

async function refreshSources() {
  // Loopback devices first: the no-picker route to system audio.
  const devices = (await listInputs().catch(() => [])).filter((d) => isLoopback(d.label))
  const short = (s: string) => s.replace(/\s*\(.*\)$/, '')
  hud.setSources(
    [
      ...devices.map((d) => ({
        label: short(d.label),
        onPick: () => pick(() => openMic(engine.ctx, d.deviceId)),
      })),
      ...SOURCES.map((s) => ({ label: s.label, onPick: () => pick(s.open) })),
    ],
    engine.source ? short(engine.source.label) : '',
  )
}

function resize() {
  const dpr = Math.min(devicePixelRatio, 2)
  canvas.width = Math.round(innerWidth * dpr)
  canvas.height = Math.round(innerHeight * dpr)
}

addEventListener('resize', resize)
resize()

let sourceCursor = -1
async function cycleSource() {
  sourceCursor = (sourceCursor + 1) % SOURCES.length
  await pick(SOURCES[sourceCursor].open)
}

addEventListener('keydown', (event) => {
  const e = event as KeyboardEvent
  hud.wake()
  const key = e.key.toLowerCase()
  if (key === ' ') { director.jump(engine.frame); e.preventDefault() }
  else if (key >= '1' && key <= '9') director.pick(Number(key) - 1)
  else if (key === '0') director.pick(9)
  else if (e.key === 'ArrowLeft') { director.step(-1); e.preventDefault() }
  else if (e.key === 'ArrowRight') { director.step(1); e.preventDefault() }
  else if (key === 'f') document.fullscreenElement ? document.exitFullscreen() : canvas.requestFullscreen()
  else if (key === 'h') hud.root.classList.toggle('hidden')
  else if (key === 'l') director.locked = !director.locked
  else if (key === 'c') director.rollCamera()
  else if (key === 'd') engine.structure.fire()
  else if (key === 'b') engine.structure.enabled = !engine.structure.enabled
  else if (key === '[') trailBias = Math.max(0.6, trailBias - 0.04)
  else if (key === ']') trailBias = Math.min(1.12, trailBias + 0.04)
  else if (key === 's') cycleSource()
})

let last = performance.now()
let clock = 0

function loop(now: number) {
  const frameStart = now
  const dt = Math.min(0.05, (now - last) / 1000)
  last = now
  clock += dt
  fps += (1 / Math.max(dt, 1e-4) - fps) * 0.05

  const frame = engine.tick(dt, clock)
  director.update(frame, dt)

  const scene = director.scene
  const scale = governor.update(performance.now() - frameStart, dt, scene.resScale)
  pipeline.resize(canvas.width, canvas.height, scale)
  pipeline.render(frame, scene, director.index, {
    hue: director.hue,
    trailBias,
    accent: director.accent,
    mirror: director.mirror,
    from: director.from !== null ? { scene: director.fromScene!, index: director.from } : null,
    blend: director.blend,
    mode: director.mode,
  })

  hud.update(frame, scene.name, fps, dt, '', director.locked)
  requestAnimationFrame(loop)
}

hud.setKeys(scenes.length)
refreshSources()
requestAnimationFrame(loop)

if (import.meta.hot) {
  import.meta.hot.accept('./scenes/index.ts', (mod) => {
    if (!mod) return
    scenes = (mod as unknown as { scenes: Scene[] }).scenes
    pipeline.loadScenes(scenes)
    director.setScenes(scenes)
  })
}

if (import.meta.env.DEV) {
  Object.assign(window, {
    raveviz: {
      engine,
      director,
      get frame() { return engine.frame },
      get scene() { return director.scene },
    },
  })
}
