"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Scene } from "@/components/digital-twin/Scene"
import { ControlPanel } from "@/components/digital-twin/ControlPanel"
import { MedicineAnalysisPanel } from "@/components/digital-twin/MedicineAnalysisPanel"
import Link from "next/link"
import {
    Activity,
    ArrowLeft,
    Dna,
    Database,
    Info
} from "lucide-react"

export default function DigitalTwinPage() {
    const searchParams = useSearchParams()

    // State
    const [showGenes, setShowGenes] = useState(true)
    const [activeMedicine, setActiveMedicine] = useState<string | null>(null)
    const [medicineEffect, setMedicineEffect] = useState<"none" | "effective" | "ineffective">("none")
    const [resetViewTrigger, setResetViewTrigger] = useState(0)

    // Derived data
    const cancerType = searchParams.get("cancer") || "Unknown Cancer"
    const aggressiveness = (searchParams.get("aggr") as "low" | "moderate" | "high") || "moderate"
    const confidence = parseFloat(searchParams.get("conf") || "0")

    // Normally passed via state/context, but parsing JSON from URL for demo
    let recommended = []
    let notRecommended = []
    try {
        recommended = JSON.parse(searchParams.get("medsRecommended") || "[]")
        notRecommended = JSON.parse(searchParams.get("medsNotRecommended") || "[]")
    } catch (e) {
        console.error("Failed to parse medicines from URL")
    }

    // Effect Handlers
    const handleSimulateDrug = async (medicine: string) => {
        setActiveMedicine(medicine)
        setMedicineEffect("none") // Reset momentarily

        try {
            const res = await fetch("/api/simulate-drug", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cancer_type: cancerType, medicine })
            })

            if (res.ok) {
                const data = await res.json()
                setMedicineEffect(data.response === "effective" ? "effective" : "ineffective")
            }
        } catch (error) {
            console.error("Simulation failed:", error)
            setActiveMedicine(null)
        }
    }

    const handleResetView = () => {
        setResetViewTrigger(prev => prev + 1)
        setMedicineEffect("none")
        setActiveMedicine(null)
    }

    const aggrColor = (a: string) => {
        if (a === "high") return "#FF3B5C"
        if (a === "moderate") return "#FF9F43"
        return "#00FF9C"
    }

    return (
        <div className="flex min-h-screen flex-col" style={{ backgroundColor: "#0A1628" }}>
            <Navbar />

            <main className="flex-1 px-6 pb-12 pt-24 max-w-7xl mx-auto w-full">
                {/* Header Section */}
                <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
                    <div>
                        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-3 text-[#8899AA] hover:text-[#E8EDF2]">
                            <Link href="/predict">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Prediction
                            </Link>
                        </Button>
                        <h1 className="text-3xl font-bold md:text-4xl text-[#E8EDF2] flex items-center gap-3">
                            Digital Tumor Twin <Badge className="bg-[#8A2BE2]/20 text-[#8A2BE2] hover:bg-[#8A2BE2]/30 border-0 uppercase tracking-widest text-[10px]">Simulation</Badge>
                        </h1>
                        <p className="mt-2 text-[#8899AA] max-w-2xl">
                            Interactive 3D representation based on patient genomics and predicted cancer type. Simulate medicine compatibility in real-time.
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-2 text-right">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-[#8899AA] uppercase tracking-wider">Target Profile</span>
                            <span className="font-semibold text-[#E8EDF2]">{cancerType}</span>
                        </div>
                        <div className="flex gap-2">
                            <Badge className="rounded-md border-0 px-2 py-0.5 text-xs font-semibold capitalize" style={{ backgroundColor: `${aggrColor(aggressiveness)}20`, color: aggrColor(aggressiveness) }}>
                                <Activity className="mr-1 h-3 w-3 inline" /> {aggressiveness} Risk
                            </Badge>
                            <Badge className="rounded-md border-0 bg-[#00E5FF]/10 px-2 py-0.5 text-xs font-semibold text-[#00E5FF]">
                                Prediction Conf. {(confidence * 100).toFixed(0)}%
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Main Interface Grid */}
                <div className="grid gap-6 lg:grid-cols-3 xl:grid-cols-4 h-[calc(100vh-220px)] min-h-[600px]">

                    {/* 3D Visualization Area (takes up more space) */}
                    <div className="lg:col-span-2 xl:col-span-3 flex flex-col gap-4">
                        {/* The Canvas Container */}
                        <div className="glass-panel relative flex-1 rounded-2xl overflow-hidden neon-border">
                            {/* Overlay Status (Active simulation info) */}
                            {activeMedicine && (
                                <div className="absolute top-4 left-4 z-10 glass-panel border border-[#8A2BE2]/30 rounded-lg p-3 bg-black/40 backdrop-blur-md animate-in fade-in zoom-in-95">
                                    <p className="text-xs text-[#8899AA] uppercase tracking-wider flex items-center gap-1.5">
                                        <Database className="h-3 w-3 text-[#8A2BE2]" /> Active Simulation
                                    </p>
                                    <p className="text-lg font-bold text-[#E8EDF2] mt-0.5">{activeMedicine}</p>
                                    {medicineEffect !== "none" && (
                                        <Badge
                                            className="mt-2 border-0"
                                            style={{ backgroundColor: medicineEffect === "effective" ? "rgba(0,255,156,0.2)" : "rgba(255,59,92,0.2)", color: medicineEffect === "effective" ? "#00FF9C" : "#FF3B5C" }}
                                        >
                                            {medicineEffect === "effective" ? "Tumor Shrinking" : "Uncontrolled Growth"}
                                        </Badge>
                                    )}
                                </div>
                            )}

                            {/* 3D Scene */}
                            <Scene
                                key={resetViewTrigger} // Force re-mount on reset for simplicity
                                aggressiveness={aggressiveness}
                                medicineEffect={medicineEffect}
                                showGenes={showGenes}
                            />

                            {/* Legend Overlay */}
                            <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-[10px] text-[#8899AA]">
                                    <span className="w-2 h-2 rounded-full bg-[#00E5FF] shadow-[0_0_5px_#00E5FF]"></span>
                                    <span>Gene Markers (Active)</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-[#8899AA]">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: aggrColor(aggressiveness) }}></span>
                                    <span>Base Tumor Status</span>
                                </div>
                            </div>
                        </div>

                        {/* View Controls underneath */}
                        <ControlPanel
                            showGenes={showGenes}
                            setShowGenes={setShowGenes}
                            onResetView={handleResetView}
                        />
                    </div>

                    {/* Sidebar Area */}
                    <div className="lg:col-span-1 border-l border-white/5 pl-2 lg:pl-6 max-h-full">
                        <MedicineAnalysisPanel
                            cancerType={cancerType}
                            recommended={recommended.length ? recommended : [
                                { name: "Gefitinib", confidence: 0.82, mechanism: "EGFR Tyrosine Kinase Inhibitor" },
                                { name: "Cisplatin", confidence: 0.76, mechanism: "DNA Cross-linking Agent" }
                            ]}
                            notRecommended={notRecommended.length ? notRecommended : [
                                { name: "Paclitaxel", confidence: 0.40, reason: "Resistance markers detected in genetic profile" }
                            ]}
                            onSimulateDrug={handleSimulateDrug}
                            activeSimulation={activeMedicine}
                        />
                    </div>

                </div>
            </main>
        </div>
    )
}
