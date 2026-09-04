// The one 3D scene. Power breathes with the sub, so the whole solid inflates
// on the kick rather than merely getting brighter.
float bulbDE(vec3 p, float power, out float trap) {
  vec3 z = p;
  float dr = 1.0;
  float r = 0.0;
  trap = 1e9;
  for (int i = 0; i < 8; i++) {
    r = length(z);
    if (r > 2.0) break;
    trap = min(trap, r);
    float theta = acos(clamp(z.z / r, -1.0, 1.0)) * power;
    float phi = atan(z.y, z.x) * power;
    dr = pow(r, power - 1.0) * power * dr + 1.0;
    z = pow(r, power) * vec3(sin(theta) * cos(phi), sin(theta) * sin(phi), cos(theta)) + p;
  }
  return 0.5 * log(max(r, 1e-6)) * r / dr;
}

vec3 bulbNormal(vec3 p, float power) {
  vec2 e = vec2(0.0015, 0.0);
  float t;
  return normalize(vec3(
    bulbDE(p + e.xyy, power, t) - bulbDE(p - e.xyy, power, t),
    bulbDE(p + e.yxy, power, t) - bulbDE(p - e.yxy, power, t),
    bulbDE(p + e.yyx, power, t) - bulbDE(p - e.yyx, power, t)));
}

vec3 scene(vec2 uv) {
  float power = 6.0 + 2.5 * uNorm[SUB] + 1.5 * uBuild;
  float t = uTime * 0.12 + uPhrase * 0.5;

  vec3 ro = vec3(sin(t) * 2.3, 0.45 * sin(t * 0.6), cos(t) * 2.3);
  vec3 fw = normalize(-ro);
  vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw));
  vec3 up = cross(fw, rt);
  vec3 rd = normalize(uv.x * rt + uv.y * up + 1.7 * fw);

  float dist = 0.0, trap = 0.0, near = 1e9;
  bool hit = false;
  for (int i = 0; i < 90; i++) {
    float tr;
    float d = bulbDE(ro + rd * dist, power, tr);
    near = min(near, d);
    if (d < 0.0015) { hit = true; trap = tr; break; }
    dist += d * 0.9;
    if (dist > 6.0) break;
  }

  vec3 col = vec3(0.0);
  if (hit) {
    vec3 n = bulbNormal(ro + rd * dist, power);
    vec3 lit = normalize(vec3(0.6, 0.8, -0.4));
    float diff = max(dot(n, lit), 0.0);
    float fres = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
    float depth = 1.0 - dist / 6.0;

    col = pal(trap * 3.2 - 0.35 + 0.15 * uNorm[MID]) * (0.12 + 0.75 * diff) * depth;
    col += pal(1.0) * fres * (0.5 + 1.2 * uImpulse[BASS]);
  }
  // Halo from near-misses only, so the interior never floods to white.
  col += pal(0.85) * exp(-40.0 * near) * 0.35;
  return col * (0.20 + 1.10 * uNorm[BASS]);
}
