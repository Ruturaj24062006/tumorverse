"use client"

import * as THREE from "three"

/**
 * Mesh Morphing Utilities for Smooth Tumor Evolution Animation
 * Handles interpolation between different tumor mesh states
 */

export interface MorphFrameData {
  vertices: number[][]
  densityMap?: number[]
  opacityMap?: number[]
  tissueRegions?: number[]
  aggressiveness?: number
  status?: string
  timestamp?: number
}

export interface MorphedMeshState {
  geometry: THREE.BufferGeometry
  densityAttribute: Float32Array
  opacityAttribute: Float32Array
  tissueAttribute: Float32Array
  aggressiveness: number
  status: string
}

export class MeshMorphingEngine {
  /**
   * Interpolate between two mesh frames smoothly
   * Uses vertex position interpolation (lerp)
   */
  static morphVertices(
    frame1: MorphFrameData,
    frame2: MorphFrameData,
    interpolation: number, // 0-1, where 0 = frame1, 1 = frame2
  ): number[][] {
    const vertices1 = frame1.vertices
    const vertices2 = frame2.vertices

    // Ensure same vertex count
    if (vertices1.length !== vertices2.length) {
      console.warn(
        "Frame vertices have different lengths, using first frame",
      )
      return vertices1
    }

    const morphed: number[][] = []

    for (let i = 0; i < vertices1.length; i++) {
      const v1 = vertices1[i]
      const v2 = vertices2[i]

      // Linear interpolation for each vertex
      const morphedVertex = [
        THREE.MathUtils.lerp(v1[0], v2[0], interpolation),
        THREE.MathUtils.lerp(v1[1], v2[1], interpolation),
        THREE.MathUtils.lerp(v1[2], v2[2], interpolation),
      ]

      morphed.push(morphedVertex)
    }

    return morphed
  }

  /**
   * Interpolate density map between frames
   */
  static morphDensity(
    frame1: MorphFrameData,
    frame2: MorphFrameData,
    interpolation: number,
  ): Float32Array {
    const density1 = frame1.densityMap || []
    const density2 = frame2.densityMap || []

    const length = Math.max(density1.length, density2.length)
    const morphed = new Float32Array(length)

    for (let i = 0; i < length; i++) {
      const d1 = density1[i] ?? 0.5
      const d2 = density2[i] ?? 0.5
      morphed[i] = THREE.MathUtils.lerp(d1, d2, interpolation)
    }

    return morphed
  }

  /**
   * Interpolate opacity map between frames
   */
  static morphOpacity(
    frame1: MorphFrameData,
    frame2: MorphFrameData,
    interpolation: number,
  ): Float32Array {
    const opacity1 = frame1.opacityMap || []
    const opacity2 = frame2.opacityMap || []

    const length = Math.max(opacity1.length, opacity2.length)
    const morphed = new Float32Array(length)

    for (let i = 0; i < length; i++) {
      const o1 = opacity1[i] ?? 0.5
      const o2 = opacity2[i] ?? 0.5
      morphed[i] = THREE.MathUtils.lerp(o1, o2, interpolation)
    }

    return morphed
  }

  /**
   * Interpolate tissue region map between frames
   */
  static morphTissueRegions(
    frame1: MorphFrameData,
    frame2: MorphFrameData,
    interpolation: number,
  ): Float32Array {
    const regions1 = frame1.tissueRegions || []
    const regions2 = frame2.tissueRegions || []

    const length = Math.max(regions1.length, regions2.length)
    const morphed = new Float32Array(length)

    for (let i = 0; i < length; i++) {
      const r1 = regions1[i] ?? 2.0
      const r2 = regions2[i] ?? 2.0
      morphed[i] = THREE.MathUtils.lerp(r1, r2, interpolation)
    }

    return morphed
  }

  /**
   * Interpolate scalar values (aggressiveness, etc)
   */
  static morphScalar(
    value1: number,
    value2: number,
    interpolation: number,
  ): number {
    return THREE.MathUtils.lerp(value1, value2, interpolation)
  }

