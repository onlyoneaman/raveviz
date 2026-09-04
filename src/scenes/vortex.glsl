// Kaleidoscopic tunnel with spectrum-driven walls. 1/r is the tunnel depth
// trick: it turns the plane inside out so rings rush the viewer forever.
vec3 scene(vec2 uv) {
  float folds = 6.0 + 2.0 * floor(3.0 * uNorm[MID]);
  vec2 p = kale(uv, folds);

  float r = length(p);
  float a = atan(p.y, p.x);

  float z = 1.0 / max(r, 0.045) + uTime * 0.55 + uPhase * 0.35;
  float ring = fract(z);
  float band = specAt(fract(z * 0.22));

  float wall = smoothstep(0.42, 0.0, abs(ring - 0.5)) * band;
  float ribs = smoothstep(0.06, 0.0, abs(fract(a * folds * 0.5 + z * 0.2) - 0.5)) * band;
  float core = exp(-2.2 * r) * (0.35 + uImpulse[BASS] * 1.7);

  vec3 col = pal(fract(z * 0.15 + band * 0.5)) * (wall * 2.0 + ribs * 0.55);
  col += pal(1.0) * core;
  col *= smoothstep(0.0, 0.22, r);
  return col * (0.18 + 1.20 * uNorm[BASS]);
}
