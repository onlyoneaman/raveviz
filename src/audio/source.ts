export type SourceKind = 'mic' | 'system' | 'device'

export type Source = {
  kind: SourceKind
  label: string
  node: AudioNode
  stop(): void
}

/**
 * Chrome's defaults are tuned for speech and apply aggressive gain
 * compression, which flattens exactly the transients the onset detector needs.
 * With them on the visuals look limp on loud music.
 */
const RAW_AUDIO = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
  voiceIsolation: false,
  channelCount: 2,
} as MediaTrackConstraints

function attach(ctx: AudioContext, stream: MediaStream, kind: SourceKind, label: string): Source {
  const node = ctx.createMediaStreamSource(stream)
  return {
    kind,
    label,
    node,
    stop() {
      node.disconnect()
      for (const track of stream.getTracks()) track.stop()
    },
  }
}

/** `deviceId` reaches a virtual loopback device such as BlackHole. */
export async function openMic(ctx: AudioContext, deviceId?: string): Promise<Source> {
  const audio = deviceId ? { ...RAW_AUDIO, deviceId: { exact: deviceId } } : RAW_AUDIO
  const stream = await navigator.mediaDevices.getUserMedia({ audio })
  const label = stream.getAudioTracks()[0]?.label || 'microphone'
  return attach(ctx, stream, deviceId ? 'device' : 'mic', label)
}

/**
 * Audio-only display capture is not permitted, so video must be requested and
 * then immediately dropped. Requires Chrome 141+ on macOS 14.2+.
 */
export async function openSystem(ctx: AudioContext): Promise<Source> {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: RAW_AUDIO,
    systemAudio: 'include',
  } as DisplayMediaStreamOptions)

  for (const track of stream.getVideoTracks()) {
    track.stop()
    stream.removeTrack(track)
  }
  if (stream.getAudioTracks().length === 0) {
    throw new Error('No audio track. Tick "Share audio" in the picker.')
  }
  return attach(ctx, stream, 'system', stream.getAudioTracks()[0].label || 'system audio')
}
