// Neon corridor over a wet floor. The reflection is the same corridor sampled
// with y mirrored below the floor line, dimmed and rippled.
vec3 corridor(vec2 uv) {
  vec3 col = vec3(0.0);
  float z = uTime * 0.85 + uPhase * 0.35;

  for (int i = 0; i < 14; i++) {
    float depth = float(i) + 1.0 - fract(z);
    float slab = float(i) + floor(z);
    float band = specAt(fract(slab * 0.09));
    float halfSize = 2.2 / depth;
    float w = (0.030 + 0.055 * band) / depth;

    float frame = smoothstep(w, 0.0, abs(max(abs(uv.x), abs(uv.y)) - halfSize));
    col += pal(fract(slab * 0.13)) * frame * (1.2 + band * 3.4) * smoothstep(0.0, 0.35, 1.0 / depth);
  }
  return col;
}

vec3 scene(vec2 uv) {
  const float FLOOR = -0.52;
  bool wet = uv.y < FLOOR;
  vec2 q = wet ? vec2(uv.x, FLOOR * 2.0 - uv.y) : uv;

  vec3 col = corridor(q);
  if (wet) {
    col *= 0.38 * smoothstep(-1.35, FLOOR, uv.y);
    col *= 0.65 + 0.35 * noise2(vec2(uv.x * 13.0, uv.y * 44.0 + uTime * 0.8));
  }
  col += pal(1.0) * uImpulse[BASS] * 0.18;
  return col * (0.3 + 1.25 * uNorm[BASS]);
}
