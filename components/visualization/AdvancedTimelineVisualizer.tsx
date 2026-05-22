"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { 
  Calendar,
  Activity,
  TrendingDown,
  AlertCircle
} from "lucide-react"

interface TimelineKeypoint {
  day: number
  tumor_size: number
  aggressiveness: number
  treatment_effect: number
}

interface AdvancedTimelineVisualizerProps {
  keypoints: TimelineKeypoint[]
  medicine: string
  recoveryStatus: string
  recoverySpeed: string
}

const getMilestoneLabel = (day: number) => {
  switch (day) {
    case 0: return "Baseline"
    case 30: return "Month 1"
    case 60: return "Month 2"
    case 90: return "Quarter 1"
    case 180: return "Half Year"
    case 365: return "Year 1"
    default: return `Day ${day}`
  }
}

const getPhaseColor = (aggressiveness: number) => {
  if (aggressiveness > 70) return "#FF3B5C"
  if (aggressiveness > 40) return "#FF9F43"
  return "#00FF9C"
}

const getPhaseLabel = (aggressiveness: number) => {
  if (aggressiveness > 70) return "Active"
  if (aggressiveness > 40) return "Responding"
  return "Controlled"
}

export function AdvancedTimelineVisualizer({
  keypoints,
  medicine,
  recoveryStatus,
  recoverySpeed,
}: AdvancedTimelineVisualizerProps) {
  const [selectedDay, setSelectedDay] = useState(0)
  const selectedPoint = keypoints.find(kp => kp.day === selectedDay) || keypoints[0]
  const maxSize = Math.max(...keypoints.map(kp => kp.tumor_size))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[#00E5FF]/10 border border-[#00E5FF]/20">
          <Calendar className="w-5 h-5 text-[#00E5FF]" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[#E8EDF2]">Treatment Evolution Timeline</h2>
          <p className="text-xs text-[#8899AA]">{medicine} - 365-Day Simulation</p>
        </div>
      </div>

      {/* Timeline Visualization */}
      <Card className="glass-panel p-6 rounded-lg border border-white/10">
        {/* Timeline Track */}
        <div className="mb-6">
          <div className="relative h-32">
            {/* Background grid */}
            <div className="absolute inset-0 grid grid-cols-6 gap-0 opacity-10">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border-l border-[#00E5FF]" />
              ))}
            </div>

            {/* SVG for curve */}
            <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }} viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="sizeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00E5FF" stopOpacity="1" />
                  <stop offset="50%" stopColor="#FF9F43" stopOpacity="1" />
                  <stop offset="100%" stopColor="#00FF9C" stopOpacity="1" />
                </linearGradient>
              </defs>

              {/* Tumor size curve */}
              <polyline
                points={keypoints
                  .map((kp, idx) => {
                    const x = (idx / (keypoints.length - 1)) * 100
                    const y = 100 - (kp.tumor_size / maxSize) * 80
                    return `${x},${y}`
                  })
                  .join(" ")}
                fill="none"
                stroke="url(#sizeGradient)"
                strokeWidth="0.5"
              />

              {/* Data points */}
              {keypoints.map((kp, idx) => {
                const x = (idx / (keypoints.length - 1)) * 100
                const y = 100 - (kp.tumor_size / maxSize) * 80
                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r="1.5"
                    fill={getPhaseColor(kp.aggressiveness)}
                    opacity="0.7"
                    onClick={() => setSelectedDay(kp.day)}
                    className="cursor-pointer hover:opacity-100 transition-opacity"
                  />
                )
              })}
            </svg>

            {/* Selected day indicator */}
            {selectedPoint && (
              <div
                className="absolute top-0 bottom-0 w-1 bg-[#00E5FF]/50 pointer-events-none"
                style={{
                  left: `${(selectedPoint.day / 365) * 100}%`,
                  zIndex: 2,
                }}
              />
            )}
          </div>
        </div>

        {/* Timeline Labels */}
        <div className="flex justify-between text-xs text-[#8899AA] mb-4 px-2">
          {keypoints.map((kp, idx) => (
            <span key={idx}>{getMilestoneLabel(kp.day)}</span>
          ))}
        </div>

        {/* Day Slider */}
        <Slider
          value={[selectedDay]}
          onValueChange={(value) => {
            const closest = keypoints.reduce((prev, curr) =>
              Math.abs(curr.day - value[0]) < Math.abs(prev.day - value[0])
                ? curr
                : prev
            )
            setSelectedDay(closest.day)
          }}
          max={365}
          step={30}
          className="mb-6"
        />
      </Card>

      {/* Selected Point Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Tumor Metrics */}
        <Card className="glass-panel p-4 rounded-lg border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-[#00E5FF]" />
            <h3 className="text-sm font-semibold text-[#E8EDF2]">Tumor Status</h3>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-[#8899AA] mb-2">Tumor Size</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[#00E5FF]">
                  {selectedPoint.tumor_size.toFixed(1)}
                </span>
                <span className="text-xs text-[#8899AA]">mm</span>
              </div>
              <div className="mt-2 h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#00E5FF] to-[#00FF9C]"
                  style={{ width: `${(selectedPoint.tumor_size / maxSize) * 100}%` }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <p className="text-xs text-[#8899AA] mb-2">Treatment Effect</p>
              <span className="text-xl font-bold text-[#00FF9C]">
                {selectedPoint.treatment_effect.toFixed(0)}%
              </span>
            </div>

            <div className="pt-4 border-t border-white/10">
              <p className="text-xs text-[#8899AA] mb-2">Phase Status</p>
              <Badge
                variant="outline"
                style={{
                  backgroundColor: getPhaseColor(selectedPoint.aggressiveness) + "20",
                  borderColor: getPhaseColor(selectedPoint.aggressiveness) + "50",
                  color: getPhaseColor(selectedPoint.aggressiveness),
                }}
              >
                {getPhaseLabel(selectedPoint.aggressiveness)}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Right: Aggressiveness & Prognosis */}
        <Card className="glass-panel p-4 rounded-lg border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-4 h-4 text-[#FF9F43]" />
            <h3 className="text-sm font-semibold text-[#E8EDF2]">Aggressiveness</h3>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-[#8899AA] mb-2">Current Level</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold" style={{ color: getPhaseColor(selectedPoint.aggressiveness) }}>
                  {selectedPoint.aggressiveness.toFixed(0)}%
                </span>
                <span className="text-xs text-[#8899AA]">active</span>
              </div>
              <div className="mt-2 h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#FF3B5C] via-[#FF9F43] to-[#00FF9C]"
                  style={{ width: `${selectedPoint.aggressiveness}%` }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-white/10">
              <p className="text-xs text-[#8899AA] mb-2">Recovery Status</p>
              <p className="text-sm text-[#D1D7E0]">{recoveryStatus}</p>
            </div>

            <div className="pt-4 border-t border-white/10">
              <p className="text-xs text-[#8899AA] mb-2">Response Speed</p>
              <Badge className="bg-[#8A2BE2]/20 text-[#8A2BE2] border-[#8A2BE2]/30" variant="outline">
                {recoverySpeed}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Key Milestones */}
      <Card className="glass-panel p-4 rounded-lg border border-white/10">
        <h3 className="text-sm font-semibold text-[#E8EDF2] mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#00E5FF]" />
          Key Milestones
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {keypoints.map((kp, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedDay(kp.day)}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                selectedDay === kp.day
                  ? "glass-panel border border-[#00E5FF]"
                  : "glass-panel border border-white/10 hover:border-white/20"
              }`}
            >
              <p className="text-xs text-[#8899AA] mb-2">{getMilestoneLabel(kp.day)}</p>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-[#E8EDF2]">{kp.tumor_size.toFixed(1)}mm</span>
                <span className="text-xs" style={{ color: getPhaseColor(kp.aggressiveness) }}>
                  {getPhaseLabel(kp.aggressiveness)}
                </span>
              </div>
              <div className="text-xs text-[#00E5FF]">
                {kp.treatment_effect.toFixed(0)}% response
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Clinical Note */}
      <div className="glass-panel p-4 rounded-lg border border-[#FF9F43]/30 bg-[#FF9F43]/5 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-[#FF9F43] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-[#D1D7E0]">
          This timeline is a AI-powered simulation based on treatment effectiveness and tumor biology. Actual outcomes may vary based on patient-specific factors, compliance, and clinical response.
        </p>
      </div>
    </div>
  )
}
