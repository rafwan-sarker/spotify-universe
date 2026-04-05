"use client"

import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing"

/**
 * PostProcessing -- bloom glow and vignette for the neon synthwave aesthetic.
 *
 * Must be the LAST child inside <Canvas> so the EffectComposer wraps the
 * entire scene render. Stars with toneMapped={false} output HDR values
 * that bloom amplifies -- beacon stars (2.5x boost) glow dramatically.
 *
 * Uses mipmapBlur for performance (single-pass Kawase blur vs multi-pass Gaussian).
 */
export function PostProcessing() {
  return (
    <EffectComposer>
      <Bloom
        intensity={1.5}
        luminanceThreshold={0.3}
        luminanceSmoothing={0.1}
        mipmapBlur={true}
      />
      <Vignette darkness={0.6} offset={0.3} />
    </EffectComposer>
  )
}
