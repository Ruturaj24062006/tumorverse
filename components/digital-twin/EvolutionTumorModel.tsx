"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { MeshMorphingEngine, MorphFrameData, EvolutionTimeline } from "@/lib/meshMorphingEngine"
import { EvolutionShaderMaterial } from "./EvolutionShaderMaterial"
import { TumorModel } from "./TumorModel"

interface EvolutionTumorModelProps {
  // Standard tumor props
  aggressiveness: "low" | "moderate" | "high"
  medicineEffect: "none" | "effective" | "ineffective"
  showGenes: boolean
  time: number
  recoveryProgress: number
  tumorIntensity: number
  treatmentScore?: number
  lesionCoverage?: number
  lesionConfidence?: number
  lesionFocus?: {
    x: number
    y: number
  } | null
  timelineSimulation?: any
  timelineFrameIndex?: number
  buildProgress?: number

  // Evolution props
  evolutionFrames?: MorphFrameData[]
  enableEvolution?: boolean
  onEvolutionUpdate?: (frameIndex: number, day: number, status: string, aggressiveness: number) => void
  autoPlayEvolution?: boolean
  evolutionPlaybackSpeed?: number
}

export function EvolutionTumorModel({
  aggressiveness,
  medicineEffect,
  showGenes,
  time,
  recoveryProgress,
  tumorIntensity,
  treatmentScore = 50,
  lesionCoverage = 0,
  lesionConfidence = 0,
  lesionFocus,
  timelineSimulation,
  timelineFrameIndex = 0,
  buildProgress = 1,
  evolutionFrames = [],
  enableEvolution = false,
  onEvolutionUpdate,
  autoPlayEvolution = false,
  evolutionPlaybackSpeed = 1.0,
}: EvolutionTumorModelProps) {
  const meshGroupRef = useRef<THREE.Group>(null)
  const timelineRef = useRef<EvolutionTimeline | null>(null)
  const [evolutionMesh, setEvolutionMesh] = useState<THREE.BufferGeometry | null>(null)
  const [currentStatus, setCurrentStatus] = useState<string>("stable")
  const [currentAggressiveness, setCurrentAggressiveness] = useState<number>(
    aggressiveness === "low" ? 0.3 : aggressiveness === "high" ? 0.9 : 0.6,
  )
  const scoreRatio = Math.max(0, Math.min(1, treatmentScore / 100))
  const deterministicSeed = 0.17 + scoreRatio * 0.53 + currentAggressiveness * 0.09
  const shaderEffectiveness = Math.max(0.05, Math.min(0.95, scoreRatio))
  const shaderInstability = Math.max(0.05, Math.min(0.98, 1.0 - shaderEffectiveness + currentAggressiveness * 0.35))
  const baseFaces = useMemo(() => {
    if (!timelineSimulation?.mesh?.faces) return new Uint32Array([])

    const faces = timelineSimulation.mesh.faces
    const faceArray = new Uint32Array(faces.length * 3)

    faces.forEach((face: number[], idx: number) => {
      faceArray[idx * 3] = face[0] ?? 0
      faceArray[idx * 3 + 1] = face[1] ?? 0
      faceArray[idx * 3 + 2] = face[2] ?? 0
    })

    return faceArray
  }, [timelineSimulation?.mesh?.faces])

  // Initialize evolution timeline
  useEffect(() => {
    if (!enableEvolution || evolutionFrames.length === 0) return

    const totalDays = evolutionFrames[evolutionFrames.length - 1]?.timestamp || 90
    const timeline = new EvolutionTimeline(evolutionFrames, totalDays)
    timeline.setPlaybackSpeed(evolutionPlaybackSpeed)

    if (autoPlayEvolution) {
      timeline.play()
    }

    timelineRef.current = timeline
  }, [enableEvolution, evolutionFrames, evolutionPlaybackSpeed, autoPlayEvolution])

  // Animation loop for evolution
  useFrame((_, delta) => {
    if (!enableEvolution || !timelineRef.current || !meshGroupRef.current) return

    const timeline = timelineRef.current

    // Update timeline
    timeline.update(delta * 1000)

    // Get interpolation data
    const interp = timeline.getCurrentInterpolation()

    // Create morphed geometry
    if (baseFaces.length > 0) {
      const morphedState = MeshMorphingEngine.createMorphedGeometry(
        interp.frame1,
        interp.frame2,
        interp.interpolation,
        baseFaces,
      )

      setEvolutionMesh(morphedState.geometry)
      setCurrentStatus(morphedState.status)
      setCurrentAggressiveness(morphedState.aggressiveness)

      // Callback
      onEvolutionUpdate?.(
        interp.frameIndex,
        timeline.getCurrentDay(),
        morphedState.status,
        morphedState.aggressiveness,
      )
    }
  })

  // If evolution is disabled or no frames, render standard tumor
  if (!enableEvolution || evolutionFrames.length === 0) {
    return (
      <TumorModel
        aggressiveness={aggressiveness}
        medicineEffect={medicineEffect}
        showGenes={showGenes}
        time={time}
        recoveryProgress={recoveryProgress}
        tumorIntensity={tumorIntensity}
        treatmentScore={treatmentScore}
        lesionCoverage={lesionCoverage}
        lesionConfidence={lesionConfidence}
        lesionFocus={lesionFocus}
        timelineSimulation={timelineSimulation}
        timelineFrameIndex={timelineFrameIndex}
        buildProgress={buildProgress}
      />
    )
  }

  // Render evolved tumor mesh
  if (evolutionMesh) {
    return (
      <group ref={meshGroupRef}>
        <mesh geometry={evolutionMesh} castShadow receiveShadow>
          <EvolutionShaderMaterial
            patientSeed={deterministicSeed}
            aggressiveness={currentAggressiveness}
            status={currentStatus}
            pulsationStrength={0.008}
            treatmentScore={treatmentScore}
            effectiveness={shaderEffectiveness}
            instability={shaderInstability}
          />
        </mesh>

        {/* Optional: Outer glow layer */}
        <mesh geometry={evolutionMesh} scale={1.01} castShadow receiveShadow>
          <meshStandardMaterial
            transparent
            opacity={0.1}
            roughness={0.3}
            metalness={0.05}
            color={
              currentStatus === "growing"
                ? 0xff4d73
                : currentStatus === "shrinking"
                  ? 0x38e8b0
                  : 0xff8798
            }
            side={THREE.BackSide}
          />
        </mesh>
      </group>
    )
  }

  // Fallback to standard tumor
  return (
    <TumorModel
      aggressiveness={aggressiveness}
      medicineEffect={medicineEffect}
      showGenes={showGenes}
      time={time}
      recoveryProgress={recoveryProgress}
      tumorIntensity={tumorIntensity}
      treatmentScore={treatmentScore}
      lesionCoverage={lesionCoverage}
      lesionConfidence={lesionConfidence}
      lesionFocus={lesionFocus}
      timelineSimulation={timelineSimulation}
      timelineFrameIndex={timelineFrameIndex}
      buildProgress={buildProgress}
    />
  )
}
