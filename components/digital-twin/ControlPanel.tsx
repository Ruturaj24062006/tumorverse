"use client"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { RotateCcw, ZoomIn, ZoomOut, Dna, Activity } from "lucide-react"

interface ControlPanelProps {
    showGenes: boolean
    setShowGenes: (show: boolean) => void
    rotateEnabled: boolean
    setRotateEnabled: (enabled: boolean) => void
    onZoomIn: () => void
    onZoomOut: () => void
    onTestMedicine: () => void
    canTestMedicine: boolean
    isTesting: boolean
    recoveryProgress: number
    setRecoveryProgress: (progress: number) => void
    onResetView: () => void
}

export function ControlPanel({
    showGenes,
    setShowGenes,
    rotateEnabled,
    setRotateEnabled,
    onZoomIn,
    onZoomOut,
    onTestMedicine,
    canTestMedicine,
    isTesting,
    recoveryProgress,
    setRecoveryProgress,
    onResetView,
}: ControlPanelProps) {
    return (
        <div className="glass-panel flex flex-col gap-4 rounded-2xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Switch
                        id="show-genes"
                        checked={showGenes}
                        onCheckedChange={setShowGenes}
                        className="data-[state=checked]:bg-[#00E5FF]"
                    />
                    <Label htmlFor="show-genes" className="flex items-center gap-1.5 cursor-pointer text-[#E8EDF2]">
                        <Dna className="h-4 w-4 text-[#00E5FF]" /> Show Genes
                    </Label>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRotateEnabled(!rotateEnabled)}
                        className="rounded-lg border-[#8899AA]/30 text-[#8899AA] hover:bg-[#8899AA]/10 hover:text-[#E8EDF2]"
                    >
                        <Activity className="mr-1.5 h-3.5 w-3.5" /> {rotateEnabled ? "Pause Rotation" : "Rotate Tumor"}
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onZoomIn}
                        className="rounded-lg border-[#8899AA]/30 text-[#8899AA] hover:bg-[#8899AA]/10 hover:text-[#E8EDF2]"
                    >
                        <ZoomIn className="mr-1.5 h-3.5 w-3.5" /> Zoom In
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onZoomOut}
                        className="rounded-lg border-[#8899AA]/30 text-[#8899AA] hover:bg-[#8899AA]/10 hover:text-[#E8EDF2]"
                    >
                        <ZoomOut className="mr-1.5 h-3.5 w-3.5" /> Zoom Out
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex-1">
                    <Label className="text-xs text-[#8899AA] mb-1.5 block">
                        Tumor Recovery Timeline: {Math.round(recoveryProgress)}%
                    </Label>
                    <Slider
                        value={[recoveryProgress]}
                        onValueChange={(values) => setRecoveryProgress(values[0])}
                        min={0}
                        max={100}
                        step={1}
                        className="w-full"
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-[#8899AA]">
                        <span>0%</span>
                        <span>25%</span>
                        <span>50%</span>
                        <span>75%</span>
                        <span>100%</span>
                    </div>
                </div>

                <Button
                    size="sm"
                    onClick={onTestMedicine}
                    disabled={!canTestMedicine || isTesting}
                    className="rounded-lg bg-[#00E5FF] text-[#0A1628] hover:bg-[#00E5FF]/90"
                >
                    <Activity className="mr-1.5 h-3.5 w-3.5" /> {isTesting ? "Testing..." : "Test Medicine"}
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={onResetView}
                    className="rounded-lg border-[#8899AA]/30 text-[#8899AA] hover:bg-[#8899AA]/10 hover:text-[#E8EDF2]"
                >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset View
                </Button>
            </div>
        </div>
    )
}
