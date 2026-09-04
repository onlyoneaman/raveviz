// Deliberately simple source. The infinite spiral comes from the feedback pass,
// which this scene configures with a large scale and rotation in the registry.
vec3 scene(vec2 uv) {
  vec2 p = uv * (1.0 + 0.20 * uNorm[SUB]);
  float r = length(p);
  float a = atan(p.y, p.x);

  float spokes = 6.0 + floor(6.0 * uNorm[MID]);
  float spoke = ring(sin(a * spokes + uTime * 0.4 + uPhase * TAU) * 0.5, 0.05 + 0.10 * uNorm[AIR]);
  float rings = ring(fract(r * 4.0 - uPhase - uTime * 0.15) - 0.5, 0.07);
  float core = exp(-6.0 * r) * (0.5 + uImpulse[BASS]);

  vec3 col = pal(fract(r * 1.5 + uTime * 0.05)) * (rings * 0.9 + spoke * 0.5);
  col += pal(0.9) * core * 1.2;
  return col * (0.14 + 1.10 * uNorm[BASS]);
}
