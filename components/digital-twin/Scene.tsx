"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, PerspectiveCamera, PerformanceMonitor } from "@react-three/drei"
import { TumorModel } from "./TumorModel"
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
}

export function Scene({ aggressiveness, medicineEffect, showGenes, time, rotateEnabled, zoomLevel, recoveryProgress, tumorIntensity }: SceneProps) {
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
        <div className="relative h-full w-full rounded-xl overflow-hidden bg-black/40" ref={canvasRef}>
            <Suspense fallback={
                <div className="absolute inset-0 flex items-center justify-center text-[#00E5FF]">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            }>
                <Canvas
                    dpr={isLowPowerMode ? [1, 1.25] : [1, 1.5]}
                    frameloop={rotateEnabled || showGenes || medicineEffect !== "none" ? "always" : "demand"}
                    gl={{
                        antialias: false,
                        alpha: true,
                        powerPreference: "high-performance",
                        preserveDrawingBuffer: false,
                        stencil: false,
                        depth: true,
                        logarithmicDepthBuffer: false,
                    }}
                    onCreated={({ gl }) => {
                        gl.domElement.addEventListener("webglcontextlost", (event) => {
                            event.preventDefault()
                        })
                    }}
                >
                    <PerspectiveCamera makeDefault position={[0, 0, zoomLevel]} fov={45} />
                    <OrbitControls
                        enablePan={false}
                        enableZoom
                        minDistance={2}
                        maxDistance={10}
                        autoRotate={rotateEnabled}
                        autoRotateSpeed={0.5}
                    />

                    <PerformanceMonitor
                        onDecline={() => setIsLowPowerMode(true)}
                        onIncline={() => setIsLowPowerMode(false)}
                    >
                        <ambientLight intensity={0.5} />
                        <directionalLight position={[10, 10, 5]} intensity={1} />
                        <pointLight position={[-10, -10, -10]} intensity={0.5} />

                        <TumorModel
                            aggressiveness={aggressiveness}
                            medicineEffect={medicineEffect}
                            showGenes={showGenes}
                            time={time}
                            recoveryProgress={recoveryProgress}
                            tumorIntensity={tumorIntensity}
                        />

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
