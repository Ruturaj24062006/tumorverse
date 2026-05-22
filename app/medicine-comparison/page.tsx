"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Shield,
  AlertTriangle,
  Pill,
  Zap,
} from "lucide-react"
import { motion } from "framer-motion"

interface MedicineComparison {
  name: string
  category: string
  recommended: boolean
  confidence: number
  effectiveness: number
  recovery_speed: string
  aggressiveness_reduction: number
  stabilization_probability: number
  side_effect_risk: number
  mechanism: string
  pros: string[]
  cons: string[]
  clinical_notes: string
}

const medicines: MedicineComparison[] = [
  {
    name: "Cabergoline",
    category: "Dopamine Agonist",
    recommended: true,
    confidence: 0.92,
    effectiveness: 0.88,
    recovery_speed: "fast",
    aggressiveness_reduction: 0.85,
    stabilization_probability: 0.89,
    side_effect_risk: 0.15,
    mechanism: "Dopamine agonist that directly inhibits hormone-secreting tumor cells",
    pros: [
      "Highest effectiveness (88%)",
      "Fastest recovery trajectory",
      "Excellent aggressiveness control",
      "Well-tolerated in most patients",
      "Oral administration",
    ],
    cons: ["Requires long-term monitoring", "Potential tolerance development"],
    clinical_notes: "First-line therapy with extensive clinical precedent",
  },
  {
    name: "Octreotide",
    category: "Somatostatin Analog",
    recommended: true,
    confidence: 0.78,
    effectiveness: 0.71,
    recovery_speed: "moderate",
    aggressiveness_reduction: 0.72,
    stabilization_probability: 0.75,
    side_effect_risk: 0.22,
    mechanism: "Somatostatin analog suppressing growth hormone and hormone secretion",
    pros: [
      "Good effectiveness (71%)",
      "Moderate recovery speed",
      "Multiple administration routes",
      "Synergistic with other agents",
    ],
    cons: [
      "Slower than Cabergoline",
      "Injection required",
      "GI side effects possible",
    ],
    clinical_notes: "Often used as combination therapy",
  },
  {
    name: "Temozolomide",
    category: "Alkylating Agent",
    recommended: true,
    confidence: 0.82,
    effectiveness: 0.79,
    recovery_speed: "moderate",
    aggressiveness_reduction: 0.78,
    stabilization_probability: 0.80,
    side_effect_risk: 0.35,
    mechanism: "Alkylating chemotherapy inducing tumor cell apoptosis",
    pros: [
      "Good CNS penetration",
      "Established efficacy in GBM",
      "Oral medication",
      "Standard of care for gliomas",
    ],
    cons: [
      "Significant side effects",
      "Myelosuppression risk",
      "Requires blood monitoring",
    ],
    clinical_notes: "Standard adjuvant therapy for glioblastoma",
  },
  {
    name: "Pembrolizumab",
    category: "Checkpoint Inhibitor",
    recommended: true,
    confidence: 0.71,
    effectiveness: 0.68,
    recovery_speed: "slow",
    aggressiveness_reduction: 0.62,
    stabilization_probability: 0.70,
    side_effect_risk: 0.28,
    mechanism: "PD-1 checkpoint inhibitor enabling immune-mediated tumor destruction",
    pros: [
      "Durable response when effective",
      "Immunotherapy approach",
      "Lower traditional toxicity",
      "IV administration",
    ],
    cons: [
      "Slower response kinetics",
      "Immune-related adverse events",
      "Variable patient response",
    ],
    clinical_notes: "Consider for immunologically responsive tumors",
  },
  {
    name: "Cisplatin",
    category: "Platinum Agent",
    recommended: false,
    confidence: 0.35,
    effectiveness: 0.28,
    recovery_speed: "very_slow",
    aggressiveness_reduction: 0.25,
    stabilization_probability: 0.32,
    side_effect_risk: 0.62,
    mechanism: "Platinum-based DNA crosslinking chemotherapy",
    pros: ["Broad antitumor activity", "Well-studied agent"],
    cons: [
      "Poor compatibility with this cancer",
      "High toxicity profile",
      "Significant nephrotoxicity",
      "Severe nausea",
      "Limited efficacy (28%)",
    ],
    clinical_notes: "Not recommended - poor tumor compatibility",
  },
  {
    name: "Paclitaxel",
    category: "Taxane",
    recommended: false,
    confidence: 0.22,
    effectiveness: 0.18,
    recovery_speed: "very_slow",
    aggressiveness_reduction: 0.15,
    stabilization_probability: 0.20,
    side_effect_risk: 0.58,
    mechanism: "Microtubule stabilizer inhibiting mitotic progression",
    pros: ["Antitumor activity in some cancers"],
    cons: [
      "Minimal effectiveness (18%)",
      "Poor tumor compatibility",
      "Peripheral neuropathy",
      "Low stabilization probability",
      "Not indicated for this indication",
    ],
    clinical_notes: "Not recommended - low effectiveness with high toxicity",
  },
]

