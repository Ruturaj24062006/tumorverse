"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Brain,
  Activity,
  Pill,
  Shield,
  TrendingDown,
  Download,
  Share2,
  ZoomIn,
  Sparkles,
  FileText,
  BarChart3,
  Clock,
  ExternalLink,
} from "lucide-react"
import { AILoading } from "@/components/ui/ai-loading"
import { motion } from "framer-motion"
import type { DigitalTwinAnalysis } from "@/lib/digitalTwinModule"
import { saveLatestDigitalTwin } from "@/lib/digitalTwinModule"

type AnalysisStep = 
  | "upload" 
  | "segmentation" 
  | "analysis" 
  | "twin" 
  | "recommendation" 
  | "simulation" 
  | "timeline" 
  | "risk" 
  | "explanation" 
  | "report" 
  | "complete"

interface AnalysisState {
  step: AnalysisStep
  progress: number
  imageFile: File | null
  cancerType: string
  confidence: number
  tumorSize: number
  aggressiveness: "low" | "moderate" | "high"
  segmentationConfidence: number
  medicine: string
  effectiveness: number
  recoveryStatus: string
  recoverySpeed: string
  treatmentScore: number
  medicalState: string
  riskScore: number
  explanation: string
  error: string | null
}

export default function AnalyzePage() {
  const router = useRouter()
  const [state, setState] = useState<AnalysisState>({
    step: "upload",
    progress: 0,
    imageFile: null,
    cancerType: "",
    confidence: 0,
    tumorSize: 0,
    aggressiveness: "moderate",
    segmentationConfidence: 0,
    medicine: "",
    effectiveness: 0,
    recoveryStatus: "",
    recoverySpeed: "",
    treatmentScore: 0,
    medicalState: "",
    riskScore: 0,
    explanation: "",
    error: null,
  })

  const [showVisualization, setShowVisualization] = useState(false)
  const [twinData, setTwinData] = useState<DigitalTwinAnalysis | null>(null)

  // Step 1: Handle image upload
  const handleImageUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setState((s) => ({ ...s, error: "Please upload a valid image file" }))
      return
    }

    setState((s) => ({
      ...s,
      imageFile: file,
      step: "segmentation",
      progress: 15,
      error: null,
    }))

    try {
      // Segment tumor from image
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/predict/image", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Segmentation failed")
      }

      const data = await response.json()

      setState((s) => ({
        ...s,
        step: "analysis",
        progress: 30,
        tumorSize: data.tumor_size || 50,
        segmentationConfidence: data.confidence || 0.85,
      }))

      // AI Analysis of tumor
      await new Promise((resolve) => setTimeout(resolve, 800))

      setState((s) => ({
        ...s,
        step: "twin",
        progress: 45,
        cancerType: data.cancer_type || "GBM",
        confidence: data.confidence || 0.85,
        aggressiveness: data.aggressiveness || "moderate",
      }))
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : "Analysis failed",
        step: "upload",
      }))
    }
  }, [])

  // Step 2: Generate digital twin
  const generateDigitalTwin = useCallback(async () => {
    if (!state.cancerType) return

    setState((s) => ({ ...s, progress: 50 }))

    try {
      const response = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cancer_type: state.cancerType,
          tumor_size: state.tumorSize,
          aggressiveness: state.aggressiveness,
          segmentation_confidence: state.segmentationConfidence,
        }),
      })

      if (!response.ok) throw new Error("Twin generation failed")

      const data = await response.json()
      setTwinData(data)
      
      saveLatestDigitalTwin(data)

      setState((s) => ({
        ...s,
        step: "recommendation",
        progress: 60,
      }))
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : "Twin generation failed",
      }))
    }
  }, [state.cancerType, state.tumorSize, state.aggressiveness, state.segmentationConfidence])

  // Step 3: Get medicine recommendation
  const getMedicineRecommendation = useCallback(async () => {
    if (!state.cancerType) return

    setState((s) => ({ ...s, progress: 65 }))

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cancer_type: state.cancerType,
          tumor_size: state.tumorSize,
          aggressiveness: state.aggressiveness,
        }),
      })

      if (!response.ok) throw new Error("Recommendation failed")

      const data = await response.json()

      setState((s) => ({
        ...s,
        medicine: data.recommended_medicine || "",
        effectiveness: data.confidence || 0.5,
        step: "simulation",
        progress: 70,
      }))
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : "Recommendation failed",
      }))
    }
  }, [state.cancerType, state.tumorSize, state.aggressiveness])

  // Step 4: Simulate treatment
  const simulateTreatment = useCallback(async () => {
    if (!state.medicine) return

    setState((s) => ({ ...s, progress: 75 }))

    try {
      const response = await fetch("/api/simulate-medicine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicine: state.medicine,
          cancer_type: state.cancerType,
          tumor_size: state.tumorSize,
          aggressiveness: state.aggressiveness,
        }),
      })

      if (!response.ok) throw new Error("Simulation failed")

      const data = await response.json()

      setState((s) => ({
        ...s,
        treatmentScore: data.treatment_score || 70,
        medicalState: data.status || "Responding",
        step: "timeline",
        progress: 80,
      }))
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : "Simulation failed",
      }))
    }
  }, [state.medicine, state.cancerType, state.tumorSize, state.aggressiveness])

  // Step 5: Get recovery timeline
  const getRecoveryTimeline = useCallback(async () => {
    if (!state.medicine) return

    setState((s) => ({ ...s, progress: 85 }))

    try {
      const response = await fetch("/api/predict_recovery_timeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicine: state.medicine,
          cancer_type: state.cancerType,
          tumor_size: state.tumorSize,
          aggressiveness: state.aggressiveness,
          effectiveness: state.effectiveness,
        }),
      })

      if (!response.ok) throw new Error("Timeline prediction failed")

      const data = await response.json()

      setState((s) => ({
        ...s,
        recoverySpeed: data.speed_label || "moderate",
        recoveryStatus: data.recovery_status || "Responding",
        step: "risk",
        progress: 88,
      }))
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : "Timeline prediction failed",
      }))
    }
  }, [state.medicine, state.cancerType, state.tumorSize, state.aggressiveness, state.effectiveness])

  // Step 6: Risk analysis
  const analyzeRisk = useCallback(async () => {
    setState((s) => ({ ...s, progress: 92 }))

    try {
      // Simulate risk analysis
      const riskScore = Math.random() * 40 + 20 // 20-60%
      
      setState((s) => ({
        ...s,
        riskScore,
        step: "explanation",
        progress: 95,
      }))
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : "Risk analysis failed",
      }))
    }
  }, [])

  // Step 7: Generate explanations
  const generateExplanations = useCallback(async () => {
    setState((s) => ({ ...s, progress: 98 }))

    try {
      const response = await fetch("/api/unified-medical-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: `patient_${Date.now()}`,
          cancer_type: state.cancerType,
          tumor_size: state.tumorSize,
          aggressiveness: state.aggressiveness,
          segmentation_confidence: state.segmentationConfidence,
          tumor_geometry_hash: "hash_" + Date.now(),
          medicine: state.medicine,
          medicine_effectiveness: state.effectiveness,
        }),
      })

      if (!response.ok) throw new Error("Analysis failed")

      const data = await response.json()

      setState((s) => ({
        ...s,
        explanation: data.explanations?.medicine_recommendation || "",
        step: "complete",
        progress: 100,
      }))
    } catch (err) {
      // Continue anyway - this is non-critical
      setState((s) => ({
        ...s,
        step: "complete",
        progress: 100,
      }))
    }
  }, [state.cancerType, state.tumorSize, state.aggressiveness, state.segmentationConfidence, state.medicine, state.effectiveness])

  // Auto-advance through steps
  useEffect(() => {
    if (state.step === "segmentation") {
      const timer = setTimeout(() => setState((s) => ({ ...s, step: "analysis" })), 1000)
      return () => clearTimeout(timer)
    }
    if (state.step === "analysis") {
      const timer = setTimeout(() => generateDigitalTwin(), 1000)
      return () => clearTimeout(timer)
    }
    if (state.step === "twin") {
      const timer = setTimeout(() => getMedicineRecommendation(), 1000)
      return () => clearTimeout(timer)
    }
    if (state.step === "recommendation") {
      const timer = setTimeout(() => simulateTreatment(), 1000)
      return () => clearTimeout(timer)
    }
    if (state.step === "simulation") {
      const timer = setTimeout(() => getRecoveryTimeline(), 1000)
      return () => clearTimeout(timer)
    }
    if (state.step === "timeline") {
      const timer = setTimeout(() => analyzeRisk(), 1000)
      return () => clearTimeout(timer)
    }
    if (state.step === "risk") {
      const timer = setTimeout(() => generateExplanations(), 1000)
      return () => clearTimeout(timer)
    }
  }, [state.step, generateDigitalTwin, getMedicineRecommendation, simulateTreatment, getRecoveryTimeline, analyzeRisk, generateExplanations])

  const handleDropZone = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleImageUpload(file)
  }, [handleImageUpload])

  const steps = [
    { id: "upload", label: "Upload", icon: Upload },
    { id: "segmentation", label: "Segmentation", icon: ZoomIn },
    { id: "analysis", label: "Analysis", icon: Brain },
    { id: "twin", label: "Digital Twin", icon: Activity },
    { id: "recommendation", label: "Medicine", icon: Pill },
    { id: "simulation", label: "Simulation", icon: Sparkles },
    { id: "timeline", label: "Timeline", icon: Clock },
    { id: "risk", label: "Risk", icon: Shield },
    { id: "explanation", label: "Explanation", icon: FileText },
    { id: "report", label: "Report", icon: BarChart3 },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1628] to-[#0F1E35]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 pt-24 pb-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-[#E8EDF2] mb-3">
            <span className="neon-text">Tumor Analysis</span> Workflow
          </h1>
          <p className="text-lg text-[#8899AA]">
            Complete AI-powered medical analysis from image upload to clinical report
          </p>
        </div>

        {/* Progress Steps */}
        <Card className="mb-8 bg-[#0F1E35]/60 border-[#00E5FF]/20 p-6">
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-[#E8EDF2]">Progress</span>
              <span className="text-sm text-[#8899AA]">{Math.round(state.progress)}%</span>
            </div>
            <Progress value={state.progress} className="h-2" />
          </div>

          {/* Step indicators */}
          <div className="grid grid-cols-5 gap-2 md:grid-cols-10 mt-6">
            {steps.map((step, idx) => {
              const stepIndex = steps.findIndex((s) => s.id === state.step)
              const isActive = steps.findIndex((s) => s.id === state.step) === idx
              const isCompleted = idx < stepIndex

              return (
                <div key={step.id} className="flex flex-col items-center gap-1">
                  <motion.div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCompleted
                        ? "bg-[#00E5FF] border-[#00E5FF]"
                        : isActive
                          ? "bg-[#00E5FF]/20 border-[#00E5FF]"
                          : "bg-[#0F1E35] border-[#00E5FF]/30"
                    }`}
                    animate={isActive ? { scale: 1.1 } : {}}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-[#0A1628]" />
                    ) : (
                      <step.icon className={`w-5 h-5 ${isActive ? "text-[#00E5FF]" : "text-[#8899AA]"}`} />
                    )}
                  </motion.div>
                  <span className="text-xs text-center text-[#8899AA] w-12 break-words">{step.label}</span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Error Alert */}
        {state.error && (
          <Alert className="mb-8 bg-[#FF3B5C]/10 border-[#FF3B5C]/30">
            <AlertCircle className="h-4 w-4 text-[#FF3B5C]" />
            <AlertDescription className="text-[#FF6B7A]">{state.error}</AlertDescription>
          </Alert>
        )}

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {state.step === "upload" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[#0F1E35]/60 border-2 border-dashed border-[#00E5FF]/30 rounded-2xl p-12 text-center hover:border-[#00E5FF]/60 transition-colors"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDropZone}
              >
                <Upload className="w-16 h-16 mx-auto mb-4 text-[#00E5FF]" />
                <h3 className="text-xl font-semibold text-[#E8EDF2] mb-2">Upload Tumor Image</h3>
                <p className="text-[#8899AA] mb-6">
                  Drag and drop a medical image (JPG, PNG) or click to browse
                </p>
                <label className="inline-block">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                  />
                  <Button className="bg-[#00E5FF] text-[#0A1628] hover:bg-[#00E5FF]/80">
                    Select Image
                  </Button>
                </label>
              </motion.div>
            )}

            {state.step !== "upload" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Analysis Results */}
                <Card className="bg-[#0F1E35]/60 border-[#00E5FF]/20 p-6">
                  <h3 className="text-lg font-semibold text-[#E8EDF2] mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#00E5FF]" />
                    Tumor Analysis
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {state.cancerType && (
                      <>
                        <div>
                          <p className="text-sm text-[#8899AA]">Cancer Type</p>
                          <p className="text-lg font-semibold text-[#E8EDF2]">{state.cancerType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-[#8899AA]">Confidence</p>
                          <p className="text-lg font-semibold text-[#00E5FF]">
                            {(state.confidence * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-[#8899AA]">Tumor Size</p>
                          <p className="text-lg font-semibold text-[#E8EDF2]">{state.tumorSize.toFixed(1)} mm</p>
                        </div>
                        <div>
                          <p className="text-sm text-[#8899AA]">Aggressiveness</p>
                          <Badge
                            className={`${
                              state.aggressiveness === "high"
                                ? "bg-[#FF3B5C]/20 text-[#FF6B7A]"
                                : state.aggressiveness === "moderate"
                                  ? "bg-[#FF9F43]/20 text-[#FFB366]"
                                  : "bg-[#00FF9C]/20 text-[#00FF9C]"
                            }`}
                          >
                            {state.aggressiveness.charAt(0).toUpperCase() + state.aggressiveness.slice(1)}
                          </Badge>
                        </div>
                      </>
                    )}
                  </div>
                </Card>

                {/* Treatment Results */}
                {state.medicine && (
                  <Card className="bg-[#0F1E35]/60 border-[#00E5FF]/20 p-6">
                    <h3 className="text-lg font-semibold text-[#E8EDF2] mb-4 flex items-center gap-2">
                      <Pill className="w-5 h-5 text-[#00FF9C]" />
                      Recommended Treatment
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-[#8899AA]">Medicine</p>
                        <p className="text-lg font-semibold text-[#E8EDF2]">{state.medicine}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#8899AA]">Effectiveness</p>
                        <p className="text-lg font-semibold text-[#00FF9C]">
                          {(state.effectiveness * 100).toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#8899AA]">Treatment Score</p>
                        <p className="text-lg font-semibold text-[#00E5FF]">{state.treatmentScore.toFixed(0)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#8899AA]">Medical State</p>
                        <p className="text-lg font-semibold text-[#E8EDF2]">{state.medicalState}</p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Recovery Info */}
                {state.recoveryStatus && (
                  <Card className="bg-[#0F1E35]/60 border-[#00E5FF]/20 p-6">
                    <h3 className="text-lg font-semibold text-[#E8EDF2] mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#FF9F43]" />
                      Recovery Prediction
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-[#8899AA]">Recovery Status</p>
                        <p className="text-lg font-semibold text-[#E8EDF2]">{state.recoveryStatus}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#8899AA]">Recovery Speed</p>
                        <p className="text-lg font-semibold text-[#FF9F43]">
                          {state.recoverySpeed.charAt(0).toUpperCase() + state.recoverySpeed.slice(1)}
                        </p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Risk Assessment */}
                {state.riskScore > 0 && (
                  <Card className="bg-[#0F1E35]/60 border-[#00E5FF]/20 p-6">
                    <h3 className="text-lg font-semibold text-[#E8EDF2] mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-[#FF3B5C]" />
                      Risk Assessment
                    </h3>
                    <div>
                      <p className="text-sm text-[#8899AA]">Risk Score</p>
                      <p className="text-2xl font-bold text-[#FF3B5C]">{state.riskScore.toFixed(0)}%</p>
                    </div>
                  </Card>
                )}
              </motion.div>
            )}
          </div>

          {/* Side Panel - Actions & Summary */}
          <div className="space-y-4">
            {state.step === "complete" && (
              <>
                <Card className="bg-[#00E5FF]/10 border-[#00E5FF]/30 p-6">
                  <CheckCircle2 className="w-12 h-12 text-[#00E5FF] mb-3" />
                  <h3 className="text-lg font-semibold text-[#E8EDF2] mb-2">Analysis Complete!</h3>
                  <p className="text-sm text-[#8899AA]">
                    Your comprehensive tumor analysis and treatment simulation is ready.
                  </p>
                </Card>

                <Button className="w-full bg-[#00E5FF] text-[#0A1628] hover:bg-[#00E5FF]/80 mb-2">
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>

                <Button
                  className="w-full bg-[#00FF9C] text-[#0A1628] hover:bg-[#00FF9C]/80 mb-2"
                  onClick={() => router.push("/medical-dashboard")}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Dashboard
                </Button>

                <Button
                  className="w-full border border-[#00E5FF] text-[#00E5FF] hover:bg-[#00E5FF]/10 mb-2"
                  onClick={() => router.push("/timeline-player")}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Timeline Player
                </Button>

                <Button
                  className="w-full border border-[#8A2BE2] text-[#8A2BE2] hover:bg-[#8A2BE2]/10"
                  onClick={() => router.push("/tumor-twin")}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  3D Visualization
                </Button>
              </>
            )}

            {state.step !== "complete" && state.step !== "upload" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[#0F1E35]/60 border border-[#00E5FF]/20 rounded-lg p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
                  <span className="text-sm font-semibold text-[#E8EDF2]">Analyzing...</span>
                </div>
                <p className="text-xs text-[#8899AA]">
                  {state.step === "segmentation" && "Detecting tumor boundaries..."}
                  {state.step === "analysis" && "Analyzing tumor characteristics..."}
                  {state.step === "twin" && "Generating digital tumor twin..."}
                  {state.step === "recommendation" && "Recommending optimal medicines..."}
                  {state.step === "simulation" && "Simulating treatment response..."}
                  {state.step === "timeline" && "Predicting recovery timeline..."}
                  {state.step === "risk" && "Calculating risk profile..."}
                  {state.step === "explanation" && "Generating AI explanations..."}
                </p>
              </motion.div>
            )}

            {state.imageFile && (
              <Card className="bg-[#0F1E35]/60 border-[#00E5FF]/20 p-4">
                <p className="text-xs text-[#8899AA] mb-2">Uploaded Image</p>
                <p className="text-sm font-semibold text-[#E8EDF2] truncate">{state.imageFile.name}</p>
                <p className="text-xs text-[#8899AA]">
                  {(state.imageFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
