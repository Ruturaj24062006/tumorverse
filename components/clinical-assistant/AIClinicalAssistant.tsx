"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Brain, 
  Activity, 
  AlertTriangle, 
  TrendingDown, 
  CheckCircle2,
  Pill,
  Heart,
  Zap,
  Shield,
  Clock
} from "lucide-react"

interface CoreAIMetrics {
  treatment_score: number
  effectiveness: number
  aggressiveness: number
  aggressiveness_label: string
  medicine_compatibility: number
  recovery_timeline_days: number
  recovery_status: string
  recovery_speed: string
  recurrence_risk: number
  progression_risk: number
  treatment_resistance_probability: number
  stabilization_confidence: number
  overall_risk_level: string
  risk_score: number
  medicine_explanation: string
  recovery_explanation: string
  aggressiveness_explanation: string
  tumor_evolution_explanation: string
  risk_summary: string
  visualization_intensity: number
  visualization_aggressiveness_color: string
  clinical_summary: string
  timeline_keypoints: Array<{
    day: number
    tumor_size: number
    aggressiveness: number
    treatment_effect: number
  }>
}

interface AIClinicalAssistantProps {
  metrics: CoreAIMetrics
  medicine: string
  cancerType: string
  isLoading?: boolean
}

const getRiskColor = (level: string) => {
  switch (level) {
    case "low":
      return "#00FF9C"
    case "intermediate":
      return "#FF9F43"
    case "high":
      return "#FF3B5C"
    default:
      return "#8899AA"
  }
}

const getStatusIcon = (level: string) => {
  switch (level) {
    case "low":
      return <CheckCircle2 className="w-4 h-4" />
    case "intermediate":
      return <AlertTriangle className="w-4 h-4" />
    case "high":
      return <AlertTriangle className="w-4 h-4" />
    default:
      return <Activity className="w-4 h-4" />
  }
}

