"use client"

import { useEffect, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { useAppStore } from "@/lib/store"
import {
  applyVelocityDamping,
  computeCruiseVelocity,
  shouldTransitionToIdle,
  FLIGHT_CONSTANTS,
} from "@/lib/flight-math"
import { deriveWarpVisuals, WARP_DURATION } from "@/lib/warp-visuals"

// ── Module-scope input state (zero re-renders) ──────────────────────

const keysPressed = new Set<string>()
let mouseDown = false
const mouseDelta = { x: 0, y: 0 }
let scrollDelta = 0
let lastInputTime = 0
let mouseDragDistance = 0

// Movement keys that trigger cruising mode
const MOVEMENT_KEYS = new Set([
  "w",
  "a",
  "s",
  "d",
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
  " ",
  "shift",
])

/** Returns true if the last mouse interaction was a drag (not a click) */
export function wasMouseDrag(): boolean {
  return mouseDragDistance > 5
}

// Keys that should NOT be captured (search shortcuts handled by DOM)
function isSearchShortcut(e: KeyboardEvent): boolean {
  return e.key === "/" || (e.key === "k" && (e.metaKey || e.ctrlKey))
}

// ── Module-scope temp vectors (avoid per-frame allocations) ─────────

const _forward = new THREE.Vector3()
const _right = new THREE.Vector3()
const _euler = new THREE.Euler(0, 0, 0, "YXZ")
const _quat = new THREE.Quaternion()
const _warpEnd = new THREE.Vector3()
const _offset = new THREE.Vector3(0, 2, 8)

/**
 * Custom flight controller replacing AutoOrbitCamera.
 *
 * Implements a 4-state camera machine: idle -> cruising -> warping -> inspecting.
 * All input is captured to module-scope mutable state (not React state) to
 * avoid re-renders. Camera updates happen in useFrame for consistent 60fps.
 *
 * Returns null -- purely imperative, no JSX output.
 */
export function FlightController() {
  const { gl } = useThree()

  // Mutable per-frame refs (not React state)
  const velocityRef = useRef(new THREE.Vector3())
  const yawRef = useRef(0)
  const pitchRef = useRef(0)
  const speedMultiplierRef = useRef(1.0)
  const warpStartPosRef = useRef(new THREE.Vector3())
  const warpStartCapturedRef = useRef(false)
  const idleAngleRef = useRef(0)
  const idleCenterRef = useRef(new THREE.Vector3())
  const idleRadiusRef = useRef(0)
  const initializedRef = useRef(false)

  // ── Event listeners ─────────────────────────────────────────────

  useEffect(() => {
    const canvas = gl.domElement

    function onKeyDown(e: KeyboardEvent) {
      if (isSearchShortcut(e)) return
      const key = e.key.toLowerCase()
      keysPressed.add(key)
      lastInputTime = performance.now() / 1000
    }

    function onKeyUp(e: KeyboardEvent) {
      const key = e.key.toLowerCase()
      keysPressed.delete(key)
    }

    function onMouseDown(e: MouseEvent) {
      if (e.button === 2) {
        mouseDown = true
        mouseDragDistance = 0
        lastInputTime = performance.now() / 1000
      }
    }

    function onMouseUp(e: MouseEvent) {
      if (e.button === 2) {
        mouseDown = false
      }
    }

    function onMouseMove(e: MouseEvent) {
      if (mouseDown) {
        mouseDelta.x += e.movementX
        mouseDelta.y += e.movementY
        mouseDragDistance += Math.abs(e.movementX) + Math.abs(e.movementY)
        lastInputTime = performance.now() / 1000
      }
    }

    function onWheel(e: WheelEvent) {
      scrollDelta += e.deltaY
      lastInputTime = performance.now() / 1000
    }

    function onContextMenu(e: MouseEvent) {
      e.preventDefault()
    }

    // Key events on window, mouse events on canvas
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    canvas.addEventListener("mousedown", onMouseDown)
    canvas.addEventListener("mouseup", onMouseUp)
    canvas.addEventListener("mousemove", onMouseMove)
    canvas.addEventListener("wheel", onWheel, { passive: true })
    canvas.addEventListener("contextmenu", onContextMenu)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("keyup", onKeyUp)
      canvas.removeEventListener("mousedown", onMouseDown)
      canvas.removeEventListener("mouseup", onMouseUp)
      canvas.removeEventListener("mousemove", onMouseMove)
      canvas.removeEventListener("wheel", onWheel)
      canvas.removeEventListener("contextmenu", onContextMenu)

      // Reset module state on unmount
      keysPressed.clear()
      mouseDown = false
      mouseDelta.x = 0
      mouseDelta.y = 0
      scrollDelta = 0
    }
  }, [gl])

  // ── Per-frame camera state machine ──────────────────────────────

  useFrame(({ camera, clock }, delta) => {
    const state = useAppStore.getState()

    // Initialize yaw/pitch from the camera's initial orientation (once)
    if (!initializedRef.current) {
      _euler.setFromQuaternion(camera.quaternion, "YXZ")
      yawRef.current = _euler.y
      pitchRef.current = _euler.x
      initializedRef.current = true
    }

    // Skip all input processing when search bar has focus
    if (state.searchOpen) return

    const cameraMode = state.cameraMode

    // ── IDLE ────────────────────────────────────────────────────
    if (cameraMode === "idle") {
      // Gentle auto-drift: rotate around the current look-at center
      if (idleRadiusRef.current === 0) {
        // First frame of idle: capture current center and radius
        _forward.set(0, 0, -1).applyQuaternion(camera.quaternion)
        idleCenterRef.current.copy(camera.position).addScaledVector(_forward, 50)
        idleRadiusRef.current = camera.position.distanceTo(
          idleCenterRef.current
        )
      }

      idleAngleRef.current += FLIGHT_CONSTANTS.driftRotationSpeed * delta
      const angle = idleAngleRef.current
      const radius = idleRadiusRef.current
      const center = idleCenterRef.current

      camera.position.x = center.x + Math.sin(angle) * radius
      camera.position.z = center.z + Math.cos(angle) * radius
      camera.lookAt(center)

      // Sync yaw/pitch from lookAt result so cruising picks up smoothly
      _euler.setFromQuaternion(camera.quaternion, "YXZ")
      yawRef.current = _euler.y
      pitchRef.current = _euler.x

      // Transition to cruising on any movement input
      const hasMovementKey = [...keysPressed].some((k) => MOVEMENT_KEYS.has(k))
      if (hasMovementKey || mouseDown) {
        idleRadiusRef.current = 0 // Reset for next idle entry
        state.setCameraMode("cruising")
      }
    }

    // ── CRUISING ────────────────────────────────────────────────
    else if (cameraMode === "cruising") {
      // Apply mouse look (right-click drag)
      if (mouseDelta.x !== 0 || mouseDelta.y !== 0) {
        yawRef.current -= mouseDelta.x * FLIGHT_CONSTANTS.mouseSensitivity
        pitchRef.current -= mouseDelta.y * FLIGHT_CONSTANTS.mouseSensitivity
        pitchRef.current = Math.max(
          -FLIGHT_CONSTANTS.pitchClamp,
          Math.min(FLIGHT_CONSTANTS.pitchClamp, pitchRef.current)
        )
        mouseDelta.x = 0
        mouseDelta.y = 0
      }

      // Apply yaw/pitch to camera quaternion
      _euler.set(pitchRef.current, yawRef.current, 0, "YXZ")
      _quat.setFromEuler(_euler)
      camera.quaternion.copy(_quat)

      // Apply scroll wheel speed adjustment
      if (scrollDelta !== 0) {
        speedMultiplierRef.current = Math.max(
          FLIGHT_CONSTANTS.minSpeedMultiplier,
          Math.min(
            FLIGHT_CONSTANTS.maxSpeedMultiplier,
            speedMultiplierRef.current - scrollDelta * 0.001
          )
        )
        scrollDelta = 0
      }

      // Compute desired velocity from keys
      const cruiseResult = computeCruiseVelocity(
        keysPressed,
        FLIGHT_CONSTANTS.cruiseSpeed * speedMultiplierRef.current
      )

      // Extract camera forward and right vectors
      _forward.set(0, 0, -1).applyQuaternion(camera.quaternion)
      _right.set(1, 0, 0).applyQuaternion(camera.quaternion)

      const hasMovement = cruiseResult.forward !== 0 || cruiseResult.strafe !== 0 || cruiseResult.vertical !== 0
      if (hasMovement) {
        // Build velocity from forward/strafe/vertical
        velocityRef.current.set(0, 0, 0)
        velocityRef.current.addScaledVector(_forward, cruiseResult.forward)
        velocityRef.current.addScaledVector(_right, cruiseResult.strafe)
        velocityRef.current.y += cruiseResult.vertical
      } else {
        // Apply damping when no keys pressed
        const damped = applyVelocityDamping(
          velocityRef.current,
          FLIGHT_CONSTANTS.dampingFactor,
          delta
        )
        velocityRef.current.set(damped.x, damped.y, damped.z)
      }

      // Move camera
      camera.position.addScaledVector(velocityRef.current, delta)

      // Check idle transition
      const timeSinceInput = performance.now() / 1000 - lastInputTime
      if (
        shouldTransitionToIdle(timeSinceInput) &&
        velocityRef.current.length() < 0.1
      ) {
        idleRadiusRef.current = 0 // Will be recaptured on idle entry
        state.setCameraMode("idle")
      }
    }

    // ── WARPING ─────────────────────────────────────────────────
    else if (cameraMode === "warping") {
      if (!state.warpTarget) {
        // No target -- abort warp
        state.setCameraMode("idle")
        return
      }

      // First frame of warp: capture start position
      if (!warpStartCapturedRef.current) {
        warpStartPosRef.current.copy(camera.position)
        warpStartCapturedRef.current = true
      }

      // Advance warp progress
      const newProgress = Math.min(
        1.0,
        state.warpProgress + delta / WARP_DURATION
      )
      useAppStore.setState({ warpProgress: newProgress })

      // Derive visuals
      const visuals = deriveWarpVisuals(newProgress)

      // Apply FOV
      const perspCamera = camera as THREE.PerspectiveCamera
      perspCamera.fov = 60 + visuals.fovOffset
      perspCamera.updateProjectionMatrix()

      // Smooth position interpolation (smoothstep easing)
      const t = newProgress
      const easeProgress = t * t * (3 - 2 * t)

      const [tx, ty, tz] = state.warpTarget.position
      _warpEnd.set(tx, ty, tz).add(_offset)

      camera.position.lerpVectors(
        warpStartPosRef.current,
        _warpEnd,
        easeProgress
      )

      // Look toward the target during warp
      camera.lookAt(tx, ty, tz)

      // On arrival
      if (newProgress >= 1.0) {
        // Reset FOV
        perspCamera.fov = 60
        perspCamera.updateProjectionMatrix()

        // Sync yaw/pitch from final lookAt
        _euler.setFromQuaternion(camera.quaternion, "YXZ")
        yawRef.current = _euler.y
        pitchRef.current = _euler.x

        // Transition to inspecting
        warpStartCapturedRef.current = false
        state.setCameraMode("inspecting")

        // Auto-select star if warpTarget has a starId
        if (state.warpTarget.starId) {
          const targetStar = state.stars.find(
            (s) => s.id === state.warpTarget!.starId
          )
          if (targetStar) {
            state.setSelectedStar(targetStar)
          }
        }
      }
    }

    // ── INSPECTING ──────────────────────────────────────────────
    else if (cameraMode === "inspecting") {
      // Gentle slow orbit around the selected star
      const selected = state.selectedStar
      if (selected) {
        const [sx, sy, sz] = selected.position

        if (idleRadiusRef.current === 0) {
          // First frame of inspecting: capture orbit radius
          idleRadiusRef.current = camera.position.distanceTo(
            new THREE.Vector3(sx, sy, sz)
          )
          if (idleRadiusRef.current < 5) idleRadiusRef.current = 8
        }

        idleAngleRef.current +=
          FLIGHT_CONSTANTS.driftRotationSpeed * 0.5 * delta
        const angle = idleAngleRef.current
        const radius = idleRadiusRef.current

        camera.position.x = sx + Math.sin(angle) * radius
        camera.position.y = sy + 2
        camera.position.z = sz + Math.cos(angle) * radius
        camera.lookAt(sx, sy, sz)

        // Sync yaw/pitch from lookAt
        _euler.setFromQuaternion(camera.quaternion, "YXZ")
        yawRef.current = _euler.y
        pitchRef.current = _euler.x
      }

      // Break out on any movement key
      const hasMovementKey = [...keysPressed].some((k) => MOVEMENT_KEYS.has(k))
      if (hasMovementKey) {
        idleRadiusRef.current = 0
        state.setSelectedStar(null)
        state.setCameraMode("cruising")
      }
    }
  })

  return null
}
