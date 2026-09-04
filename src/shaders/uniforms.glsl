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
uniform sampler2D uWave;

/** Time-domain sample at x in 0..1, returned in -1..1. */
float waveAt(float x) { return texture(uWave, vec2(clamp(x, 0.0, 1.0), 0.5)).r * 2.0 - 1.0; }

#define SUB   0
#define BASS  1
#define LOMID 2
#define MID   3
#define AIR   4

/** Scene palette ramp with the global hue offset applied. */
vec3 pal(float t) {
  return hueRotate(mix(uPalA, uPalB, smoothstep(0.0, 1.0, clamp(t, 0.0, 1.0))), uHue);
}

/** 1.0 on the beat, falling away. Higher `sharp` is a tighter spike. */
float beatPulse(float sharp) { return pow(1.0 - uPhase, sharp); }