export function AIClinicalAssistant({
  metrics,
  medicine,
  cancerType,
  isLoading = false,
}: AIClinicalAssistantProps) {
  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin inline-block">
          <Brain className="w-8 h-8 text-[#00E5FF]" />
        </div>
        <p className="text-[#8899AA] mt-3">Analyzing treatment plan...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* AI Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-[#00E5FF]/10 border border-[#00E5FF]/20">
          <Brain className="w-5 h-5 text-[#00E5FF]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#E8EDF2]">AI Clinical Intelligence</h2>
          <p className="text-xs text-[#8899AA]">Treatment Analysis & Predictive Insights</p>
        </div>
      </div>

      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-6">
          {/* Medicine Recommendation */}
          <div className="glass-panel p-4 rounded-lg border border-white/10">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 rounded bg-[#00FF9C]/10">
                <Pill className="w-4 h-4 text-[#00FF9C]" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[#E8EDF2]">Medicine Recommendation</h3>
                <p className="text-xs text-[#8899AA]">{medicine}</p>
              </div>
              <Badge 
                className="bg-[#00FF9C]/20 text-[#00FF9C] border-[#00FF9C]/30"
                variant="outline"
              >
                {(metrics.medicine_compatibility * 100).toFixed(0)}% Compatible
              </Badge>
            </div>
            <p className="text-sm text-[#D1D7E0] leading-relaxed">
              {metrics.medicine_explanation}
            </p>
            <div className="mt-3 pt-3 border-t border-white/5">
              <p className="text-xs text-[#8899AA]">
                Effectiveness: <span className="text-[#00E5FF]">{(metrics.effectiveness * 100).toFixed(1)}%</span> | 
                Treatment Score: <span className="text-[#00E5FF]">{metrics.treatment_score.toFixed(1)}</span>/100
              </p>
            </div>
          </div>

          {/* Recovery Prediction */}
          <div className="glass-panel p-4 rounded-lg border border-white/10">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 rounded bg-[#8A2BE2]/10">
                <Heart className="w-4 h-4 text-[#8A2BE2]" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[#E8EDF2]">Recovery Prediction</h3>
                <p className="text-xs text-[#8899AA]">{metrics.recovery_status}</p>
              </div>
              <Badge 
                className="bg-[#8A2BE2]/20 text-[#8A2BE2] border-[#8A2BE2]/30"
                variant="outline"
              >
                {metrics.recovery_timeline_days}d estimate
              </Badge>
            </div>
            <p className="text-sm text-[#D1D7E0] leading-relaxed">
              {metrics.recovery_explanation}
            </p>
            <div className="mt-3 pt-3 border-t border-white/5">
              <p className="text-xs text-[#8899AA]">
                Response Speed: <span className="text-[#8A2BE2]">{metrics.recovery_speed}</span> | 
                Stabilization Confidence: <span className="text-[#8A2BE2]">{(metrics.stabilization_confidence * 100).toFixed(0)}%</span>
              </p>
            </div>
          </div>

          {/* Aggressiveness Analysis */}
          <div className="glass-panel p-4 rounded-lg border border-white/10">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 rounded bg-[#FF9F43]/10">
                <Zap className="w-4 h-4 text-[#FF9F43]" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[#E8EDF2]">Tumor Aggressiveness</h3>
                <p className="text-xs text-[#8899AA]">{metrics.aggressiveness_label}</p>
              </div>
              <Badge 
                className="border"
                style={{ 
                  backgroundColor: metrics.visualization_aggressiveness_color + "20",
                  borderColor: metrics.visualization_aggressiveness_color + "50",
                  color: metrics.visualization_aggressiveness_color,
                }}
                variant="outline"
              >
                {(metrics.aggressiveness * 100).toFixed(0)}%
              </Badge>
            </div>
            <p className="text-sm text-[#D1D7E0] leading-relaxed">
              {metrics.aggressiveness_explanation}
            </p>
          </div>

          {/* Tumor Evolution */}
          <div className="glass-panel p-4 rounded-lg border border-white/10">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 rounded bg-[#00E5FF]/10">
                <TrendingDown className="w-4 h-4 text-[#00E5FF]" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[#E8EDF2]">Evolution Projection</h3>
                <p className="text-xs text-[#8899AA]">365-day simulation</p>
              </div>
            </div>
            <p className="text-sm text-[#D1D7E0] leading-relaxed">
              {metrics.tumor_evolution_explanation}
            </p>
          </div>

          {/* Risk Assessment */}
          <div className="glass-panel p-4 rounded-lg border border-white/10">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 rounded" style={{ backgroundColor: getRiskColor(metrics.overall_risk_level) + "20" }}>
                {getStatusIcon(metrics.overall_risk_level)}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[#E8EDF2]">Risk Assessment</h3>
                <p className="text-xs text-[#8899AA]">Clinical Risk Stratification</p>
              </div>
              <Badge 
                style={{ 
                  backgroundColor: getRiskColor(metrics.overall_risk_level) + "20",
                  borderColor: getRiskColor(metrics.overall_risk_level) + "50",
                  color: getRiskColor(metrics.overall_risk_level),
                }}
                variant="outline"
              >
                {metrics.overall_risk_level.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-[#D1D7E0] leading-relaxed mb-3">
              {metrics.risk_summary}
            </p>
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
              <div>
                <p className="text-xs text-[#8899AA]">Recurrence Risk</p>
                <p className="text-sm font-semibold text-[#FF3B5C]">{(metrics.recurrence_risk * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-xs text-[#8899AA]">Progression Risk</p>
                <p className="text-sm font-semibold text-[#FF9F43]">{(metrics.progression_risk * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-xs text-[#8899AA]">Treatment Resistance</p>
                <p className="text-sm font-semibold text-[#FF3B5C]">{(metrics.treatment_resistance_probability * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-xs text-[#8899AA]">Stabilization Conf.</p>
                <p className="text-sm font-semibold text-[#00FF9C]">{(metrics.stabilization_confidence * 100).toFixed(0)}%</p>
              </div>
            </div>
          </div>

          {/* Clinical Summary */}
          <div className="glass-panel p-4 rounded-lg border border-[#00E5FF]/30 bg-[#00E5FF]/5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded bg-[#00E5FF]/20">
                <Shield className="w-4 h-4 text-[#00E5FF]" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[#00E5FF] mb-2">Clinical Summary</h3>
                <p className="text-sm text-[#D1D7E0] leading-relaxed">
                  {metrics.clinical_summary}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline Preview */}
          <div className="glass-panel p-4 rounded-lg border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded bg-[#00FF9C]/10">
                <Clock className="w-4 h-4 text-[#00FF9C]" />
              </div>
              <h3 className="text-sm font-semibold text-[#E8EDF2]">Treatment Timeline</h3>
            </div>
            <div className="space-y-2">
              {metrics.timeline_keypoints.slice(0, 4).map((point, idx) => (
                <div key={idx} className="flex items-center gap-3 text-xs">
                  <span className="text-[#8899AA] min-w-[40px]">Day {point.day}</span>
                  <div className="flex-1 h-1 rounded-full bg-white/5" style={{ 
                    background: `linear-gradient(to right, #00E5FF 0%, #00E5FF ${point.treatment_effect}%, rgba(255,255,255,0.05) ${point.treatment_effect}%)`
                  }} />
                  <span className="text-[#00E5FF] min-w-[50px] text-right">{point.treatment_effect.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
