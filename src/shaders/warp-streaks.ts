/**
 * Warp streak shader source strings for the hyperspace star-streak effect.
 *
 * Inlined as TypeScript strings (same pattern as star-shaders.ts) because
 * Next.js Turbopack doesn't support ?raw GLSL imports natively.
 *
 * Streaks are thin instanced planes arranged in a cylinder around the camera
 * forward axis. The vertex shader stretches them along Z based on warp
 * progress, and the fragment shader applies a white-to-cyan gradient
 * with smooth alpha falloff.
 */

export const warpStreakVertex = /* glsl */ `
uniform float uStreakStretch;  // 0 to 5, from deriveWarpVisuals
uniform float uTime;

attribute float aAngle;       // Random angle around forward axis (0 to 2*PI)
attribute float aRadius;      // Random distance from center (0.5 to 3.0)
attribute float aSpeed;       // Random speed multiplier (0.8 to 1.2)

varying float vAlpha;
varying float vProgress;      // 0 at tail, 1 at head -- for color gradient

void main() {
  // Position particle on a ring around the camera forward axis
  float angle = aAngle;
  float radius = aRadius;

  vec3 pos = vec3(
    cos(angle) * radius,
    sin(angle) * radius,
    0.0
  );

  // Stretch along Z (camera forward) based on warp progress
  float stretch = uStreakStretch * aSpeed;
  // position.z from PlaneGeometry ranges -0.5 to 0.5 -- becomes streak length
  pos.z += position.z * stretch * 10.0;

  // Scroll streaks forward over time for motion feel
  pos.z -= mod(uTime * aSpeed * 20.0, 40.0) - 20.0;

  // Alpha: fade at head and tail of each streak
  vAlpha = smoothstep(0.0, 0.3, 1.0 - abs(position.z * 2.0));
  vProgress = position.z + 0.5;  // 0 at tail, 1 at head

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

export const warpStreakFragment = /* glsl */ `
uniform float uOpacity;       // 0 to 0.8, from deriveWarpVisuals

varying float vAlpha;
varying float vProgress;

void main() {
  // Gradient along streak: cyan (#00f0ff) at tail, white at head
  vec3 white = vec3(1.0, 1.0, 1.0);
  vec3 cyan = vec3(0.0, 0.94, 1.0);  // #00f0ff
  vec3 color = mix(cyan, white, vProgress);

  float alpha = vAlpha * uOpacity;
  if (alpha < 0.01) discard;

  // Premultiplied alpha for correct additive blending
  gl_FragColor = vec4(color * alpha, alpha);
}
`
