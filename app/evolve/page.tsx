"use client"

import { useState, useRef } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera } from "@react-three/drei"
import * as THREE from "three"
import { EvolutionTumorModel } from "@/components/digital-twin/EvolutionTumorModel"
import { EvolutionTimelineUI, TumorStatusBadge } from "@/components/digital-twin/EvolutionAnimationController"
import useEvolutionSimulation from "@/hooks/useEvolutionSimulation"

/**
 * Example: Tumor Evolution Viewer Page
 * 
 * Demonstrates complete integration of:
 * - Evolution simulation API calls
 * - Timeline playback controls
 * - Status visualization
 * - Medicine effectiveness adjustment
 */

// Sample tumor mesh (replace with real data)
const SAMPLE_MESH = {
  vertices: Array.from({ length: 50 }, () => [
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 2,
  ]),
  faces: Array.from({ length: 30 }, (_, i) => [
    i % 50,
    (i + 1) % 50,
    (i + 2) % 50,
  ]),
}

interface AnimationControllerRef {
  play?: () => void
  pause?: () => void
  reset?: () => void
  seek?: (frameIndex: number) => void
  seekDay?: (day: number) => void
  setSpeed?: (speed: number) => void
  getCurrentFrame?: () => number
  getCurrentDay?: () => number
  isPlaying?: () => boolean
  getFrameCount?: () => number
  getProgress?: () => number
}

