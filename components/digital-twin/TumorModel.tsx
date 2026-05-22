"use client"

import { useEffect, useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { Sphere, MeshDistortMaterial } from "@react-three/drei"
import * as THREE from "three"
import { EnhancedMedicalMaterial } from "./EnhancedMedicalMaterial"

interface TumorMeshData {
  vertices: number[][]
  faces: number[][]
  densityMap?: number[]
  tissueRegions?: number[]
  opacityMap?: number[]
}

interface TumorTimelineData {
  status?: "shrinking" | "growing" | "stable" | string
  tumor_area_percentages?: number[]
  mesh?: TumorMeshData | null
}

interface TumorModelProps {
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
  timelineSimulation?: TumorTimelineData | null
  timelineFrameIndex?: number
  buildProgress?: number
}

export function TumorModel({
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
}: TumorModelProps) {
  const volumeRef = useRef<THREE.Group>(null)
  const tissueRef = useRef<THREE.Mesh>(null)
  const lesionRef = useRef<THREE.Mesh>(null)
  const particlesRef = useRef<THREE.InstancedMesh>(null)
  const elapsedRef = useRef(0)
  const meshGeometryRef = useRef<THREE.BufferGeometry | null>(null)
  const scoreRatio = Math.max(0, Math.min(1, treatmentScore / 100))

  const baseSpeed = (aggressiveness === "high" ? 1.15 : aggressiveness === "moderate" ? 0.84 : 0.58) * (0.88 + (1.0 - scoreRatio) * 0.22)
  const focusX = lesionFocus ? (lesionFocus.x - 0.5) * 1.4 : 0
  const focusY = lesionFocus ? (0.5 - lesionFocus.y) * 1.4 : 0
  const focusStrength = Math.min(1, lesionCoverage * 3 + lesionConfidence * 0.35)
  const recoveryRatio = Math.max(0, Math.min(1, recoveryProgress / 100))
  const timelineAreas = timelineSimulation?.tumor_area_percentages || []
  const currentTimelineArea = timelineAreas.length > 0 ? timelineAreas[Math.min(Math.max(timelineFrameIndex, 0), timelineAreas.length - 1)] : null
  const baselineTimelineArea = timelineAreas[0] || null
  const timelineStatus = (timelineSimulation?.status || (treatmentScore >= 70 ? "shrinking" : treatmentScore < 40 ? "growing" : medicineEffect === "effective" ? "shrinking" : medicineEffect === "ineffective" ? "growing" : "stable")) as
    | "shrinking"
    | "growing"
    | "stable"
    | string

  const effectiveShrink = 1 - (0.18 + scoreRatio * 0.5) * recoveryRatio
  const ineffectiveGrowth = 1 + Math.min(0.58, time * (0.025 + (1.0 - scoreRatio) * 0.03))
  const treatmentScale =
    treatmentScore >= 70 || timelineStatus === "shrinking"
      ? effectiveShrink
      : treatmentScore < 40 || timelineStatus === "growing"
      ? ineffectiveGrowth
      : medicineEffect === "effective"
      ? effectiveShrink
      : medicineEffect === "ineffective"
      ? ineffectiveGrowth
      : 1
  const timelineScale =
    currentTimelineArea && baselineTimelineArea
      ? Math.sqrt(Math.max(0.2, currentTimelineArea / Math.max(0.1, baselineTimelineArea)))
      : null
  const currentScale = 1

  const patientSeed = useMemo(() => {
    const mesh = timelineSimulation?.mesh
    const vertexCount = mesh?.vertices?.length || 0
    const faceCount = mesh?.faces?.length || 0
    const focusMix = lesionFocus ? lesionFocus.x * 17.13 + lesionFocus.y * 23.91 : 0
    const aggressivenessMix = aggressiveness === "high" ? 31 : aggressiveness === "moderate" ? 17 : 7
    const seed = Math.sin(vertexCount * 12.9898 + faceCount * 78.233 + focusMix + aggressivenessMix) * 43758.5453
    return seed - Math.floor(seed)
  }, [timelineSimulation, lesionFocus, aggressiveness])

  const lesionBaseRadius = (0.14 + focusStrength * 0.22) * (0.7 + (1.0 - scoreRatio) * 0.5)
  const lesionRadius =
    treatmentScore >= 70 || timelineStatus === "shrinking"
      ? lesionBaseRadius * (1 - recoveryRatio * (0.4 + scoreRatio * 0.2))
      : treatmentScore < 40 || timelineStatus === "growing"
      ? lesionBaseRadius * (1 + Math.min(0.65, time * (0.04 + (1.0 - scoreRatio) * 0.02)))
      : lesionBaseRadius * (1 + Math.sin(time * 0.9) * (0.03 + (1.0 - scoreRatio) * 0.03))

  const lesionColor = treatmentScore >= 70 || timelineStatus === "shrinking" ? "#38e8b0" : treatmentScore < 40 || timelineStatus === "growing" ? "#ff4d73" : "#ff8798"
  const tissueColor = treatmentScore >= 70 || timelineStatus === "shrinking" ? "#80d9ff" : treatmentScore < 40 || timelineStatus === "growing" ? "#8bb0ff" : "#9bcfff"
  const sliceColor = treatmentScore >= 70 || timelineStatus === "shrinking" ? "#a7edff" : treatmentScore < 40 || timelineStatus === "growing" ? "#b3c8ff" : "#b9ddff"

  const meshGeometry = useMemo(() => {
    const mesh = timelineSimulation?.mesh
    if (!mesh?.vertices?.length || !mesh?.faces?.length) {
      return null
    }

    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(mesh.vertices.length * 3)
    mesh.vertices.forEach((vertex, index) => {
      positions[index * 3] = Number(vertex[0] ?? 0)
      positions[index * 3 + 1] = Number(vertex[1] ?? 0)
      positions[index * 3 + 2] = Number(vertex[2] ?? 0)
    })

    // Build index array using 16-bit when possible to maximize compatibility.
    const indexCount = mesh.faces.length * 3
    const useUint16 = mesh.vertices.length < 65535
    const IndexArray = useUint16 ? Uint16Array : Uint32Array
    const indices = new IndexArray(indexCount)
    mesh.faces.forEach((face, index) => {
      indices[index * 3] = Number(face[0] ?? 0)
      indices[index * 3 + 1] = Number(face[1] ?? 0)
      indices[index * 3 + 2] = Number(face[2] ?? 0)
    })

    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
    geometry.setIndex(new THREE.BufferAttribute(indices, 1))

    const densityMap = mesh.densityMap || []
    const opacityMap = mesh.opacityMap || []
    const tissueRegions = mesh.tissueRegions || []

    const densityAttr = new Float32Array(mesh.vertices.length)
    const opacityAttr = new Float32Array(mesh.vertices.length)
    const tissueAttr = new Float32Array(mesh.vertices.length)

    for (let i = 0; i < mesh.vertices.length; i++) {
      densityAttr[i] = Number.isFinite(densityMap[i]) ? Number(densityMap[i]) : 0.62
      opacityAttr[i] = Number.isFinite(opacityMap[i]) ? Number(opacityMap[i]) : 0.78
      tissueAttr[i] = Number.isFinite(tissueRegions[i]) ? Number(tissueRegions[i]) : 2
    }

    geometry.setAttribute("aDensity", new THREE.Float32BufferAttribute(densityAttr, 1))
    geometry.setAttribute("aOpacity", new THREE.Float32BufferAttribute(opacityAttr, 1))
    geometry.setAttribute("aTissueRegion", new THREE.Float32BufferAttribute(tissueAttr, 1))

    geometry.computeVertexNormals()
    geometry.computeBoundingSphere()

    // Debugging: log mesh sizes when loaded in dev
    if (typeof window !== "undefined" && (window as any).DEBUG_TUMOR_MESH) {
      // eslint-disable-next-line no-console
      console.debug("Tumor mesh loaded", { vertices: mesh.vertices.length, faces: mesh.faces.length, useUint16 })
    }

    return geometry
  }, [timelineSimulation])

  const mriSlices = useMemo(() => {
    const total = 11
    return Array.from({ length: total }, (_, index) => {
      const norm = -1 + (index / (total - 1)) * 2
      return { index, norm }
    })
  }, [])

  const particleCount = useMemo(() => {
    if (treatmentScore >= 70 || timelineStatus === "shrinking") return 72
    if (treatmentScore < 40 || timelineStatus === "growing") return 132
    return Math.round(94 + focusStrength * 28)
  }, [timelineStatus, focusStrength, treatmentScore])

  const particleMatrices = useMemo(() => {
    const matrices: THREE.Matrix4[] = []
    const radius = 1.5
    const dummy = new THREE.Object3D()
    const seed = (patientSeed * 9973.0 + 17.0) % 1

    for (let i = 0; i < particleCount; i++) {
      const base = seed + i * 0.61803398875
      const theta = (base * Math.PI * 2.0) % (Math.PI * 2)
      const phi = Math.acos(Math.max(-1, Math.min(1, Math.sin(base * 13.0))))
      const jitter = 0.82 + 0.18 * Math.abs(Math.sin(base * 7.7))
      const r = radius * jitter

      const x = r * Math.sin(phi) * Math.cos(theta)
      const y = r * Math.sin(phi) * Math.sin(theta)
      const z = r * Math.cos(phi)

      dummy.position.set(x, y, z)
      dummy.scale.setScalar(treatmentScore < 40 || timelineStatus === "growing" ? 1.12 : 0.9 + scoreRatio * 0.14)
      dummy.updateMatrix()
      matrices.push(dummy.matrix.clone())
    }

    return matrices
  }, [particleCount, timelineStatus, patientSeed, scoreRatio, treatmentScore])

  useEffect(() => {
    if (!particlesRef.current || !showGenes) return

    particleMatrices.forEach((matrix, index) => {
      particlesRef.current?.setMatrixAt(index, matrix)
    })
    particlesRef.current.instanceMatrix.needsUpdate = true
  }, [particleMatrices, showGenes])

  useEffect(() => {
    return () => {
      meshGeometryRef.current?.dispose()
    }
  }, [])

  useEffect(() => {
    meshGeometryRef.current?.dispose()
    meshGeometryRef.current = meshGeometry
  }, [meshGeometry])

  useFrame((_, delta) => {
    const safeDelta = Math.min(delta, 0.05)
    elapsedRef.current += safeDelta

    if (volumeRef.current) {
      const rotationBoost = treatmentScore < 40 || timelineStatus === "growing" ? 1.4 : treatmentScore >= 70 || timelineStatus === "shrinking" ? 0.62 : 0.9
      volumeRef.current.rotation.y = elapsedRef.current * 0.22 * baseSpeed * rotationBoost
      volumeRef.current.rotation.x = Math.sin(elapsedRef.current * 0.32) * 0.08
    }

    if (tissueRef.current) {
      const pulse = 1 + Math.sin(elapsedRef.current * (0.7 + focusStrength * 1.2)) * ((0.012 + focusStrength * 0.02) * (1.0 - scoreRatio * 0.7))
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
    <group ref={volumeRef} scale={[1, 1, 1]}>
      {meshGeometry ? (
        <>
          <mesh geometry={meshGeometry} ref={tissueRef} castShadow receiveShadow>
            <EnhancedMedicalMaterial
              patientSeed={patientSeed}
              timelineStatus={timelineStatus}
              focusStrength={focusStrength}
              focusX={focusX}
              focusY={focusY}
              opacity={0.9}
              medicineEffect={medicineEffect}
              aggressiveness={aggressiveness}
              treatmentScore={treatmentScore}
            />
          </mesh>

          <mesh geometry={meshGeometry} scale={1.04} castShadow receiveShadow>
            <meshStandardMaterial
              color={lesionColor}
              transparent
              opacity={0.18}
              roughness={0.2}
              metalness={0.04}
              emissive={lesionColor}
              emissiveIntensity={0.35}
              side={THREE.BackSide}
            />
          </mesh>
        </>
      ) : (
        <>
          <Sphere ref={tissueRef} args={[1.02, 56, 56]} castShadow receiveShadow>
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

          <Sphere args={[0.94, 34, 34]} castShadow receiveShadow>
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
        </>
      )}

      {mriSlices.map((slice) => {
        const sliceCurve = Math.exp(-Math.pow(slice.norm, 2) * 2.35)
        const flicker = 0.95 + Math.sin(time * 2.1 + slice.index * 0.55) * 0.05
        const sliceRadius = Math.max(0.04, 1.08 * sliceCurve * flicker)
        const sliceOpacity = 0.025 + sliceCurve * 0.06
        const lesionSliceStrength = Math.exp(-Math.pow(slice.norm - focusY * 0.7, 2) / 0.14) * (0.35 + focusStrength * 0.65)

        return (
          <group key={slice.index}>
            <mesh position={[0, slice.norm * 1.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[sliceRadius, 48]} />
              <meshBasicMaterial color={sliceColor} transparent opacity={sliceOpacity} blending={THREE.AdditiveBlending} />
            </mesh>

            {lesionSliceStrength > 0.03 && (
              <mesh
                position={[focusX * 0.52, slice.norm * 1.15, 0.01]}
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
        <group position={[focusX * 0.45, focusY * 0.45, 0]}>
          <Sphere ref={lesionRef} args={[lesionRadius, 26, 26]}>
            <MeshDistortMaterial
              color={lesionColor}
              emissive={lesionColor}
              emissiveIntensity={timelineStatus === "shrinking" ? 0.5 : 0.85}
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
        <instancedMesh ref={particlesRef} args={[undefined, undefined, particleCount]} castShadow receiveShadow>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshBasicMaterial
            transparent
            color={timelineStatus === "growing" ? "#FF3B5C" : "#00E5FF"}
            opacity={0.85}
            blending={THREE.AdditiveBlending}
          />
        </instancedMesh>
      )}
    </group>
  )
}
