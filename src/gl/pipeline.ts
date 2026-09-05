import lib from '../shaders/lib.glsl?raw'
import uniformBlock from '../shaders/uniforms.glsl?raw'
import feedbackSrc from '../shaders/feedback.glsl?raw'
import postSrc from '../shaders/post.glsl?raw'
import type { AudioFrame } from '../audio/frame'
import type { Scene } from '../scenes'
import { SPECTRUM_SIZE, WAVE_SIZE } from '../config'
import { createGlyphTexture } from './glyph'
import { type Target, Uniforms, createProgram, createTarget, destroyTarget } from './context'
import { uploadAudio } from './uniforms'

const VERT = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`

const HEADER = `#version 300 es
precision highp float;
precision highp int;
out vec4 fragColor;
`

const SCENE_MAIN = `
void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uRes) / uRes.y;
  uv = rot2(uCamSpin) * uv * uCamZoom;
  vec2 folded = mirrorFold(uv, uMirror);
  fragColor = vec4(scene(folded) + ambient(uv) * uFill, 1.0);
}`

const frag = (body: string, sceneMain: boolean) =>
  HEADER + lib + uniformBlock + body + (sceneMain ? SCENE_MAIN : '')

type Pass = { program: WebGLProgram; uniforms: Uniforms }

/**
 * How two scenes are mixed mid-transition. All three composite additively onto
 * a cleared buffer, which suits glow-heavy scenes far better than an alpha
 * crossfade, where the midpoint goes muddy instead of hot.
 */
export type TransitionMode = 'fade' | 'burn' | 'flash' | 'cut'

export type RenderOptions = {
  hue: number
  trailBias: number
  accent: readonly [number, number, number]
  mirror: number
  /** Scene being faded out, and how far the fade has got. 1 means done. */
  from: { scene: Scene; index: number } | null
  blend: number
  mode: TransitionMode
}

/** Weights for the outgoing and incoming scene. Summing above 1 mid-fade is
 *  the point: the overlap blooms rather than dipping. */
function mixWeights(mode: TransitionMode, b: number): [number, number] {
  if (mode === 'cut') return b < 0.5 ? [1, 0] : [0, 1]
  const s = b * b * (3 - 2 * b)
  if (mode === 'fade') return [1 - s, s]
  const out = Math.sqrt(1 - b)
  const inn = Math.sqrt(b)
  if (mode === 'burn') return [out, inn]
  const spike = 1 + 0.9 * Math.sin(Math.PI * b)
  return [out * spike, inn * spike]
}

/**
 * scene -> feedback -> post. The feedback buffer is shared, so every scene
 * inherits trails and only has to describe its own look.
 */
export class Pipeline {
  private readonly vao: WebGLVertexArrayObject
  private readonly waveTex: WebGLTexture
  private readonly specTex: WebGLTexture
  private readonly omTex: WebGLTexture
  private scenePasses: Pass[] = []
  private readonly feedback: Pass
  private readonly post: Pass

  private sceneTarget: Target
  private history: [Target, Target]
  private width = 1
  private height = 1

  constructor(
    private readonly gl: WebGL2RenderingContext,
    scenes: Scene[],
  ) {
    this.vao = gl.createVertexArray()!
    this.waveTex = this.makeDataTexture(WAVE_SIZE)
    this.specTex = this.makeDataTexture(SPECTRUM_SIZE)
    this.omTex = createGlyphTexture(gl, '\u0950')
    const _unused = gl.createTexture()!
    gl.deleteTexture(_unused)
    this.feedback = this.makePass(feedbackSrc, false, 'feedback')
    this.post = this.makePass(postSrc, false, 'post')
    this.loadScenes(scenes)

    this.sceneTarget = createTarget(gl, 1, 1)
    this.history = [createTarget(gl, 1, 1), createTarget(gl, 1, 1)]
  }


  /** 1D R8 lookup table for per-frame audio data. */
  private makeDataTexture(width: number): WebGLTexture {
    const gl = this.gl
    const tex = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, width, 1, 0, gl.RED, gl.UNSIGNED_BYTE, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    return tex
  }

  private makePass(body: string, sceneMain: boolean, label: string): Pass {
    const program = createProgram(this.gl, VERT, frag(body, sceneMain), label)
    return { program, uniforms: new Uniforms(this.gl, program) }
  }

  /** Rebuilt wholesale on shader hot-reload. */
  loadScenes(scenes: Scene[]) {
    for (const pass of this.scenePasses) this.gl.deleteProgram(pass.program)
    this.scenePasses = scenes.map((s) => this.makePass(s.source, true, s.name))
  }

  resize(width: number, height: number, sceneScale: number) {
    const gl = this.gl
    const sw = Math.max(1, Math.round(width * sceneScale))
    const sh = Math.max(1, Math.round(height * sceneScale))

    if (this.sceneTarget.width !== sw || this.sceneTarget.height !== sh) {
      destroyTarget(gl, this.sceneTarget)
      this.sceneTarget = createTarget(gl, sw, sh)
    }
    if (this.width !== width || this.height !== height) {
      for (const t of this.history) destroyTarget(gl, t)
      this.history = [createTarget(gl, width, height), createTarget(gl, width, height)]
    }
    this.width = width
    this.height = height
  }

  render(frame: AudioFrame, scene: Scene, index: number, opts: RenderOptions) {
    const gl = this.gl
    const [prev, next] = this.history
    gl.bindVertexArray(this.vao)
    gl.disable(gl.BLEND)
    gl.disable(gl.DEPTH_TEST)

    gl.bindTexture(gl.TEXTURE_2D, this.waveTex)
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, WAVE_SIZE, 1, gl.RED, gl.UNSIGNED_BYTE, frame.wave)
    gl.bindTexture(gl.TEXTURE_2D, this.specTex)
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, SPECTRUM_SIZE, 1, gl.RED, gl.UNSIGNED_BYTE, frame.spectrum)

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.sceneTarget.fbo)
    gl.viewport(0, 0, this.sceneTarget.width, this.sceneTarget.height)

    // The second scene pass only runs while a transition is in flight.
    if (opts.from && opts.blend < 1) {
      const [outW, inW] = mixWeights(opts.mode, opts.blend)
      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.enable(gl.BLEND)
      gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE)
      gl.blendColor(0, 0, 0, outW)
      this.drawScene(opts.from.index, frame, opts.from.scene, opts)
      gl.blendColor(0, 0, 0, inW)
      this.drawScene(index, frame, scene, opts)
      gl.disable(gl.BLEND)
    } else {
      this.drawScene(index, frame, scene, opts)
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, next.fbo)
    gl.viewport(0, 0, this.width, this.height)
    gl.useProgram(this.feedback.program)
    uploadAudio(this.feedback.uniforms, frame, this.width, this.height, scene, opts.hue, opts.accent)
    this.feedback.uniforms.tex('uScene', 0, this.sceneTarget.tex)
    this.feedback.uniforms.tex('uPrev', 1, prev.tex)
    this.feedback.uniforms.f('uDecay', Math.min(0.985, scene.feedback.decay * opts.trailBias))
    this.feedback.uniforms.f('uFbScale', scene.feedback.scale)
    this.feedback.uniforms.f('uFbRotate', scene.feedback.rotate)
    gl.drawArrays(gl.TRIANGLES, 0, 3)

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, this.width, this.height)
    gl.useProgram(this.post.program)
    uploadAudio(this.post.uniforms, frame, this.width, this.height, scene, opts.hue, opts.accent)
    this.post.uniforms.tex('uTex', 0, next.tex)
    gl.drawArrays(gl.TRIANGLES, 0, 3)

    this.history = [next, prev]
  }

  private drawScene(index: number, frame: AudioFrame, scene: Scene, opts: RenderOptions) {
    const pass = this.scenePasses[index]
    this.gl.useProgram(pass.program)
    uploadAudio(
      pass.uniforms,
      frame,
      this.sceneTarget.width,
      this.sceneTarget.height,
      scene,
      opts.hue,
      opts.accent,
    )
    pass.uniforms.f('uMirror', opts.mirror)
    pass.uniforms.tex('uWave', 2, this.waveTex)
    pass.uniforms.tex('uSpectrum', 3, this.specTex)
    pass.uniforms.tex('uOm', 4, this.omTex)
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 3)
  }
}
