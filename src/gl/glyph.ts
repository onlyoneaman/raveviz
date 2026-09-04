/**
 * Rasterises a glyph to an R8 texture. Approximating Om with SDF arcs gets you
 * something Om-shaped; drawing the actual character gets you Om.
 */
export function createGlyphTexture(
  gl: WebGL2RenderingContext,
  char: string,
  size = 512,
): WebGLTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `${Math.round(size * 0.72)}px "Kohinoor Devanagari", "Devanagari Sangam MN", "Noto Sans Devanagari", serif`
  ctx.fillText(char, size / 2, size / 2)

  const rgba = ctx.getImageData(0, 0, size, size).data
  const red = new Uint8Array(size * size)
  for (let i = 0; i < red.length; i++) red[i] = rgba[i * 4]

  const tex = gl.createTexture()!
  gl.bindTexture(gl.TEXTURE_2D, tex)
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, size, size, 0, gl.RED, gl.UNSIGNED_BYTE, red)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4)
  return tex
}
