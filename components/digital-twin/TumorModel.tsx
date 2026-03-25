"use client"

import { useEffect, useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { Sphere, MeshDistortMaterial } from "@react-three/drei"
import * as THREE from "three"

interface TumorModelProps {
  aggressiveness: "low" | "moderate" | "high"
  medicineEffect: "none" | "effective" | "ineffective"
  showGenes: boolean
  time: number
  recoveryProgress: number
  tumorIntensity: number
  lesionCoverage?: number
  lesionConfidence?: number
  lesionFocus?: {
    x: number
    y: number
  } | null
  buildProgress?: number
}

export function TumorModel({
  aggressiveness,
  medicineEffect,
  showGenes,
  time,
  recoveryProgress,
  tumorIntensity,
  lesionCoverage = 0,
  lesionConfidence = 0,
  lesionFocus,
  buildProgress = 1,
}: TumorModelProps) {
  const volumeRef = useRef<THREE.Group>(null)
  const tissueRef = useRef<THREE.Mesh>(null)
  const lesionRef = useRef<THREE.Mesh>(null)
  const particlesRef = useRef<THREE.InstancedMesh>(null)
  const elapsedRef = useRef(0)

  const baseScale = (aggressiveness === "high" ? 1.24 : aggressiveness === "moderate" ? 1.04 : 0.86) * (0.88 + tumorIntensity * 0.24)
  const baseSpeed = aggressiveness === "high" ? 1.25 : aggressiveness === "moderate" ? 0.9 : 0.6
  const focusX = lesionFocus ? (lesionFocus.x - 0.5) * 1.4 : 0
  const focusY = lesionFocus ? (0.5 - lesionFocus.y) * 1.4 : 0
  const focusStrength = Math.min(1, lesionCoverage * 3 + lesionConfidence * 0.35)
  const buildScale = 0.08 + Math.max(0, Math.min(1, buildProgress)) * 0.92
  const recoveryRatio = Math.max(0, Math.min(1, recoveryProgress / 100))

  const growthRate = aggressiveness === "high" ? 0.15 : aggressiveness === "moderate" ? 0.08 : 0.04
  const growthFactor = 1 + (time * growthRate)
  const effectiveShrink = 1 - recoveryRatio * 0.48
  const ineffectiveGrowth = 1 + Math.min(0.75, time * 0.05)
  const treatmentScale =
    medicineEffect === "effective" ? effectiveShrink : medicineEffect === "ineffective" ? ineffectiveGrowth : 1
  const currentScale = baseScale * growthFactor * treatmentScale * buildScale

  const lesionBaseRadius = currentScale * (0.2 + focusStrength * 0.24)
  const lesionRadius =
    medicineEffect === "effective"
      ? lesionBaseRadius * (1 - recoveryRatio * 0.58)
      : medicineEffect === "ineffective"
      ? lesionBaseRadius * (1 + Math.min(0.85, time * 0.06))
      : lesionBaseRadius * (1 + Math.sin(time * 1.2) * 0.05)

  const lesionColor = medicineEffect === "effective" ? "#38e8b0" : medicineEffect === "ineffective" ? "#ff4d73" : "#ff8798"
  const tissueColor = medicineEffect === "effective" ? "#80d9ff" : medicineEffect === "ineffective" ? "#8bb0ff" : "#9bcfff"
  const sliceColor = medicineEffect === "effective" ? "#a7edff" : medicineEffect === "ineffective" ? "#b3c8ff" : "#b9ddff"

  const mriSlices = useMemo(() => {
    const total = 11
    return Array.from({ length: total }, (_, index) => {
      const norm = -1 + (index / (total - 1)) * 2
      return { index, norm }
    })
  }, [])

  const particleCount = useMemo(() => {
    if (medicineEffect === "effective") return 80
    if (medicineEffect === "ineffective") return 120
    return Math.round(100 + focusStrength * 40)
  }, [medicineEffect, focusStrength])

  const particleMatrices = useMemo(() => {
    const matrices: THREE.Matrix4[] = []
    const radius = currentScale * 1.5
    const dummy = new THREE.Object3D()

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)
      const r = radius * (0.8 + Math.random() * 0.4)

      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.sin(phi) * Math.sin(theta)
      const z = r * Math.cos(phi)

      dummy.position.set(x, y, z)
      dummy.scale.setScalar(medicineEffect === "ineffective" ? 1.15 : 1)
      dummy.updateMatrix()
      matrices.push(dummy.matrix.clone())
    }

    return matrices
  }, [particleCount, currentScale, medicineEffect])

  useEffect(() => {
    if (!particlesRef.current || !showGenes) return

    particleMatrices.forEach((matrix, index) => {
      particlesRef.current?.setMatrixAt(index, matrix)
    })
    particlesRef.current.instanceMatrix.needsUpdate = true
  }, [particleMatrices, showGenes])

  useFrame((_, delta) => {
    const safeDelta = Math.min(delta, 0.05)
    elapsedRef.current += safeDelta

    if (volumeRef.current) {
      const rotationBoost = medicineEffect === "ineffective" ? 1.45 : medicineEffect === "effective" ? 0.65 : 1
      volumeRef.current.rotation.y = elapsedRef.current * 0.22 * baseSpeed * rotationBoost
      volumeRef.current.rotation.x = Math.sin(elapsedRef.current * 0.32) * 0.08
    }

    if (tissueRef.current) {
      const pulse = 1 + Math.sin(elapsedRef.current * (1.1 + focusStrength * 1.8)) * (0.02 + focusStrength * 0.03)
      tissueRef.current.scale.setScalar(pulse)
    }

    if (lesionRef.current) {
      lesionRef.current.rotation.y = elapsedRef.current * (0.35 + focusStrength * 0.4)
      lesionRef.current.rotation.x = elapsedRef.current * 0.2
    }

    if (particlesRef.current && showGenes) {
      particlesRef.current.rotation.y = elapsedRef.current * 0.12 * baseSpeed
      particlesRef.current.rotation.x = elapsedRef.current * 0.06 * baseSpeed
    }
  })


  return (
    <group ref={volumeRef}>
      <Sphere ref={tissueRef} args={[currentScale * 1.02, 56, 56]}>
        <MeshDistortMaterial
          color={tissueColor}
          transparent
          opacity={0.26}
          roughness={0.32}
          metalness={0.08}
          distort={0.22 + focusStrength * 0.14}
          speed={0.6 + baseSpeed * 0.25}
          emissive={tissueColor}
          emissiveIntensity={0.06}
        />
      </Sphere>

      <Sphere args={[currentScale * 0.94, 34, 34]}>
        <meshPhysicalMaterial
          color={tissueColor}
          transparent
          opacity={0.1}
          roughness={0.8}
          metalness={0.02}
          transmission={0.22}
          clearcoat={0.16}
        />
      </Sphere>

      {mriSlices.map((slice) => {
        const sliceCurve = Math.exp(-Math.pow(slice.norm, 2) * 2.35)
        const flicker = 0.95 + Math.sin(time * 2.1 + slice.index * 0.55) * 0.05
        const sliceRadius = Math.max(0.04, currentScale * 1.08 * sliceCurve * flicker)
        const sliceOpacity = 0.025 + sliceCurve * 0.06
        const lesionSliceStrength = Math.exp(-Math.pow(slice.norm - focusY * 0.7, 2) / 0.14) * (0.35 + focusStrength * 0.65)

        return (
          <group key={slice.index}>
            <mesh position={[0, slice.norm * currentScale * 1.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[sliceRadius, 48]} />
              <meshBasicMaterial color={sliceColor} transparent opacity={sliceOpacity} blending={THREE.AdditiveBlending} />
            </mesh>

            {lesionSliceStrength > 0.03 && (
              <mesh
                position={[focusX * currentScale * 0.52, slice.norm * currentScale * 1.15, 0.01]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <circleGeometry args={[Math.max(0.02, lesionRadius * lesionSliceStrength * 0.48), 42]} />
                <meshBasicMaterial
                  color={lesionColor}
                  transparent
                  opacity={0.22 + lesionSliceStrength * 0.44}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            )}
          </group>
        )
      })}

      {focusStrength > 0.02 && (
        <group position={[focusX * currentScale * 0.45, focusY * currentScale * 0.45, 0]}>
          <Sphere ref={lesionRef} args={[lesionRadius, 26, 26]}>
            <MeshDistortMaterial
              color={lesionColor}
              emissive={lesionColor}
              emissiveIntensity={medicineEffect === "effective" ? 0.5 : 0.85}
              transparent
              opacity={0.5}
              distort={0.35}
              speed={1.2}
            />
          </Sphere>

          <Sphere args={[lesionRadius * 1.46, 18, 18]}>
            <meshBasicMaterial color={lesionColor} transparent opacity={0.18} blending={THREE.AdditiveBlending} />
          </Sphere>
        </group>
      )}

      {/* Gene Markers (Instanced for GPU efficiency) */}
      {showGenes && (
        <instancedMesh ref={particlesRef} args={[undefined, undefined, particleCount]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshBasicMaterial
            transparent
            color={medicineEffect === "ineffective" ? "#FF3B5C" : "#00E5FF"}
            opacity={0.85}
            blending={THREE.AdditiveBlending}
          />
        </instancedMesh>
      )}
    </group>
  )
}
