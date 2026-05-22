"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import {
  MeshMorphingEngine,
  EvolutionTimeline,
  MorphFrameData,
} from "@/lib/meshMorphingEngine"

interface EvolutionAnimationProps {
  evolutionFrames: MorphFrameData[]
  baseFaces: Uint32Array | Uint16Array
  onFrameChange?: (frameIndex: number, day: number, progress: number) => void
  onStatusChange?: (status: string) => void
  autoPlay?: boolean
  playbackSpeed?: number
}

export function EvolutionAnimationController({
  evolutionFrames,
  baseFaces,
  onFrameChange,
  onStatusChange,
  autoPlay = false,
  playbackSpeed = 1.0,
}: EvolutionAnimationProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const timelineRef = useRef<EvolutionTimeline | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize timeline
  useEffect(() => {
    if (evolutionFrames.length === 0) return

    // Estimate total days from frame data
    const totalDays = evolutionFrames.length > 0
      ? (evolutionFrames[evolutionFrames.length - 1].timestamp || evolutionFrames.length * 3) || 90
      : 90

    const timeline = new EvolutionTimeline(evolutionFrames, totalDays)
    timeline.setPlaybackSpeed(playbackSpeed)

    if (autoPlay) {
      timeline.play()
    }

    timelineRef.current = timeline
    setIsInitialized(true)
  }, [evolutionFrames, playbackSpeed, autoPlay])

  // Animation loop
  useFrame((_, delta) => {
    if (!timelineRef.current || !meshRef.current) return

    const timeline = timelineRef.current

    // Update timeline
    timeline.update(delta * 1000) // Convert to milliseconds

    // Get interpolation data
    const interp = timeline.getCurrentInterpolation()

    // Create morphed geometry
    const morphedState = MeshMorphingEngine.createMorphedGeometry(
      interp.frame1,
      interp.frame2,
      interp.interpolation,
      baseFaces,
    )

    // Update mesh geometry
    if (meshRef.current.geometry) {
      meshRef.current.geometry.dispose()
    }
    meshRef.current.geometry = morphedState.geometry

    // Update shader uniforms if material supports it
    if (meshRef.current.material instanceof THREE.ShaderMaterial) {
      const mat = meshRef.current.material
      mat.uniforms.uAggressiveness = {
        value: morphedState.aggressiveness,
      }
    }

    // Callbacks
    onFrameChange?.(
      interp.frameIndex,
      timeline.getCurrentDay(),
      interp.progress,
    )

    if (interp.status !== (meshRef.current as any).lastStatus) {
      onStatusChange?.(interp.status)
      ;(meshRef.current as any).lastStatus = interp.status
    }
  })

  // Playback controls
  const play = useCallback(() => {
    timelineRef.current?.play()
  }, [])

  const pause = useCallback(() => {
    timelineRef.current?.pause()
  }, [])

  const togglePlayback = useCallback(() => {
    timelineRef.current?.togglePlayback()
  }, [])

  const reset = useCallback(() => {
    timelineRef.current?.reset()
  }, [])

  const seek = useCallback((frameIndex: number) => {
    timelineRef.current?.setFrame(frameIndex)
  }, [])

  const seekDay = useCallback((day: number) => {
    timelineRef.current?.setDay(day)
  }, [])

  const setSpeed = useCallback((speed: number) => {
    timelineRef.current?.setPlaybackSpeed(speed)
  }, [])

  return {
    meshRef,
    play,
    pause,
    togglePlayback,
    reset,
    seek,
    seekDay,
    setSpeed,
    isInitialized,
    getProgress: () => timelineRef.current?.getProgress() ?? 0,
    getCurrentFrame: () => timelineRef.current?.getCurrentFrameIndex() ?? 0,
    getCurrentDay: () => timelineRef.current?.getCurrentDay() ?? 0,
    isPlaying: () => timelineRef.current?.getIsPlaying() ?? false,
    getFrameCount: () => timelineRef.current?.getFrameCount() ?? 0,
  }
}

