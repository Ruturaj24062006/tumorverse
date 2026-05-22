"use client"

import React, { useEffect, useRef, useState, Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera } from "@react-three/drei"
import * as THREE from "three"

interface ViewerProps {
  src?: string
}

interface TumorMesh {
  vertices: number[][]
  faces: number[][]
}

function TumorVisualization({ mesh, opacity }: { mesh: TumorMesh | null; opacity: number }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useEffect(() => {
    if (!mesh || !meshRef.current) return

    try {
      // Create geometry from mesh data
      const geometry = new THREE.BufferGeometry()

      // Convert vertices to flat array
      const vertices = new Float32Array(mesh.vertices.flat())
      geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3))

      // Convert faces to indices
      const indices = new Uint32Array(mesh.faces.flat())
      geometry.setIndex(new THREE.BufferAttribute(indices, 1))

      // Compute normals for proper lighting
      geometry.computeVertexNormals()
      geometry.center()

      meshRef.current.geometry = geometry
    } catch (err) {
      console.error("Error creating tumor mesh:", err)
    }
  }, [mesh])

  return (
    <mesh ref={meshRef}>
      <meshPhongMaterial
        color="#ff006e"
        emissive="#ff006e"
        emissiveIntensity={0.3}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        shininess={100}
      />
    </mesh>
  )
}

function DefaultTumorVisualization({ opacity }: { opacity: number }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useEffect(() => {
    if (!meshRef.current) return

    // Create a procedural tumor-like shape using a distorted sphere
    const geometry = new THREE.IcosahedronGeometry(1, 5)
    const positionAttribute = geometry.getAttribute("position")

    // Distort vertices to create tumor-like shape
    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i)
      const y = positionAttribute.getY(i)
      const z = positionAttribute.getZ(i)

      // Add noise to create irregular tumor surface
      const noise = Math.sin(x * 3) * Math.cos(y * 3) * Math.sin(z * 3) * 0.3
      const scale = 1 + noise

      positionAttribute.setXYZ(i, x * scale, y * scale, z * scale)
    }
    positionAttribute.needsUpdate = true
    geometry.computeVertexNormals()

    meshRef.current.geometry = geometry
  }, [])

  return (
    <mesh ref={meshRef}>
      <meshPhongMaterial
        color="#ff006e"
        emissive="#ff006e"
        emissiveIntensity={0.4}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        shininess={80}
      />
    </mesh>
  )
}

export default function MedicalVolumeViewer({ src = "/api/simulate" }: ViewerProps) {
  const [volumeOpacity, setVolumeOpacity] = useState(1.0)
  const [tumorOpacity, setTumorOpacity] = useState(0.8)
  const [unitDistance, setUnitDistance] = useState(2.0)
  const [tumorMesh, setTumorMesh] = useState<TumorMesh | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTumorData() {
      try {
        setLoading(true)
        // Try to fetch tumor mesh data from the simulate API
        const response = await fetch(src, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tumor_area: 50,
            days: 30,
            medicine_effectiveness: 0.7,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.mesh) {
            setTumorMesh(data.mesh)
          }
        }
      } catch (err) {
        console.warn("Could not fetch tumor mesh data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchTumorData()
  }, [src])

  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <label style={{ color: "#E8EDF2", fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
          Volume Opacity
          <input
            type="range"
            min={0.1}
            max={1.0}
            step={0.05}
            value={volumeOpacity}
            onChange={(e) => setVolumeOpacity(Number(e.target.value))}
            style={{ width: 120 }}
          />
          <span style={{ fontSize: 11, color: "#94a3b8" }}>{Math.round(volumeOpacity * 100)}%</span>
        </label>
        <label style={{ color: "#E8EDF2", fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
          Tumor Opacity
          <input
            type="range"
            min={0.1}
            max={1.0}
            step={0.05}
            value={tumorOpacity}
            onChange={(e) => setTumorOpacity(Number(e.target.value))}
            style={{ width: 120 }}
          />
          <span style={{ fontSize: 11, color: "#94a3b8" }}>{Math.round(tumorOpacity * 100)}%</span>
        </label>
        <label style={{ color: "#E8EDF2", fontSize: 12, display: "flex", alignItems: "center", gap: 8 }}>
          Unit Distance
          <input
            type="range"
            min={0.5}
            max={5.0}
            step={0.5}
            value={unitDistance}
            onChange={(e) => setUnitDistance(Number(e.target.value))}
            style={{ width: 120 }}
          />
          <span style={{ fontSize: 11, color: "#94a3b8" }}>{unitDistance.toFixed(1)}</span>
        </label>
      </div>

      <div
        style={{
          width: "100%",
          height: 500,
          background: "linear-gradient(135deg, rgba(10, 22, 40, 0.8), rgba(20, 35, 55, 0.6))",
          borderRadius: 8,
          border: "1px solid rgba(0, 255, 255, 0.2)",
          overflow: "hidden",
        }}
      >
        <Suspense
          fallback={
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#94a3b8",
              }}
            >
              {loading ? "Loading tumor data..." : "Initializing 3D viewer..."}
            </div>
          }
        >
          <Canvas
            style={{ width: "100%", height: "100%" }}
            camera={{ position: [3, 3, 3], fov: 50 }}
            gl={{ antialias: true, alpha: true }}
          >
            <PerspectiveCamera makeDefault position={[3, 3, 3]} fov={50} />
            <color attach="background" args={["#0a1628"]} />

            {/* Enhanced Lighting for Tumor Visualization */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} intensity={1} color={0xffffff} />
            <pointLight position={[-5, -5, 5]} intensity={0.6} color="#ff006e" />
            <pointLight position={[5, -5, -5]} intensity={0.4} color="#00ffff" />

            {/* Tumor Visualization */}
            {tumorMesh ? (
              <TumorVisualization mesh={tumorMesh} opacity={tumorOpacity} />
            ) : (
              <DefaultTumorVisualization opacity={tumorOpacity} />
            )}

            {/* Background sphere for context */}
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[2.5, 32, 32]} />
              <meshPhongMaterial
                color="#1e3a5f"
                transparent
                opacity={volumeOpacity * 0.3}
                side={THREE.BackSide}
              />
            </mesh>

            {/* Controls */}
            <OrbitControls
              enableZoom={true}
              enablePan={true}
              enableRotate={true}
              autoRotate={true}
              autoRotateSpeed={2}
              makeDefault
            />
          </Canvas>
        </Suspense>
      </div>

      {/* Info Footer */}
      <div style={{ marginTop: 12, fontSize: 12, color: "#94a3b8" }}>
        <p style={{ margin: 0 }}>
          💡 <strong>Tip:</strong> Tumor shown in <span style={{ color: "#ff006e", fontWeight: "bold" }}>PINK</span> • Use mouse to rotate • Scroll to zoom • Right-click to pan
        </p>
      </div>
    </div>
  )
}
