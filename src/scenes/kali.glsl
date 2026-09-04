// Kaleidoscopic IFS fold. The definitive psytrance fractal: p = abs(p)/dot(p,p) - c.
vec3 scene(vec2 uv) {
  vec2 p = uv * (1.10 - 0.25 * uNorm[SUB] - 0.12 * uBuild);
  p *= rot2(uTime * 0.05 + uPhase * 0.20 + uPhrase * 0.7);

  // Re-rolled each phrase so consecutive visits to this scene are not identical.
  float v = hash11(uPhrase + 1.0);
  vec2 c = vec2(0.62 + 0.22 * v, 0.48 + 0.22 * fract(v * 7.0))
         + 0.04 * vec2(sin(uTime * 0.11), cos(uTime * 0.13))
         + 0.04 * uImpulse[BASS];

  float iters = 8.0 + 5.0 * uNorm[LOMID];
  float glow = 0.0;
  float minD = 1e9;

  for (int i = 0; i < 14; i++) {
    if (float(i) > iters) break;
    p = abs(p) / max(dot(p, p), 1e-4) - c;
    float d = length(p);
    minD = min(minD, d);
    glow += exp(-4.0 * d);
  }

  // Gamma, or the fold fills the frame with midtones and reads as mud.
  glow = pow(glow / iters, 2.2);
  float shape = pow(1.0 - smoothstep(0.0, 0.30, minD), 2.5);

  // Hue comes from the exit angle of the fold. It spans the full ramp by
  // construction; an unbounded trap like max|p.x| saturates and the frame goes
  // one colour.
  float t = fract(atan(p.y, p.x) / TAU + 0.5 + glow * 0.3 + uPhrase * 0.13);
  vec3 col = pal(t) * (glow * 3.0 + shape * 0.5);
  col += pal(1.0) * shape * (0.20 + 0.9 * uImpulse[BASS]);
  return col * (0.5 + 0.8 * uNorm[BASS]);
}
