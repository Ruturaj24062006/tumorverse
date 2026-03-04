"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Pill, Activity, CheckCircle2, XCircle } from "lucide-react"

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
    selectedMedicine: string
    onMedicineChange: (medicine: string) => void
    onTestMedicine: () => void
    isTesting: boolean
}

export function MedicineAnalysisPanel({
    cancerType,
    recommended,
    notRecommended,
    selectedMedicine,
    onMedicineChange,
    onTestMedicine,
    isTesting,
}: MedicineAnalysisPanelProps) {
    const [customMedicine, setCustomMedicine] = useState("")

    const renderMedicineCard = (m: Medicine, isRecommended: boolean) => {
        const isActive = selectedMedicine.toLowerCase() === m.name.toLowerCase()
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
                    <span className="font-semibold text-[#E8EDF2]/70">{isRecommended ? "Why recommended: " : "Why not recommended: "}</span>
                    {m.mechanism || m.reason}
                </p>

                <Button
                    onClick={() => onMedicineChange(m.name)}
                    className={`w-full text-xs font-semibold shadow-none transition-colors ${isActive
                            ? "bg-[#00E5FF]/20 text-[#00E5FF] hover:bg-[#00E5FF]/30 cursor-default"
                            : "bg-[#0A1628] text-[#E8EDF2] hover:bg-[#1A2638]"
                        }`}
                    style={!isActive ? { border: `1px solid ${themeColor}40` } : {}}
                >
                    {isActive ? (
                        <span className="flex items-center gap-2">
                            <Activity className="h-3 w-3" /> Selected for Test
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <Activity className="h-3 w-3" /> Select Medicine
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

                <div className="mt-4 space-y-2">
                    <p className="text-xs uppercase tracking-wider text-[#8899AA]">Test Medicine</p>
                    <div className="flex items-center gap-2">
                        <Input
                            value={customMedicine}
                            onChange={(e) => setCustomMedicine(e.target.value)}
                            placeholder="Enter medicine name"
                            className="border-white/10 bg-[#0A1628]/70 text-[#E8EDF2] placeholder:text-[#8899AA]"
                        />
                        <Button
                            variant="outline"
                            className="border-[#8A2BE2]/40 text-[#8A2BE2] hover:bg-[#8A2BE2]/10 hover:text-[#8A2BE2]"
                            onClick={() => {
                                if (customMedicine.trim()) {
                                    onMedicineChange(customMedicine.trim())
                                }
                            }}
                        >
                            Use
                        </Button>
                    </div>
                    <Button
                        onClick={onTestMedicine}
                        disabled={!selectedMedicine || isTesting}
                        className="w-full bg-[#00E5FF] text-[#0A1628] hover:bg-[#00E5FF]/90"
                    >
                        {isTesting ? "Testing Medicine..." : "Test Medicine on Digital Twin"}
                    </Button>
                </div>
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
