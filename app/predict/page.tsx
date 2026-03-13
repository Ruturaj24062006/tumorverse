"use client"

import { useState, useCallback, useRef } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import {
  Upload,
  FileText,
  FlaskConical,
  Dna,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Activity,
  Pill,
  X,
  Image as ImageIcon
} from "lucide-react"
import { AILoading } from "@/components/ui/ai-loading"
import { ErrorPanel } from "@/components/ui/error-panel"
import { ConfidenceVisualizer } from "@/components/ui/confidence-visualizer"
import { GeneVisualizer } from "@/components/ui/gene-visualizer"
import { motion } from "framer-motion"

interface GeneImportance {
  gene: string
  importance: number
}

interface MedicineRec {
  name: string
  confidence: number
  mechanism?: string
  reason?: string
}

interface PredictionResult {
  cancer_type: string
  confidence: number
  aggressiveness: "low" | "moderate" | "high"
  prediction_mode: "gene" | "image"
  tumor_detected?: boolean
  tumor_type?: string
  top_genes: GeneImportance[]
  medicines: {
    recommended: MedicineRec[]
    notRecommended: MedicineRec[]
  }
  sample_count: number
  model_version: string
}

export default function PredictionPage() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
  const [file, setFile] = useState<File | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null)
  const [dismissedError, setDismissedError] = useState(false)
  const [error, setError] = useState<{ title: string; message: string; type: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const predictionSteps = [
    "Uploading tumor data",
    "Analyzing gene expression",
    "Running AI model",
    "Generating digital tumor twin",
    "Preparing medicine recommendations"
  ]

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      if (droppedFile.type.startsWith("image/") || droppedFile.name.endsWith(".dicom")) {
        setImageFile(droppedFile)
      } else {
        setFile(droppedFile)
      }
      setError(null)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isImage: boolean = false) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (isImage) setImageFile(selectedFile)
      else setFile(selectedFile)
      setError(null)
    }
  }

  const predict = async (useDemo: boolean) => {
    setLoading(true)
    setError(null)
    setPredictionResult(null)
    setDismissedError(false)

    console.log("🚀 Starting prediction...", { useDemo, hasFile: !!file, hasImage: !!imageFile })

    try {
      let res: Response
      
      if (useDemo) {
        console.log("🎯 Demo mode: Sending demo request to backend")
        
        // Show loading animation
        const steps = [...predictionSteps]
        for (let i = 0; i < steps.length; i++) {
          setLoadingStep(i)
          await new Promise(resolve => setTimeout(resolve, 800))
        }
        
        // Send FormData with demo=true
        const formData = new FormData()
        formData.append("demo", "true")
        
        console.log(`📤 Sending request to ${backendUrl}/predict`)
        res = await fetch(`${backendUrl}/predict`, {
          method: "POST",
          body: formData,
        })
        
      } else if (imageFile && !file) {
        console.log("🖼️ Image-only upload mode", {
          imageName: imageFile.name,
          imageSize: imageFile.size,
          imageType: imageFile.type,
        })

        const formData = new FormData()
        formData.append("file", imageFile)

        console.log(`📤 Sending image request to ${backendUrl}/predict-image`)
        res = await fetch(`${backendUrl}/predict-image`, {
          method: "POST",
          body: formData,
        })
      } else if (file || imageFile) {
        console.log("📁 File upload mode:", { 
          fileName: file?.name, 
          fileSize: file?.size,
          imageName: imageFile?.name,
          imageSize: imageFile?.size
        })
        
        // Check file size
        const totalSize = (file?.size || 0) + (imageFile?.size || 0)
        if (totalSize > 100 * 1024 * 1024) {
          console.error("❌ File too large:", totalSize, "bytes")
          setError({
            title: "File Too Large",
            message: "Total file size exceeds 100MB. Please upload smaller files.",
            type: "file_too_large"
          })
          setLoading(false)
          return
        }
        
        // Show loading animation
        const steps = [...predictionSteps]
        for (let i = 0; i < steps.length; i++) {
          setLoadingStep(i)
          await new Promise(resolve => setTimeout(resolve, 800))
        }
        
        // Send FormData with file and image
        const formData = new FormData()
        if (file) {
          formData.append("file", file)
          console.log("📎 Added gene data file:", file.name)
        }
        if (imageFile) {
          formData.append("image", imageFile)
          console.log("📎 Added tumor image:", imageFile.name)
        }
        
        console.log(`📤 Sending file upload request to ${backendUrl}/predict`)
        res = await fetch(`${backendUrl}/predict`, { 
          method: "POST", 
          body: formData 
        })
        
      } else {
        console.error("❌ No data provided")
        setError({
          title: "Missing Data",
          message: "Please upload gene data or a tumor image, or use demo mode.",
          type: "invalid_file"
        })
        setLoading(false)
        return
      }
      
      console.log("📥 Response status:", res.status, res.statusText)
      
      // Handle response errors
      if (!res.ok) {
        const errorText = await res.text()
        console.error("❌ Server error:", res.status, errorText)
        
        // Try to parse error details
        let errorDetail = errorText
        try {
          const errorJson = JSON.parse(errorText)
          errorDetail = errorJson.detail || errorText
        } catch (e) {
          // errorText is not JSON, use as-is
        }
        
        if (res.status === 503) {
          throw { 
            title: "Server Offline", 
            message: "The AI model server is temporarily offline. Please try again later.", 
            type: "server_offline" 
          }
        } else if (res.status === 400) {
          throw { 
            title: "Invalid Input", 
            message: `Bad request: ${errorDetail}`, 
            type: "invalid_input" 
          }
        } else {
          throw { 
            title: "Prediction Failed", 
            message: `Server error (${res.status}): ${errorDetail}`, 
            type: "prediction_failed" 
          }
        }
      }
      
      // Parse successful response
      const data = await res.json()
      console.log("✅ Prediction successful:", data)
      
      const mappedAggressiveness = (data.tumor_aggressiveness || data.aggressiveness || "").toString().toLowerCase()
      const normalizedAggressiveness: "low" | "moderate" | "high" =
        mappedAggressiveness === "high" || mappedAggressiveness === "moderate" || mappedAggressiveness === "low"
          ? mappedAggressiveness
          : (data.confidence > 0.8 ? "high" : data.confidence > 0.5 ? "moderate" : "low")

      const isImageResult = typeof data.tumor_detected === "boolean" || typeof data.tumor_type === "string"

      const transformedResult: PredictionResult = isImageResult
        ? {
            cancer_type: data.tumor_type || "Unknown",
            confidence: data.confidence || 0,
            // Image model predicts presence/type, not clinical aggressiveness.
            aggressiveness: data.tumor_detected ? "moderate" : "low",
            prediction_mode: "image",
            tumor_detected: !!data.tumor_detected,
            tumor_type: data.tumor_type || "unknown",
            top_genes: [],
            medicines: { recommended: [], notRecommended: [] },
            sample_count: 1,
            model_version: data.model_version || "Tumor CNN"
          }
        : {
            cancer_type: data.cancer_type || data.predicted_cancer || "Unknown",
            confidence: data.confidence || 0,
            aggressiveness: normalizedAggressiveness,
            prediction_mode: "gene",
            top_genes: data.important_genes || data.top_genes || [],
            medicines: data.medicines || { recommended: [], notRecommended: [] },
            sample_count: data.sample_count || 1,
            model_version: data.model_version || "1.0.0"
          }
      
      console.log("📊 Transformed result:", transformedResult)
      setPredictionResult(transformedResult)
      
    } catch (err: any) {
      console.error("❌ Prediction error:", err)
      
      // Handle network errors
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        setError({
          title: "Connection Failed",
          message: `Cannot connect to backend server at ${backendUrl}. Make sure the FastAPI server is running.`,
          type: "network_error"
        })
      } else if (err.type) {
        // Custom error with type
        setError(err)
      } else {
        // Unexpected error
        setError({
          title: "Prediction Failed",
          message: err.message || "An unexpected error occurred. Please try again.",
          type: "prediction_failed"
        })
      }
    } finally {
      setLoading(false)
      console.log("🏁 Prediction complete")
    }
  }

  const aggrColor = (a: string) => {
    if (a === "high") return "#FF3B5C"
    if (a === "moderate") return "#FF9F43"
    return "#00FF9C"
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A1628" }}>
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-24">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold md:text-4xl" style={{ color: "#E8EDF2" }}>
            AI Cancer Prediction
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-pretty leading-relaxed" style={{ color: "#8899AA" }}>
            Upload gene expression data or a tumor image to predict cancer type, view gene importance, and analyze medicine compatibility.
          </p>
        </div>

        {/* Upload Area */}
        {!predictionResult && (
          <motion.div
            className="mx-auto max-w-4xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="grid gap-6 md:grid-cols-2">
              {/* Gene Data Upload */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`glass-panel cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${dragActive
                    ? "border-[#00E5FF] bg-[#00E5FF]/5"
                    : "border-[#00E5FF]/20 hover:border-[#00E5FF]/40"
                  }`}
              >
                <input ref={inputRef} type="file" accept=".csv,.tsv,.txt" onChange={(e) => handleFileChange(e, false)} className="hidden" />
                <Upload className="mb-4 h-10 w-10 text-[#00E5FF]/60" />
                <p className="text-base font-medium" style={{ color: "#E8EDF2" }}>
                  {file ? file.name : "Gene Expression Data"}
                </p>
                <p className="mt-1 text-xs" style={{ color: "#8899AA" }}>CSV, TSV</p>
                {file && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setFile(null) }}
                    className="mt-4 h-8 text-[#FF3B5C] hover:bg-[#FF3B5C]/10 hover:text-[#FF3B5C]"
                  >
                    Remove
                  </Button>
                )}
              </div>

              {/* Tumor Image Upload */}
              <div
                onClick={() => imageInputRef.current?.click()}
                className="glass-panel cursor-pointer flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#8A2BE2]/20 p-8 text-center transition-all hover:border-[#8A2BE2]/40"
              >
                <input ref={imageInputRef} type="file" accept="image/*,.dicom" onChange={(e) => handleFileChange(e, true)} className="hidden" />
                <ImageIcon className="mb-4 h-10 w-10 text-[#8A2BE2]/60" />
                <p className="text-base font-medium" style={{ color: "#E8EDF2" }}>
                  {imageFile ? imageFile.name : "Tumor Image"}
                </p>
                <p className="mt-1 text-xs" style={{ color: "#8899AA" }}>JPG, PNG, DICOM</p>
                {imageFile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); setImageFile(null) }}
                    className="mt-4 h-8 text-[#FF3B5C] hover:bg-[#FF3B5C]/10 hover:text-[#FF3B5C]"
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button
                onClick={() => predict(false)}
                disabled={(!file && !imageFile) || loading}
                className="w-full rounded-xl bg-[#00E5FF] px-8 text-[#0A1628] hover:bg-[#00E5FF]/90 font-semibold sm:w-auto disabled:opacity-40"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A1628] border-t-transparent" />
                    Analyzing...
                  </span>
                ) : (
                  <>
                    <FlaskConical className="mr-1 h-4 w-4" /> Predict & Analyze
                  </>
                )}
              </Button>
              <Button
                onClick={() => predict(true)}
                disabled={loading}
                variant="outline"
                className="w-full rounded-xl border-[#8A2BE2]/30 text-[#8A2BE2] hover:bg-[#8A2BE2]/10 hover:text-[#8A2BE2] sm:w-auto"
              >
                <Dna className="mr-1 h-4 w-4" /> Demo Mode
              </Button>
            </div>
            {loading && (
              <div className="mt-8 mx-auto max-w-md">
                <AILoading currentStep={loadingStep} steps={predictionSteps} />
              </div>
            )}

            {!loading && !dismissedError && error && (
              <div className="mt-6">
                <ErrorPanel 
                  error={error as any} 
                  onDismiss={() => setDismissedError(true)} 
                />
              </div>
            )}

            {(file || imageFile) && !loading && (
              <div className="mt-6 text-center text-sm text-[#8899AA]">
                <p>Data readiness verified. Ready for analysis.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Results */}
        {predictionResult && (
          <motion.div
            className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            {/* Top Summary */}
            <div className="glass-panel rounded-2xl p-6 neon-border relative overflow-hidden">
              {/* Decorative background for the result card */}
              <div className="absolute right-0 top-0 h-32 w-32 -translate-y-1/2 translate-x-1/3 rounded-full bg-[#00E5FF]/10 blur-3xl"></div>

              <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center relative z-10">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wider text-[#8899AA]">
                    {predictionResult.prediction_mode === "image" ? "Image Analysis Result" : "Predicted Cancer Type"}
                  </p>
                  <h2 className="mt-1 text-3xl font-bold text-[#E8EDF2]">
                    {predictionResult.cancer_type}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {predictionResult.prediction_mode === "image" ? (
                    <Badge
                      className="rounded-lg border-0 px-3 py-1 text-sm font-semibold"
                      style={{
                        backgroundColor: predictionResult.tumor_detected ? "#FF3B5C20" : "#00FF9C20",
                        color: predictionResult.tumor_detected ? "#FF3B5C" : "#00FF9C",
                      }}
                    >
                      <Activity className="mr-1 h-3.5 w-3.5 inline" />
                      {predictionResult.tumor_detected ? "Tumor Detected" : "No Tumor Detected"}
                    </Badge>
                  ) : (
                    <Badge className="rounded-lg border-0 px-3 py-1 text-sm font-semibold capitalize" style={{ backgroundColor: `${aggrColor(predictionResult.aggressiveness)}20`, color: aggrColor(predictionResult.aggressiveness) }}>
                      <Activity className="mr-1 h-3.5 w-3.5 inline" /> {predictionResult.aggressiveness} Risk
                    </Badge>
                  )}
                  <Badge className="rounded-lg border-0 bg-[#00E5FF]/10 px-3 py-1 text-sm font-semibold text-[#00E5FF]">
                    {predictionResult.model_version}
                  </Badge>
                </div>
              </div>

              <div className="mt-6 relative z-10">
                <ConfidenceVisualizer confidence={predictionResult.confidence} label="Prediction Confidence" />
                {predictionResult.prediction_mode === "image" && (
                  <p className="mt-2 text-xs text-[#8899AA]">
                    Confidence reflects model certainty for image class prediction, not medical risk level.
                  </p>
                )}
              </div>
            </div>

            {/* Prediction Results */}
            <div className="glass-panel rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-[#E8EDF2]">Prediction Results</h3>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {predictionResult.prediction_mode === "image" && (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-wider text-[#8899AA]">Tumor Detected</p>
                    <p className="mt-1 text-base font-semibold text-[#E8EDF2]">
                      {predictionResult.tumor_detected ? "Yes" : "No"}
                    </p>
                  </div>
                )}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wider text-[#8899AA]">
                    {predictionResult.prediction_mode === "image" ? "Tumor Type" : "Cancer Type"}
                  </p>
                  <p className="mt-1 text-base font-semibold text-[#E8EDF2]">
                    {predictionResult.prediction_mode === "image"
                      ? predictionResult.tumor_type || predictionResult.cancer_type
                      : predictionResult.cancer_type}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wider text-[#8899AA]">Confidence</p>
                  <p className="mt-1 text-base font-semibold text-[#E8EDF2]">{Math.round(predictionResult.confidence * 100)}%</p>
                </div>
                {predictionResult.prediction_mode !== "image" && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wider text-[#8899AA]">Aggressiveness</p>
                  <p className="mt-1 text-base font-semibold text-[#E8EDF2]">
                    {predictionResult.aggressiveness.charAt(0).toUpperCase() + predictionResult.aggressiveness.slice(1)}
                  </p>
                </div>
                )}
              </div>

              {predictionResult.prediction_mode !== "image" && (
              <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-[#E8EDF2]">Important Genes</p>
                {predictionResult.top_genes.length > 0 ? (
                  <ul className="mt-3 space-y-2 text-sm text-[#E8EDF2]">
                    {predictionResult.top_genes.map((item) => (
                      <li key={item.gene} className="flex items-center justify-between rounded-md border border-white/10 px-3 py-2">
                        <span>{item.gene}</span>
                        <span className="text-[#00E5FF]">{item.importance.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-[#8899AA]">No gene importance data available for this prediction.</p>
                )}
              </div>
              )}
            </div>

            {/* Actions for next step */}
            {predictionResult.prediction_mode !== "image" && (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <div className="flex items-center gap-2">
                <div className="h-px w-12 bg-linear-to-r from-transparent to-[#8A2BE2]/50"></div>
                <span className="text-xs uppercase tracking-widest text-[#8A2BE2] font-semibold">Next Step</span>
                <div className="h-px w-12 bg-linear-to-l from-transparent to-[#8A2BE2]/50"></div>
              </div>

              <Button asChild className="h-14 rounded-2xl bg-linear-to-r from-[#00E5FF] to-[#8A2BE2] px-8 text-white hover:opacity-90 font-bold shadow-[0_0_20px_rgba(138,43,226,0.3)] transition-all hover:scale-105">
                <Link href={{
                  pathname: "/tumor-twin",
                  query: {
                    cancer: predictionResult.cancer_type,
                    aggr: predictionResult.aggressiveness,
                    conf: predictionResult.confidence.toString(),
                    imageName: imageFile?.name || "",
                    genes: JSON.stringify(predictionResult.top_genes.slice(0, 3)),
                    medsRecommended: JSON.stringify(predictionResult.medicines.recommended),
                    medsNotRecommended: JSON.stringify(predictionResult.medicines.notRecommended)
                  }
                }}>
                  <FlaskConical className="mr-2 h-5 w-5" /> Generate Digital Twin
                </Link>
              </Button>

              <p className="max-w-md text-center text-xs text-[#8899AA]">
                Create a 3D simulation to analyze medicine compatibility and observe potential tumor responses.
              </p>
            </div>
            )}


            {/* Gene Visualization */}
            {predictionResult.prediction_mode !== "image" && (
            <div>
              <GeneVisualizer genes={predictionResult.top_genes} title="Gene Importance Analysis" />
            </div>
            )}



            <div className="flex justify-center pt-8 pb-4">
              <div className="flex flex-col items-center gap-3 sm:flex-row">
                <Button asChild variant="outline" className="border-[#00E5FF]/30 text-[#00E5FF] hover:bg-[#00E5FF]/10">
                  <Link href="/history">View Prediction History</Link>
                </Button>
                <Button
                  onClick={() => { setPredictionResult(null); setFile(null); setImageFile(null); }}
                  variant="ghost"
                  className="text-[#8899AA] hover:text-[#E8EDF2]"
                >
                  Start Over
                </Button>
              </div>
            </div>

          </motion.div>
        )}
      </main>
    </div>
  )
}
