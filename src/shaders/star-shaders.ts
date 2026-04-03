/**
 * Star shader source strings for the galaxy InstancedMesh ShaderMaterial.
 *
 * Inlined as TypeScript strings to avoid bundler-specific raw import
 * configuration (Next.js Turbopack doesn't support ?raw imports natively).
 *
 * Source of truth: star.vert.glsl and star.frag.glsl in this directory.
 */

export const starVertexShader = /* glsl */ `
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
`

export const starFragmentShader = /* glsl */ `
// Star radial glow fragment shader
// Renders circular glowing orbs with soft falloff and white-hot core

varying vec2 vUv;
varying vec3 vColor;
varying float vAlpha;

void main() {
  // Distance from center of the billboard quad
  vec2 center = vec2(0.5);
  float d = distance(vUv, center);

  // Discard fragments outside the circular star shape
  if (d > 0.5) discard;

  // Soft radial falloff for glowing orb effect
  float glow = smoothstep(0.5, 0.0, d);

  // Core brightening: blend genre color toward white at center
  float coreMix = smoothstep(0.25, 0.0, d);
  vec3 color = mix(vColor, vec3(1.0, 1.0, 1.0), coreMix * 0.6);

  // Final alpha with glow falloff and brightness
  float alpha = glow * vAlpha;

  // Premultiplied alpha output for correct additive blending
  gl_FragColor = vec4(color * alpha, alpha);
}
`
