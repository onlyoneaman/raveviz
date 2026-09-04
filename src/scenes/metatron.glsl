// Flower of Life over a hex lattice. Rotates with the track, quarter-turn snap
// on the downbeat once the tempo lock is confident enough to trust.
vec3 scene(vec2 uv) {
  float snap = floor(uBeat) * PI * 0.5 * step(0.5, uConf);
  vec2 p = uv * (1.6 - 0.2 * uNorm[SUB]);
  p *= rot2(uTime * 0.05 + snap * 0.06 + uPhase * 0.02);

  float w = 0.010 + 0.030 * uNorm[LOMID] + 0.020 * uImpulse[LOMID];

  float acc = 0.0;
  for (int i = 0; i < 19; i++) {
    float fi = float(i);
    float shell = fi < 1.0 ? 0.0 : (fi < 7.0 ? 1.0 : 2.0);
    float k = fi < 1.0 ? 0.0 : (fi < 7.0 ? fi - 1.0 : fi - 7.0);
    float n = shell < 1.5 ? 6.0 : 12.0;
    vec2 o = shell < 0.5 ? vec2(0.0) : vec2(cos(k / n * TAU), sin(k / n * TAU)) * shell * 0.42;
    acc += ring(sdCircle(p - o, 0.42), w);
  }

  float hex = ring(sdHex(kale(p, 6.0) - vec2(0.9, 0.0), 0.30), w * 0.8);

  vec3 col = pal(0.15 + 0.5 * acc + 0.3 * uNorm[MID]) * acc * 1.1;
  col += pal(0.95) * hex * (0.4 + uImpulse[MID]);
  return col * (0.4 + 1.0 * uNorm[LOMID]);
}
