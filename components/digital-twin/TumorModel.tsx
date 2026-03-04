"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { Sphere, MeshDistortMaterial, Points, PointMaterial } from "@react-three/drei"
import * as THREE from "three"

interface TumorModelProps {
  aggressiveness: "low" | "moderate" | "high"
  medicineEffect: "none" | "effective" | "ineffective"
  showGenes: boolean
  time: number
}

export function TumorModel({ aggressiveness, medicineEffect, showGenes, time }: TumorModelProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const particlesRef = useRef<THREE.Points>(null)

  // Base properties based on aggressiveness
  const baseColor =
    aggressiveness === "high" ? "#FF3B5C" : aggressiveness === "moderate" ? "#FF9F43" : "#00FF9C"
  const baseDistort = aggressiveness === "high" ? 0.6 : aggressiveness === "moderate" ? 0.4 : 0.2
  const baseSpeed = aggressiveness === "high" ? 2 : aggressiveness === "moderate" ? 1 : 0.5
  const baseScale = aggressiveness === "high" ? 1.2 : aggressiveness === "moderate" ? 1.0 : 0.8

  // Growth rate based on aggressiveness (growth per second)
  const growthRate = aggressiveness === "high" ? 0.15 : aggressiveness === "moderate" ? 0.08 : 0.04
  
  // Calculate natural growth over time
  const growthFactor = 1 + (time * growthRate)
  const naturalScale = baseScale * growthFactor

  // Evolution factors: tumor becomes more distorted and faster as it grows
  const evolutionFactor = 1 + (time * 0.02) // Gradual increase over time
  const naturalDistort = baseDistort * evolutionFactor
  const naturalSpeed = baseSpeed * evolutionFactor

  // Modified properties based on medicine effect
  const currentColor =
    medicineEffect === "effective"
      ? "#00FF9C"
      : medicineEffect === "ineffective"
      ? "#FF0000"
      : baseColor

  const currentScale =
    medicineEffect === "effective"
      ? naturalScale * 0.7 // Shrinking with treatment
      : medicineEffect === "ineffective"
      ? naturalScale * 1.3 // Accelerated growth with wrong treatment
      : naturalScale // Natural growth without treatment

  const currentDistort =
    medicineEffect === "effective"
      ? naturalDistort * 0.5 // Reduce distortion with effective treatment
      : medicineEffect === "ineffective"
      ? naturalDistort * 1.5 // Increase distortion with wrong treatment
      : naturalDistort // Natural evolution

  const currentSpeed =
    medicineEffect === "effective"
      ? naturalSpeed * 0.5 // Slow down with effective treatment
      : medicineEffect === "ineffective"
      ? naturalSpeed * 1.5 // Speed up with wrong treatment
      : naturalSpeed // Natural evolution

  // Animation loop
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2 * currentSpeed
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3 * currentSpeed
      
      // Smooth scale transition
      meshRef.current.scale.lerp(new THREE.Vector3(currentScale, currentScale, currentScale), 0.05)
    }

    if (particlesRef.current && showGenes) {
      particlesRef.current.rotation.y = state.clock.getElapsedTime() * 0.1 * currentSpeed
    }
  })

  // Generate gene particles
  const particlePositions = useMemo(() => {
    const count = 200
    const positions = new Float32Array(count * 3)
    const radius = currentScale * 1.5

    for (let i = 0; i < count; i++) {
        // Distribute points roughly uniformly on a sphere, then add some noise
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        
        // Slightly random radius for floating effect
        const r = radius * (0.8 + Math.random() * 0.4);

        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
    }
    return positions
  }, [currentScale]) // Re-generate if base scale changes significantly


  return (
    <group>
      {/* Main Tumor Body */}
      <Sphere ref={meshRef} args={[1, 64, 64]}>
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

      {/* Gene Markers (Glowing Nodes) */}
      {showGenes && (
        <Points ref={particlesRef} positions={particlePositions}>
          <PointMaterial
            transparent
            color="#00E5FF"
            size={0.05}
            sizeAttenuation={true}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </Points>
      )}

       {/* Core glow */}
       <Sphere args={[currentScale * 0.8, 32, 32]}>
        <meshBasicMaterial color={currentColor} transparent opacity={0.15} blending={THREE.AdditiveBlending} />
      </Sphere>
    </group>
  )
}
