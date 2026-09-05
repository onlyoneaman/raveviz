uniform vec2  uRes;
uniform float uTime;
uniform float uNorm[5];
uniform float uImpulse[5];
uniform float uRms;
uniform float uCentroid;
uniform float uFlatness;
uniform float uBpm;
uniform float uPhase;
uniform float uBeat;
uniform float uBar;
uniform float uPhrase;
uniform float uConf;
uniform float uBuild;
uniform float uDrop;
uniform float uEnergy;
uniform float uHue;
uniform vec3  uPalA;
uniform vec3  uPalB;
uniform vec3  uPalC;
uniform float uCamSpin;
uniform float uCamZoom;
uniform sampler2D uWave;
uniform sampler2D uSpectrum;
uniform sampler2D uOm;
uniform float uNyquist;
uniform float uKickZoom;
uniform float uKickFlash;
uniform float uBloom;
uniform float uFill;
uniform float uMirror;

/** Time-domain sample at x in 0..1, returned in -1..1. */
float waveAt(float x) { return texture(uWave, vec2(clamp(x, 0.0, 1.0), 0.5)).r * 2.0 - 1.0; }

/** Coverage of the Om glyph at p, where the glyph fills roughly -1..1. */
float omAt(vec2 p) {
  vec2 uv = p * 0.5 + 0.5;
  uv.y = 1.0 - uv.y;
  vec2 inside = step(vec2(0.0), uv) * step(uv, vec2(1.0));
  return texture(uOm, uv).r * inside.x * inside.y;
}

/** Signed distance to an equilateral triangle of radius r, point up. */
float sdTriangle(vec2 p, float r) {
  const float K = 1.7320508;
  p.x = abs(p.x) - r;
  p.y = p.y + r / K;
  if (p.x + K * p.y > 0.0) p = vec2(p.x - K * p.y, -K * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}

/** Magnitude 0..1 at x in 0..1, log-spaced across 20Hz to 16kHz. */
float specAt(float x) {
  float hz = 20.0 * pow(800.0, clamp(x, 0.0, 1.0));
  return texture(uSpectrum, vec2(hz / uNyquist, 0.5)).r;
}

#define SUB   0
#define BASS  1
#define LOMID 2
#define MID   3
#define AIR   4

/**
 * Three-stop ramp. The third stop is borrowed from another scene's palette and
 * re-rolled each phrase, so colours keep mixing instead of sitting on one axis.
 */
vec3 pal(float t) {
  t = clamp(t, 0.0, 1.0);
  vec3 c = t < 0.5
    ? mix(uPalA, uPalB, smoothstep(0.0, 1.0, t * 2.0))
    : mix(uPalB, uPalC, smoothstep(0.0, 1.0, t * 2.0 - 1.0));
  return hueRotate(c, uHue);
}

/** Random symmetry fold, re-rolled per scene. */
vec2 mirrorFold(vec2 uv, float mode) {
  if (mode < 0.5) return uv;
  if (mode < 1.5) return vec2(abs(uv.x), uv.y);
  if (mode < 2.5) return vec2(uv.x, abs(uv.y));
  if (mode < 3.5) return abs(uv);
  return kale(uv, mode < 4.5 ? 4.0 : 8.0);
}

/**
 * Shared backdrop for scenes that are a single centred object. Three layers,
 * all weak and all audio-driven: drifting haze, spectrum rings spreading
 * outward, and a faint grid that only appears away from the centre. Without it
 * a wide screen is mostly dead black around the subject.
 */
vec3 ambient(vec2 uv) {
  float r = length(uv);
  // Gated away from the middle, so it never competes with the subject.
  float far = smoothstep(0.45, 1.7, r);

  // Thresholded to wisps. Without the cut this reads as a wash, not texture.
  float haze = fbm(uv * 1.6 + vec2(uTime * 0.03, -uTime * 0.02));
  haze = pow(max(haze - 0.45, 0.0) * 2.2, 2.0);
  vec3 col = pal(0.15 + haze * 0.5) * haze * (0.10 + 0.40 * uNorm[SUB]);

  // Thin rings travelling outward, not a glow.
  float w = specAt(fract(r * 0.38 - uPhase * 0.15));
  col += pal(0.6) * pow(max(w - 0.55, 0.0) * 2.2, 2.0) * 0.32;

  vec2 g = abs(fract(uv * 2.5) - 0.5);
  col += pal(0.25) * smoothstep(0.46, 0.5, max(g.x, g.y)) * 0.07 * (0.4 + uNorm[LOMID]);

  return col * far * (0.5 + 0.9 * uNorm[BASS]);
}

/** 1.0 on the beat, falling away. Higher `sharp` is a tighter spike. */
float beatPulse(float sharp) { return pow(1.0 - uPhase, sharp); }
