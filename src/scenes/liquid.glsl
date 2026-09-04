// Oil-slick marbling. Domain warping folds the field back through itself, which
// is what makes the bands flow like liquid instead of scrolling like a texture.
vec3 scene(vec2 uv) {
  vec2 p = vec2(abs(uv.x), uv.y) * 1.15;
  float t = uTime * 0.13;

  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3 - t)));
  vec2 w = vec2(fbm(p + 3.4 * q + vec2(1.7, 9.2) + 0.15 * t),
                fbm(p + 3.4 * q + vec2(8.3, 2.8) - 0.12 * t));
  float f = fbm(p + 4.0 * w + vec2(0.0, t * 0.4));

  float bands = fract(f * (5.0 + 7.0 * uNorm[LOMID]) + uPhase * 0.3);
  float edge = smoothstep(0.0, 0.07, bands) * smoothstep(1.0, 0.93, bands);

  vec3 col = pal(fract(f * 2.4 + uNorm[MID] * 0.4 + uTime * 0.02)) * edge * (0.5 + 2.2 * f);
  col += pal(1.0) * uImpulse[BASS] * edge * 0.6;
  return col * (0.18 + 1.2 * uNorm[BASS]);
}
