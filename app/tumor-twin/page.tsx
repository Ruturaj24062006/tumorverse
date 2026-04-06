"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Scene } from "@/components/digital-twin/Scene"
import { ClinicalTwinView } from "@/components/digital-twin/ClinicalTwinView"
import { ControlPanel } from "@/components/digital-twin/ControlPanel"
import { MedicineAnalysisPanel } from "@/components/digital-twin/MedicineAnalysisPanel"
import Link from "next/link"
import {
  Activity,
  ArrowLeft,
  Database,
  ScanSearch,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  FlaskConical,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RefreshCw,
  Dna,
  Play,
  Pause,
} from "lucide-react"
import { motion } from "framer-motion"
import { ConfidenceVisualizer } from "@/components/ui/confidence-visualizer"
import { MedicineTimeline } from "@/components/ui/medicine-timeline"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { loadLatestDigitalTwin } from "@/lib/digitalTwinModule"
import type { StoredDigitalTwinAnalysis as DigitalTwinAnalysis } from "@/lib/digitalTwinModule"
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts"

const timelineChartConfig = {
  tumorArea: { label: "Tumor Area %", color: "#FF3B5C" },
  recovery: { label: "Recovery %", color: "#00FF9C" },
  riskScore: { label: "Risk Score", color: "#00E5FF" },
}

interface Medicine {
  name: string
  confidence: number
  mechanism?: string
  reason?: string
}

interface SimulationResponse {
  selected_drug?: string
  best_drug?: string
  confidence: number
  effectiveness: number
  recovery: Record<string, string>
  recovery_timeline?: Record<string, string>
  top_3_drugs?: string[]
  effective: boolean
  explanation?: string
  risk_message?: string
}

interface TimelineSimulationResponse {
  effectiveness: number
  frames: string[]
  message: string
  risk_levels: string[]
  recovery_percentages: number[]
  progression_percentages: number[]
  tumor_area_percentages: number[]
  frame_interval_ms: number
}

function parseMonths(value?: string): number {
  if (!value) return 0
  const numeric = Number.parseFloat(value)
  return Number.isFinite(numeric) ? numeric : 0
}

