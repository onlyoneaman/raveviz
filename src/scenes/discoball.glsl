// Mirror ball. Each facet throws a spot that owns a slice of the spectrum, so
// the room lights up in patches instead of all at once.
vec3 scene(vec2 uv) {
  vec3 col = vec3(0.0);
  float spin = uTime * 0.25 + uPhase * 0.22;

  for (int i = 0; i < 28; i++) {
    float fi = float(i);
    float a = fi * 2.39996 + spin;
    float z = hash11(fi) * 2.0 - 1.0;
    // Spread across the frame, not a unit circle: most spots landed off-screen
    // vertically before this.
    vec2 pos = vec2(cos(a) * sqrt(1.0 - z * z) * 1.95, z * 0.92)
             * (0.85 + 0.20 * sin(uTime * 0.3 + fi));

    float band = specAt(fract(hash11(fi + 7.0)));
    float size = 0.055 + 0.090 * band;
    col += pal(hash11(fi + 3.0))
         * smoothstep(size, size * 0.18, length(uv - pos))
         * (0.55 + band * 3.4);
  }

  float ball = smoothstep(0.17, 0.15, length(uv));
  float facet = step(0.5, fract(atan(uv.y, uv.x) * 3.0 + spin * 2.0)) * step(0.5, fract(uv.y * 15.0));
  col += pal(0.8) * ball * (0.22 + facet * 0.8 + uImpulse[BASS] * 0.9);
  return col * (0.2 + 1.15 * uNorm[BASS]);
}
