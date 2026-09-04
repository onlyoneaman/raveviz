// Chrome bars refracting into spectrum. French house: shiny, mechanical, and
// unapologetically 1979.
vec3 scene(vec2 uv) {
  vec2 p = uv * rot2(uPhase * 0.10 + uTime * 0.04);
  const float BARS = 11.0;
  float idx = floor(p.x * BARS);
  float within = fract(p.x * BARS) - 0.5;

  float band = specAt(fract(abs(idx) / BARS * 0.8 + 0.05));
  float bar = step(abs(p.y), 0.22 + band * 0.90) * smoothstep(0.5, 0.33, abs(within));
  float shade = 0.35 + 0.65 * pow(1.0 - abs(within * 2.0), 2.0);

  vec3 col = pal(fract(idx * 0.13 + band * 0.6 + uTime * 0.03)) * bar * shade * (0.45 + band * 2.3);
  col += vec3(1.0) * bar * pow(shade, 6.0) * 0.7;
  col += pal(0.02) * smoothstep(0.5, 0.41, abs(within)) * bar * 0.35;
  col += vec3(1.0) * uImpulse[BASS] * bar * 0.45;
  return col * (0.2 + 1.15 * uNorm[BASS]);
}
