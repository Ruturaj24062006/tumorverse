"use client"

import { Suspense, useEffect, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import {
  EffectComposer,
  Bloom,
  SSAO,
  Vignette,
  ToneMapping,
  DepthOfField,
  ChromaticAberration,
} from "@react-three/postprocessing"
import { BlendFunction, ToneMappingMode } from "postprocessing"
import * as THREE from "three"

interface MedicalPostProcessingProps {
  medicineEffect: "none" | "effective" | "ineffective"
  recoveryProgress: number
  tumorIntensity: number
  treatmentScore?: number
}

export function MedicalPostProcessing({
  medicineEffect,
  recoveryProgress,
  tumorIntensity,
  treatmentScore = 50,
}: MedicalPostProcessingProps) {
  const composerRef = useRef<any>(null)
  const bloomRef = useRef<any>(null)
  const ssaoRef = useRef<any>(null)
  const toneRef = useRef<any>(null)
  const vignetteRef = useRef<any>(null)
  const { camera } = useThree()

  const recoveryRatio = Math.max(0, Math.min(1, recoveryProgress / 100))
  const scoreRatio = Math.max(0, Math.min(1, treatmentScore / 100))

  // Dynamic bloom based on medicine effectiveness
  useFrame(() => {
    if (!bloomRef.current) return

    if (medicineEffect === "effective") {
      // Softer bloom for effective medicine
      bloomRef.current.luminanceThreshold = THREE.MathUtils.lerp(
        bloomRef.current.luminanceThreshold || 0.2,
        0.15,
        0.05,
      )
      bloomRef.current.luminanceSmoothing = THREE.MathUtils.lerp(
        bloomRef.current.luminanceSmoothing || 0.9,
        0.92,
        0.05,
      )
      bloomRef.current.intensity = THREE.MathUtils.lerp(bloomRef.current.intensity || 1.0, 1.0 + scoreRatio * 0.45, 0.05)
      bloomRef.current.radius = THREE.MathUtils.lerp(bloomRef.current.radius || 0.6, 0.55 + scoreRatio * 0.35, 0.05)
    } else if (medicineEffect === "ineffective") {
      // More aggressive bloom for ineffective medicine
      bloomRef.current.luminanceThreshold = THREE.MathUtils.lerp(
        bloomRef.current.luminanceThreshold || 0.2,
        0.1,
        0.05,
      )
      bloomRef.current.luminanceSmoothing = THREE.MathUtils.lerp(
        bloomRef.current.luminanceSmoothing || 0.9,
        0.85,
        0.05,
      )
      bloomRef.current.intensity = THREE.MathUtils.lerp(bloomRef.current.intensity || 1.0, 0.9 - scoreRatio * 0.2, 0.05)
      bloomRef.current.radius = THREE.MathUtils.lerp(bloomRef.current.radius || 0.6, 0.35 + (1.0 - scoreRatio) * 0.12, 0.05)
    } else {
      // Neutral bloom
      bloomRef.current.luminanceThreshold = THREE.MathUtils.lerp(
        bloomRef.current.luminanceThreshold || 0.2,
        0.18,
        0.05,
      )
      bloomRef.current.luminanceSmoothing = THREE.MathUtils.lerp(
        bloomRef.current.luminanceSmoothing || 0.9,
        0.9,
        0.05,
      )
      bloomRef.current.intensity = THREE.MathUtils.lerp(bloomRef.current.intensity || 1.0, 0.88 + scoreRatio * 0.28, 0.05)
      bloomRef.current.radius = THREE.MathUtils.lerp(bloomRef.current.radius || 0.6, 0.42 + scoreRatio * 0.28, 0.05)
    }
  })

  // Dynamic SSAO for depth perception
  useFrame(() => {
    if (!ssaoRef.current) return

    const targetRadius = medicineEffect === "effective" ? 0.0025 + (1.0 - scoreRatio) * 0.003 : medicineEffect === "ineffective" ? 0.014 - scoreRatio * 0.006 : 0.008 - scoreRatio * 0.003
    const targetIntensity = medicineEffect === "effective" ? 0.18 + scoreRatio * 0.18 : medicineEffect === "ineffective" ? 0.58 - scoreRatio * 0.12 : 0.5 - scoreRatio * 0.14

    ssaoRef.current.radius = THREE.MathUtils.lerp(ssaoRef.current.radius || 0.008, targetRadius, 0.05)
    ssaoRef.current.intensity = THREE.MathUtils.lerp(ssaoRef.current.intensity || 0.45, targetIntensity, 0.05)
  })

  // Dynamic tone mapping and vignette
  useFrame(() => {
    if (!toneRef.current || !vignetteRef.current) return

    const targetExposure = medicineEffect === "effective" ? 0.98 + scoreRatio * 0.22 : medicineEffect === "ineffective" ? 0.95 - (1.0 - scoreRatio) * 0.06 : 0.96 + scoreRatio * 0.1
    toneRef.current.exposure = THREE.MathUtils.lerp(toneRef.current.exposure || 1.0, targetExposure, 0.05)

    const targetVignette = medicineEffect === "ineffective" ? 0.6 - scoreRatio * 0.12 : 0.42 - scoreRatio * 0.1
    vignetteRef.current.darkness = THREE.MathUtils.lerp(
      vignetteRef.current.darkness || 0.35,
      targetVignette,
      0.05,
    )
  })

  return (
    <EffectComposer ref={composerRef} multisampling={8}>
      {/* Subtle bloom for medical cinematic look */}
      <Bloom
        ref={bloomRef}
        luminanceThreshold={0.18}
        luminanceSmoothing={0.9}
        intensity={1.15}
        radius={0.75}
        blendFunction={BlendFunction.SCREEN}
      />

      {/* Screen-space ambient occlusion for depth and realism */}
      <SSAO
        ref={ssaoRef}
        radius={0.008}
        intensity={0.45}
        bias={0.0}
        falloff={1.0}
        samples={11}
        rings={4}
      />

      {/* Filmic tone mapping for medical imaging look */}
      <ToneMapping ref={toneRef} mode={ToneMappingMode.FILMIC} exposure={1.0} />

      {/* Vignette for focus and cinematic framing */}
      <Vignette
        ref={vignetteRef}
        darkness={0.35}
        offset={0.15}
        blendFunction={BlendFunction.NORMAL}
      />

      {/* Subtle chromatic aberration for immersion (disabled for medical realism) */}
      {/* <ChromaticAberration 
        offset={new THREE.Vector2(0.001, 0.001)}
        blendFunction={BlendFunction.NORMAL}
      /> */}

      {/* Optional depth of field for focus (disabled by default) */}
      {/* <DepthOfField
        focusDistance={0}
        focalLength={0.02}
        bokehScale={2}
      /> */}
    </EffectComposer>
  )
}
