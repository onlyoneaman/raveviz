// Flower of Life over a hex lattice. Each shell is driven by its own slice of
// the spectrum, so the figure breathes from the inside out rather than just
// getting brighter.
vec3 scene(vec2 uv) {
  float snap = floor(uBeat) * PI * 0.5 * step(0.5, uConf);
  vec2 p = uv * (1.24 - 0.18 * uNorm[SUB]);
  p *= rot2(uTime * 0.05 + snap * 0.06 + uPhase * 0.02);

  vec3 col = vec3(0.0);
  float lit = 0.0;

  for (int i = 0; i < 19; i++) {
    float fi = float(i);
    float shell = fi < 1.0 ? 0.0 : (fi < 7.0 ? 1.0 : 2.0);
    float k = fi < 1.0 ? 0.0 : (fi < 7.0 ? fi - 1.0 : fi - 7.0);
    float n = shell < 1.5 ? 6.0 : 12.0;
    vec2 o = shell < 0.5 ? vec2(0.0) : vec2(cos(k / n * TAU), sin(k / n * TAU)) * shell * 0.42;

    // Each circle takes a different slice of the spectrum.
    float band = specAt(fract(0.06 + shell * 0.3 + k / n * 0.28));
    float w = 0.006 + 0.026 * band + 0.020 * uImpulse[LOMID];
    float c = ring(sdCircle(p - o, 0.42 + 0.03 * band), w);

    col += pal(0.1 + shell * 0.3 + band * 0.55) * c * (0.35 + band * 2.2);
    lit += c;
  }

  float hex = ring(sdHex(kale(p, 6.0) - vec2(0.9, 0.0), 0.30), 0.008 + 0.02 * uNorm[MID]);
  col += pal(0.95) * hex * (0.25 + uImpulse[MID] * 1.6);
  col += pal(1.0) * lit * uImpulse[BASS] * 0.5;
  return col * (0.16 + 1.15 * uNorm[LOMID]);
}
