// Hard Voronoi that mostly does not exist. This is the industrial punch that
// separates psytech from goa: black, then gone, then black.
vec3 scene(vec2 uv) {
  float gate = pow(max(uImpulse[MID], uImpulse[AIR]), 0.6);

  vec2 p = uv * (3.0 + 4.0 * uNorm[LOMID]);
  p *= rot2(floor(uBeat) * 0.7);
  vec2 g = floor(p), f = fract(p);

  float d1 = 8.0, d2 = 8.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 o = vec2(float(x), float(y));
      vec2 pt = o + hash22(g + o) - f;
      float d = dot(pt, pt);
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) { d2 = d; }
    }
  }

  float edge = smoothstep(0.0, 0.045, sqrt(d2) - sqrt(d1));
  float cell = 1.0 - edge;

  vec3 col = pal(hash21(g)) * cell * gate * 2.2;
  col += vec3(1.0) * cell * gate * 0.25;
  col += pal(0.5) * cell * (0.02 + 0.07 * uNorm[SUB]);
  return col;
}
