"use client"

import { Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, Environment, PerspectiveCamera } from "@react-three/drei"
import { TumorModel } from "./TumorModel"
import { Loader2 } from "lucide-react"

interface SceneProps {
    aggressiveness: "low" | "moderate" | "high"
    medicineEffect: "none" | "effective" | "ineffective"
    showGenes: boolean
    time: number
}

export function Scene({ aggressiveness, medicineEffect, showGenes, time }: SceneProps) {
    return (
        <div className="relative h-full w-full rounded-xl overflow-hidden bg-black/40">
            <Suspense fallback={
                <div className="absolute inset-0 flex items-center justify-center text-[#00E5FF]">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            }>
                <Canvas gl={{ antialias: true, alpha: true }}>
                    <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />
                    <OrbitControls
                        enablePan={false}
                        minDistance={2}
                        maxDistance={10}
                        autoRotate
                        autoRotateSpeed={0.5}
                    />

                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 5]} intensity={1} />
                    <pointLight position={[-10, -10, -10]} intensity={0.5} />

                    <TumorModel
                        aggressiveness={aggressiveness}
                        medicineEffect={medicineEffect}
                        showGenes={showGenes}
                        time={time}
                    />

                    <Environment preset="city" />
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
