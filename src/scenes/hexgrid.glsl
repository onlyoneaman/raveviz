// Hex LED wall. Horizontal position is frequency and vertical is level, so the
// panel reads as a spectrum analyser. Giving each cell a random bin instead
// just produces noise that happens to flicker in time.
vec3 scene(vec2 uv) {
  float k = 5.0 + 3.0 * uNorm[LOMID];
  vec2 p = uv * k;

  const vec2 R = vec2(1.0, 1.7320508);
  vec2 a = mod(p, R) - R * 0.5;
  vec2 b = mod(p - R * 0.5, R) - R * 0.5;
  vec2 gv = dot(a, a) < dot(b, b) ? a : b;
  vec2 cell = (p - gv) / k;

  float band = specAt(clamp(cell.x / (uRes.x / uRes.y) * 0.5 + 0.5, 0.0, 1.0));
  float level = (cell.y + 1.0) * 0.5;
  float on = smoothstep(0.05, -0.02, level - band);
  float head = smoothstep(0.10, 0.0, abs(level - band));

  float d = sdHex(gv, 0.42);
  float face = smoothstep(0.03, -0.03, d);

  vec3 col = pal(0.08 + level * 0.85) * face * on * 2.2;
  col += pal(0.15) * face * 0.045 * (0.4 + uNorm[LOMID]);
  col += pal(1.0) * face * head * (0.8 + uImpulse[BASS] * 1.8);
  col += pal(0.4) * ring(d, 0.035) * (0.16 + 0.5 * on);
  return col * (0.18 + 1.2 * uNorm[BASS]);
}
