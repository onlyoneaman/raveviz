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

/** 1.0 on the beat, falling away. Higher `sharp` is a tighter spike. */
float beatPulse(float sharp) { return pow(1.0 - uPhase, sharp); }
