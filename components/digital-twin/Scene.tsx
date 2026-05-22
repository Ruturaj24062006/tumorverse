"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, PerspectiveCamera, PerformanceMonitor } from "@react-three/drei"
import * as THREE from "three"
import { TumorModel } from "./TumorModel"
import { MedicalLightingSystem } from "./MedicalLightingSystem"
import { MedicalPostProcessing } from "./MedicalPostProcessing"
import { VolumetricMedicalLighting } from "./VolumetricMedicalLighting"
import { Loader2 } from "lucide-react"

interface SceneProps {
    aggressiveness: "low" | "moderate" | "high"
    medicineEffect: "none" | "effective" | "ineffective"
    showGenes: boolean
    time: number
    rotateEnabled: boolean
    zoomLevel: number
    recoveryProgress: number
    tumorIntensity: number
    treatmentScore?: number
    lesionCoverage?: number
    lesionConfidence?: number
    lesionFocus?: {
        x: number
        y: number
    } | null
    timelineSimulation?: {
        status?: string
        tumor_area_percentages?: number[]
        mesh?: {
            vertices: number[][]
            faces: number[][]
            densityMap?: number[]
            opacityMap?: number[]
            tissueRegions?: number[]
        }
    } | null
    timelineFrameIndex?: number
    buildProgress?: number
}

export function Scene({
    aggressiveness,
    medicineEffect,
    showGenes,
    time,
    rotateEnabled,
    zoomLevel,
    recoveryProgress,
    tumorIntensity,
    treatmentScore = 50,
    lesionCoverage,
    lesionConfidence,
    lesionFocus,
    timelineSimulation,
    timelineFrameIndex = 0,
    buildProgress = 1,
}: SceneProps) {
    const canvasRef = useRef<HTMLDivElement>(null)
    const [isLowPowerMode, setIsLowPowerMode] = useState(false)

    useEffect(() => {
        const handleContextLost = (event: Event) => {
            event.preventDefault()
            // Silently handle context loss - no need to log as it's expected
        }

        const canvas = canvasRef.current?.querySelector("canvas")
        if (canvas && canvas instanceof HTMLCanvasElement) {
            canvas.addEventListener("webglcontextlost", handleContextLost, false)
            return () => {
                canvas.removeEventListener("webglcontextlost", handleContextLost, false)
            }
        }

        return
    }, [])

    return (
        <div className="relative h-full w-full rounded-xl overflow-hidden" style={{ background: "radial-gradient(ellipse at center, #0d1f35 0%, #060e1a 100%)" }} ref={canvasRef}>
            <Suspense fallback={
                <div className="absolute inset-0 flex items-center justify-center text-[#00E5FF]">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            }>
                <Canvas
                    dpr={isLowPowerMode ? [1, 1.25] : [1, 1.5]}
                    frameloop={rotateEnabled || showGenes || medicineEffect !== "none" ? "always" : "demand"}
                    style={{ background: "transparent" }}
                    gl={{
                        antialias: true,
                        alpha: false,
                        powerPreference: "high-performance",
                        preserveDrawingBuffer: false,
                        stencil: false,
                        depth: true,
                        logarithmicDepthBuffer: false,
                    }}
                    onCreated={({ gl, scene }) => {
                        gl.domElement.addEventListener("webglcontextlost", (event) => {
                            event.preventDefault()
                        })
                        gl.shadowMap.enabled = true
                        // Use soft PCF shadows when supported
                        gl.shadowMap.type = THREE.PCFSoftShadowMap
                        scene.background = new THREE.Color("#060e1a")
                    }}
                >
                    <PerspectiveCamera makeDefault position={[0, 0, zoomLevel]} fov={46} />
                    <OrbitControls
                        enablePan={false}
                        enableZoom
                        minDistance={2.8}
                        maxDistance={9}
                        autoRotate={rotateEnabled}
                        autoRotateSpeed={0.5}
                    />

                    <PerformanceMonitor
                        onDecline={() => setIsLowPowerMode(true)}
                        onIncline={() => setIsLowPowerMode(false)}
                    >
                        {/* Advanced Medical Lighting System */}
                        <MedicalLightingSystem
                            aggressiveness={aggressiveness}
                            medicineEffect={medicineEffect}
                            recoveryProgress={recoveryProgress}
                            tumorIntensity={tumorIntensity}
                            time={time}
                            treatmentScore={treatmentScore}
                        />

                        {/* Volumetric Atmospheric Effects */}
                        <VolumetricMedicalLighting
                            medicineEffect={medicineEffect}
                            aggressiveness={aggressiveness}
                            tumorIntensity={tumorIntensity}
                            treatmentScore={treatmentScore}
                        />

                        {/* Medical Post-Processing Pipeline */}
                        <MedicalPostProcessing
                            medicineEffect={medicineEffect}
                            recoveryProgress={recoveryProgress}
                            tumorIntensity={tumorIntensity}
                            treatmentScore={treatmentScore}
                        />

                        {/* Main Tumor Model */}
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

                        {/* Medical Scan Environment */}
                        <Environment preset="apartment" frames={1} />
                    </PerformanceMonitor>
                </Canvas>
            </Suspense>

            {/* Decorative overlay corners */}
            <div className="pointer-events-none absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-[#00E5FF]/50 rounded-tl-xl m-4" />
            <div className="pointer-events-none absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-[#00E5FF]/50 rounded-tr-xl m-4" />
            <div className="pointer-events-none absolute left-0 bottom-0 h-8 w-8 border-l-2 border-b-2 border-[#00E5FF]/50 rounded-bl-xl m-4" />
            <div className="pointer-events-none absolute right-0 bottom-0 h-8 w-8 border-r-2 border-b-2 border-[#00E5FF]/50 rounded-br-xl m-4" />
        </div>
    )
}
