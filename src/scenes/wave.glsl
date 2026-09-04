// The honest one. Draws the literal input samples, ungated and unsmoothed, so
// there is never any doubt about whether the thing is actually hearing you.
vec3 scene(vec2 uv) {
  float aspect = uRes.x / uRes.y;
  float x = uv.x / aspect * 0.5 + 0.5;

  float s = waveAt(x);
  float amp = 0.62;
  float thickness = 0.006 + 0.010 * uNorm[BASS];

  float d = abs(uv.y - s * amp);
  float line = smoothstep(thickness, 0.0, d);
  float halo = smoothstep(thickness * 14.0, 0.0, d);

  // Neighbouring samples, so steep edges stay connected instead of dashing.
  float step0 = 1.0 / uRes.x * aspect;
  float prev = waveAt(x - step0), next = waveAt(x + step0);
  float lo = min(min(prev, next), s) * amp, hi = max(max(prev, next), s) * amp;
  line = max(line, smoothstep(thickness, 0.0, max(0.0, max(lo - uv.y, uv.y - hi))));

  float axis = smoothstep(0.0018, 0.0, abs(uv.y)) * 0.18;
  float ticks = smoothstep(0.9, 1.0, abs(fract(x * 16.0) * 2.0 - 1.0))
              * smoothstep(0.035, 0.0, abs(uv.y)) * 0.25;

  vec3 col = pal(0.15 + 0.7 * abs(s)) * (line * 2.4 + halo * 0.28);
  col += pal(0.05) * (axis + ticks);
  col += pal(1.0) * line * uImpulse[BASS] * 1.1;
  return col;
}
