uniform sampler2D uScene;
uniform sampler2D uPrev;
uniform float uDecay;
uniform float uFbScale;
uniform float uFbRotate;

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;

  vec2 c = (uv - 0.5) * vec2(aspect, 1.0);
  c = rot2(uFbRotate) * c * uFbScale;
  vec2 prevUv = c / vec2(aspect, 1.0) + 0.5;

  vec3 prev = texture(uPrev, prevUv).rgb * uDecay;
  vec2 inside = step(vec2(0.0), prevUv) * step(prevUv, vec2(1.0));
  prev *= inside.x * inside.y;

  fragColor = vec4(max(texture(uScene, uv).rgb, prev), 1.0);
}
