// Radar scope. Nested wireframe rings with dashed tick marks and a sweep, each
// ring bound to its own band so the scope breathes outward with the spectrum.
vec3 scene(vec2 uv) {
  float r = length(uv);
  float t01 = atan(uv.y, uv.x) / TAU + 0.5;

  vec3 col = vec3(0.0);
  for (int i = 0; i < 11; i++) {
    float fi = float(i);
    float band = specAt(fi / 11.0);
    float rad = 0.12 + fi * 0.108 + band * 0.045;
    float ring = smoothstep(0.0035 + 0.012 * band, 0.0, abs(r - rad));
    float dash = step(0.35, fract(t01 * (14.0 + fi * 4.0) + uTime * 0.06 * (fi - 5.0)));
    col += pal(0.08 + fi / 11.0 * 0.85) * ring * (0.30 + dash * 1.15) * (0.9 + band * 3.4);
  }

  col += pal(1.0) * exp(-6.0 * fract(t01 - uPhase * 0.25)) * smoothstep(1.15, 0.1, r) * 0.45;
  col += pal(0.45) * (smoothstep(0.003, 0.0, abs(uv.y)) + smoothstep(0.003, 0.0, abs(uv.x))) * 0.14;
  col += pal(1.0) * exp(-28.0 * r) * (0.3 + uImpulse[BASS] * 2.2);
  return col * (0.25 + 1.15 * max(uNorm[BASS], uNorm[LOMID]));
}
