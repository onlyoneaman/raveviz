import { BAND_COUNT, BAND_NAMES } from '../config'
import type { AudioFrame } from '../audio/frame'

// Lowercase on purpose: these are plain keypresses, no shift.
const keyList = (sceneCount: number) => [
  ['space', 'jump scene'],
  [sceneCount > 10 ? '1-9 0' : `1-${sceneCount}`, 'pick scene'],
  ['← →', 'prev / next'],
  ['s', 'source'],
  ['f', 'fullscreen'],
  ['c', 're-roll camera'],
  ['l', 'lock scene'],
  ['d', 'drop'],
  ['[ ]', 'trails'],
  ['b', 'build detect'],
  ['h', 'hide'],
]

export class Hud {
  readonly root = document.createElement('div')
  private readonly keys = document.createElement('div')
  private readonly status = document.createElement('div')
  private readonly meters: HTMLDivElement[] = []
  private readonly sources = document.createElement('div')
  private readonly toast = document.createElement('div')
  private idleTimer = 0

  constructor() {
    this.root.className = 'hud'
    this.root.innerHTML = `
      <div class="hud-row"><span class="brand">raveviz</span><span class="stat"></span></div>
      <div class="meters"></div>
      <div class="sources"></div>
      <div class="toast" hidden></div>
      <div class="keys"></div>`

    this.status = this.root.querySelector('.stat')!
    this.keys = this.root.querySelector('.keys')!
    const meterBox = this.root.querySelector('.meters')!
    for (let i = 0; i < BAND_COUNT; i++) {
      const bar = document.createElement('div')
      bar.className = 'meter'
      bar.innerHTML = `<i></i><label>${BAND_NAMES[i]}</label>`
      meterBox.appendChild(bar)
      this.meters.push(bar.firstElementChild as HTMLDivElement)
    }
    this.sources = this.root.querySelector('.sources')!
    this.toast = this.root.querySelector('.toast')!

    addEventListener('mousemove', () => this.wake())
    this.wake()
  }

  setKeys(sceneCount: number) {
    this.keys.innerHTML = keyList(sceneCount)
      .map(([k, v]) => `<span><b>${k}</b>${v}</span>`)
      .join('')
  }

  setSources(buttons: { label: string; onPick: () => void }[], activeLabel: string) {
    this.sources.innerHTML = ''
    for (const b of buttons) {
      const el = document.createElement('button')
      el.textContent = b.label
      el.className = b.label === activeLabel ? 'active' : ''
      el.onclick = () => b.onPick()
      this.sources.appendChild(el)
    }
  }

  /** Capture failures are the one thing that must not auto-hide. */
  say(message: string) {
    this.toast.textContent = message
    this.toast.hidden = !message
    if (message) this.wake()
  }

  wake() {
    this.idleTimer = 0
    this.root.classList.remove('idle')
  }

  update(f: AudioFrame, sceneName: string, fps: number, dt: number, notes: string, locked = false) {
    this.idleTimer += dt
    if (this.idleTimer > 3) this.root.classList.add('idle')

    // Never print a tempo the tracker has not actually measured.
    const lock = f.confidence > 0.5 ? 'lock' : f.confidence > 0.2 ? 'soft' : 'free'
    const tempo = f.silent
      ? 'no signal'
      : f.bpm > 0
        ? `${f.bpm.toFixed(1)} bpm ${lock}`
        : 'listening'
    this.status.textContent =
      `${sceneName}${locked ? ' [locked]' : ''} · ${tempo} · bar ${f.bar % 4 | 0}` +
      ` · ${fps.toFixed(0)}fps${notes}`

    for (let i = 0; i < this.meters.length; i++) {
      this.meters[i].style.transform = `scaleX(${f.norm[i].toFixed(3)})`
    }
  }
}
