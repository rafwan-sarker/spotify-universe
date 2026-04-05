import type * as THREE from "three"

/** Shared camera reference for non-R3F components (e.g., MiniMap) */
export const sharedCameraRef: { current: THREE.Camera | null } = { current: null }
