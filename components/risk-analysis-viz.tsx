import React, { useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Shield,
  Heart,
  Activity,
  Zap,
  Clock,
  BarChart3,
} from "lucide-react"
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts"
import { motion } from "framer-motion"

interface RiskAnalysisProps {
  riskScore: number
  riskLevel: "low" | "intermediate" | "high"
  recurrenceRisk: number
  progressionRisk: number
  treatmentResistanceRisk: number
  stabilizationConfidence: number
  tumorSize: number
  aggressiveness: "low" | "moderate" | "high"
  effectiveness: number
  treatmentScore: number
}

export default function RiskAnalysisVisualization(props: RiskAnalysisProps) {
  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return { bg: "#00FF9C", text: "#0A1628", light: "#00FF9C/10", border: "#00FF9C/50" }
      case "intermediate":
        return { bg: "#FF9F43", text: "#0A1628", light: "#FF9F43/10", border: "#FF9F43/50" }
      case "high":
        return { bg: "#FF3B5C", text: "#FFFFFF", light: "#FF3B5C/10", border: "#FF3B5C/50" }
      default:
        return { bg: "#00E5FF", text: "#0A1628", light: "#00E5FF/10", border: "#00E5FF/50" }
    }
  }

  const riskColor = getRiskColor(props.riskLevel)

  const riskFactors = [
    {
      name: "Recurrence Risk",
      value: props.recurrenceRisk,
      icon: Heart,
      description: "Probability of tumor returning after treatment",
    },
    {
      name: "Progression Risk",
      value: props.progressionRisk,
      icon: TrendingUp,
      description: "Likelihood of continued tumor growth",
    },
    {
      name: "Treatment Resistance",
      value: props.treatmentResistanceRisk,
      icon: Shield,
      description: "Probability of treatment ineffectiveness",
    },
    {
      name: "Stabilization Confidence",
      value: props.stabilizationConfidence,
      icon: Activity,
      description: "Confidence in achieving tumor stability",
    },
  ]

  const riskTrendData = [
    { month: 0, baseline: 100, predicted: 100, controlled: 100 },
    { month: 1, baseline: 95, predicted: 98, controlled: 88 },
    { month: 2, baseline: 88, predicted: 92, controlled: 72 },
    { month: 3, baseline: 78, predicted: 80, controlled: 55 },
    { month: 6, baseline: 65, predicted: 60, controlled: 35 },
  ]

  const riskRadarData = [
    {
      category: "Recurrence",
      value: Math.min(props.recurrenceRisk * 100, 100),
      fullMark: 100,
    },
    {
      category: "Progression",
      value: Math.min(props.progressionRisk * 100, 100),
      fullMark: 100,
    },
    {
      category: "Resistance",
      value: Math.min(props.treatmentResistanceRisk * 100, 100),
      fullMark: 100,
    },
    {
      category: "Size",
      value: Math.min((props.tumorSize / 100) * 100, 100),
      fullMark: 100,
    },
    {
      category: "Aggressiveness",
      value: props.aggressiveness === "high" ? 80 : props.aggressiveness === "moderate" ? 50 : 20,
      fullMark: 100,
    },
  ]

  const protectiveFactors = [
    { name: "Treatment Effectiveness", value: props.effectiveness * 100, icon: Zap },
    { name: "Treatment Score", value: props.treatmentScore, icon: BarChart3 },
    { name: "Stabilization Confidence", value: props.stabilizationConfidence * 100, icon: Shield },
  ]

  const getRiskRecommendation = () => {
    if (props.riskLevel === "low") {
      return "Excellent prognosis. Continue current therapy with standard monitoring intervals (8-12 weeks)."
    } else if (props.riskLevel === "intermediate") {
      return "Guarded prognosis. Maintain current therapy with close monitoring (4-6 weeks). Consider intensification if progression detected."
    } else {
      return "Aggressive disease. Current therapy may require modification. Urgent multidisciplinary review recommended. Consider treatment escalation or clinical trials."
    }
  }

  return (
    <div className="space-y-6">
      {/* Main Risk Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#0F1E35] to-[#0A1628] border-2 rounded-lg p-8 overflow-hidden relative"
        style={{ borderColor: riskColor.bg }}
      >
        <div className="absolute -right-20 -top-20 w-40 h-40 rounded-full opacity-10" style={{ backgroundColor: riskColor.bg }} />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Risk Score Circle */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-32 h-32 rounded-full flex items-center justify-center border-4" style={{ borderColor: riskColor.bg }}>
              <div className="absolute inset-0 rounded-full opacity-20" style={{ backgroundColor: riskColor.bg }} />
              <div className="relative z-10 text-center">
                <p className="text-4xl font-bold" style={{ color: riskColor.bg }}>
                  {Math.round(props.riskScore)}
                </p>
                <p className="text-xs text-[#8899AA] mt-2">Risk Score</p>
              </div>
            </div>
          </div>

          {/* Risk Level & Status */}
          <div className="flex flex-col justify-center">
            <Badge className={`mb-4 w-fit ${riskColor.light} text-[${riskColor.bg}] border ${riskColor.border}`} style={{ color: riskColor.bg, backgroundColor: riskColor.light }}>
              {props.riskLevel.toUpperCase()}
            </Badge>
            <h3 className="text-2xl font-bold text-[#E8EDF2] mb-3">
              {props.riskLevel === "low" ? "Favorable Prognosis" : props.riskLevel === "intermediate" ? "Intermediate Risk" : "Aggressive Disease"}
            </h3>
            <p className="text-sm text-[#8899AA]">
              {props.riskLevel === "low"
                ? "Excellent response to treatment with low progression risk"
                : props.riskLevel === "intermediate"
                  ? "Partial response requiring close monitoring"
                  : "Limited response, treatment modification may be needed"}
            </p>
          </div>

          {/* Key Metrics */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-[#8899AA]">Stabilization Confidence</span>
                <span className="text-sm font-semibold text-[#E8EDF2]">{(props.stabilizationConfidence * 100).toFixed(0)}%</span>
              </div>
              <Progress value={props.stabilizationConfidence * 100} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-[#8899AA]">Treatment Effectiveness</span>
                <span className="text-sm font-semibold text-[#E8EDF2]">{(props.effectiveness * 100).toFixed(0)}%</span>
              </div>
              <Progress value={props.effectiveness * 100} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-[#8899AA]">Treatment Score</span>
                <span className="text-sm font-semibold text-[#E8EDF2]">{props.treatmentScore}/100</span>
              </div>
              <Progress value={props.treatmentScore} className="h-2" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Risk Factors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {riskFactors.map((factor, idx) => {
          const Icon = factor.icon
          const isHigh = factor.value > 0.6
          return (
            <motion.div
              key={factor.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-[#0F1E35]/60 border border-[#00E5FF]/20 rounded-lg p-4 hover:border-[#00E5FF]/40 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${isHigh ? "bg-[#FF3B5C]/10" : "bg-[#00E5FF]/10"}`}>
                  <Icon className={`w-5 h-5 ${isHigh ? "text-[#FF3B5C]" : "text-[#00E5FF]"}`} />
                </div>
                <h4 className="text-sm font-semibold text-[#E8EDF2]">{factor.name}</h4>
              </div>
              <div className="text-2xl font-bold mb-2" style={{ color: isHigh ? "#FF3B5C" : "#00E5FF" }}>
                {(factor.value * 100).toFixed(0)}%
              </div>
              <p className="text-xs text-[#8899AA]">{factor.description}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Trend */}
        <Card className="bg-[#0F1E35]/60 border-[#00E5FF]/20 p-6">
          <h3 className="text-lg font-semibold text-[#E8EDF2] mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Risk Trend (6 Months)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={riskTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#00E5FF/20" />
              <XAxis dataKey="month" stroke="#8899AA" />
              <YAxis stroke="#8899AA" />
              <Tooltip contentStyle={{ backgroundColor: "#0F1E35", border: "1px solid #00E5FF" }} />
              <Legend />
              <Line type="monotone" dataKey="baseline" stroke="#FF3B5C" strokeWidth={2} name="Baseline Risk" />
              <Line type="monotone" dataKey="predicted" stroke="#FF9F43" strokeWidth={2} name="Without Treatment" />
              <Line type="monotone" dataKey="controlled" stroke="#00FF9C" strokeWidth={2} name="With Treatment" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Risk Radar */}
        <Card className="bg-[#0F1E35]/60 border-[#00E5FF]/20 p-6">
          <h3 className="text-lg font-semibold text-[#E8EDF2] mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Risk Profile
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={riskRadarData}>
              <PolarGrid stroke="#00E5FF/20" />
              <PolarAngleAxis dataKey="category" stroke="#8899AA" fontSize={12} />
              <PolarRadiusAxis stroke="#8899AA" />
              <Radar name="Risk Level" dataKey="value" stroke="#FF3B5C" fill="#FF3B5C" fillOpacity={0.3} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Protective Factors */}
      <Card className="bg-[#0F1E35]/60 border-[#00E5FF]/20 p-6">
        <h3 className="text-lg font-semibold text-[#E8EDF2] mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#00FF9C]" />
          Protective Factors
        </h3>
        <div className="space-y-4">
          {protectiveFactors.map((factor, idx) => {
            const Icon = factor.icon
            return (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-[#00FF9C]" />
                    <span className="text-sm text-[#E8EDF2]">{factor.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-[#00FF9C]">{factor.value.toFixed(0)}%</span>
                </div>
                <Progress value={factor.value} className="h-2 bg-[#00FF9C]/20" />
              </div>
            )
          })}
        </div>
      </Card>

      {/* Clinical Recommendation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-lg p-6 border-2 ${riskColor.light}`}
        style={{ borderColor: riskColor.bg }}
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${riskColor.light}`} style={{ backgroundColor: riskColor.light }}>
            <AlertTriangle className="w-6 h-6" style={{ color: riskColor.bg }} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[#E8EDF2] mb-2">Clinical Recommendation</h3>
            <p className="text-[#8899AA] leading-relaxed">{getRiskRecommendation()}</p>
          </div>
        </div>
      </motion.div>

      {/* Risk Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "6-Month Progression", value: (props.progressionRisk * 100).toFixed(0), unit: "%" },
          { label: "12-Month Recurrence", value: (props.recurrenceRisk * 100).toFixed(0), unit: "%" },
          { label: "Treatment Resistance", value: (props.treatmentResistanceRisk * 100).toFixed(0), unit: "%" },
          { label: "Disease-Free Survival", value: (100 - props.riskScore).toFixed(0), unit: "%" },
        ].map((metric, idx) => (
          <Card key={idx} className="bg-[#0F1E35]/60 border-[#00E5FF]/20 p-4">
            <p className="text-xs text-[#8899AA] mb-2">{metric.label}</p>
            <p className="text-2xl font-bold text-[#E8EDF2]">
              {metric.value}
              <span className="text-lg text-[#8899AA]">{metric.unit}</span>
            </p>
          </Card>
        ))}
      </div>
    </div>
  )
}