export default function TumorEvolutionViewer() {
  const [medicineEffect, setMedicineEffect] = useState<"effective" | "ineffective" | "none">("effective")
  const [aggressiveness, setAggressiveness] = useState<"low" | "moderate" | "high">("moderate")
  const [currentStatus, setCurrentStatus] = useState("stable")
  const [currentAggressiveness, setCurrentAggressiveness] = useState(0.6)
  const [currentDay, setCurrentDay] = useState(0)
  const controllerRef = useRef<AnimationControllerRef>(null)

  // Fetch evolution frames from backend
  const {
    frames,
    isLoading,
    error,
    simulationResult,
    refetch,
    isAvailable,
    estimatedDays,
  } = useEvolutionSimulation({
    meshData: SAMPLE_MESH,
    medicineEffect,
    aggressiveness,
    recoveryProgress: 0,
    autoFetch: true,
    enabled: true,
  })

  const handleEvolutionUpdate = (
    frameIndex: number,
    day: number,
    status: string,
    agg: number,
  ) => {
    setCurrentDay(day)
    setCurrentStatus(status)
    setCurrentAggressiveness(agg)
  }

  const handleMedicineChange = (effect: typeof medicineEffect) => {
    setMedicineEffect(effect)
  }

  const handleAggressivenessChange = (level: typeof aggressiveness) => {
    setAggressiveness(level)
  }

  return (
    <div className="w-full h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-800/50 border-b border-blue-500/20 p-4">
        <h1 className="text-2xl font-bold text-blue-400">Tumor Evolution Viewer</h1>
        <p className="text-sm text-gray-400">
          Real-time visualization of tumor response to treatment
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* 3D Viewport */}
        <div className="flex-1 rounded-lg overflow-hidden border border-blue-500/20 bg-black">
          {frames.length > 0 ? (
            <Canvas>
              <PerspectiveCamera makeDefault position={[0, 0, 4]} />
              <OrbitControls />
              
              {/* Lighting */}
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
              <pointLight position={[-10, 10, 10]} intensity={0.5} />

              {/* Tumor Model */}
              <EvolutionTumorModel
                aggressiveness={aggressiveness}
                medicineEffect={medicineEffect}
                showGenes={false}
                time={0}
                recoveryProgress={0}
                tumorIntensity={1.0}
                evolutionFrames={frames}
                enableEvolution={true}
                onEvolutionUpdate={handleEvolutionUpdate}
                autoPlayEvolution={false}
                evolutionPlaybackSpeed={1.0}
              />
            </Canvas>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              {isLoading && (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
                  <p className="text-gray-300">Generating evolution simulation...</p>
                </div>
              )}
              {error && (
                <div className="text-center">
                  <p className="text-red-400 font-semibold">Error Loading Evolution</p>
                  <p className="text-red-300 text-sm">{error.message}</p>
                </div>
              )}
              {!isLoading && !error && (
                <p className="text-gray-400">Waiting for evolution data...</p>
              )}
            </div>
          )}
        </div>

        {/* Control Panel */}
        <div className="w-96 flex flex-col gap-4 overflow-y-auto">
          {/* Status Display */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-blue-500/20">
            <h2 className="text-sm font-semibold text-blue-400 mb-3">Simulation Status</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Current Day:</span>
                <span className="text-blue-400 font-semibold">{currentDay}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Total Days:</span>
                <span className="text-blue-400 font-semibold">{estimatedDays}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400">Aggressiveness:</span>
                <span className="text-blue-400 font-semibold">
                  {Math.round(currentAggressiveness * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div>
            <h2 className="text-sm font-semibold text-blue-400 mb-2">Tumor Status</h2>
            <TumorStatusBadge status={currentStatus} aggressiveness={currentAggressiveness} />
          </div>

          {/* Timeline */}
          {frames.length > 0 && (
            <div className="bg-gray-800/50 rounded-lg p-4 border border-blue-500/20">
              <h2 className="text-sm font-semibold text-blue-400 mb-3">Timeline</h2>
              <EvolutionTimelineUI
                controller={{
                  play: () => controllerRef.current?.play?.(),
                  pause: () => controllerRef.current?.pause?.(),
                  togglePlayback: () => {},
                  reset: () => controllerRef.current?.reset?.(),
                  seek: (idx) => controllerRef.current?.seek?.(idx),
                  seekDay: (d) => controllerRef.current?.seekDay?.(d),
                  setSpeed: (s) => controllerRef.current?.setSpeed?.(s),
                  isInitialized: true,
                  getProgress: () => 0,
                  getCurrentFrame: () => 0,
                  getCurrentDay: () => currentDay,
                  isPlaying: () => false,
                  getFrameCount: () => frames.length,
                } as any}
                totalDays={estimatedDays}
                onlyControls={false}
              />
            </div>
          )}

          {/* Medicine Controls */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-blue-500/20">
            <h2 className="text-sm font-semibold text-blue-400 mb-3">Medicine Type</h2>
            <div className="grid grid-cols-2 gap-2">
              {(["effective", "ineffective", "none"] as const).map((effect) => (
                <button
                  key={effect}
                  onClick={() => handleMedicineChange(effect)}
                  className={`px-3 py-2 rounded text-xs font-semibold transition ${
                    medicineEffect === effect
                      ? "bg-green-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {effect === "effective" && "✓ Effective"}
                  {effect === "ineffective" && "✗ Ineffective"}
                  {effect === "none" && "- None"}
                </button>
              ))}
            </div>
          </div>

          {/* Aggressiveness Controls */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-blue-500/20">
            <h2 className="text-sm font-semibold text-blue-400 mb-3">Tumor Aggressiveness</h2>
            <div className="grid grid-cols-3 gap-2">
              {(["low", "moderate", "high"] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => handleAggressivenessChange(level)}
                  className={`px-3 py-2 rounded text-xs font-semibold transition ${
                    aggressiveness === level
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  {level === "low" && "🟢 Low"}
                  {level === "moderate" && "🟡 Moderate"}
                  {level === "high" && "🔴 High"}
                </button>
              ))}
            </div>
          </div>

          {/* Simulation Info */}
          {simulationResult && (
            <div className="bg-gray-800/50 rounded-lg p-4 border border-blue-500/20">
              <h2 className="text-sm font-semibold text-blue-400 mb-2">Simulation Results</h2>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Frames:</span>
                  <span className="text-blue-400">{simulationResult.frames?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Medicine Response:</span>
                  <span className="text-blue-400">
                    {Math.round(simulationResult.medicine_response_score * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Final Aggressiveness:</span>
                  <span className="text-blue-400">
                    {Math.round(simulationResult.final_aggressiveness * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 mt-auto">
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded text-sm font-semibold transition"
            >
              {isLoading ? "Simulating..." : "Refresh Simulation"}
            </button>
          </div>

          {/* Service Status */}
          <div className="text-xs text-gray-500 text-center">
            {isAvailable ? "✓ Evolution service available" : "✗ Service unavailable"}
          </div>
        </div>
      </div>
    </div>
  )
}
