import { BAND_COUNT } from '../config'
import type { AudioFrame } from '../audio/frame'

const KEYS = [
  ['space', 'next scene'],
  ['1-5', 'pick scene'],
  ['S', 'audio source'],
  ['F', 'fullscreen'],
  ['P', 'pause cycle'],
  ['D', 'fire drop'],
  ['[ ]', 'trails'],
  ['B', 'build detect'],
  ['H', 'hide'],
]

export class Hud {
  readonly root = document.createElement('div')
  private readonly status = document.createElement('div')
  private readonly meters: HTMLDivElement[] = []
  private readonly sources = document.createElement('div')
  private idleTimer = 0

  constructor() {
    this.root.className = 'hud'
    this.root.innerHTML = `
      <div class="hud-row"><span class="brand">raveviz</span><span class="stat"></span></div>
      <div class="meters"></div>
      <div class="sources"></div>
      <div class="keys">${KEYS.map(([k, v]) => `<span><b>${k}</b>${v}</span>`).join('')}</div>`

    this.status = this.root.querySelector('.stat')!
    const meterBox = this.root.querySelector('.meters')!
    for (let i = 0; i < BAND_COUNT; i++) {
      const bar = document.createElement('div')
      bar.className = 'meter'
      bar.innerHTML = '<i></i>'
      meterBox.appendChild(bar)
      this.meters.push(bar.firstElementChild as HTMLDivElement)
    }
    this.sources = this.root.querySelector('.sources')!

    addEventListener('mousemove', () => this.wake())
    this.wake()
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

  wake() {
    this.idleTimer = 0
    this.root.classList.remove('idle')
  }

  update(f: AudioFrame, sceneName: string, fps: number, dt: number, notes: string) {
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
      `${sceneName} · ${tempo} · bar ${f.bar % 4 | 0} · ${fps.toFixed(0)}fps${notes}`

    for (let i = 0; i < this.meters.length; i++) {
      this.meters[i].style.transform = `scaleX(${f.norm[i].toFixed(3)})`
    }
  }
}