/**
 * Timeline UI Component with Play/Pause, Scrubber, Speed Controls
 */
interface EvolutionTimelineUIProps {
  controller: ReturnType<typeof EvolutionAnimationController>
  totalDays: number
  onlyControls?: boolean
}

export function EvolutionTimelineUI({
  controller,
  totalDays,
  onlyControls = false,
}: EvolutionTimelineUIProps) {
  const [currentFrame, setCurrentFrame] = useState(0)
  const [currentDay, setCurrentDay] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0)
  const [progress, setProgress] = useState(0)

  // Update UI on frame change
  useFrame(() => {
    if (!controller.isInitialized) return

    setCurrentFrame(controller.getCurrentFrame())
    setCurrentDay(Math.round(controller.getCurrentDay()))
    setProgress(controller.getProgress())
    setIsPlaying(controller.isPlaying())
  })

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value)
    controller.seekDay(newProgress * totalDays / 100)
  }

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed)
    controller.setSpeed(speed)
  }

  if (!controller.isInitialized) {
    return (
      <div className="text-center text-sm text-gray-400 p-4">
        Loading evolution timeline...
      </div>
    )
  }

  return (
    <div className="w-full bg-gray-900/80 rounded-lg p-4 space-y-3 border border-blue-500/20">
      {/* Status Display */}
      {!onlyControls && (
        <div className="flex justify-between items-center text-xs text-gray-300">
          <div>
            <span className="text-blue-400">Day {currentDay}</span>
            <span className="text-gray-500 mx-2">•</span>
            <span className="text-blue-400">Frame {currentFrame + 1}/{controller.getFrameCount()}</span>
          </div>
          <div className="text-blue-400">{Math.round(progress * 100)}%</div>
        </div>
      )}

      {/* Timeline Scrubber */}
      <div className="w-full">
        <input
          type="range"
          min="0"
          max="100"
          value={progress * 100}
          onChange={handleSeek}
          className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          style={{
            background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${progress * 100}%, rgb(55, 65, 81) ${progress * 100}%, rgb(55, 65, 81) 100%)`,
          }}
        />
      </div>

      {/* Playback Controls */}
      <div className="flex items-center gap-2 justify-center">
        {/* Play/Pause */}
        <button
          onClick={() => controller.togglePlayback()}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs font-semibold transition"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? "⏸ Pause" : "▶ Play"}
        </button>

        {/* Reset */}
        <button
          onClick={() => controller.reset()}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-white text-xs font-semibold transition"
          title="Reset to start"
        >
          ⟲ Reset
        </button>

        {/* Speed Controls */}
        <div className="flex gap-1 ml-2">
          {[0.5, 1.0, 1.5, 2.0].map((speed) => (
            <button
              key={speed}
              onClick={() => handleSpeedChange(speed)}
              className={`px-2 py-1 rounded text-xs font-semibold transition ${
                Math.abs(playbackSpeed - speed) < 0.1
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
              title={`${speed}x speed`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* Day Display */}
      {!onlyControls && (
        <div className="text-center text-xs text-gray-400">
          Timeline: Day 0 → Day {totalDays}
        </div>
      )}
    </div>
  )
}

/**
 * Status Badge showing current tumor state
 */
interface StatusBadgeProps {
  status: string
  aggressiveness?: number
}

export function TumorStatusBadge({ status, aggressiveness }: StatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "shrinking":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      case "growing":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      case "stable":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/50"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "shrinking":
        return "🔻 Responding to Treatment"
      case "growing":
        return "⚠️ Aggressive Growth"
      case "stable":
        return "⊗ Stable / Equilibrium"
      default:
        return "• Unknown"
    }
  }

  return (
    <div
      className={`px-3 py-2 rounded-lg border text-xs font-semibold ${getStatusColor(status)} flex items-center gap-2`}
    >
      <span>{getStatusLabel(status)}</span>
      {aggressiveness !== undefined && (
        <span className="text-gray-400">
          | Agg: {Math.round(aggressiveness * 100)}%
        </span>
      )}
    </div>
  )
}
