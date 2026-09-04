// Receding corridor of steel beams. Hard edges and no glow: this is a former
// power station, not a mandala.
vec3 scene(vec2 uv) {
  vec3 ro = vec3(0.0, 0.0, uTime * 1.7 + uPhase * 0.5);
  vec3 rd = normalize(vec3(uv, 0.85));

  // Nearest wall of an infinite square corridor.
  float t = min(abs(1.0 / rd.x), abs(1.0 / rd.y));
  vec3 p = ro + rd * t;

  float band = specAt(fract(p.z * 0.11));
  float toBeam = abs(fract(p.z * 0.5) - 0.5) * 2.0;
  float bar = step(toBeam, 0.16 + 0.40 * band);

  vec2 wall = abs(fract(vec2(p.x, p.y) * 2.0) - 0.5) * 2.0;
  float seam = step(0.94, max(wall.x, wall.y));

  float fog = exp(-0.10 * t);
  vec3 col = pal(0.12 + band * 0.55) * bar * fog * 1.7;
  col += pal(0.85) * seam * fog * 0.35;

  // Hard blackout on the snare. No ramp: it is on or it is not.
  col *= 1.0 - step(0.35, uImpulse[MID]) * 0.85;
  col += vec3(1.0) * uImpulse[BASS] * bar * fog * 0.9;
  return col * (0.14 + 1.2 * uNorm[BASS]);
}
