// Sri Yantra core. Interlocking up and down triangles make the Star of David,
// ringed by lotus petals, with Om at the bindu. The Om is the real Devanagari
// glyph rasterised to a texture, not an approximation built from arcs.
vec3 scene(vec2 uv) {
  vec2 p = uv * (1.42 - 0.16 * uNorm[SUB]);
  p *= rot2(uPhase * 0.04 + uTime * 0.015);

  vec3 col = vec3(0.0);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float sc = 0.92 - fi * 0.25;
    float band = specAt(0.08 + fi * 0.3);
    float w = 0.005 + 0.016 * band;
    float star = ring(sdTriangle(p, sc), w) + ring(sdTriangle(vec2(p.x, -p.y), sc), w);
    col += pal(0.12 + fi * 0.3 + band * 0.4) * star * (1.1 + band * 3.2);
  }

  float petals = ring(sdCircle(kale(p, 16.0) - vec2(1.06, 0.0), 0.16), 0.007 + 0.020 * uNorm[MID]);
  col += pal(0.9) * petals * (0.8 + uImpulse[MID] * 1.8);
  col += pal(0.55) * ring(length(p) - 1.20, 0.009) * 1.1;

  float om = omAt(p * 1.5);
  col = mix(col, vec3(0.0), om * 0.55);
  col += pal(1.0) * om * (2.2 + uImpulse[BASS] * 2.6 + uNorm[MID] * 1.2);
  return col * (0.22 + 1.0 * max(uNorm[LOMID], uNorm[BASS]));
}
