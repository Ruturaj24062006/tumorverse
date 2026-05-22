"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Maximize2,
  Calendar,
  TrendingDown,
  Activity,
  Clock,
  Flame,
} from "lucide-react"
import { motion } from "framer-motion"

interface TimelinePoint {
  day: number
  label: string
  tumor_size: number
  aggressiveness: number
  status: string
  phase: string
}

export default function TimelinePlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentDay, setCurrentDay] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [volume, setVolume] = useState(70)

  // Generate timeline data for 180 days
  const generateTimeline = (): TimelinePoint[] => {
    const points: TimelinePoint[] = []
    const days = [0, 7, 14, 21, 30, 45, 60, 90, 120, 180]
    
    for (const day of days) {
      const progress = day / 180 // 0 to 1
      // Simulated tumor regression with treatment
      const baseShrinkage = Math.max(0.3, 1.0 - progress * 0.7)
      const aggressiveness = Math.max(20, 80 - progress * 60)
      
      points.push({
        day,
        label: `Day ${day}`,
        tumor_size: 40 * baseShrinkage,
        aggressiveness,
        status:
          day === 0
            ? "Pre-treatment"
            : day <= 30
              ? "Early Response"
              : day <= 90
                ? "Ongoing Response"
                : day <= 180
                  ? "Stabilized"
                  : "Controlled",
        phase: progress < 0.17 ? "week_1-3" : progress < 0.33 ? "month_1" : progress < 0.66 ? "quarter_2-3" : "month_6",
      })
    }
    return points
  }

  const timeline = generateTimeline()
  const currentTimelinePoint = timeline.find((p) => p.day === currentDay) || timeline[0]

  // Auto-play
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setCurrentDay((prev) => {
        const nextIndex = timeline.findIndex((p) => p.day === prev) + 1
        if (nextIndex >= timeline.length) {
          setIsPlaying(false)
          return prev
        }
        return timeline[nextIndex].day
      })
    }, 2000 / speed)

    return () => clearInterval(interval)
  }, [isPlaying, speed, timeline])

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "week_1-3":
        return "#FF6B6B"
      case "month_1":
        return "#FF9F43"
      case "quarter_2-3":
        return "#00FF9C"
      case "month_6":
        return "#00E5FF"
      default:
        return "#8899AA"
    }
  }

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case "week_1-3":
        return "Early Response Phase"
      case "month_1":
        return "Initial Treatment Phase"
      case "quarter_2-3":
        return "Ongoing Response Phase"
      case "month_6":
        return "Long-term Stabilization"
      default:
        return "Unknown Phase"
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
          <h1 className="text-4xl font-bold neon-text">Tumor Evolution Timeline Player</h1>
          <p className="text-[#8899AA] mt-2">Interactive 180-day simulation of tumor response to treatment</p>
        </motion.div>

        {/* Main Timeline View */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
        >
          {/* 3D Visualization Area */}
          <div className="lg:col-span-2">
            <Card className="glass-panel p-8 border-white/10 aspect-video flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl font-bold text-[#00E5FF] mb-4">
                  {currentTimelinePoint.tumor_size.toFixed(1)}mm
                </div>
                <p className="text-[#8899AA] mb-6">Tumor Size at Day {currentDay}</p>
                
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00FF9C]/10 border border-[#00FF9C]">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getPhaseColor(currentTimelinePoint.phase) }}
                  />
                  <span className="text-[#00FF9C] font-semibold">
                    {getPhaseLabel(currentTimelinePoint.phase)}
                  </span>
                </div>

                <p className="text-[#8899AA] text-sm mt-6">
                  3D tumor visualization would render here in real application
                </p>
              </div>
            </Card>
          </div>

          {/* Timeline Info Panel */}
          <div className="space-y-6">
            {/* Current Status */}
            <Card className="glass-panel p-6 border-white/10">
              <h3 className="text-sm uppercase tracking-wider text-[#8899AA] font-semibold mb-4">
                Current Status
              </h3>

              <div className="space-y-4">
                <div>
                  <p className="text-xs text-[#8899AA] mb-2">Day</p>
                  <p className="text-3xl font-bold text-[#00E5FF]">{currentDay}</p>
                </div>

                <div>
                  <p className="text-xs text-[#8899AA] mb-2">Clinical Status</p>
                  <Badge className="bg-[#00FF9C]/20 text-[#00FF9C] border border-[#00FF9C]">
                    {currentTimelinePoint.status}
                  </Badge>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <p className="text-xs text-[#8899AA]">Tumor Size</p>
                    <span className="text-xs font-bold text-[#E8EDF2]">
                      {currentTimelinePoint.tumor_size.toFixed(1)}mm
                    </span>
                  </div>
                  <Progress
                    value={(currentTimelinePoint.tumor_size / 40) * 100}
                    className="h-2"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <p className="text-xs text-[#8899AA]">Aggressiveness</p>
                    <span className="text-xs font-bold text-[#FF6B6B]">
                      {currentTimelinePoint.aggressiveness.toFixed(0)}%
                    </span>
                  </div>
                  <Progress
                    value={currentTimelinePoint.aggressiveness}
                    className="h-2"
                  />
                </div>
              </div>
            </Card>

            {/* Timeline Milestones */}
            <Card className="glass-panel p-6 border-white/10">
              <h3 className="text-sm uppercase tracking-wider text-[#8899AA] font-semibold mb-4">
                Key Milestones
              </h3>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3 pb-3 border-b border-white/10">
                  <span className="text-[#00E5FF] font-bold">Day 0</span>
                  <div>
                    <p className="text-[#E8EDF2]">Treatment Start</p>
                    <p className="text-xs text-[#8899AA]">Baseline tumor size</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pb-3 border-b border-white/10">
                  <span className="text-[#FF9F43] font-bold">Day 30</span>
                  <div>
                    <p className="text-[#E8EDF2]">Early Response</p>
                    <p className="text-xs text-[#8899AA]">Initial tumor shrinkage</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 pb-3 border-b border-white/10">
                  <span className="text-[#00FF9C] font-bold">Day 90</span>
                  <div>
                    <p className="text-[#E8EDF2]">Sustained Response</p>
                    <p className="text-xs text-[#8899AA]">Continued shrinkage</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-[#00E5FF] font-bold">Day 180</span>
                  <div>
                    <p className="text-[#E8EDF2]">Long-term Control</p>
                    <p className="text-xs text-[#8899AA]">Stabilized disease</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Timeline Scrubber */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="glass-panel p-8 border-white/10">
            <div className="space-y-6">
              {/* Timeline Bar with Milestones */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm uppercase tracking-wider text-[#8899AA] font-semibold">
                    Timeline Scrubber
                  </label>
                  <span className="text-sm font-bold text-[#00E5FF]">Day {currentDay}</span>
                </div>

                <div className="relative">
                  <Slider
                    min={0}
                    max={timeline.length - 1}
                    step={1}
                    value={[timeline.findIndex((p) => p.day === currentDay)]}
                    onValueChange={(val) => {
                      setCurrentDay(timeline[val[0]].day)
                      setIsPlaying(false)
                    }}
                    className="w-full"
                  />

                  {/* Milestone markers */}
                  <div className="absolute top-[-20px] left-0 right-0 flex justify-between px-0 pointer-events-none">
                    {timeline.map((point, idx) => (
                      <div
                        key={point.day}
                        className="flex flex-col items-center"
                        style={{ left: `${(idx / (timeline.length - 1)) * 100}%` }}
                      >
                        <div
                          className="w-2 h-2 rounded-full mb-1"
                          style={{
                            backgroundColor:
                              point.day === currentDay ? "#00E5FF" : getPhaseColor(point.phase),
                            opacity: point.day === currentDay ? 1 : 0.6,
                          }}
                        />
                        <span className="text-xs text-[#8899AA] mt-2 text-center whitespace-nowrap">
                          D{point.day}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline labels */}
                <div className="flex justify-between text-xs text-[#8899AA] mt-8 px-1">
                  <span>Day 0 (Start)</span>
                  <span>Day 180 (6 Months)</span>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="border-t border-white/10 pt-6 space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setCurrentDay(timeline[0].day)
                      setIsPlaying(false)
                    }}
                    className="text-[#8899AA] hover:text-[#00E5FF]"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>

                  <Button
                    size="lg"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="h-12 w-12 rounded-full bg-[#00E5FF]/20 hover:bg-[#00E5FF]/30 text-[#00E5FF] border border-[#00E5FF]"
                  >
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const nextIdx = timeline.findIndex((p) => p.day === currentDay) + 1
                      if (nextIdx < timeline.length) {
                        setCurrentDay(timeline[nextIdx].day)
                      }
                      setIsPlaying(false)
                    }}
                    className="text-[#8899AA] hover:text-[#00E5FF]"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>

                {/* Speed Control */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-[#8899AA]">Playback Speed</label>
                    <span className="text-xs font-bold text-[#00E5FF]">{speed.toFixed(1)}x</span>
                  </div>
                  <Slider
                    min={0.5}
                    max={3}
                    step={0.5}
                    value={[speed]}
                    onValueChange={(val) => setSpeed(val[0])}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Detailed Evolution Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Tumor Size Evolution */}
          <Card className="glass-panel p-6 border-white/10">
            <h3 className="text-lg font-semibold text-[#00E5FF] mb-4 flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Tumor Size Evolution
            </h3>

            <div className="space-y-4">
              {timeline.map((point, idx) => (
                <div
                  key={point.day}
                  className={`p-3 rounded-lg transition ${
                    point.day === currentDay
                      ? "bg-[#00E5FF]/20 border border-[#00E5FF]"
                      : "bg-transparent border border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-[#E8EDF2]">{point.label}</span>
                    <span className="text-sm text-[#00E5FF] font-bold">{point.tumor_size.toFixed(1)}mm</span>
                  </div>
                  <Progress value={(point.tumor_size / 40) * 100} className="h-1" />
                </div>
              ))}
            </div>
          </Card>

          {/* Aggressiveness Evolution */}
          <Card className="glass-panel p-6 border-white/10">
            <h3 className="text-lg font-semibold text-[#FF6B6B] mb-4 flex items-center gap-2">
              <Flame className="h-5 w-5" />
              Aggressiveness Evolution
            </h3>

            <div className="space-y-4">
              {timeline.map((point, idx) => (
                <div
                  key={point.day}
                  className={`p-3 rounded-lg transition ${
                    point.day === currentDay
                      ? "bg-[#FF6B6B]/20 border border-[#FF6B6B]"
                      : "bg-transparent border border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-[#E8EDF2]">{point.label}</span>
                    <span className="text-sm text-[#FF6B6B] font-bold">
                      {point.aggressiveness.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={point.aggressiveness} className="h-1" />
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
