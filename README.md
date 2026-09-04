# raveviz

Live psytech audio-reactive visualizer. Listens to the mic or to whatever the
laptop is playing, and renders WebGL2 scenes locked to the beat.

```bash
bun install
bun run dev          # http://localhost:5273
```

Click **system audio** or **mic** in the corner, then press `F`.

**On headphones, use system audio.** The mic hears the room, so headphones give
it nothing. System audio taps the stream inside macOS before it reaches any
output device, so what you are listening on makes no difference. In Chrome'"'"'s
picker choose **Entire Screen** and tick **Share system audio**.

Scene `1` is the raw waveform: literal time-domain samples, ungated and
unsmoothed. A flat line means nothing is arriving. It is the fastest way to
tell whether the capture path is live. With no source
connected it runs on a synthetic 145 BPM drive, so the screen is never dead.

| key | |
|---|---|
| `space` | jump to a random scene |
| `1`-`9` `0` | pick scene (`1` is the raw waveform) |
| `,` `.` | previous / next scene |
| `s` | cycle audio source |
| `f` | fullscreen |
| `p` | pause auto-cycle |
| `d` | fire a drop manually |
| `c` | re-roll the camera (spin direction, zoom target, accent colour) |
| `b` | toggle build/drop detection |
| `[` `]` | shorter / longer trails |

All plain keypresses, no modifiers. The five meters are the analysis bands:
`sub` 20-60Hz, `bass` 60-150, `low` 150-800, `mid` 800-3k (where vocals sit),
`air` 3k-16k.
| `h` | hide the HUD |

## Where to change things

**Feel and timing:** `src/config.ts`. Every tunable number lives here: band
edges, envelope attack and release, how fast the adaptive normalizer forgets a
peak, onset thresholds and refractory windows, tempo range, PLL gain, how many
beats make a phrase. Nothing else hardcodes a constant.

**A scene's look:** `src/scenes/<name>.glsl`. Each is a single self-contained
`vec3 scene(vec2 uv)`. Save the file and it hot-reloads into the running page.

Shaders can read the live audio directly: `waveAt(x)` for time-domain samples
and `specAt(x)` for a log-spaced spectrum magnitude, both taking x in 0..1.
That is how the circular scenes bend frequency around a ring.

**Adding a scene:** drop a `.glsl` next to the others and add one entry to
`src/scenes/index.ts` with its palette, resolution scale and feedback settings.
No other file changes.

**Colors and trails:** the `palette` and `feedback` fields in that same
registry. `decay` is how long trails last, `scale` and `rotate` are the
per-frame zoom and twist of the feedback buffer, which is what makes droste
spiral and metatron stay crisp.

**What the shaders can see:** `src/shaders/uniforms.glsl` declares it, and
`src/gl/uniforms.ts` fills it. Add a field to `AudioFrame` and wire it in both
places to expose something new.

**Shared GLSL helpers:** `src/shaders/lib.glsl`. Noise, folds, SDFs, tonemap.

## Layout

```
src/audio/    capture and DSP. No WebGL, no AudioContext outside engine.ts,
              so everything here is testable in node.
  source.ts     mic / system audio / named device
  analyser.ts   log bands, envelopes, adaptive normalization
  onset.ts      per-band spectral flux with a median threshold
  tempo.ts      inter-onset tempo estimate plus a phase-locked loop
  structure.ts  build and drop detection
  frame.ts      AudioFrame, the only contract between the two halves
  engine.ts     ties it together, owns the AudioContext

src/gl/       scene -> feedback -> post, plus the resolution governor
src/scenes/   one .glsl per scene, plus the registry
src/shaders/  shared lib, uniform block, feedback and post passes
```

## Tests

```bash
bun test        # DSP: bands, envelopes, normalization, onsets, tempo, structure
bun run shots   # shader smoke check + contact sheet (needs `bun run dev` first)
```

`bun test` covers the parts that fail silently: envelope time constants that
drift with frame rate, a normalizer that dies on quiet input, an onset detector
that goes deaf during dense passages, a tempo estimate that halves. Node has no
WebGL2, so shader compilation is checked by `bun run shots`, which drives the
real page in Chromium and fails on any console error.
