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
