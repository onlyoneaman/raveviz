// Circular spectrum. Angle is frequency, radius is magnitude, mirrored left to
// right so it reads as one ring rather than a strip bent into a circle.
vec3 scene(vec2 uv) {
  float r = length(uv);
  float x = abs(atan(uv.y, uv.x) / PI);

  const float SLOTS = 110.0;
  float slot = floor(x * SLOTS);
  float within = fract(x * SLOTS);
  float edge = smoothstep(0.0, 0.18, min(within, 1.0 - within));
  float mag = specAt(pow((slot + 0.5) / SLOTS, 0.8));

  float inner = 0.30 + 0.04 * uNorm[SUB];
  float outer = inner + mag * (0.36 + 0.18 * uNorm[BASS]);

  float bar = step(inner, r) * step(r, outer) * edge;
  float cap = smoothstep(0.014, 0.0, abs(r - outer)) * edge;

  // The waveform, bent into a circle inside the ring.
  float w = waveAt(x) * (0.055 + 0.05 * uNorm[MID]);
  float trace = smoothstep(0.007, 0.0, abs(r - (inner - 0.09 + w)));

  vec3 col = pal(0.1 + mag * 0.9) * (bar * 0.5 + cap * 1.9);
  col += pal(0.85) * trace * 1.7;
  col += pal(0.4) * smoothstep(0.004, 0.0, abs(r - inner)) * 0.35;
  col += pal(1.0) * exp(-12.0 * r) * uImpulse[BASS] * 1.5;
  return col * (0.55 + 0.7 * uNorm[BASS]);
}
