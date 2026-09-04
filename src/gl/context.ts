export type Target = {
  fbo: WebGLFramebuffer
  tex: WebGLTexture
  width: number
  height: number
}

export function createContext(canvas: HTMLCanvasElement): WebGL2RenderingContext {
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false,
  })
  if (!gl) throw new Error('WebGL2 is required and this browser did not provide it.')
  gl.getExtension('EXT_color_buffer_float')
  return gl
}

function compile(gl: WebGL2RenderingContext, type: number, src: string, label: string) {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? ''
    gl.deleteShader(shader)
    throw new Error(`[${label}] ${log}\n${numbered(src, log)}`)
  }
  return shader
}

/** Shader logs give a line number and nothing else, so print the neighbourhood. */
function numbered(src: string, log: string) {
  const match = /ERROR:\s*\d+:(\d+)/.exec(log)
  if (!match) return ''
  const target = Number(match[1])
  return src
    .split('\n')
    .map((line, i) => [i + 1, line] as const)
    .filter(([n]) => Math.abs(n - target) <= 4)
    .map(([n, line]) => `${String(n).padStart(4)} | ${line}`)
    .join('\n')
}

export function createProgram(
  gl: WebGL2RenderingContext,
  vertexSrc: string,
  fragmentSrc: string,
  label: string,
): WebGLProgram {
  const vs = compile(gl, gl.VERTEX_SHADER, vertexSrc, `${label}:vert`)
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragmentSrc, `${label}:frag`)
  const program = gl.createProgram()!
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program)
    gl.deleteProgram(program)
    throw new Error(`[${label}:link] ${log}`)
  }
  return program
}

export function createTarget(gl: WebGL2RenderingContext, width: number, height: number): Target {
  const tex = gl.createTexture()!
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.HALF_FLOAT, null)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  const fbo = gl.createFramebuffer()!
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)

  return { fbo, tex, width, height }
}

export function destroyTarget(gl: WebGL2RenderingContext, t: Target) {
  gl.deleteFramebuffer(t.fbo)
  gl.deleteTexture(t.tex)
}

/** Uniform locations are looked up once; missing names resolve to null and are skipped. */
export class Uniforms {
  private readonly cache = new Map<string, WebGLUniformLocation | null>()
  constructor(
    private readonly gl: WebGL2RenderingContext,
    private readonly program: WebGLProgram,
  ) {}

  private at(name: string) {
    let loc = this.cache.get(name)
    if (loc === undefined) {
      loc = this.gl.getUniformLocation(this.program, name)
      this.cache.set(name, loc)
    }
    return loc
  }

  f(name: string, v: number) {
    const l = this.at(name)
    if (l) this.gl.uniform1f(l, v)
  }
  fv(name: string, v: Float32Array) {
    const l = this.at(name)
    if (l) this.gl.uniform1fv(l, v)
  }
  v2(name: string, x: number, y: number) {
    const l = this.at(name)
    if (l) this.gl.uniform2f(l, x, y)
  }
  v3(name: string, x: number, y: number, z: number) {
    const l = this.at(name)
    if (l) this.gl.uniform3f(l, x, y, z)
  }
  tex(name: string, unit: number, texture: WebGLTexture) {
    const l = this.at(name)
    if (!l) return
    this.gl.activeTexture(this.gl.TEXTURE0 + unit)
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
    this.gl.uniform1i(l, unit)
  }
}
