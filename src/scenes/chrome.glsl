// Liquid chrome. Metaballs summed into a scalar field and shaded by its
// gradient, so the surface reads as metal instead of flat overlapping discs.
float blobField(vec2 p) {
  float v = 0.0;
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    float rad = 0.10 + 0.18 * specAt(fi / 7.0);
    vec2 c = vec2(sin(uTime * (0.23 + fi * 0.07) + fi * 2.1),
                  cos(uTime * (0.19 + fi * 0.05) + fi * 1.3)) * vec2(1.55, 0.85);
    v += rad * rad / max(dot(p - c, p - c), 1e-3);
  }
  return v;
}

vec3 scene(vec2 uv) {
  float v = blobField(uv);
  const float E = 0.012;
  vec2 n = normalize(vec2(blobField(uv + vec2(E, 0.0)) - blobField(uv - vec2(E, 0.0)),
                          blobField(uv + vec2(0.0, E)) - blobField(uv - vec2(0.0, E))) + 1e-6);

  float surf = smoothstep(0.85, 1.15, v);
  float rim = smoothstep(1.6, 0.95, v) * smoothstep(0.82, 1.05, v);

  vec3 col = pal(0.1 + 0.5 * n.x + 0.4 * n.y + 0.2 * uNorm[MID]) * surf * (0.45 + 0.18 * v);
  col += vec3(1.0) * pow(max(0.0, dot(n, normalize(vec2(0.6, 0.8)))), 10.0) * surf * 0.55;
  col += pal(1.0) * rim * (0.6 + uImpulse[BASS] * 1.9);
  return col * (0.2 + 1.15 * uNorm[BASS]);
}
