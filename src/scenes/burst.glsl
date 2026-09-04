// Prismatic burst. Each colour channel samples the ray field at a slightly
// different scale, so the edges disperse into spectral fringes the way a prism
// splits white light, rather than being tinted after the fact.
float rays(vec2 uv, float k) {
  vec2 p = kale(uv * k, 6.0 + 2.0 * floor(3.0 * uNorm[MID]));
  float r = length(p);
  float spokes = 9.0 + floor(11.0 * uNorm[LOMID]);
  float v = 0.5 + 0.5 * sin(atan(p.y, p.x) * spokes + r * 7.0 - uTime * 1.1 - uPhase * TAU);
  return smoothstep(0.12, 0.92, v) * smoothstep(0.05, 0.45, r) * exp(-1.1 * r);
}

vec3 scene(vec2 uv) {
  float disp = 0.06 + 0.18 * uNorm[BASS] + 0.22 * uImpulse[BASS];
  vec3 split = vec3(rays(uv, 1.0 - disp), rays(uv, 1.0), rays(uv, 1.0 + disp));

  vec3 col = split * (pal(0.1 + 0.8 * length(uv)) * 1.5 + 0.9);
  col += split.grb * 0.55 + split.brg * 0.35;
  col += vec3(1.0) * split.g * uImpulse[BASS] * 0.5;
  return col * (0.18 + 1.25 * uNorm[BASS]);
}
