"use client"

import { useEffect, useRef, useMemo } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"

interface MedicalLightingSystemProps {
  aggressiveness: "low" | "moderate" | "high"
  medicineEffect: "none" | "effective" | "ineffective"
  recoveryProgress: number
  tumorIntensity: number
  time: number
  treatmentScore?: number
}

export function MedicalLightingSystem({
  aggressiveness,
  medicineEffect,
  recoveryProgress,
  tumorIntensity,
  time,
  treatmentScore = 50,
}: MedicalLightingSystemProps) {
  const { scene } = useThree()
  const mainLightRef = useRef<THREE.DirectionalLight>(null)
  const rimLightRef = useRef<THREE.DirectionalLight>(null)
  const secondaryLightRef = useRef<THREE.DirectionalLight>(null)
  const ambientLightRef = useRef<THREE.AmbientLight>(null)
  const hemisphereLightRef = useRef<THREE.HemisphereLight>(null)

  const lightConfigRef = useRef({
    mainIntensity: 1.15,
    mainColor: new THREE.Color(0xffffff),
    rimIntensity: 0.4,
    rimColor: new THREE.Color(0x6bb9cc),
    secondaryIntensity: 0.3,
    secondaryColor: new THREE.Color(0x4a7a8f),
    ambientIntensity: 0.42,
    ambientColor: new THREE.Color(0x1a3a4a),
    hemisphereSkyIntensity: 0.35,
    hemisphereSkyColor: new THREE.Color(0x1f4f6f),
    hemisphereGroundIntensity: 0.2,
    hemisphereGroundColor: new THREE.Color(0x0d1f35),
  })

  const recoveryRatio = Math.max(0, Math.min(1, recoveryProgress / 100))

  const scoreRatio = Math.max(0, Math.min(1, treatmentScore / 100))
  // Calculate dynamic lighting based on medicine effectiveness
  const effectivenessRatio = useMemo(() => {
    const scoreDriven = 0.1 + scoreRatio * 0.9
    if (medicineEffect === "effective") {
      return Math.max(scoreDriven, 0.85 + recoveryRatio * 0.15)
    }
    if (medicineEffect === "ineffective") {
      return Math.min(scoreDriven, 0.3 - Math.min(0.2, time * 0.02))
    }
    return scoreDriven
  }, [medicineEffect, recoveryProgress, time, scoreRatio])

  // Adjust lighting based on tumor aggressiveness
  const aggressivenessMultiplier = useMemo(() => {
    switch (aggressiveness) {
      case "low":
        return 0.85
      case "moderate":
        return 1.0
      case "high":
        return 1.15
      default:
        return 1.0
    }
  }, [aggressiveness])

  // Main directional light - clinical illumination
  useEffect(() => {
    if (!mainLightRef.current) return

    mainLightRef.current.position.set(6.2, 7.8, 5.4)
    mainLightRef.current.target.position.set(0, 0, 0)
    mainLightRef.current.castShadow = true
    mainLightRef.current.shadow.mapSize.width = 2048
    mainLightRef.current.shadow.mapSize.height = 2048
    mainLightRef.current.shadow.camera.near = 0.3
    mainLightRef.current.shadow.camera.far = 50
    mainLightRef.current.shadow.camera.left = -8
    mainLightRef.current.shadow.camera.right = 8
    mainLightRef.current.shadow.camera.top = 8
    mainLightRef.current.shadow.camera.bottom = -8
    mainLightRef.current.shadow.bias = -0.0004
    mainLightRef.current.shadow.blurSamples = 16
    mainLightRef.current.shadow.mapSize.width = 2048
    mainLightRef.current.shadow.mapSize.height = 2048

    // Clinical white-blue tone
    mainLightRef.current.color.setRGB(0.95, 0.98, 1.0)
  }, [])

  // Rim light - subtle back light for separation
  useEffect(() => {
    if (!rimLightRef.current) return

    rimLightRef.current.position.set(-5.5, 3.2, -7.8)
    rimLightRef.current.target.position.set(0, 0, 0)
    rimLightRef.current.castShadow = false

    // Soft cyan rim light
    rimLightRef.current.color.setRGB(0.42, 0.72, 0.85)
  }, [])

  // Secondary directional light - depth enhancement
  useEffect(() => {
    if (!secondaryLightRef.current) return

    secondaryLightRef.current.position.set(3.2, 2.1, -6.5)
    secondaryLightRef.current.target.position.set(0, 0, 0)
    secondaryLightRef.current.castShadow = false

    // Cool-toned secondary light
    secondaryLightRef.current.color.setRGB(0.42, 0.58, 0.72)
  }, [])

  // Ambient light - avoid overly dark shadows
  useEffect(() => {
    if (!ambientLightRef.current) return

    ambientLightRef.current.color.setRGB(0.15, 0.22, 0.32)
  }, [])

  // Hemisphere light - realistic skydome effect
  useEffect(() => {
    if (!hemisphereLightRef.current) return

    hemisphereLightRef.current.color.setRGB(0.18, 0.35, 0.52)
    hemisphereLightRef.current.groundColor.setRGB(0.08, 0.14, 0.22)
  }, [])

  // Dynamic lighting updates based on medicine effect
  useFrame(() => {
    if (!mainLightRef.current || !rimLightRef.current || !ambientLightRef.current) return

    // Effective medicine: cleaner, brighter lighting
    if (medicineEffect === "effective") {
      const targetMainIntensity = 1.05 + scoreRatio * 0.35
      const targetRimIntensity = 0.36 + scoreRatio * 0.24
      const targetAmbientIntensity = 0.28 + scoreRatio * 0.22

      mainLightRef.current.intensity = THREE.MathUtils.lerp(
        mainLightRef.current.intensity,
        targetMainIntensity,
        0.02,
      )
      rimLightRef.current.intensity = THREE.MathUtils.lerp(rimLightRef.current.intensity, targetRimIntensity, 0.02)
      ambientLightRef.current.intensity = THREE.MathUtils.lerp(
        ambientLightRef.current.intensity,
        targetAmbientIntensity,
        0.02,
      )

      // Shift to cleaner white-blue tones
      mainLightRef.current.color.lerp(new THREE.Color(0xffffff), 0.01)
    }
    // Ineffective medicine: darker, more aggressive lighting
    else if (medicineEffect === "ineffective") {
      const targetMainIntensity = 0.9 - (1.0 - scoreRatio) * 0.18
      const targetRimIntensity = 0.22 + scoreRatio * 0.06
      const targetAmbientIntensity = 0.24 + scoreRatio * 0.05

      mainLightRef.current.intensity = THREE.MathUtils.lerp(
        mainLightRef.current.intensity,
        targetMainIntensity,
        0.02,
      )
      rimLightRef.current.intensity = THREE.MathUtils.lerp(rimLightRef.current.intensity, targetRimIntensity, 0.02)
      ambientLightRef.current.intensity = THREE.MathUtils.lerp(
        ambientLightRef.current.intensity,
        targetAmbientIntensity,
        0.02,
      )

      // Shift to darker, more menacing tones
      mainLightRef.current.color.lerp(new THREE.Color(0xc9a5b8), 0.01)
    }
    // Neutral medicine response
    else {
      const baseMainIntensity = (0.85 + scoreRatio * 0.5) * aggressivenessMultiplier
      const baseRimIntensity = 0.22 + scoreRatio * 0.22
      const baseAmbientIntensity = 0.22 + scoreRatio * 0.24

      mainLightRef.current.intensity = THREE.MathUtils.lerp(
        mainLightRef.current.intensity,
        baseMainIntensity,
        0.02,
      )
      rimLightRef.current.intensity = THREE.MathUtils.lerp(rimLightRef.current.intensity, baseRimIntensity, 0.02)
      ambientLightRef.current.intensity = THREE.MathUtils.lerp(
        ambientLightRef.current.intensity,
        baseAmbientIntensity,
        0.02,
      )

      // Return to clinical white
      mainLightRef.current.color.lerp(new THREE.Color(0xfbfcff), 0.01)
    }

    // Update secondary light and ambient based on aggressiveness
    if (secondaryLightRef.current) {
      secondaryLightRef.current.intensity = 0.3 * aggressivenessMultiplier
    }

    if (hemisphereLightRef.current) {
      const targetHemisphereIntensity = 0.35 * aggressivenessMultiplier
      hemisphereLightRef.current.intensity = THREE.MathUtils.lerp(
        hemisphereLightRef.current.intensity,
        targetHemisphereIntensity,
        0.02,
      )
    }
  })

  return (
    <>
      {/* Main clinical directional light */}
      <directionalLight
        ref={mainLightRef}
        position={[6.2, 7.8, 5.4]}
        intensity={1.15}
        color={0xfbfcff}
        castShadow
      />

      {/* Rim/back light for silhouette and depth */}
      <directionalLight ref={rimLightRef} position={[-5.5, 3.2, -7.8]} intensity={0.4} color={0x6bb9cc} />

      {/* Secondary depth-enhancing light */}
      <directionalLight
        ref={secondaryLightRef}
        position={[3.2, 2.1, -6.5]}
        intensity={0.3}
        color={0x6a9ab6}
      />

      {/* Ambient light - prevents overly dark shadows */}
      <ambientLight ref={ambientLightRef} intensity={0.42} color={0x1a3a4a} />

      {/* Hemisphere light - realistic skydome illumination */}
      <hemisphereLight
        ref={hemisphereLightRef}
        skyColor={0x1f4f6f}
        groundColor={0x0d1f35}
        intensity={0.35}
      />
    </>
  )
}