function DigitalTwinContent() {
  const searchParams = useSearchParams()

  const [showGenes, setShowGenes] = useState(true)
  const [rotateEnabled, setRotateEnabled] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(7.4)
  const [selectedMedicine, setSelectedMedicine] = useState("")
  const [activeMedicine, setActiveMedicine] = useState<string | null>(null)
  const [medicineEffect, setMedicineEffect] = useState<"none" | "effective" | "ineffective">("none")
  const [simulating, setSimulating] = useState(false)
  const [simulationResult, setSimulationResult] = useState<SimulationResponse | null>(null)
  const [digitalTwinAnalysis, setDigitalTwinAnalysis] = useState<DigitalTwinAnalysis | null>(null)
  const [resetSceneTrigger, setResetSceneTrigger] = useState(0)
  const [recoveryProgress, setRecoveryProgress] = useState(0)
  const [time, setTime] = useState(0)
  const [twinBuildProgress, setTwinBuildProgress] = useState(0)
  const [twinReplayNonce, setTwinReplayNonce] = useState(0)
  const [viewMode, setViewMode] = useState<"clinical" | "3d">("clinical")
  const [timelineSimulation, setTimelineSimulation] = useState<TimelineSimulationResponse | null>(null)
  const [timelineFrameIndex, setTimelineFrameIndex] = useState(0)
  const [timelinePlaying, setTimelinePlaying] = useState(true)
  const [timelineSpeedMs, setTimelineSpeedMs] = useState(500)

  useEffect(() => {
    if (typeof window === "undefined") return

    let frame = 0
    let startTime = 0
    const duration = 1800

    const animateBuild = (timestamp: number) => {
      if (startTime === 0) startTime = timestamp
      const progress = Math.min(1, (timestamp - startTime) / duration)
      setTwinBuildProgress(progress)
      if (progress < 1) {
        frame = window.requestAnimationFrame(animateBuild)
      }
    }

    setTwinBuildProgress(0)
    frame = window.requestAnimationFrame(animateBuild)

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [twinReplayNonce])

  useEffect(() => {
    if (!simulationResult || medicineEffect === "none") return

    const timeline = simulationResult.recovery || simulationResult.recovery_timeline || {}
    const totalMonths = Math.max(parseMonths(timeline["75%"]), parseMonths(timeline["50%"]), 0.1)
    const simulationDurationMs = Math.max(2500, Math.min(18000, totalMonths * 700))

    let frame = 0
    let startAt = 0

    const animateProgress = (timestamp: number) => {
      if (startAt === 0) startAt = timestamp
      const elapsed = timestamp - startAt
      const ratio = Math.min(1, elapsed / simulationDurationMs)
      setRecoveryProgress(ratio * 75)

      if (ratio < 1) {
        frame = window.requestAnimationFrame(animateProgress)
      }
    }

    setRecoveryProgress(0)
    frame = window.requestAnimationFrame(animateProgress)

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [simulationResult, medicineEffect])

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => prev + 0.1)
    }, 100)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!timelineSimulation?.frames?.length || !timelinePlaying) return

    const ticker = window.setInterval(() => {
      setTimelineFrameIndex((prev) => (prev + 1) % timelineSimulation.frames.length)
    }, Math.max(120, timelineSpeedMs))

    return () => window.clearInterval(ticker)
  }, [timelineSimulation, timelinePlaying, timelineSpeedMs])

  useEffect(() => {
    const currentImageName = searchParams.get("imageName") || ""
    const twinData = loadLatestDigitalTwin(currentImageName)
    if (twinData) {
      setDigitalTwinAnalysis(twinData)
    }
  }, [searchParams])

  const cancerType = searchParams.get("cancer") || "Unknown Cancer"
  const aggressiveness =
    digitalTwinAnalysis?.aggressiveness || ((searchParams.get("aggr") as "low" | "moderate" | "high") || "moderate")
  const confidence = parseFloat(searchParams.get("conf") || "0")
  const imageName = searchParams.get("imageName") || ""
  const predictionMode = searchParams.get("predictionMode") || "gene"

  const tumorIntensity = Math.min(
    1,
    Math.max(
      0.35,
      confidence +
        (digitalTwinAnalysis?.mask_area_ratio || 0) * 1.75 +
        (aggressiveness === "high" ? 0.15 : aggressiveness === "moderate" ? 0.08 : 0.02) +
        (imageName ? 0.07 : 0),
    ),
  )

  let recommended: Medicine[] = []
  let notRecommended: Medicine[] = []
  try {
    recommended = JSON.parse(searchParams.get("medsRecommended") || "[]")
    notRecommended = JSON.parse(searchParams.get("medsNotRecommended") || "[]")
  } catch {
    console.error("Failed to parse medicines from URL")
  }

  const handleSimulateDrug = async () => {
    if (!selectedMedicine.trim()) return

    setSimulating(true)
    setActiveMedicine(selectedMedicine)
    setMedicineEffect("none")
    setSimulationResult(null)
    setRecoveryProgress(0)
    setTimelineSimulation(null)
    setTimelineFrameIndex(0)
    setTimelinePlaying(true)

    try {
      const res = await fetch("/api/simulate-medicine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tumor_type: cancerType,
          medicine: selectedMedicine,
          tumor_size: Math.max(0.1, digitalTwinAnalysis?.mask_coverage_pct || tumorIntensity * 100),
        }),
      })

      if (res.ok) {
        const data = (await res.json()) as SimulationResponse
        setSimulationResult(data)
        const modelScore = Number.isFinite(data.confidence) ? data.confidence : data.effectiveness
        const effective = data.effective ?? modelScore >= 0.55
        setMedicineEffect(effective ? "effective" : "ineffective")
        setRecoveryProgress(0)

        if (digitalTwinAnalysis?.mask_image) {
          try {
            const timelineRes = await fetch("/api/simulate-timeline", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                effectiveness: Math.max(0, Math.min(1, modelScore)),
                steps: 8,
                mask_image: digitalTwinAnalysis.mask_image,
                original_image: digitalTwinAnalysis.source_image || digitalTwinAnalysis.overlay_image,
              }),
            })

            if (timelineRes.ok) {
              const timeline = (await timelineRes.json()) as TimelineSimulationResponse
              setTimelineSimulation(timeline)
              setTimelineFrameIndex(0)
              setTimelinePlaying(true)
              setTimelineSpeedMs(Number(timeline.frame_interval_ms) || 500)
            }
          } catch (timelineError) {
            console.error("Timeline simulation failed:", timelineError)
            setTimelineSimulation(null)
          }
        } else {
          setTimelineSimulation(null)
        }

        if (typeof window !== "undefined") {
          const existing = JSON.parse(localStorage.getItem("predictionHistory") || "[]")
          const historyItem = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            patientId: `P${String(Math.floor(Math.random() * 9000) + 1000)}`,
            cancerType,
            medicineTested: selectedMedicine,
            result: effective ? "effective" : modelScore >= 0.35 ? "moderate" : "ineffective",
            effectiveness: modelScore,
            date: new Date().toISOString(),
            confidence,
          }
          localStorage.setItem("predictionHistory", JSON.stringify([historyItem, ...existing].slice(0, 30)))
        }
      }
    } catch (error) {
      console.error("Simulation failed:", error)
      setActiveMedicine(null)
    } finally {
      setSimulating(false)
    }
  }

  const handleResetView = () => {
    setResetSceneTrigger((prev) => prev + 1)
    setTwinReplayNonce((prev) => prev + 1)
    setMedicineEffect("none")
    setActiveMedicine(null)
    setSimulationResult(null)
    setRecoveryProgress(0)
    setTimelineSimulation(null)
    setTimelineFrameIndex(0)
    setTimelinePlaying(true)
    setTime(0)
    setZoomLevel(7.4)
    setRotateEnabled(true)
  }

  const handleRepeatTwinCreation = () => {
    setResetSceneTrigger((prev) => prev + 1)
    setTwinReplayNonce((prev) => prev + 1)
    setTime(0)
  }

  const aggrColor = (a: string) => {
    if (a === "high") return "#FF3B5C"
    if (a === "moderate") return "#FF9F43"
    return "#00FF9C"
  }

  const recoveryTimeline = simulationResult?.recovery || simulationResult?.recovery_timeline || {}

  const modelEffectiveness = simulationResult
    ? Number.isFinite(simulationResult.confidence)
      ? simulationResult.confidence
      : simulationResult.effectiveness
    : 0
  const effectivenessPct = Math.round(modelEffectiveness * 100)
  const lesionFocus = digitalTwinAnalysis?.bounding_box
    ? {
        x: (digitalTwinAnalysis.bounding_box.x_min + digitalTwinAnalysis.bounding_box.x_max) / 2,
        y: (digitalTwinAnalysis.bounding_box.y_min + digitalTwinAnalysis.bounding_box.y_max) / 2,
      }
    : null
  const activeTimelineFrame = timelineSimulation?.frames?.[timelineFrameIndex] || null
  const timelineChartData = useMemo(() => {
    if (!timelineSimulation) return []

    const toRiskScore = (risk: string) => {
      if (risk === "high") return 100
      if (risk === "moderate") return 60
      return 25
    }

    return timelineSimulation.tumor_area_percentages.map((area, idx) => ({
      step: `T${idx + 1}`,
      tumorArea: Number(area.toFixed(2)),
      recovery: Number((timelineSimulation.recovery_percentages[idx] || 0).toFixed(2)),
      riskScore: toRiskScore(timelineSimulation.risk_levels[idx] || "moderate"),
      riskLabel: timelineSimulation.risk_levels[idx] || "moderate",
    }))
  }, [timelineSimulation])

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "#0A1628" }}>
      <Navbar />

      <main className="mx-auto flex-1 w-full max-w-7xl px-6 pb-12 pt-24">
        <motion.div
          className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-2 -ml-3 text-[#8899AA] hover:text-[#E8EDF2]">
              <Link href="/predict">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Prediction
              </Link>
            </Button>
            <h1 className="flex items-center gap-3 text-3xl font-bold md:text-4xl text-[#E8EDF2]">
              Digital Tumor Twin
              <Badge className="border-0 bg-[#8A2BE2]/20 text-[#8A2BE2] hover:bg-[#8A2BE2]/30 uppercase tracking-widest text-[10px]">
                Simulation
              </Badge>
            </h1>
            <p className="mt-2 max-w-2xl text-[#8899AA]">
              Upload-driven 3D tumor twin with medicine testing, recovery timeline, AI-guided treatment suitability, and image-based segmentation when available.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 text-right">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8899AA] uppercase tracking-wider">Target Profile</span>
              <span className="font-semibold text-[#E8EDF2]">{cancerType}</span>
            </div>
            <div className="flex gap-2">
              <Badge
                className="rounded-md border-0 px-2 py-0.5 text-xs font-semibold capitalize"
                style={{ backgroundColor: `${aggrColor(aggressiveness)}20`, color: aggrColor(aggressiveness) }}
              >
                <Activity className="mr-1 h-3 w-3 inline" /> {aggressiveness} Risk
              </Badge>
              <Badge className="rounded-md border-0 bg-[#00E5FF]/10 px-2 py-0.5 text-xs font-semibold text-[#00E5FF]">
                Prediction Conf. {(confidence * 100).toFixed(0)}%
                          <div className="w-full max-w-xs">
                            <ConfidenceVisualizer confidence={confidence} label="Confidence Level" />
                          </div>
              </Badge>
            </div>
          </div>
        </motion.div>

        {medicineEffect !== "none" && (
          <div className="mb-6 rounded-2xl border border-white/10 glass-panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {medicineEffect === "effective" ? (
                  <TrendingUp className="h-5 w-5 text-[#00FF9C]" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-[#FF3B5C]" />
                )}
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#E8EDF2]">Health Status</h3>
              </div>
              <Badge
                className="border-0 text-xs"
                style={{
                  backgroundColor: medicineEffect === "effective" ? "rgba(0,255,156,0.2)" : "rgba(255,59,92,0.2)",
                  color: medicineEffect === "effective" ? "#00FF9C" : "#FF3B5C",
                }}
              >
                {medicineEffect === "effective" ? "Responding to Treatment" : "Ineffective Treatment"}
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-xs text-[#8899AA]">Tumor Recovery Simulation</span>
                  <span className="text-2xl font-bold" style={{ color: medicineEffect === "effective" ? "#00FF9C" : "#FF3B5C" }}>
                    {`${Math.round(recoveryProgress)}%`}
                  </span>
                </div>
                <Progress value={Math.min(100, recoveryProgress)} className="h-2" />
                <style jsx global>{`
                  [data-slot="progress-indicator"] {
                    background: ${medicineEffect === "effective" ? "#00FF9C" : "#FF3B5C"} !important;
                  }
                `}</style>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#8899AA]">Effectiveness</p>
                <p className="text-lg font-bold text-[#E8EDF2]">{effectivenessPct}%</p>
              </div>
            </div>

            {medicineEffect === "ineffective" && (
              <div className="mt-3 rounded-lg border border-[#FF3B5C]/30 bg-[#FF3B5C]/10 p-3 text-sm text-[#FF3B5C]">
                <p className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="h-4 w-4" /> Medicine Ineffective for this tumor
                </p>
                <p className="mt-1 text-xs text-[#FF3B5C]/90">
                  {simulationResult?.risk_message || "This medicine may worsen the tumor condition. Consider recommended alternatives."}
                </p>
              </div>
            )}
          </div>
        )}

        <motion.div
          className="grid min-h-160 gap-6 lg:h-[calc(100vh-150px)] lg:grid-cols-5 xl:grid-cols-5"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
        >
          <div className="flex flex-col gap-4 lg:col-span-3 xl:col-span-3">
            <div className="glass-panel relative flex-1 overflow-hidden rounded-2xl neon-border">
              <div className="absolute left-4 top-4 z-30 flex gap-2">
                <Button
                  size="sm"
                  variant={viewMode === "clinical" ? "default" : "outline"}
                  onClick={() => setViewMode("clinical")}
                  className={viewMode === "clinical" ? "bg-[#00E5FF] text-[#051425] hover:bg-[#00E5FF]/90" : "border-[#00E5FF]/30 bg-black/40 text-[#00E5FF] hover:bg-[#00E5FF]/15"}
                >
                  Clinical View
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "3d" ? "default" : "outline"}
                  onClick={() => setViewMode("3d")}
                  className={viewMode === "3d" ? "bg-[#00E5FF] text-[#051425] hover:bg-[#00E5FF]/90" : "border-[#00E5FF]/30 bg-black/40 text-[#00E5FF] hover:bg-[#00E5FF]/15"}
                >
                  3D View
                </Button>
              </div>

              {activeMedicine && (
                <div className="animate-in fade-in zoom-in-95 absolute left-4 top-16 z-10 rounded-lg border border-[#8A2BE2]/30 glass-panel bg-black/40 p-3 backdrop-blur-md">
                  <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#8899AA]">
                    <Database className="h-3 w-3 text-[#8A2BE2]" /> Active Simulation
                  </p>
                  <p className="mt-0.5 text-lg font-bold text-[#E8EDF2]">{activeMedicine}</p>
                  {medicineEffect !== "none" && (
                    <Badge
                      className="mt-2 border-0"
                      style={{
                        backgroundColor: medicineEffect === "effective" ? "rgba(0,255,156,0.2)" : "rgba(255,59,92,0.2)",
                        color: medicineEffect === "effective" ? "#00FF9C" : "#FF3B5C",
                      }}
                    >
                      {medicineEffect === "effective" ? "Recovery In Progress" : "Tumor Escalation"}
                    </Badge>
                  )}
                </div>
              )}

              {viewMode === "3d" ? (
                <Scene
                  key={resetSceneTrigger}
                  aggressiveness={aggressiveness}
                  medicineEffect={medicineEffect}
                  showGenes={showGenes}
                  time={time}
                  rotateEnabled={rotateEnabled}
                  zoomLevel={zoomLevel}
                  recoveryProgress={recoveryProgress}
                  tumorIntensity={tumorIntensity}
                  lesionCoverage={digitalTwinAnalysis?.mask_area_ratio}
                  lesionConfidence={digitalTwinAnalysis?.segmentation_confidence}
                  lesionFocus={lesionFocus}
                  buildProgress={twinBuildProgress}
                />
              ) : (
                <ClinicalTwinView
                  aggressiveness={aggressiveness}
                  medicineEffect={medicineEffect}
                  recoveryProgress={recoveryProgress}
                  time={time}
                  tumorIntensity={tumorIntensity}
                  lesionCoverage={digitalTwinAnalysis?.mask_area_ratio}
                  lesionConfidence={digitalTwinAnalysis?.segmentation_confidence}
                  lesionFocus={lesionFocus}
                  sourceImageUrl={digitalTwinAnalysis?.overlay_image}
                  sourceImageName={imageName}
                />
              )}

              {viewMode === "3d" && (
              <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setRotateEnabled((prev) => !prev)}
                  className="h-9 w-9 rounded-full border-[#00E5FF]/30 bg-black/50 text-[#00E5FF] hover:bg-[#00E5FF]/15"
                >
                  <Activity className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setZoomLevel((prev) => Math.max(3, prev - 0.8))}
                  className="h-9 w-9 rounded-full border-[#00E5FF]/30 bg-black/50 text-[#00E5FF] hover:bg-[#00E5FF]/15"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setZoomLevel((prev) => Math.min(10, prev + 0.8))}
                  className="h-9 w-9 rounded-full border-[#00E5FF]/30 bg-black/50 text-[#00E5FF] hover:bg-[#00E5FF]/15"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setShowGenes((prev) => !prev)}
                  className="h-9 w-9 rounded-full border-[#00E5FF]/30 bg-black/50 text-[#00E5FF] hover:bg-[#00E5FF]/15"
                >
                  <Dna className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleSimulateDrug}
                  disabled={!selectedMedicine.trim() || simulating}
                  className="h-9 w-9 rounded-full border-[#8A2BE2]/30 bg-black/50 text-[#8A2BE2] hover:bg-[#8A2BE2]/15 disabled:opacity-50"
                >
                  <FlaskConical className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleRepeatTwinCreation}
                  className="h-9 w-9 rounded-full border-[#00E5FF]/30 bg-black/50 text-[#00E5FF] hover:bg-[#00E5FF]/15"
                  title="Repeat Twin Creation"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleResetView}
                  className="h-9 w-9 rounded-full border-[#8899AA]/30 bg-black/50 text-[#8899AA] hover:bg-[#8899AA]/15"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
              )}

              {viewMode === "3d" && (
              <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[10px] text-[#8899AA]">
                  <span className="h-2 w-2 rounded-full bg-[#00E5FF] shadow-[0_0_5px_#00E5FF]"></span>
                  <span>Gene Markers</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[#8899AA]">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: aggrColor(aggressiveness) }}></span>
                  <span>Tumor Intensity</span>
                </div>
              </div>
              )}
            </div>

            <ControlPanel
              showGenes={showGenes}
              setShowGenes={setShowGenes}
              rotateEnabled={rotateEnabled}
              setRotateEnabled={setRotateEnabled}
              onZoomIn={() => setZoomLevel((prev) => Math.max(3, prev - 0.8))}
              onZoomOut={() => setZoomLevel((prev) => Math.min(10, prev + 0.8))}
              onTestMedicine={handleSimulateDrug}
              canTestMedicine={!!selectedMedicine.trim()}
              isTesting={simulating}
              recoveryProgress={recoveryProgress}
              setRecoveryProgress={setRecoveryProgress}
              onResetView={handleResetView}
            />

            {digitalTwinAnalysis?.available && (
              <div className="glass-panel rounded-2xl p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[#E8EDF2]">
                    <ScanSearch className="h-4 w-4 text-[#00E5FF]" /> Segmentation Metrics
                  </h3>
                  <Badge className="border-0 bg-[#00E5FF]/10 text-[#00E5FF]">
                    {predictionMode === "image" ? "Image-Driven Twin" : "Hybrid Twin"}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-white/10 bg-[#0A1628]/60 p-3">
                    <p className="text-xs uppercase tracking-wider text-[#8899AA]">Tumor Coverage</p>
                    <p className="mt-1 text-xl font-bold text-[#E8EDF2]">{digitalTwinAnalysis.mask_coverage_pct.toFixed(1)}%</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-[#0A1628]/60 p-3">
                    <p className="text-xs uppercase tracking-wider text-[#8899AA]">Segmentation Confidence</p>
                    <p className="mt-1 text-xl font-bold text-[#00E5FF]">
                      {(digitalTwinAnalysis.segmentation_confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-[#0A1628]/60 p-3">
                    <p className="text-xs uppercase tracking-wider text-[#8899AA]">Risk Level</p>
                    <p className="mt-1 text-xl font-bold capitalize" style={{ color: aggrColor(aggressiveness) }}>
                      {aggressiveness}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {simulationResult && (
              <div className="glass-panel rounded-2xl p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#E8EDF2]">Expected Tumor Recovery</h3>
                <div className="space-y-3">
                  {[25, 50, 75].map((value) => (
                    <div key={value}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-[#8899AA]">{value}% improvement</span>
                        <span className="font-semibold text-[#00E5FF]">{recoveryTimeline[`${value}%`] || "--"}</span>
                      </div>
                      <Progress value={Math.min(100, (recoveryProgress / value) * 100)} className="h-2" />
                    </div>
                  ))}
                            {simulationResult && activeMedicine && medicineEffect !== "none" && (
                              <MedicineTimeline
                                timeline={recoveryTimeline}
                                medicineEffect={medicineEffect as "effective" | "ineffective"}
                                activeMedicine={activeMedicine}
                                progress={recoveryProgress}
                              />
                            )}
                </div>
              </div>
            )}

            {timelineSimulation && activeTimelineFrame && (
              <div className="glass-panel rounded-2xl p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-[#E8EDF2]">
                    Tumor Time Simulation
                  </h3>
                  <Badge
                    className="border-0"
                    style={{
                      backgroundColor: timelineSimulation.message.toLowerCase().includes("shrinking")
                        ? "rgba(0,255,156,0.2)"
                        : "rgba(255,59,92,0.2)",
                      color: timelineSimulation.message.toLowerCase().includes("shrinking") ? "#00FF9C" : "#FF3B5C",
                    }}
                  >
                    {timelineSimulation.message}
                  </Badge>
                </div>

                <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0A1628]/70">
                  <img
                    src={activeTimelineFrame}
                    alt="Tumor progression animation frame"
                    className="h-56 w-full object-cover md:h-72"
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setTimelinePlaying((prev) => !prev)}
                    className="bg-[#00E5FF] text-[#051425] hover:bg-[#00E5FF]/90"
                  >
                    {timelinePlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                    {timelinePlaying ? "Pause" : "Play"}
                  </Button>

                  <select
                    value={timelineSpeedMs}
                    onChange={(event) => setTimelineSpeedMs(Number(event.target.value))}
                    className="rounded-md border border-white/20 bg-[#0A1628] px-2 py-1 text-sm text-[#E8EDF2]"
                  >
                    <option value={800}>0.6x Speed</option>
                    <option value={500}>1x Speed</option>
                    <option value={320}>1.6x Speed</option>
                    <option value={220}>2.2x Speed</option>
                  </select>

                  <span className="text-xs text-[#8899AA]">
                    Frame {timelineFrameIndex + 1}/{timelineSimulation.frames.length}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                  {timelineSimulation.tumor_area_percentages.map((area, idx) => {
                    const isShrinking = timelineSimulation.message.toLowerCase().includes("shrinking")
                    const risk = timelineSimulation.risk_levels[idx] || "moderate"
                    const recovery = timelineSimulation.recovery_percentages[idx] || 0
                    const progression = timelineSimulation.progression_percentages?.[idx] || 0
                    return (
                      <div key={`timeline-step-${idx}`} className="rounded-lg border border-white/10 bg-[#0A1628]/60 p-2">
                        <p className="text-[10px] uppercase tracking-wider text-[#8899AA]">T{idx + 1}</p>
                        <p className="text-xs text-[#E8EDF2]">Area {area.toFixed(1)}%</p>
                        <p className="text-xs capitalize text-[#00E5FF]">Risk {risk}</p>
                        {isShrinking ? (
                          <p className="text-xs text-[#00FF9C]">Recovery {recovery.toFixed(1)}%</p>
                        ) : (
                          <p className="text-xs text-[#FF9F43]">Growth +{progression.toFixed(1)}%</p>
                        )}
                      </div>
                    )
                  })}
                </div>

                {timelineChartData.length > 1 && (
                  <div className="mt-4 rounded-xl border border-white/10 bg-[#0A1628]/60 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8899AA]">
                      Tumor Response Timeline
                    </p>
                    <ChartContainer config={timelineChartConfig} className="h-56 w-full">
                      <LineChart data={timelineChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" />
                        <XAxis dataKey="step" tick={{ fill: "#8899AA", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fill: "#8899AA", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <ChartTooltip
                          cursor={{ stroke: "rgba(255,255,255,0.25)", strokeWidth: 1 }}
                          content={
                            <ChartTooltipContent
                              formatter={(value, name, item) => {
                                if (name === "riskScore") {
                                  return (
                                    <>
                                      <span className="text-muted-foreground">Risk Level</span>
                                      <span className="text-foreground font-mono font-medium tabular-nums">
                                        {String(item?.payload?.riskLabel || "moderate")}
                                      </span>
                                    </>
                                  )
                                }
                                return (
                                  <>
                                    <span className="text-muted-foreground">{String(name)}</span>
                                    <span className="text-foreground font-mono font-medium tabular-nums">
                                      {Number(value).toFixed(1)}%
                                    </span>
                                  </>
                                )
                              }}
                            />
                          }
                        />
                        <ReferenceLine
                          x={timelineChartData[Math.min(timelineFrameIndex, timelineChartData.length - 1)]?.step}
                          stroke="rgba(0,229,255,0.5)"
                          strokeDasharray="4 4"
                        />
                        <Line type="monotone" dataKey="tumorArea" stroke="var(--color-tumorArea)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="recovery" stroke="var(--color-recovery)" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="riskScore" stroke="var(--color-riskScore)" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ChartContainer>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col overflow-hidden border-l border-white/5 pl-2 lg:col-span-2 lg:pl-6 xl:col-span-2">
            <MedicineAnalysisPanel
              cancerType={cancerType}
              recommended={recommended}
              notRecommended={notRecommended}
              selectedMedicine={selectedMedicine}
              onMedicineChange={setSelectedMedicine}
              onTestMedicine={handleSimulateDrug}
              isTesting={simulating}
            />

            {simulationResult && activeMedicine && (
              <div className="mt-4 rounded-2xl border border-white/10 glass-panel p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[#E8EDF2]">
                  <FlaskConical className="h-4 w-4 text-[#00E5FF]" /> Tumor Analysis Result
                </h3>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="text-[#8899AA]">Cancer Type: <span className="font-semibold text-[#E8EDF2]">{cancerType}</span></p>
                  <p className="text-[#8899AA]">Medicine Tested: <span className="font-semibold text-[#E8EDF2]">{simulationResult.selected_drug || activeMedicine}</span></p>
                  <p className="text-[#8899AA]">Best Drug Predicted: <span className="font-semibold text-[#E8EDF2]">{simulationResult.best_drug || "N/A"}</span></p>
                  <p className="text-[#8899AA]">Effectiveness: <span className="font-semibold text-[#00E5FF]">{effectivenessPct}%</span></p>
                </div>

                <div className="mt-4 space-y-2 border-t border-white/10 pt-3 text-xs">
                  <p className="font-semibold text-[#E8EDF2]">Recovery Prediction:</p>
                  <p className="text-[#8899AA]">25% improvement → <span className="text-[#00E5FF]">{recoveryTimeline["25%"] || "--"}</span></p>
                  <p className="text-[#8899AA]">50% improvement → <span className="text-[#00E5FF]">{recoveryTimeline["50%"] || "--"}</span></p>
                  <p className="text-[#8899AA]">75% improvement → <span className="text-[#00E5FF]">{recoveryTimeline["75%"] || "--"}</span></p>
                </div>

                {simulationResult.explanation && (
                  <p className="mt-3 rounded-lg bg-[#0A1628]/70 p-2 text-xs text-[#8899AA]">{simulationResult.explanation}</p>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  )
}

export default function DigitalTwinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ backgroundColor: "#0A1628" }} />}>
      <DigitalTwinContent />
    </Suspense>
  )
}
