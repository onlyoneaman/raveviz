export type Capabilities = {
  webgl2: boolean
  mic: boolean
  /** Chrome and Edge only. Safari has no support, Firefox ignores the request. */
  systemAudio: boolean
  blocker: string | null
}

export function detect(): Capabilities {
  const ua = navigator.userAgent
  const touchMac = navigator.maxTouchPoints > 1 && /Macintosh/.test(ua)
  const ios = /iPad|iPhone|iPod/.test(ua) || touchMac
  const android = /Android/.test(ua)
  const firefox = /Firefox\//.test(ua)
  const safari = /Safari\//.test(ua) && !/Chrome\/|Chromium\/|Edg\//.test(ua)

  const webgl2 = !!document.createElement('canvas').getContext('webgl2')
  const mic = typeof navigator.mediaDevices?.getUserMedia === 'function'
  const systemAudio =
    typeof navigator.mediaDevices?.getDisplayMedia === 'function' && !safari && !firefox && !ios

  let blocker: string | null = null
  if (!webgl2) blocker = 'This browser has no WebGL2, which the whole thing is built on.'
  else if (ios || android) blocker = 'Phones cannot capture audio from other apps, and there are no touch controls yet. Open this on a desktop.'
  else if (safari) blocker = 'Safari cannot capture system audio at all: it accepts the request and returns no audio track. Use Chrome. The mic still works here.'
  else if (firefox) blocker = 'Firefox ignores the audio half of a screen share without erroring. Use Chrome for system audio. The mic still works here.'

  return { webgl2, mic, systemAudio, blocker }
}
