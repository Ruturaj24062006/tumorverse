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
}

export function TumorModel({ aggressiveness, medicineEffect, showGenes, time, recoveryProgress, tumorIntensity }: TumorModelProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const particlesRef = useRef<THREE.InstancedMesh>(null)
  const elapsedRef = useRef(0)

  // Base properties based on aggressiveness
  const baseColor =
    aggressiveness === "high" ? "#FF3B5C" : aggressiveness === "moderate" ? "#FF9F43" : "#00FF9C"
  const baseDistort = aggressiveness === "high" ? 0.6 : aggressiveness === "moderate" ? 0.4 : 0.2
  const baseSpeed = aggressiveness === "high" ? 2 : aggressiveness === "moderate" ? 1 : 0.5
  const baseScale = (aggressiveness === "high" ? 1.2 : aggressiveness === "moderate" ? 1.0 : 0.8) * (0.9 + tumorIntensity * 0.25)

  // Growth rate based on aggressiveness (growth per second)
  const growthRate = aggressiveness === "high" ? 0.15 : aggressiveness === "moderate" ? 0.08 : 0.04
  
  // Calculate natural growth over time
  const growthFactor = 1 + (time * growthRate)
  const naturalScale = baseScale * growthFactor

  // Evolution factors: tumor becomes more distorted and faster as it grows
  const evolutionFactor = 1 + (time * 0.02) // Gradual increase over time
  const naturalDistort = baseDistort * evolutionFactor
  const naturalSpeed = baseSpeed * evolutionFactor

  const recoveryRatio = Math.max(0, Math.min(1, recoveryProgress / 100))
  const ineffectiveBoost = medicineEffect === "ineffective" ? Math.min(0.8, time * 0.03) : 0

  // Modified properties based on medicine effect
  const currentColor = (() => {
    if (medicineEffect === "ineffective") {
      return "#FF3B5C"
    }

    if (medicineEffect === "effective") {
      const start = new THREE.Color(baseColor)
      const mid = new THREE.Color("#FF9F43")
      const end = new THREE.Color("#00FF9C")

      if (recoveryRatio < 0.5) {
        return start.lerp(mid, recoveryRatio * 2).getStyle()
      }

      return mid.lerp(end, (recoveryRatio - 0.5) * 2).getStyle()
    }

    return baseColor
  })()

  const currentScale =
    medicineEffect === "effective"
      ? naturalScale * (1 - 0.25 * recoveryRatio) // Slight shrink with treatment progress
      : medicineEffect === "ineffective"
      ? naturalScale * (1.15 + ineffectiveBoost) // Accelerated growth with wrong treatment
      : naturalScale // Natural growth without treatment

  const currentDistort =
    medicineEffect === "effective"
      ? naturalDistort * (1 - 0.6 * recoveryRatio) // Smoother surface during recovery
      : medicineEffect === "ineffective"
      ? naturalDistort * (1.35 + ineffectiveBoost * 0.5) // Increase distortion with wrong treatment
      : naturalDistort // Natural evolution

  const currentSpeed =
    medicineEffect === "effective"
      ? naturalSpeed * (1 - 0.45 * recoveryRatio) // Slow down with effective treatment
      : medicineEffect === "ineffective"
      ? naturalSpeed * (1.4 + ineffectiveBoost * 0.4) // Speed up with wrong treatment
      : naturalSpeed // Natural evolution

  const particleCount = useMemo(() => {
    if (medicineEffect === "effective") return 80
    if (medicineEffect === "ineffective") return 120
    return 100
  }, [medicineEffect])

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
  }, [particleCount, currentScale, medicineEffect, tumorIntensity])

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

    if (meshRef.current) {
      meshRef.current.rotation.x = elapsedRef.current * 0.2 * currentSpeed
      meshRef.current.rotation.y = elapsedRef.current * 0.3 * currentSpeed
      meshRef.current.scale.lerp(new THREE.Vector3(currentScale, currentScale, currentScale), 0.05)
    }

    if (particlesRef.current && showGenes) {
      particlesRef.current.rotation.y = elapsedRef.current * 0.1 * currentSpeed
      particlesRef.current.rotation.x = elapsedRef.current * 0.05 * currentSpeed
    }
  })


  return (
    <group>
      {/* Main Tumor Body */}
      <Sphere ref={meshRef} args={[1, 32, 32]}>
        <MeshDistortMaterial
          color={currentColor}
          envMapIntensity={1}
          clearcoat={1}
          clearcoatRoughness={0.1}
          metalness={0.5}
          roughness={0.2}
          distort={currentDistort}
          speed={currentSpeed}
          emissive={currentColor}
          emissiveIntensity={0.2}
        />
      </Sphere>

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

       {/* Core glow */}
       <Sphere args={[currentScale * 0.8, 16, 16]}>
        <meshBasicMaterial color={currentColor} transparent opacity={0.15} blending={THREE.AdditiveBlending} />
      </Sphere>
    </group>
  )
}
