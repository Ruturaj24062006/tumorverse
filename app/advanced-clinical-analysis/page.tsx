"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Brain,
  Activity,
  Pill,
  TrendingDown,
  FileText,
  Settings,
  Download,
} from "lucide-react"
import { AIClinicalAssistant } from "@/components/clinical-assistant/AIClinicalAssistant"
import { AdvancedTimelineVisualizer } from "@/components/visualization/AdvancedTimelineVisualizer"
import { MedicineComparisonLab } from "@/components/medicine/MedicineComparisonLab"
import { ClinicalReportGenerator } from "@/components/reports/ClinicalReportGenerator"

interface AnalysisState {
  cancerType: string
  tumorSize: number
  aggressiveness: string
  medicine: string
  metrics: any | null
  loading: boolean
  error: string | null
}

export default function AdvancedClinicalAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    cancerType: "Pituitary Adenoma",
    tumorSize: 45.0,
    aggressiveness: "moderate",
    medicine: "Cabergoline",
    metrics: null,
    loading: false,
    error: null,
  })

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

  useEffect(() => {
    computeMetrics()
  }, [])

  const computeMetrics = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const response = await fetch(`${backendUrl}/core-ai-metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicine: state.medicine,
          cancer_type: state.cancerType,
          tumor_size: state.tumorSize,
          aggressiveness: state.aggressiveness,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to compute metrics")
      }

      const metrics = await response.json()
      setState((prev) => ({ ...prev, metrics, loading: false }))
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Unknown error",
        loading: false,
      }))
    }
  }

  const handleMedicineChange = (newMedicine: string) => {
    setState((prev) => ({ ...prev, medicine: newMedicine }))
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A1628" }}>
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 pb-24 pt-24">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-lg bg-[#00E5FF]/10 border border-[#00E5FF]/20">
              <Brain className="w-6 h-6 text-[#00E5FF]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#E8EDF2]">
                Advanced Clinical Analysis
              </h1>
              <p className="text-[#8899AA]">
                AI-powered comprehensive tumor analysis and treatment planning
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card className="glass-panel p-4 rounded-lg border border-white/10">
              <p className="text-xs text-[#8899AA] mb-2">Cancer Type</p>
              <p className="text-lg font-semibold text-[#E8EDF2]">{state.cancerType}</p>
            </Card>
            <Card className="glass-panel p-4 rounded-lg border border-white/10">
              <p className="text-xs text-[#8899AA] mb-2">Tumor Size</p>
              <p className="text-lg font-semibold text-[#00E5FF]">{state.tumorSize.toFixed(1)} mm</p>
            </Card>
            <Card className="glass-panel p-4 rounded-lg border border-white/10">
              <p className="text-xs text-[#8899AA] mb-2">Aggressiveness</p>
              <Badge className="bg-[#FF9F43]/20 text-[#FF9F43] border-[#FF9F43]/30" variant="outline">
                {state.aggressiveness}
              </Badge>
            </Card>
            <Card className="glass-panel p-4 rounded-lg border border-white/10">
              <p className="text-xs text-[#8899AA] mb-2">Treatment</p>
              <p className="text-lg font-semibold text-[#8A2BE2]">{state.medicine}</p>
            </Card>
          </div>
        </div>

        {/* Error Display */}
        {state.error && (
          <Card className="glass-panel p-4 rounded-lg border border-[#FF3B5C]/30 bg-[#FF3B5C]/5 mb-6">
            <p className="text-sm text-[#FF3B5C]">{state.error}</p>
          </Card>
        )}

        {/* Main Tabs */}
        {state.metrics && (
          <Tabs defaultValue="assistant" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-white/5 border border-white/10">
              <TabsTrigger value="assistant" className="data-[state=active]:bg-[#00E5FF]/20">
                <Brain className="w-4 h-4 mr-2" />
                AI Assistant
              </TabsTrigger>
              <TabsTrigger value="timeline" className="data-[state=active]:bg-[#00E5FF]/20">
                <TrendingDown className="w-4 h-4 mr-2" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="comparison" className="data-[state=active]:bg-[#00E5FF]/20">
                <Pill className="w-4 h-4 mr-2" />
                Medicine Lab
              </TabsTrigger>
              <TabsTrigger value="report" className="data-[state=active]:bg-[#00E5FF]/20">
                <FileText className="w-4 h-4 mr-2" />
                Report
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-[#00E5FF]/20">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Tab Content */}
            <TabsContent value="assistant" className="space-y-6">
              <Card className="glass-panel p-6 rounded-lg border border-white/10">
                <AIClinicalAssistant
                  metrics={state.metrics}
                  medicine={state.medicine}
                  cancerType={state.cancerType}
                  isLoading={state.loading}
                />
              </Card>
            </TabsContent>

            <TabsContent value="timeline" className="space-y-6">
              <Card className="glass-panel p-6 rounded-lg border border-white/10">
                <AdvancedTimelineVisualizer
                  keypoints={state.metrics.timeline_keypoints}
                  medicine={state.medicine}
                  recoveryStatus={state.metrics.recovery_status}
                  recoverySpeed={state.metrics.recovery_speed}
                />
              </Card>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-6">
              <Card className="glass-panel p-6 rounded-lg border border-white/10">
                <MedicineComparisonLab
                  cancerType={state.cancerType}
                  tumorSize={state.tumorSize}
                  currentAggressiveness={state.metrics.aggressiveness * 100}
                />
              </Card>
            </TabsContent>

            <TabsContent value="report" className="space-y-6">
              <Card className="glass-panel p-6 rounded-lg border border-white/10">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-[#E8EDF2] mb-2">Clinical Report</h2>
                    <p className="text-sm text-[#8899AA]">
                      Generate and export comprehensive AI clinical intelligence reports
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <ClinicalReportGenerator
                      data={{
                        cancer_type: state.cancerType,
                        tumor_size: state.tumorSize,
                        aggressiveness: state.aggressiveness,
                        medicine: state.medicine,
                        treatment_score: state.metrics.treatment_score,
                        effectiveness: state.metrics.effectiveness,
                        recovery_status: state.metrics.recovery_status,
                        recovery_timeline_days: state.metrics.recovery_timeline_days,
                        medicine_explanation: state.metrics.medicine_explanation,
                        recovery_explanation: state.metrics.recovery_explanation,
                        aggressiveness_explanation: state.metrics.aggressiveness_explanation,
                        tumor_evolution_explanation: state.metrics.tumor_evolution_explanation,
                        risk_summary: state.metrics.risk_summary,
                        recurrence_risk: state.metrics.recurrence_risk,
                        progression_risk: state.metrics.progression_risk,
                        treatment_resistance_probability: state.metrics.treatment_resistance_probability,
                        stabilization_confidence: state.metrics.stabilization_confidence,
                        overall_risk_level: state.metrics.overall_risk_level,
                        clinical_summary: state.metrics.clinical_summary,
                        generated_at: new Date().toISOString(),
                      }}
                    />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card className="glass-panel p-6 rounded-lg border border-white/10">
                <h2 className="text-lg font-semibold text-[#E8EDF2] mb-4">Analysis Settings</h2>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-[#E8EDF2] block mb-2">
                      Cancer Type
                    </label>
                    <input
                      type="text"
                      value={state.cancerType}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          cancerType: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded bg-black/20 border border-white/10 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#E8EDF2] block mb-2">
                      Tumor Size (mm)
                    </label>
                    <input
                      type="number"
                      value={state.tumorSize}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          tumorSize: parseFloat(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 rounded bg-black/20 border border-white/10 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#E8EDF2] block mb-2">
                      Aggressiveness
                    </label>
                    <select
                      value={state.aggressiveness}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          aggressiveness: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded bg-black/20 border border-white/10 text-white"
                    >
                      <option>low</option>
                      <option>moderate</option>
                      <option>high</option>
                    </select>
                  </div>

                  <Button
                    onClick={computeMetrics}
                    disabled={state.loading}
                    className="w-full bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-[#0A1628]"
                  >
                    {state.loading ? "Analyzing..." : "Update Analysis"}
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Loading State */}
        {state.loading && !state.metrics && (
          <Card className="glass-panel p-12 rounded-lg border border-white/10 text-center">
            <div className="animate-spin inline-block mb-4">
              <Brain className="w-8 h-8 text-[#00E5FF]" />
            </div>
            <p className="text-[#8899AA]">Performing AI clinical analysis...</p>
          </Card>
        )}
      </main>
    </div>
  )
}
