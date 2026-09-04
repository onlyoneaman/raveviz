// Circular spectrum. Angle is frequency, radius is magnitude, mirrored left to
// right so it reads as one ring rather than a strip bent into a circle.
vec3 scene(vec2 uv) {
  float r = length(uv);
  // Bass at the bottom sweeping up both sides to treble at the top. Mapping
  // frequency straight onto the angle instead puts all the loud low end on one
  // side and the ring reads lopsided.
  float ang = atan(uv.y, uv.x);
  float x = abs(mod(ang + PI * 1.5, TAU) - PI) / PI;

  const float SLOTS = 110.0;
  float slot = floor(x * SLOTS);
  float within = fract(x * SLOTS);
  float edge = smoothstep(0.0, 0.18, min(within, 1.0 - within));
  float mag = specAt(pow((slot + 0.5) / SLOTS, 0.8));

  float inner = 0.44 + 0.05 * uNorm[SUB];
  float outer = inner + mag * (0.46 + 0.20 * uNorm[BASS]);

  float bar = step(inner, r) * step(r, outer) * edge;
  float cap = smoothstep(0.014, 0.0, abs(r - outer)) * edge;

  // The waveform, bent into a circle inside the ring.
  float w = waveAt(x) * (0.075 + 0.06 * uNorm[MID]);
  float trace = smoothstep(0.008, 0.0, abs(r - (inner - 0.14 + w)));

  vec3 col = pal(0.1 + mag * 0.9) * (bar * 0.5 + cap * 1.9);
  col += pal(0.85) * trace * 1.7;
  col += pal(0.4) * smoothstep(0.004, 0.0, abs(r - inner)) * 0.35;
  // Spokes run past the ring to the edges, so an ultrawide is not mostly black.
  float spoke = smoothstep(0.0, 0.06, min(within, 1.0 - within)) * step(outer, r);
  col += pal(0.2 + mag) * spoke * mag * mag * 0.5 * smoothstep(1.6, 0.5, r);
  col += pal(1.0) * exp(-9.0 * r) * uImpulse[BASS] * 1.5;
  return col * (0.55 + 0.7 * uNorm[BASS]);
}
