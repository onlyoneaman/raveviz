// Goa mandala. Layered kaleidoscopic petal rings turning at different rates and
// opposite directions, the way blacklight festival backdrops are built up.
vec3 scene(vec2 uv) {
  vec3 col = vec3(0.0);
  float r0 = length(uv);

  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float petals = 6.0 + fi * 6.0;
    float dir = mod(fi, 2.0) < 0.5 ? 1.0 : -1.0;

    vec2 p = uv * rot2(uTime * 0.12 * dir * (1.0 + fi * 0.3) + uPhase * 0.4 * dir);
    p = kale(p, petals);

    float band = specAt(0.08 + fi * 0.22);
    float radius = 0.30 + fi * 0.27 + band * 0.12;
    float w = 0.010 + 0.020 * band + 0.015 * uImpulse[LOMID];

    float petal = ring(sdCircle(p - vec2(radius, 0.0), 0.16 + 0.05 * band), w);
    float arc = ring(length(p) - radius, w * 0.7);
    float spike = ring(sdHex(p - vec2(radius * 1.25, 0.0), 0.07 + 0.04 * band), w * 0.8);

    col += pal(fi / 3.0 * 0.8 + band * 0.3)
         * (petal * 1.1 + arc * 0.5 + spike * 0.6)
         * (0.35 + band * 1.4);
  }

  float eye = ring(sdCircle(uv, 0.10 + 0.03 * uNorm[SUB]), 0.006 + 0.020 * uImpulse[BASS]);
  col += pal(1.0) * eye * 1.6;
  col += pal(0.9) * exp(-9.0 * r0) * (0.25 + uImpulse[BASS] * 1.5);

  return col * (0.18 + 1.20 * uNorm[BASS]);
}
