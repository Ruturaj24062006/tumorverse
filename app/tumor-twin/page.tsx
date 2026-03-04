"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Scene } from "@/components/digital-twin/Scene"
import { ControlPanel } from "@/components/digital-twin/ControlPanel"
import { MedicineAnalysisPanel } from "@/components/digital-twin/MedicineAnalysisPanel"
import Link from "next/link"
import {
  Activity,
  ArrowLeft,
  Database,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  FlaskConical,
} from "lucide-react"

interface Medicine {
  name: string
  confidence: number
  mechanism?: string
  reason?: string
}

interface SimulationResponse {
  effectiveness: number
  recovery_timeline: Record<string, string>
  effective: boolean
  explanation?: string
  risk_message?: string
}

export default function DigitalTwinPage() {
  const searchParams = useSearchParams()

  const [showGenes, setShowGenes] = useState(true)
  const [rotateEnabled, setRotateEnabled] = useState(true)
  const [zoomLevel, setZoomLevel] = useState(8)
  const [selectedMedicine, setSelectedMedicine] = useState("")
  const [activeMedicine, setActiveMedicine] = useState<string | null>(null)
  const [medicineEffect, setMedicineEffect] = useState<"none" | "effective" | "ineffective">("none")
  const [simulating, setSimulating] = useState(false)
  const [simulationResult, setSimulationResult] = useState<SimulationResponse | null>(null)
  const [resetSceneTrigger, setResetSceneTrigger] = useState(0)
  const [recoveryProgress, setRecoveryProgress] = useState(0)
  const [time, setTime] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prev) => prev + 0.1)
    }, 100)
    return () => clearInterval(interval)
  }, [])

  const cancerType = searchParams.get("cancer") || "Unknown Cancer"
  const aggressiveness = (searchParams.get("aggr") as "low" | "moderate" | "high") || "moderate"
  const confidence = parseFloat(searchParams.get("conf") || "0")
  const imageName = searchParams.get("imageName") || ""

  const tumorIntensity = Math.min(
    1,
    Math.max(
      0.35,
      confidence + (aggressiveness === "high" ? 0.15 : aggressiveness === "moderate" ? 0.08 : 0.02) + (imageName ? 0.07 : 0),
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

    try {
      const res = await fetch("/api/simulate-medicine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tumor_type: cancerType, medicine: selectedMedicine }),
      })

      if (res.ok) {
        const data = (await res.json()) as SimulationResponse
        setSimulationResult(data)
        const effective = data.effective ?? data.effectiveness >= 0.65
        setMedicineEffect(effective ? "effective" : "ineffective")
        setRecoveryProgress(effective ? 25 : 0)
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
    setMedicineEffect("none")
    setActiveMedicine(null)
    setSimulationResult(null)
    setRecoveryProgress(0)
    setTime(0)
    setZoomLevel(8)
    setRotateEnabled(true)
  }

  const aggrColor = (a: string) => {
    if (a === "high") return "#FF3B5C"
    if (a === "moderate") return "#FF9F43"
    return "#00FF9C"
  }

  const recoveryTimeline = simulationResult?.recovery_timeline || {
    "25%": "3 months",
    "50%": "6 months",
    "75%": "10 months",
    "100%": "14 months",
  }

  const effectivenessPct = simulationResult ? Math.round(simulationResult.effectiveness * 100) : 0

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: "#0A1628" }}>
      <Navbar />

      <main className="mx-auto flex-1 w-full max-w-7xl px-6 pb-12 pt-24">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
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
              Upload-driven 3D tumor twin with medicine testing, recovery timeline, and AI-guided treatment suitability.
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
              </Badge>
            </div>
          </div>
        </div>

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
                    {medicineEffect === "effective" ? `${Math.round(recoveryProgress)}%` : "0%"}
                  </span>
                </div>
                <Progress value={medicineEffect === "effective" ? recoveryProgress : Math.min(100, 15 + time)} className="h-2" />
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

        <div className="grid h-[calc(100vh-150px)] min-h-150 gap-6 lg:grid-cols-5 xl:grid-cols-5">
          <div className="flex flex-col gap-4 lg:col-span-3 xl:col-span-3">
            <div className="glass-panel relative flex-1 overflow-hidden rounded-2xl neon-border">
              {activeMedicine && (
                <div className="animate-in fade-in zoom-in-95 absolute left-4 top-4 z-10 rounded-lg border border-[#8A2BE2]/30 glass-panel bg-black/40 p-3 backdrop-blur-md">
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
              />

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

            {simulationResult && (
              <div className="glass-panel rounded-2xl p-4">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#E8EDF2]">Expected Tumor Recovery</h3>
                <div className="space-y-3">
                  {[25, 50, 75].map((value) => (
                    <div key={value}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-[#8899AA]">{value}% improvement</span>
                        <span className="font-semibold text-[#00E5FF]">{recoveryTimeline[`${value}%`]}</span>
                      </div>
                      <Progress value={value} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col overflow-hidden border-l border-white/5 pl-2 lg:col-span-2 lg:pl-6 xl:col-span-2">
            <MedicineAnalysisPanel
              cancerType={cancerType}
              recommended={recommended.length ? recommended : [
                { name: "Gefitinib", confidence: 0.82, mechanism: "EGFR Tyrosine Kinase Inhibitor" },
                { name: "Cisplatin", confidence: 0.76, mechanism: "DNA Cross-linking Agent" },
                { name: "Trastuzumab", confidence: 0.71, mechanism: "HER2 receptor blockade" },
              ]}
              notRecommended={notRecommended.length ? notRecommended : [
                { name: "Paclitaxel", confidence: 0.4, reason: "Resistance markers detected in this profile" },
                { name: "Doxorubicin", confidence: 0.33, reason: "Low predicted compatibility" },
              ]}
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
                  <p className="text-[#8899AA]">Medicine Tested: <span className="font-semibold text-[#E8EDF2]">{activeMedicine}</span></p>
                  <p className="text-[#8899AA]">Effectiveness: <span className="font-semibold text-[#00E5FF]">{effectivenessPct}%</span></p>
                </div>

                <div className="mt-4 space-y-2 border-t border-white/10 pt-3 text-xs">
                  <p className="font-semibold text-[#E8EDF2]">Recovery Prediction:</p>
                  <p className="text-[#8899AA]">25% improvement → <span className="text-[#00E5FF]">{recoveryTimeline["25%"]}</span></p>
                  <p className="text-[#8899AA]">50% improvement → <span className="text-[#00E5FF]">{recoveryTimeline["50%"]}</span></p>
                  <p className="text-[#8899AA]">75% improvement → <span className="text-[#00E5FF]">{recoveryTimeline["75%"]}</span></p>
                  <p className="text-[#8899AA]">100% recovery → <span className="text-[#00E5FF]">{recoveryTimeline["100%"]}</span></p>
                </div>

                {simulationResult.explanation && (
                  <p className="mt-3 rounded-lg bg-[#0A1628]/70 p-2 text-xs text-[#8899AA]">{simulationResult.explanation}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
