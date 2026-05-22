"use client"

import { useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pill,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
} from "lucide-react"

interface MedicineComparison {
  medicine: string
  effectiveness: number
  compatibility: number
  recovery_timeline: number
  recovery_speed: string
  treatment_score: number
  aggressiveness_reduction: number
}

interface MedicineComparisonLabProps {
  cancerType: string
  tumorSize: number
  currentAggressiveness: number
  availableMedicines?: string[]
  onComparison?: (medicines: MedicineComparison[]) => void
}

const MEDICINES_DATABASE: Record<string, string[]> = {
  "Pituitary Adenoma": ["Cabergoline", "Octreotide", "Pasireotide"],
  "GBM": ["Temozolomide", "Bevacizumab", "Irinotecan"],
  "Lung Adenocarcinoma": ["Docetaxel", "Pembrolizumab", "Gefitinib"],
  "Breast Invasive Carcinoma": ["Tamoxifen", "Docetaxel", "Pembrolizumab"],
  "Colon Adenocarcinoma": ["Cisplatin", "Oxaliplatin", "Docetaxel"],
  "Kidney Renal Clear Cell Carcinoma": ["Nivolumab", "Pembrolizumab", "Sorafenib"],
}

export function MedicineComparisonLab({
  cancerType,
  tumorSize,
  currentAggressiveness,
  availableMedicines = [],
  onComparison,
}: MedicineComparisonLabProps) {
  const [comparisons, setComparisons] = useState<MedicineComparison[]>([])
  const [selectedMedicine, setSelectedMedicine] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const medicines = availableMedicines.length > 0 ? availableMedicines : (MEDICINES_DATABASE[cancerType] || [])

  const addMedicine = useCallback(async () => {
    if (!selectedMedicine || comparisons.some(c => c.medicine === selectedMedicine)) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/core-ai-metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicine: selectedMedicine,
          cancer_type: cancerType,
          tumor_size: tumorSize,
          aggressiveness: "moderate",
        }),
      })

      if (response.ok) {
        const metrics = await response.json()
        const newComparison: MedicineComparison = {
          medicine: selectedMedicine,
          effectiveness: metrics.effectiveness,
          compatibility: metrics.medicine_compatibility,
          recovery_timeline: metrics.recovery_timeline_days,
          recovery_speed: metrics.recovery_speed,
          treatment_score: metrics.treatment_score,
          aggressiveness_reduction: (currentAggressiveness - metrics.aggressiveness) / currentAggressiveness * 100,
        }
        setComparisons([...comparisons, newComparison])
        if (onComparison) onComparison([...comparisons, newComparison])
      }
    } finally {
      setIsLoading(false)
      setSelectedMedicine("")
    }
  }, [selectedMedicine, cancerType, tumorSize, currentAggressiveness, comparisons, onComparison])

  const removeMedicine = useCallback((medicine: string) => {
    const updated = comparisons.filter(c => c.medicine !== medicine)
    setComparisons(updated)
    if (onComparison) onComparison(updated)
  }, [comparisons, onComparison])

  const getComparisonColor = (value: number, isLower = false) => {
    const normalized = Math.max(0, Math.min(1, value))
    if (isLower) {
      return normalized < 0.33 ? "#00FF9C" : normalized < 0.67 ? "#FF9F43" : "#FF3B5C"
    }
    return normalized > 0.67 ? "#00FF9C" : normalized > 0.33 ? "#FF9F43" : "#FF3B5C"
  }

  const getBestValue = (metric: keyof MedicineComparison) => {
    if (comparisons.length === 0) return null
    return Math.max(...comparisons.map(c => typeof c[metric] === "number" ? c[metric] : 0))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#8A2BE2]/10 border border-[#8A2BE2]/20">
          <Pill className="w-5 h-5 text-[#8A2BE2]" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-[#E8EDF2]">Medicine Comparison Lab</h2>
          <p className="text-xs text-[#8899AA]">Compare treatment options for {cancerType}</p>
        </div>
      </div>

      {/* Add Medicine */}
      <Card className="glass-panel p-4 rounded-lg border border-white/10">
        <div className="flex gap-2">
          <Select value={selectedMedicine} onValueChange={setSelectedMedicine}>
            <SelectTrigger className="flex-1 bg-black/20 border-white/10">
              <SelectValue placeholder="Select medicine to compare..." />
            </SelectTrigger>
            <SelectContent>
              {medicines.map((med) => (
                <SelectItem
                  key={med}
                  value={med}
                  disabled={comparisons.some(c => c.medicine === med)}
                >
                  {med}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={addMedicine}
            disabled={!selectedMedicine || isLoading || comparisons.length >= 4}
            className="bg-[#8A2BE2] hover:bg-[#8A2BE2]/80 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
        {comparisons.length >= 4 && (
          <p className="text-xs text-[#FF3B5C] mt-2">Maximum 4 medicines for comparison</p>
        )}
      </Card>

      {/* Comparison Grid */}
      {comparisons.length === 0 ? (
        <Card className="glass-panel p-12 rounded-lg border border-white/10 text-center">
          <Pill className="w-12 h-12 text-[#8899AA] mx-auto mb-4 opacity-50" />
          <p className="text-[#8899AA]">Add medicines to compare treatment options</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {comparisons.map((comparison) => (
            <Card
              key={comparison.medicine}
              className="glass-panel p-4 rounded-lg border border-white/10 hover:border-white/20 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-[#E8EDF2]">{comparison.medicine}</h3>
                  <p className="text-xs text-[#8899AA]">Treatment Profile</p>
                </div>
                <Button
                  onClick={() => removeMedicine(comparison.medicine)}
                  variant="ghost"
                  size="sm"
                  className="text-[#FF3B5C] hover:text-[#FF3B5C] hover:bg-[#FF3B5C]/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Metrics */}
              <div className="space-y-3">
                {/* Effectiveness */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#8899AA]">Effectiveness</span>
                    <Badge
                      variant="outline"
                      style={{
                        color: getComparisonColor(comparison.effectiveness),
                        borderColor: getComparisonColor(comparison.effectiveness) + "50",
                        backgroundColor: getComparisonColor(comparison.effectiveness) + "20",
                      }}
                    >
                      {(comparison.effectiveness * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${comparison.effectiveness * 100}%`,
                        backgroundColor: getComparisonColor(comparison.effectiveness),
                      }}
                    />
                  </div>
                </div>

                {/* Compatibility */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#8899AA]">Compatibility</span>
                    <Badge
                      variant="outline"
                      style={{
                        color: getComparisonColor(comparison.compatibility),
                        borderColor: getComparisonColor(comparison.compatibility) + "50",
                        backgroundColor: getComparisonColor(comparison.compatibility) + "20",
                      }}
                    >
                      {(comparison.compatibility * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${comparison.compatibility * 100}%`,
                        backgroundColor: getComparisonColor(comparison.compatibility),
                      }}
                    />
                  </div>
                </div>

                {/* Treatment Score */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#8899AA]">Treatment Score</span>
                    <Badge variant="outline" className="bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/30">
                      {comparison.treatment_score.toFixed(1)}/100
                    </Badge>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#00E5FF]"
                      style={{ width: `${comparison.treatment_score}%` }}
                    />
                  </div>
                </div>

                {/* Recovery Stats */}
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8899AA] flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      Recovery Time
                    </span>
                    <span className="text-sm font-semibold text-[#8A2BE2]">
                      {comparison.recovery_timeline} days
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#8899AA] flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      Aggressiveness Reduction
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: getComparisonColor(comparison.aggressiveness_reduction / 100) }}
                    >
                      {comparison.aggressiveness_reduction.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Recovery Speed */}
                <div className="pt-2">
                  <Badge className="bg-[#FF9F43]/20 text-[#FF9F43] border-[#FF9F43]/30" variant="outline">
                    {comparison.recovery_speed}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Comparison Summary */}
      {comparisons.length > 1 && (
        <Card className="glass-panel p-4 rounded-lg border border-[#00E5FF]/30 bg-[#00E5FF]/5">
          <h3 className="text-sm font-semibold text-[#00E5FF] mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Quick Comparison
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-[#8899AA] mb-1">Best Effectiveness</p>
              <p className="text-sm font-semibold text-[#00FF9C]">
                {comparisons.reduce((max, c) => c.effectiveness > max.effectiveness ? c : max).medicine}
              </p>
            </div>
            <div>
              <p className="text-[#8899AA] mb-1">Best Compatibility</p>
              <p className="text-sm font-semibold text-[#00FF9C]">
                {comparisons.reduce((max, c) => c.compatibility > max.compatibility ? c : max).medicine}
              </p>
            </div>
            <div>
              <p className="text-[#8899AA] mb-1">Fastest Recovery</p>
              <p className="text-sm font-semibold text-[#00FF9C]">
                {comparisons.reduce((min, c) => c.recovery_timeline < min.recovery_timeline ? c : min).medicine}
              </p>
            </div>
            <div>
              <p className="text-[#8899AA] mb-1">Highest Score</p>
              <p className="text-sm font-semibold text-[#00FF9C]">
                {comparisons.reduce((max, c) => c.treatment_score > max.treatment_score ? c : max).medicine}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
