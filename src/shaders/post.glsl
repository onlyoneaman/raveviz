uniform sampler2D uTex;

vec3 aberrated(vec2 uv, float amt) {
  vec2 dir = uv - 0.5;
  return vec3(
    texture(uTex, uv - dir * amt).r,
    texture(uTex, uv).g,
    texture(uTex, uv + dir * amt).b
  );
}

/** Single-pass bloom over a golden-angle spiral of the bright parts. */
vec3 bloom(vec2 uv, float radius) {
  const float GA = 2.399963;
  vec3 sum = vec3(0.0);
  for (int i = 0; i < 20; i++) {
    float fi = float(i) + 1.0;
    float rad = sqrt(fi / 20.0) * radius;
    float ang = fi * GA;
    vec2 o = vec2(cos(ang), sin(ang)) * rad * vec2(uRes.y / uRes.x, 1.0);
    sum += max(texture(uTex, uv + o).rgb - 0.60, 0.0);
  }
  return sum / 20.0;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;

  // Whole-frame punch on the kick, so every scene reacts even if its own
  // shader barely does.
  float punch = uImpulse[SUB] * 0.4 + uImpulse[BASS];
  uv = 0.5 + (uv - 0.5) * (1.0 - uKickZoom * punch - 0.04 * uDrop);

  vec3 col = aberrated(uv, 0.002 + 0.022 * uNorm[BASS] + 0.030 * uDrop);
  col *= 1.0 + uKickFlash * punch;
  col += bloom(uv, 0.020 + 0.020 * uNorm[AIR]) * (0.9 + 1.1 * uNorm[AIR]);

  col *= smoothstep(1.25, 0.35, length(uv - 0.5) * 1.6);
  // Silence must look like silence, not like quiet music.
  col *= mix(0.35, 1.0, smoothstep(0.0, 0.35, uEnergy));
  col = mix(col, vec3(1.0), clamp(uDrop * 0.85, 0.0, 1.0));
  col = aces(col * (1.0 + 0.6 * uBuild));

  // Grain is not decoration: it stops near-black gradients banding on a big panel.
  col += (hash21(gl_FragCoord.xy + fract(uTime) * 511.0) - 0.5) * (0.012 + 0.030 * uNorm[AIR]);

  fragColor = vec4(col, 1.0);
}