  /**
   * Create morphed geometry from two frames
   */
  static createMorphedGeometry(
    frame1: MorphFrameData,
    frame2: MorphFrameData,
    interpolation: number,
    baseFaces: Uint32Array | Uint16Array,
  ): MorphedMeshState {
    // Morph vertex positions
    const morphedVertices = this.morphVertices(frame1, frame2, interpolation)
    const positions = new Float32Array(morphedVertices.length * 3)

    for (let i = 0; i < morphedVertices.length; i++) {
      positions[i * 3] = morphedVertices[i][0]
      positions[i * 3 + 1] = morphedVertices[i][1]
      positions[i * 3 + 2] = morphedVertices[i][2]
    }

    // Create geometry
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
    geometry.setIndex(new THREE.BufferAttribute(baseFaces, 1))

    // Morph attributes
    const densityAttribute = this.morphDensity(frame1, frame2, interpolation)
    const opacityAttribute = this.morphOpacity(frame1, frame2, interpolation)
    const tissueAttribute = this.morphTissueRegions(
      frame1,
      frame2,
      interpolation,
    )

    // Add custom attributes
    geometry.setAttribute(
      "aDensity",
      new THREE.BufferAttribute(densityAttribute, 1),
    )
    geometry.setAttribute(
      "aOpacity",
      new THREE.BufferAttribute(opacityAttribute, 1),
    )
    geometry.setAttribute(
      "aTissueRegion",
      new THREE.BufferAttribute(tissueAttribute, 1),
    )

    // Compute normals for lighting
    geometry.computeVertexNormals()
    geometry.computeBoundingSphere()

    // Interpolate scalar values
    const aggressiveness = this.morphScalar(
      frame1.aggressiveness ?? 0.5,
      frame2.aggressiveness ?? 0.5,
      interpolation,
    )

    return {
      geometry,
      densityAttribute,
      opacityAttribute,
      tissueAttribute,
      aggressiveness,
      status: interpolation < 0.5 ? frame1.status || "stable" : frame2.status || "stable",
    }
  }

  /**
   * Interpolate between multiple frames with smooth animation
   * Handles finding the correct surrounding frames
   */
  static interpolateFrameSequence(
    frames: MorphFrameData[],
    timeIndex: number, // 0 to frames.length - 1
  ): {
    frame1: MorphFrameData
    frame2: MorphFrameData
    interpolation: number
  } {
    // Clamp to valid range
    const clampedTime = Math.max(0, Math.min(timeIndex, frames.length - 1))

    // Find surrounding frames
    const frameIndex = Math.floor(clampedTime)
    const nextFrameIndex = Math.min(frameIndex + 1, frames.length - 1)

    const frame1 = frames[frameIndex]
    const frame2 = frames[nextFrameIndex]

    // Calculate interpolation within frame pair
    const interpolation =
      frameIndex === nextFrameIndex ? 0 : clampedTime - frameIndex

    return {
      frame1,
      frame2,
      interpolation,
    }
  }

  /**
   * Compute smooth animation easing for better visual feel
   */
  static easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  /**
   * Apply easing to frame interpolation
   */
  static interpolateFrameSequenceEased(
    frames: MorphFrameData[],
    timeIndex: number,
  ): {
    frame1: MorphFrameData
    frame2: MorphFrameData
    interpolation: number
  } {
    const base = this.interpolateFrameSequence(frames, timeIndex)
    return {
      ...base,
      interpolation: this.easeInOutCubic(base.interpolation),
    }
  }

