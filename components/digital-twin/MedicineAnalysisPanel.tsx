"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Pill, Activity, CheckCircle2, XCircle, Loader2 } from "lucide-react"

interface Medicine {
    name: string
    confidence: number
    mechanism?: string
    reason?: string
}

interface MedicineAnalysisPanelProps {
    cancerType: string
    recommended: Medicine[]
    notRecommended: Medicine[]
    onSimulateDrug: (medicine: string) => Promise<void>
    activeSimulation: string | null
}

export function MedicineAnalysisPanel({
    cancerType,
    recommended,
    notRecommended,
    onSimulateDrug,
    activeSimulation,
}: MedicineAnalysisPanelProps) {
    const [simulatingDrug, setSimulatingDrug] = useState<string | null>(null)

    const handleSimulate = async (medicineName: string) => {
        setSimulatingDrug(medicineName)
        await onSimulateDrug(medicineName)
        setSimulatingDrug(null)
    }

    const renderMedicineCard = (m: Medicine, isRecommended: boolean) => {
        const isSimulating = simulatingDrug === m.name
        const isActive = activeSimulation === m.name
        const themeColor = isRecommended ? "#00FF9C" : "#FF3B5C"
        const bgOpacity = isActive ? "0.15" : "0.05"

        return (
            <div
                key={m.name}
                className={`relative overflow-hidden rounded-xl border p-4 transition-all ${isActive ? "border-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.2)]" : "border-transparent"
                    }`}
                style={{ backgroundColor: `rgba(${isRecommended ? '0,255,156' : '255,59,92'},${bgOpacity})` }}
            >
                <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        {isRecommended ? (
                            <CheckCircle2 className="h-5 w-5" style={{ color: themeColor }} />
                        ) : (
                            <XCircle className="h-5 w-5" style={{ color: themeColor }} />
                        )}
                        <div>
                            <h4 className="font-semibold" style={{ color: "#E8EDF2" }}>{m.name}</h4>
                            <Badge
                                variant="outline"
                                className="mt-1 border-0 px-2 py-0 text-[10px]"
                                style={{ backgroundColor: `${themeColor}20`, color: themeColor }}
                            >
                                {isRecommended ? "Effective" : "Low Effectiveness"}
                            </Badge>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-xs" style={{ color: "#8899AA" }}>Confidence</span>
                        <p className="font-mono font-bold" style={{ color: themeColor }}>
                            {(m.confidence * 100).toFixed(0)}%
                        </p>
                    </div>
                </div>

                <p className="mb-4 text-xs leading-relaxed" style={{ color: "#8899AA" }}>
                    <span className="font-semibold text-[#E8EDF2]/70">Mechanism: </span>
                    {m.mechanism || m.reason}
                </p>

                <Button
                    onClick={() => handleSimulate(m.name)}
                    disabled={isSimulating || isActive}
                    className={`w-full text-xs font-semibold shadow-none transition-colors ${isActive
                            ? "bg-[#00E5FF]/20 text-[#00E5FF] hover:bg-[#00E5FF]/30 cursor-default"
                            : "bg-[#0A1628] text-[#E8EDF2] hover:bg-[#1A2638]"
                        }`}
                    style={!isActive ? { border: `1px solid ${themeColor}40` } : {}}
                >
                    {isSimulating ? (
                        <span className="flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" /> Simulating...
                        </span>
                    ) : isActive ? (
                        <span className="flex items-center gap-2">
                            <Activity className="h-3 w-3" /> Currently Simulating
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <Activity className="h-3 w-3" /> Simulate Effect
                        </span>
                    )}
                </Button>
            </div>
        )
    }

    return (
        <div className="glass-panel flex h-full flex-col rounded-2xl p-6">
            <div className="mb-6">
                <h3 className="flex items-center gap-2 text-xl font-bold" style={{ color: "#E8EDF2" }}>
                    <Pill className="h-6 w-6 text-[#00E5FF]" /> Medicine Analysis
                </h3>
                <p className="mt-1 text-sm" style={{ color: "#8899AA" }}>
                    Evaluate compatibility for <span className="text-[#00E5FF]">{cancerType}</span>
                </p>
            </div>

            <ScrollArea className="flex-1 pr-4">
                <div className="space-y-6">
                    <div>
                        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: "#00FF9C" }}>
                            Recommended
                        </h4>
                        <div className="space-y-3">
                            {recommended.map(m => renderMedicineCard(m, true))}
                        </div>
                    </div>

                    <div>
                        <h4 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wider" style={{ color: "#FF3B5C" }}>
                            Not Recommended
                        </h4>
                        <div className="space-y-3">
                            {notRecommended.map(m => renderMedicineCard(m, false))}
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    )
}
