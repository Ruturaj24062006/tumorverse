"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Flame,
  Heart,
  Info,
  Pill,
  Shield,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react"
import { motion } from "framer-motion"

interface MedicalAnalysisData {
  patient_id: string
  core_metrics: {
    treatment_score: number
    medical_state: string
    recovery_status: string
    recovery_speed: string
    effectiveness: number
  }
  tumor_behavior: {
    base_growth_rate: number
    morphology_complexity: number
    invasion_style: string
    hypoxia_pattern: string
    pulsation_frequency: number
    treatment_resistance_phenotype: string
    description: string
  }
  risk_profile: {
    overall_risk_level: string
    risk_score: number
    recurrence_risk: number
    progression_risk: number
    treatment_resistance_probability: number
    primary_risk_factors: string[]
    protective_factors: string[]
    disease_free_survival_probability: number
  }
  explanations: {
    medicine_recommendation: string
    recovery_prediction: string
    aggressiveness_analysis: string
    tumor_evolution_analysis: string
    risk_assessment: string
    clinical_summary: string
    confidence_level: string
  }
  visual_guidance: {
    medical_state: string
    state_description: string
    visual_properties: Record<string, any>
  }
  report: {
    report_id: string
    markdown: string
  }
}

export default function MedicalDashboard() {
  const [analysisData, setAnalysisData] = useState<MedicalAnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    // In a real implementation, this would fetch from the unified endpoint
    // For now, mock data
    const mockData: MedicalAnalysisData = {
      patient_id: "PATIENT-001",
      core_metrics: {
        treatment_score: 82.5,
        medical_state: "Responding",
        recovery_status: "Responding to Treatment",
        recovery_speed: "moderate",
        effectiveness: 0.85,
      },
      tumor_behavior: {
        base_growth_rate: 0.4,
        morphology_complexity: 0.65,
        invasion_style: "rim_enhancing",
        hypoxia_pattern: "scattered",
        pulsation_frequency: 0.8,
        treatment_resistance_phenotype: "responsive",
        description: "Moderate growth with responsive phenotype",
      },
      risk_profile: {
        overall_risk_level: "intermediate",
        risk_score: 45,
        recurrence_risk: 0.35,
        progression_risk: 0.42,
        treatment_resistance_probability: 0.15,
        primary_risk_factors: [
          "Moderate tumor size affects treatment penetration",
          "Intermediate aggressiveness suggests moderate progression risk",
        ],
        protective_factors: [
          "Strong medicine effectiveness provides good response",
          "Excellent treatment score indicates disease control",
        ],
        disease_free_survival_probability: 0.78,
      },
      explanations: {
        medicine_recommendation:
          "Medicine X is strongly recommended for this cancer type with 85% effectiveness.",
        recovery_prediction:
          "Recovery trajectory is steady with expected timeline of 90-120 days.",
        aggressiveness_analysis:
          "Aggressiveness is stable with treatment showing good control.",
        tumor_evolution_analysis:
          "Tumor is stabilizing under treatment with minimal growth observed.",
        risk_assessment: "Intermediate risk disease with favorable prognostic indicators.",
        clinical_summary:
          "Patient with responsive tumor under good treatment control.",
        confidence_level: "High",
      },
      visual_guidance: {
        medical_state: "Responding",
        state_description: "The tumor is responding well to treatment.",
        visual_properties: {
          glow_intensity: 0.3,
          glow_color_rgb: [0.2, 0.8, 0.4],
          pulsation_amplitude: 0.15,
        },
      },
      report: {
        report_id: "TVDTWIN-ABC123DEF456",
        markdown: "# Medical Report\n\nFull report content...",
      },
    }

    setAnalysisData(mockData)
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-white">Loading medical analysis...</div>
      </div>
    )
  }

  if (!analysisData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-white">No analysis data available</div>
      </div>
    )
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "low":
        return "#00FF9C"
      case "intermediate":
        return "#FF9F43"
      case "high":
        return "#FF6B6B"
      default:
        return "#8899AA"
    }
  }

  const getStateColor = (state: string) => {
    switch (state) {
      case "Responding":
        return "#00FF9C"
      case "Stable":
        return "#00E5FF"
      case "Aggressive":
        return "#FF6B6B"
      case "Resistant":
        return "#8A2BE2"
      case "Progressive":
        return "#FF0000"
      case "Necrotic":
        return "#888888"
      case "Controlled":
        return "#00FF00"
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
          <h1 className="text-4xl font-bold neon-text">Medical Intelligence Dashboard</h1>
          <p className="text-[#8899AA] mt-2">
            AI-Powered Digital Tumor Twin Analysis - Report {analysisData.report.report_id}
          </p>
        </motion.div>

        {/* Core Metrics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {/* Treatment Score */}
          <Card className="glass-panel p-6 border-white/10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-[#8899AA] font-semibold">
                  Treatment Score
                </p>
                <p className="text-3xl font-bold text-white mt-2">
                  {analysisData.core_metrics.treatment_score.toFixed(1)}
                </p>
                <p className="text-xs text-[#00E5FF] mt-1">out of 100</p>
              </div>
              <Zap className="h-6 w-6 text-[#00E5FF]" />
            </div>
            <Progress
              value={analysisData.core_metrics.treatment_score}
              className="h-2"
            />
          </Card>

          {/* Effectiveness */}
          <Card className="glass-panel p-6 border-white/10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-[#8899AA] font-semibold">
                  Effectiveness
                </p>
                <p className="text-3xl font-bold text-white mt-2">
                  {(analysisData.core_metrics.effectiveness * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-[#00FF9C] mt-1">Medicine response</p>
              </div>
              <Heart className="h-6 w-6 text-[#00FF9C]" />
            </div>
            <Progress
              value={analysisData.core_metrics.effectiveness * 100}
              className="h-2"
            />
          </Card>

          {/* Medical State */}
          <Card className="glass-panel p-6 border-white/10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-[#8899AA] font-semibold">
                  Medical State
                </p>
                <Badge
                  className="mt-2 px-3 py-1 text-sm font-semibold"
                  style={{
                    backgroundColor: `${getStateColor(analysisData.core_metrics.medical_state)}20`,
                    color: getStateColor(analysisData.core_metrics.medical_state),
                    border: `1px solid ${getStateColor(analysisData.core_metrics.medical_state)}`,
                  }}
                >
                  {analysisData.core_metrics.medical_state}
                </Badge>
              </div>
              <Activity className="h-6 w-6" style={{ color: getStateColor(analysisData.core_metrics.medical_state) }} />
            </div>
          </Card>

          {/* Risk Level */}
          <Card className="glass-panel p-6 border-white/10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-[#8899AA] font-semibold">
                  Risk Level
                </p>
                <Badge
                  className="mt-2 px-3 py-1 text-sm font-semibold uppercase"
                  style={{
                    backgroundColor: `${getRiskColor(analysisData.risk_profile.overall_risk_level)}20`,
                    color: getRiskColor(analysisData.risk_profile.overall_risk_level),
                    border: `1px solid ${getRiskColor(analysisData.risk_profile.overall_risk_level)}`,
                  }}
                >
                  {analysisData.risk_profile.overall_risk_level}
                </Badge>
              </div>
              <Shield className="h-6 w-6" style={{ color: getRiskColor(analysisData.risk_profile.overall_risk_level) }} />
            </div>
            <p className="text-2xl font-bold text-white mt-2">
              {analysisData.risk_profile.risk_score.toFixed(0)}/100
            </p>
          </Card>
        </motion.div>

        {/* Tabs for detailed information */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glass-panel grid grid-cols-2 md:grid-cols-5 w-full border border-white/10">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="treatment">Treatment</TabsTrigger>
            <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
            <TabsTrigger value="behavior">Tumor Behavior</TabsTrigger>
            <TabsTrigger value="report">Report</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              {/* Recovery Status */}
              <Card className="glass-panel p-6 border-white/10">
                <h3 className="text-lg font-semibold text-[#00E5FF] mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recovery Prediction
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[#8899AA] text-sm mb-2">Status</p>
                    <p className="text-white font-semibold">{analysisData.core_metrics.recovery_status}</p>
                  </div>
                  <div>
                    <p className="text-[#8899AA] text-sm mb-2">Timeline</p>
                    <p className="text-white font-semibold capitalize">
                      {analysisData.core_metrics.recovery_speed.replace("_", " ")} progression
                    </p>
                  </div>
                  <div>
                    <p className="text-[#8899AA] text-sm mb-2">Disease-Free Survival</p>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-bold">
                        {(analysisData.risk_profile.disease_free_survival_probability * 100).toFixed(0)}%
                      </p>
                      <Progress
                        value={analysisData.risk_profile.disease_free_survival_probability * 100}
                        className="flex-1 h-2"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Clinical Summary */}
              <Card className="glass-panel p-6 border-white/10">
                <h3 className="text-lg font-semibold text-[#8A2BE2] mb-4 flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Clinical Summary
                </h3>
                <p className="text-[#E8EDF2] leading-relaxed text-sm">
                  {analysisData.explanations.clinical_summary}
                </p>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-[#8899AA] text-xs uppercase font-semibold mb-2">Confidence Level</p>
                  <Badge className="bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/50">
                    {analysisData.explanations.confidence_level}
                  </Badge>
                </div>
              </Card>
            </motion.div>

            {/* AI Explanations */}
            <motion.div className="space-y-4">
              <h2 className="text-xl font-bold text-[#00E5FF]">AI Medical Explanations</h2>

              <Card className="glass-panel p-6 border-white/10">
                <h4 className="font-semibold text-[#00FF9C] mb-3 flex items-center gap-2">
                  <Pill className="h-4 w-4" />
                  Medicine Recommendation
                </h4>
                <p className="text-[#E8EDF2] text-sm leading-relaxed">
                  {analysisData.explanations.medicine_recommendation}
                </p>
              </Card>

              <Card className="glass-panel p-6 border-white/10">
                <h4 className="font-semibold text-[#00FF9C] mb-3 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Recovery Prediction
                </h4>
                <p className="text-[#E8EDF2] text-sm leading-relaxed">
                  {analysisData.explanations.recovery_prediction}
                </p>
              </Card>

              <Card className="glass-panel p-6 border-white/10">
                <h4 className="font-semibold text-[#00FF9C] mb-3 flex items-center gap-2">
                  <Flame className="h-4 w-4" />
                  Aggressiveness Analysis
                </h4>
                <p className="text-[#E8EDF2] text-sm leading-relaxed">
                  {analysisData.explanations.aggressiveness_analysis}
                </p>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Treatment Tab */}
          <TabsContent value="treatment" className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <Card className="glass-panel p-6 border-white/10">
                <h3 className="text-lg font-semibold text-[#00E5FF] mb-6">Treatment Intelligence Analysis</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Score Breakdown */}
                  <div className="space-y-4">
                    <h4 className="text-sm uppercase font-semibold text-[#8899AA]">Treatment Score Breakdown</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-[#8899AA]">Overall Score</span>
                          <span className="text-sm font-bold text-[#00E5FF]">
                            {analysisData.core_metrics.treatment_score.toFixed(1)}/100
                          </span>
                        </div>
                        <Progress
                          value={analysisData.core_metrics.treatment_score}
                          className="h-2"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-[#8899AA]">Medicine Effectiveness</span>
                          <span className="text-sm font-bold text-[#00FF9C]">
                            {(analysisData.core_metrics.effectiveness * 100).toFixed(0)}%
                          </span>
                        </div>
                        <Progress
                          value={analysisData.core_metrics.effectiveness * 100}
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Recovery Status */}
                  <div className="space-y-4">
                    <h4 className="text-sm uppercase font-semibold text-[#8899AA]">Recovery Status</h4>
                    <div className="space-y-2">
                      <p className="text-[#E8EDF2] font-semibold">{analysisData.core_metrics.recovery_status}</p>
                      <p className="text-sm text-[#8899AA]">
                        Timeline: {analysisData.core_metrics.recovery_speed.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Treatment Explanation */}
              <Card className="glass-panel p-6 border-white/10">
                <h3 className="text-lg font-semibold text-[#00E5FF] mb-4">Treatment Evolution Analysis</h3>
                <p className="text-[#E8EDF2] text-sm leading-relaxed">
                  {analysisData.explanations.tumor_evolution_analysis}
                </p>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Risk Analysis Tab */}
          <TabsContent value="risk" className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Risk Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="glass-panel p-6 border-white/10">
                  <p className="text-xs uppercase tracking-wider text-[#8899AA] font-semibold mb-3">
                    Recurrence Risk
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {(analysisData.risk_profile.recurrence_risk * 100).toFixed(0)}%
                  </p>
                  <Progress
                    value={analysisData.risk_profile.recurrence_risk * 100}
                    className="mt-3 h-2"
                  />
                </Card>

                <Card className="glass-panel p-6 border-white/10">
                  <p className="text-xs uppercase tracking-wider text-[#8899AA] font-semibold mb-3">
                    Progression Risk
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {(analysisData.risk_profile.progression_risk * 100).toFixed(0)}%
                  </p>
                  <Progress
                    value={analysisData.risk_profile.progression_risk * 100}
                    className="mt-3 h-2"
                  />
                </Card>

                <Card className="glass-panel p-6 border-white/10">
                  <p className="text-xs uppercase tracking-wider text-[#8899AA] font-semibold mb-3">
                    Treatment Resistance
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {(analysisData.risk_profile.treatment_resistance_probability * 100).toFixed(0)}%
                  </p>
                  <Progress
                    value={analysisData.risk_profile.treatment_resistance_probability * 100}
                    className="mt-3 h-2"
                  />
                </Card>
              </div>

              {/* Risk Factors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="glass-panel p-6 border-white/10">
                  <h4 className="text-sm font-semibold text-[#FF6B6B] mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Primary Risk Factors
                  </h4>
                  <ul className="space-y-2">
                    {analysisData.risk_profile.primary_risk_factors.map((factor, idx) => (
                      <li key={idx} className="text-sm text-[#E8EDF2] flex gap-2">
                        <span className="text-[#FF6B6B]">•</span>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card className="glass-panel p-6 border-white/10">
                  <h4 className="text-sm font-semibold text-[#00FF9C] mb-4 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Protective Factors
                  </h4>
                  <ul className="space-y-2">
                    {analysisData.risk_profile.protective_factors.map((factor, idx) => (
                      <li key={idx} className="text-sm text-[#E8EDF2] flex gap-2">
                        <span className="text-[#00FF9C]">•</span>
                        {factor}
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              {/* Risk Assessment Narrative */}
              <Card className="glass-panel p-6 border-white/10">
                <h3 className="text-lg font-semibold text-[#00E5FF] mb-4">Risk Assessment Summary</h3>
                <p className="text-[#E8EDF2] leading-relaxed">
                  {analysisData.explanations.risk_assessment}
                </p>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Tumor Behavior Tab */}
          <TabsContent value="behavior" className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <Card className="glass-panel p-6 border-white/10">
                <h3 className="text-lg font-semibold text-[#00E5FF] mb-4">Biological Tumor Profile</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-sm uppercase font-semibold text-[#8899AA]">Growth Characteristics</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-[#8899AA] mb-1">Base Growth Rate</p>
                        <p className="text-[#E8EDF2] font-semibold">
                          {analysisData.tumor_behavior.base_growth_rate.toFixed(2)} mm/month
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#8899AA] mb-1">Morphology Complexity</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[#E8EDF2] font-semibold">
                            {(analysisData.tumor_behavior.morphology_complexity * 100).toFixed(0)}%
                          </p>
                          <Progress
                            value={analysisData.tumor_behavior.morphology_complexity * 100}
                            className="flex-1 h-2"
                          />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-[#8899AA] mb-1">Invasion Style</p>
                        <p className="text-[#E8EDF2] font-semibold capitalize">
                          {analysisData.tumor_behavior.invasion_style.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm uppercase font-semibold text-[#8899AA]">Biological State</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-[#8899AA] mb-1">Hypoxia Pattern</p>
                        <p className="text-[#E8EDF2] font-semibold capitalize">
                          {analysisData.tumor_behavior.hypoxia_pattern.replace("_", " ")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#8899AA] mb-1">Treatment Response Phenotype</p>
                        <Badge
                          className="mt-1 px-3 py-1 capitalize"
                          style={{
                            backgroundColor: "#00FF9C20",
                            color: "#00FF9C",
                            border: "1px solid #00FF9C",
                          }}
                        >
                          {analysisData.tumor_behavior.treatment_resistance_phenotype}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-[#8899AA] mb-1">Pulsation Frequency</p>
                        <p className="text-[#E8EDF2] font-semibold">
                          {analysisData.tumor_behavior.pulsation_frequency.toFixed(2)} Hz
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-sm text-[#8899AA] mb-2">Behavioral Summary</p>
                  <p className="text-[#E8EDF2]">{analysisData.tumor_behavior.description}</p>
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Report Tab */}
          <TabsContent value="report" className="space-y-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <Card className="glass-panel p-6 border-white/10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#00E5FF]">Medical Analysis Report</h3>
                    <p className="text-xs text-[#8899AA] mt-1">Report ID: {analysisData.report.report_id}</p>
                  </div>
                  <button className="px-4 py-2 rounded-lg bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF] hover:bg-[#00E5FF]/30 transition text-sm font-semibold">
                    Download PDF
                  </button>
                </div>

                <div className="prose prose-invert max-w-none prose-sm prose-headings:text-[#00E5FF] prose-p:text-[#E8EDF2]">
                  <p className="text-[#8899AA] text-sm leading-relaxed">
                    Complete medical simulation report generated by the TumorVerse AI Digital Twin Platform.
                    This report includes comprehensive tumor analysis, treatment intelligence, recovery predictions,
                    and clinical recommendations.
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-xs text-[#8899AA] mb-4">REPORT SECTIONS:</p>
                  <ul className="space-y-2 text-sm text-[#E8EDF2]">
                    <li className="flex gap-2">
                      <span className="text-[#00E5FF]">✓</span> Tumor Classification & Characteristics
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#00E5FF]">✓</span> Treatment Analysis & Intelligence
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#00E5FF]">✓</span> Recovery Timeline & Prognosis
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#00E5FF]">✓</span> Tumor Behavior & Evolution
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#00E5FF]">✓</span> Risk Stratification & Assessment
                    </li>
                    <li className="flex gap-2">
                      <span className="text-[#00E5FF]">✓</span> Clinical Recommendations
                    </li>
                  </ul>
                </div>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
