import type { Capabilities } from './capabilities'

/**
 * First run. Someone arriving cold sees a near-black screen and a flat line,
 * with no way to guess that the audio lives behind a checkbox inside Chrome's
 * share picker. This stays up until a source is actually connected.
 */
export class Welcome {
  readonly root = document.createElement('div')

  constructor(caps: Capabilities, onPick: (kind: 'system' | 'mic') => void) {
    this.root.className = 'welcome'
    this.root.innerHTML = `
      <div class="panel">
        <h1>raveviz</h1>
        <p class="lede">Audio-reactive visuals. Give it something to listen to.</p>
        ${caps.blocker ? `<p class="warn">${caps.blocker}</p>` : ''}
        <div class="picks">
          ${caps.systemAudio ? '<button data-kind="system" class="primary">Use system audio</button>' : ''}
          ${caps.mic ? '<button data-kind="mic">Use microphone</button>' : ''}
        </div>
        ${
          caps.systemAudio
            ? `<ol class="how">
                 <li>Pick <b>Entire Screen</b> for anything on your Mac, or <b>Chrome Tab</b> for one tab.</li>
                 <li>Tick <b>Share system audio</b> (or <b>Also share tab audio</b>). It is off by default and easy to miss.</li>
                 <li>A window share never carries audio. Chrome does not offer it.</li>
               </ol>
               <p class="foot">On headphones? System audio still works: it taps the stream before it reaches any output device.</p>`
            : `<p class="foot">The microphone hears the room, so it needs speakers rather than headphones.</p>`
        }
      </div>`

    for (const b of this.root.querySelectorAll('button')) {
      b.addEventListener('click', () => onPick(b.dataset.kind as 'system' | 'mic'))
    }
  }

  dismiss() {
    this.root.classList.add('gone')
    setTimeout(() => this.root.remove(), 400)
  }
}
