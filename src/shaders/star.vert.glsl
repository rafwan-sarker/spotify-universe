// Star billboard vertex shader
// Per-instance attributes for color, size, animation, and top-track detection

attribute vec3 instanceColor;
attribute float instanceSize;
attribute float instanceBrightness;
attribute float instanceBirthTime;
attribute float instancePhaseOffset;
attribute float instanceIsTopTrack;

uniform float uTime;

varying vec2 vUv;
varying vec3 vColor;
varying float vAlpha;

void main() {
  vUv = uv;
  vColor = instanceColor;

  // Fade-in: smoothstep over 1.5 seconds from birth time
  float age = uTime - instanceBirthTime;
  float fadeIn = clamp(smoothstep(0.0, 1.5, age), 0.0, 1.0);

  // Twinkle: subtle per-instance desynchronized sine wave
  float twinkle = 1.0 + 0.12 * sin(uTime * 2.5 + instancePhaseOffset);

  // Size pulse for top tracks: gentle oscillation
  float pulse = 1.0 + instanceIsTopTrack * 0.08 * sin(uTime * 1.8 + instancePhaseOffset * 0.7);

  // Final scale: base size * fade-in growth * top-track pulse
  float finalScale = instanceSize * fadeIn * pulse;

  // Brightness combines base brightness, fade-in, and twinkle
  vAlpha = instanceBrightness * fadeIn * twinkle;

  // Billboard: extract instance world position from matrix, then offset in view space
  vec4 worldPos = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  vec4 mvPos = viewMatrix * worldPos;

  // Offset quad vertices in view space so the quad always faces the camera
  mvPos.xy += position.xy * finalScale;

  gl_Position = projectionMatrix * mvPos;
}
