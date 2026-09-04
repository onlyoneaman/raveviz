// Balearic horizon. Warm gradient, a sun disc sliced by the spectrum, mirrored
// on water below. Deep house wants somewhere warm, not a warehouse.
vec3 scene(vec2 uv) {
  const float HORIZON = -0.18;
  bool water = uv.y < HORIZON;
  float y = water ? HORIZON * 2.0 - uv.y : uv.y;
  float h = y - HORIZON;

  vec3 col = mix(pal(0.0), pal(0.7), clamp(h * 0.85, 0.0, 1.0)) * 0.26;

  float sun = smoothstep(0.40, 0.375, length(vec2(uv.x, h - 0.34)));
  float slice = step(0.30, specAt(fract(h * 2.4)));
  col += pal(0.95) * sun * (0.30 + slice * 1.25) * 1.5;

  if (water) {
    float rip = sin((uv.y - HORIZON) * 55.0 + uTime * 1.8 + uNorm[BASS] * 7.0);
    col *= 0.45 + 0.55 * smoothstep(-0.35, 0.35, rip);
    col *= 0.18 + 0.9 * smoothstep(-1.35, HORIZON, uv.y);
  }

  col += pal(1.0) * uImpulse[BASS] * sun * 0.7;
  return col * (0.24 + 1.05 * uNorm[BASS]);
}
