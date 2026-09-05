// Mainstage deity mask. Every feature is drawn from the mirrored half-plane, so
// the face is symmetric by construction rather than by careful placement.
vec3 scene(vec2 uv) {
  vec2 p = vec2(abs(uv.x), uv.y) * 0.98;
  vec3 col = vec3(0.0);

  float low = specAt(0.10);
  float head = ring(length(vec2(p.x / 0.72, (p.y - 0.05) / 0.95)) - 1.0, 0.020 + 0.030 * low);
  col += pal(0.12 + low * 0.45) * head * (2.2 + low * 3.4);

  float jaw = ring(length(vec2(p.x / 0.52, (p.y + 0.62) / 0.42)) - 1.0, 0.014);
  col += pal(0.35) * jaw * (1.3 + uNorm[LOMID] * 2.0);

  vec2 e = p - vec2(0.32, 0.12);
  col += pal(0.85) * ring(length(vec2(e.x / 0.20, e.y / 0.095)) - 1.0, 0.012)
       * (1.8 + specAt(0.40) * 2.6);
  col += pal(1.0) * smoothstep(0.055, 0.028, length(e)) * (0.5 + uImpulse[MID] * 1.8);

  col += pal(0.5) * ring(length(vec2((p.x - 0.33) / 0.26, (p.y - 0.30) / 0.10)) - 1.0, 0.010)
       * (1.1 + uNorm[MID] * 1.4);

  // Third eye, opening on the kick.
  vec2 t = p - vec2(0.0, 0.52);
  float open = 0.05 + 0.11 * uImpulse[BASS] + 0.05 * uNorm[SUB];
  col += pal(1.0) * ring(length(vec2(t.x / open, t.y / 0.16)) - 1.0, 0.012)
       * (1.3 + uImpulse[BASS] * 2.6);

  float lips = 0.05 + 0.10 * uNorm[MID];
  col += pal(0.7) * ring(length(vec2(p.x / 0.30, (p.y + 0.42) / lips)) - 1.0, 0.012)
       * (1.4 + uNorm[MID] * 2.0);

  vec2 k = kale(uv * 0.98 - vec2(0.0, 0.15), 9.0);
  col += pal(0.9) * ring(sdCircle(k - vec2(1.18, 0.0), 0.05), 0.008) * step(0.10, uv.y)
       * (0.9 + specAt(0.72) * 2.4);

  return col * (0.20 + 1.15 * uNorm[BASS]);
}
