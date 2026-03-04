"use client"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RotateCcw, ZoomIn, Dna } from "lucide-react"

interface ControlPanelProps {
    showGenes: boolean
    setShowGenes: (show: boolean) => void
    onResetView: () => void
}

export function ControlPanel({ showGenes, setShowGenes, onResetView }: ControlPanelProps) {
    return (
        <div className="glass-panel flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4">
            <div className="flex items-center gap-6">
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
            </div>

            <div className="flex items-center gap-2">
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
