// Rig overhead, shafts down through smoke. Each shaft owns a slice of the
// spectrum and switches hard rather than fading, the way a real rig does.
vec3 scene(vec2 uv) {
  vec3 col = vec3(0.0);
  float down = 1.0 - (uv.y + 1.0) * 0.5;

  for (int i = 0; i < 9; i++) {
    float slot = (float(i) + 0.5) / 9.0;
    float band = specAt(pow(slot, 0.7));
    float x0 = (slot * 2.0 - 1.0) * 1.75;
    float sway = sin(uTime * 0.5 + float(i) * 1.7 + uPhase * TAU) * (0.12 + 0.38 * band);

    float spread = 0.040 + 0.13 * down;
    float shaft = smoothstep(spread, spread * 0.12, abs(uv.x - (x0 + sway * down)));
    col += pal(band * 0.55)
         * shaft * smoothstep(-1.05, 0.95, uv.y) * step(0.05, band)
         * (0.9 + band * 3.2);
  }

  col += pal(0.5) * fbm(uv * 2.0 + vec2(0.0, uTime * 0.06)) * 0.07 * uNorm[AIR];
  col += vec3(1.0) * uImpulse[BASS] * 0.3;
  return col * (0.18 + 1.3 * uNorm[BASS]);
}