export default function MedicineComparison() {
  const [selectedMedicines, setSelectedMedicines] = useState<string[]>([medicines[0].name])
  const [sortBy, setSortBy] = useState<"effectiveness" | "recovery" | "stability">("effectiveness")

  const toggleMedicine = (name: string) => {
    setSelectedMedicines((prev) => {
      if (prev.includes(name)) {
        return prev.filter((m) => m !== name)
      } else {
        if (prev.length >= 3) {
          return [prev[1], prev[2], name]
        }
        return [...prev, name]
      }
    })
  }

  const selectedData = medicines.filter((m) => selectedMedicines.includes(m.name))
  const recommendedMedicines = medicines.filter((m) => m.recommended)

  const getRecoveryLabel = (speed: string) => {
    switch (speed) {
      case "very_fast":
        return "Very Fast"
      case "fast":
        return "Fast"
      case "moderate":
        return "Moderate"
      case "slow":
        return "Slow"
      case "very_slow":
        return "Very Slow"
      default:
        return "Unknown"
    }
  }

  const getRecoveryColor = (speed: string) => {
    switch (speed) {
      case "very_fast":
        return "#00FF00"
      case "fast":
        return "#00FF9C"
      case "moderate":
        return "#00E5FF"
      case "slow":
        return "#FF9F43"
      case "very_slow":
        return "#FF6B6B"
      default:
        return "#8899AA"
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A1628" }}>
      <Navbar />

      <main className="relative z-10 mx-auto max-w-7xl px-6 pt-24 pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-4xl font-bold neon-text">Medicine Comparison Analysis</h1>
          <p className="text-[#8899AA] mt-2">
            Compare treatment options side-by-side and understand effectiveness differences
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Medicine Selection */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <Card className="glass-panel p-6 border-white/10 sticky top-24 space-y-6">
              <div>
                <h3 className="text-sm uppercase tracking-wider text-[#8899AA] font-semibold mb-4">
                  Select Medicines
                </h3>
                <p className="text-xs text-[#8899AA] mb-4">Choose up to 3 medicines to compare</p>
              </div>

              {/* Recommended Section */}
              <div className="space-y-2">
                <p className="text-xs uppercase font-semibold text-[#00FF9C]">Recommended</p>
                {recommendedMedicines.slice(0, 3).map((med) => (
                  <button
                    key={med.name}
                    onClick={() => toggleMedicine(med.name)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                      selectedMedicines.includes(med.name)
                        ? "bg-[#00FF9C]/20 border border-[#00FF9C] text-[#00FF9C]"
                        : "bg-transparent border border-white/10 text-[#E8EDF2] hover:border-[#00FF9C]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                      <span>{med.name}</span>
                    </div>
                    <p className="text-xs text-[#8899AA] mt-1 ml-6">{med.category}</p>
                  </button>
                ))}
              </div>

              {/* Other Recommended */}
              <div className="space-y-2">
                <p className="text-xs uppercase font-semibold text-[#00E5FF]">Other Options</p>
                {recommendedMedicines.slice(3).map((med) => (
                  <button
                    key={med.name}
                    onClick={() => toggleMedicine(med.name)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                      selectedMedicines.includes(med.name)
                        ? "bg-[#00E5FF]/20 border border-[#00E5FF] text-[#00E5FF]"
                        : "bg-transparent border border-white/10 text-[#E8EDF2] hover:border-[#00E5FF]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Pill className="h-4 w-4 flex-shrink-0" />
                      <span>{med.name}</span>
                    </div>
                    <p className="text-xs text-[#8899AA] mt-1 ml-6">{med.category}</p>
                  </button>
                ))}
              </div>

              {/* Not Recommended */}
              <div className="space-y-2">
                <p className="text-xs uppercase font-semibold text-[#FF6B6B]">Not Recommended</p>
                {medicines.filter((m) => !m.recommended).map((med) => (
                  <button
                    key={med.name}
                    onClick={() => toggleMedicine(med.name)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition opacity-60 ${
                      selectedMedicines.includes(med.name)
                        ? "bg-[#FF6B6B]/20 border border-[#FF6B6B] text-[#FF6B6B] opacity-100"
                        : "bg-transparent border border-white/10 text-[#8899AA] hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{med.name}</span>
                    </div>
                    <p className="text-xs text-[#8899AA] mt-1 ml-6">{med.category}</p>
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Right Panel - Comparison */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3 space-y-6"
          >
            {/* Comparison Grid */}
            {selectedData.length > 0 ? (
              <>
                {/* Quick Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedData.map((med) => (
                    <motion.div
                      key={med.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <Card className="glass-panel p-6 border-white/10">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-[#E8EDF2] mb-1">{med.name}</h3>
                            <p className="text-xs text-[#8899AA]">{med.category}</p>
                          </div>
                          {med.recommended ? (
                            <CheckCircle2 className="h-5 w-5 text-[#00FF9C]" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-[#FF6B6B]" />
                          )}
                        </div>

                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs text-[#8899AA]">Effectiveness</span>
                              <span className="text-xs font-bold text-[#00E5FF]">
                                {(med.effectiveness * 100).toFixed(0)}%
                              </span>
                            </div>
                            <Progress value={med.effectiveness * 100} className="h-2" />
                          </div>

                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-xs text-[#8899AA]">Confidence</span>
                              <span className="text-xs font-bold text-[#00FF9C]">
                                {(med.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                            <Progress value={med.confidence * 100} className="h-2" />
                          </div>

                          <div className="pt-2 border-t border-white/10">
                            <p className="text-xs text-[#8899AA] mb-2">Recovery Speed</p>
                            <Badge
                              style={{
                                backgroundColor: `${getRecoveryColor(med.recovery_speed)}20`,
                                color: getRecoveryColor(med.recovery_speed),
                                border: `1px solid ${getRecoveryColor(med.recovery_speed)}`,
                              }}
                              className="text-xs"
                            >
                              {getRecoveryLabel(med.recovery_speed)}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Detailed Comparison Tables */}
                <Card className="glass-panel p-6 border-white/10">
                  <h3 className="text-lg font-semibold text-[#00E5FF] mb-6">Detailed Comparison</h3>

                  <div className="space-y-6">
                    {/* Effectiveness */}
                    <div>
                      <h4 className="text-sm font-semibold text-[#E8EDF2] mb-3 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-[#FFD700]" />
                        Effectiveness
                      </h4>
                      <div className="space-y-2">
                        {selectedData
                          .sort((a, b) => b.effectiveness - a.effectiveness)
                          .map((med) => (
                            <div key={med.name}>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm text-[#E8EDF2]">{med.name}</span>
                                <span className="text-sm font-bold text-[#00E5FF]">
                                  {(med.effectiveness * 100).toFixed(0)}%
                                </span>
                              </div>
                              <Progress value={med.effectiveness * 100} className="h-2" />
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Recovery Speed */}
                    <div className="pt-4 border-t border-white/10">
                      <h4 className="text-sm font-semibold text-[#E8EDF2] mb-3 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#00FF9C]" />
                        Recovery Speed
                      </h4>
                      <div className="space-y-2">
                        {selectedData.map((med) => (
                          <div key={med.name} className="flex items-center justify-between p-2 rounded border border-white/5">
                            <span className="text-sm text-[#E8EDF2]">{med.name}</span>
                            <Badge
                              style={{
                                backgroundColor: `${getRecoveryColor(med.recovery_speed)}20`,
                                color: getRecoveryColor(med.recovery_speed),
                                border: `1px solid ${getRecoveryColor(med.recovery_speed)}`,
                              }}
                              className="text-xs"
                            >
                              {getRecoveryLabel(med.recovery_speed)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Stabilization */}
                    <div className="pt-4 border-t border-white/10">
                      <h4 className="text-sm font-semibold text-[#E8EDF2] mb-3 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-[#00E5FF]" />
                        Stabilization Probability
                      </h4>
                      <div className="space-y-2">
                        {selectedData
                          .sort((a, b) => b.stabilization_probability - a.stabilization_probability)
                          .map((med) => (
                            <div key={med.name}>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm text-[#E8EDF2]">{med.name}</span>
                                <span className="text-sm font-bold text-[#00FF9C]">
                                  {(med.stabilization_probability * 100).toFixed(0)}%
                                </span>
                              </div>
                              <Progress
                                value={med.stabilization_probability * 100}
                                className="h-2"
                              />
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Side Effect Risk */}
                    <div className="pt-4 border-t border-white/10">
                      <h4 className="text-sm font-semibold text-[#E8EDF2] mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-[#FF9F43]" />
                        Side Effect Risk
                      </h4>
                      <div className="space-y-2">
                        {selectedData
                          .sort((a, b) => a.side_effect_risk - b.side_effect_risk)
                          .map((med) => (
                            <div key={med.name}>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm text-[#E8EDF2]">{med.name}</span>
                                <span className="text-sm font-bold text-[#FF9F43]">
                                  {(med.side_effect_risk * 100).toFixed(0)}%
                                </span>
                              </div>
                              <Progress
                                value={med.side_effect_risk * 100}
                                className="h-2"
                              />
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Detailed Medicine Information */}
                {selectedData.map((med) => (
                  <motion.div
                    key={med.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="glass-panel p-6 border-white/10">
                      <h3 className="text-lg font-semibold text-[#00E5FF] mb-4">{med.name}</h3>

                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-semibold text-[#8899AA] mb-2">Mechanism of Action</p>
                          <p className="text-sm text-[#E8EDF2]">{med.mechanism}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-semibold text-[#00FF9C] mb-2">Advantages</p>
                            <ul className="space-y-1">
                              {med.pros.map((pro, idx) => (
                                <li
                                  key={idx}
                                  className="text-sm text-[#E8EDF2] flex gap-2"
                                >
                                  <span className="text-[#00FF9C]">+</span>
                                  {pro}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-[#FF6B6B] mb-2">Disadvantages</p>
                            <ul className="space-y-1">
                              {med.cons.map((con, idx) => (
                                <li
                                  key={idx}
                                  className="text-sm text-[#E8EDF2] flex gap-2"
                                >
                                  <span className="text-[#FF6B6B]">−</span>
                                  {con}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-white/10">
                          <p className="text-sm font-semibold text-[#8899AA] mb-2">Clinical Notes</p>
                          <p className="text-sm text-[#E8EDF2]">{med.clinical_notes}</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </>
            ) : (
              <Card className="glass-panel p-12 border-white/10 text-center">
                <p className="text-[#8899AA]">Select a medicine from the left panel to begin comparison</p>
              </Card>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  )
}