  /**
   * Batch update geometry with new morphed state
   */
  static updateGeometryInPlace(
    geometry: THREE.BufferGeometry,
    morphedState: MorphedMeshState,
  ): void {
    // Update position attribute
    const positionAttr = geometry.getAttribute("position")
    if (positionAttr) {
      positionAttr.needsUpdate = true
    }

    // Update custom attributes
    const densityAttr = geometry.getAttribute("aDensity")
    if (densityAttr) {
      densityAttr.needsUpdate = true
    }

    const opacityAttr = geometry.getAttribute("aOpacity")
    if (opacityAttr) {
      opacityAttr.needsUpdate = true
    }

    const tissueAttr = geometry.getAttribute("aTissueRegion")
    if (tissueAttr) {
      tissueAttr.needsUpdate = true
    }

    // Recompute normals for changing geometry
    geometry.computeVertexNormals()
  }
}

/**
 * Timeline controller for animation playback
 */
export class EvolutionTimeline {
  private frames: MorphFrameData[]
  private currentTime: number = 0
  private duration: number = 1.0
  private isPlaying: boolean = false
  private playbackSpeed: number = 1.0

  constructor(frames: MorphFrameData[], totalDays: number) {
    this.frames = frames
    this.duration = totalDays
    this.currentTime = 0
  }

  /**
   * Get normalized time (0-1)
   */
  getNormalizedTime(): number {
    return this.frames.length > 0
      ? this.currentTime / (this.frames.length - 1)
      : 0
  }

  /**
   * Advance timeline by delta time (in seconds)
   */
  update(deltaSeconds: number): void {
    if (!this.isPlaying) return

    // Convert days to seconds (assume 1 frame = 1 day in the simulation)
    const frameAdvance =
      (deltaSeconds / 1000) * this.playbackSpeed * this.frames.length
    this.currentTime += frameAdvance

    // Loop or clamp
    if (this.currentTime >= this.frames.length - 1) {
      this.currentTime = this.frames.length - 1
      this.isPlaying = false
    }
  }

  /**
   * Set timeline to specific frame (0 to frames.length - 1)
   */
  setFrame(frameIndex: number): void {
    this.currentTime = Math.max(
      0,
      Math.min(frameIndex, this.frames.length - 1),
    )
  }

  /**
   * Set timeline to specific day
   */
  setDay(day: number): void {
    const normalizedDay = Math.max(0, Math.min(day, this.duration))
    this.currentTime = (normalizedDay / this.duration) * (this.frames.length - 1)
  }

  /**
   * Play animation
   */
  play(): void {
    this.isPlaying = true
  }

  /**
   * Pause animation
   */
  pause(): void {
    this.isPlaying = false
  }

  /**
   * Toggle playback
   */
  togglePlayback(): void {
    this.isPlaying = !this.isPlaying
  }

  /**
   * Reset to start
   */
  reset(): void {
    this.currentTime = 0
    this.isPlaying = false
  }

  /**
   * Set playback speed (1.0 = normal, 2.0 = 2x, 0.5 = 0.5x)
   */
  setPlaybackSpeed(speed: number): void {
    this.playbackSpeed = Math.max(0.1, Math.min(5.0, speed))
  }

  /**
   * Get interpolation data for current time
   */
  getCurrentInterpolation(): {
    frame1: MorphFrameData
    frame2: MorphFrameData
    interpolation: number
    frameIndex: number
    progress: number
  } {
    const { frame1, frame2, interpolation } =
      MeshMorphingEngine.interpolateFrameSequenceEased(
        this.frames,
        this.currentTime,
      )

    return {
      frame1,
      frame2,
      interpolation,
      frameIndex: Math.floor(this.currentTime),
      progress: this.getNormalizedTime(),
    }
  }

  /**
   * Get current frame data
   */
  getCurrentFrameIndex(): number {
    return Math.floor(this.currentTime)
  }

  /**
   * Get progress (0-1)
   */
  getProgress(): number {
    return this.getNormalizedTime()
  }

  /**
   * Check if playing
   */
  getIsPlaying(): boolean {
    return this.isPlaying
  }

  /**
   * Get total number of frames
   */
  getFrameCount(): number {
    return this.frames.length
  }

  /**
   * Get current day
   */
  getCurrentDay(): number {
    return (this.getNormalizedTime() * this.duration)
  }
}
