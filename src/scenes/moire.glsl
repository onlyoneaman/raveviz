// Two identical line grids at a small angle to each other. The moire bands come
// from the angle, not a frequency difference: that is what makes them broad and
// readable rather than a fine cross-hatch that just aliases.
float bars(vec2 p, float w) { return step(abs(fract(p.x) - 0.5) * 2.0, w); }

vec3 scene(vec2 uv) {
  float freq = 8.0 + 11.0 * uNorm[LOMID];
  float a = uTime * 0.05 + uPhase * 0.12;
  float delta = 0.05 + 0.11 * uNorm[MID] + 0.05 * uImpulse[BASS];

  float w = 0.5 - 0.16 * uNorm[BASS];
  float inter = bars(rot2(a) * uv * freq, w) * bars(rot2(a + delta) * uv * freq, w);

  float r = length(uv) * (5.0 + 5.0 * uNorm[SUB]) - uPhase;
  float rings = step(abs(fract(r) - 0.5) * 2.0, 0.22);

  vec3 col = pal(0.05 + 0.5 * uNorm[MID]) * inter * 1.9;
  col += pal(1.0) * rings * inter * 0.8;
  col += vec3(1.0) * uImpulse[BASS] * inter * 0.8;
  return col * (0.12 + 1.25 * uNorm[LOMID]);
}
