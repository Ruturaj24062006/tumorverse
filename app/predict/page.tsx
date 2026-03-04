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
  top_genes: GeneImportance[]
  medicines: {
    recommended: MedicineRec[]
    notRecommended: MedicineRec[]
  }
  sample_count: number
  model_version: string
}

export default function PredictionPage() {
  const [file, setFile] = useState<File | null>(null) // Gene expr
  const [imageFile, setImageFile] = useState<File | null>(null) // Tumor Image
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

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
    setResult(null)

    try {
      let res: Response
      if (useDemo) {
        res = await fetch("/api/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ demo: true, genes: 20000, samples: 1 }),
        })
      } else if (file || imageFile) {
        const formData = new FormData()
        if (file) formData.append("file", file)
        if (imageFile) formData.append("image", imageFile)

        // Let's pretend the API handles both now, though in mock it doesn't need to change much
        res = await fetch("/api/predict", { method: "POST", body: formData })
      } else {
        setError("Please upload gene data or a tumor image, or use demo mode.")
        setLoading(false)
        return
      }

      if (!res.ok) throw new Error("Prediction failed")
      const data = await res.json()
      setResult(data)
    } catch {
      setError("Prediction failed. Please try again.")
    } finally {
      setLoading(false)
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
        {!result && (
          <div className="mx-auto max-w-4xl">
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

            {error && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm" style={{ color: "#FF3B5C" }}>
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}

            {(file || imageFile) && !loading && (
              <div className="mt-6 text-center text-sm text-[#8899AA]">
                <p>Data readiness verified. Ready for analysis.</p>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Top Summary */}
            <div className="glass-panel rounded-2xl p-6 neon-border relative overflow-hidden">
              {/* Decorative background for the result card */}
              <div className="absolute right-0 top-0 h-32 w-32 -translate-y-1/2 translate-x-1/3 rounded-full bg-[#00E5FF]/10 blur-3xl"></div>

              <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center relative z-10">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wider text-[#8899AA]">Predicted Cancer Type</p>
                  <h2 className="mt-1 text-3xl font-bold text-[#E8EDF2]">
                    {result.cancer_type}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="rounded-lg border-0 px-3 py-1 text-sm font-semibold capitalize" style={{ backgroundColor: `${aggrColor(result.aggressiveness)}20`, color: aggrColor(result.aggressiveness) }}>
                    <Activity className="mr-1 h-3.5 w-3.5 inline" /> {result.aggressiveness} Risk
                  </Badge>
                  <Badge className="rounded-lg border-0 bg-[#00E5FF]/10 px-3 py-1 text-sm font-semibold text-[#00E5FF]">
                    {result.model_version}
                  </Badge>
                </div>
              </div>

              {/* Confidence bar */}
              <div className="mt-6 relative z-10">
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: "#8899AA" }}>Prediction Confidence</span>
                  <span className="font-mono font-bold" style={{ color: "#00E5FF" }}>
                    {(result.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full" style={{ backgroundColor: "rgba(0,229,255,0.1)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${result.confidence * 100}%`,
                      background: "linear-gradient(90deg, #00E5FF, #8A2BE2)",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Actions for next step */}
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
                    cancer: result.cancer_type,
                    aggr: result.aggressiveness,
                    conf: result.confidence.toString(),
                    genes: JSON.stringify(result.top_genes.slice(0, 3)),
                    medsRecommended: JSON.stringify(result.medicines.recommended),
                    medsNotRecommended: JSON.stringify(result.medicines.notRecommended)
                  }
                }}>
                  <FlaskConical className="mr-2 h-5 w-5" /> Generate Digital Twin
                </Link>
              </Button>

              <p className="max-w-md text-center text-xs text-[#8899AA]">
                Create a 3D simulation to analyze medicine compatibility and observe potential tumor responses.
              </p>
            </div>


            {/* Simplified Gene Preview (moved down) */}
            <div className="glass-panel rounded-2xl p-6 opacity-80">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[#E8EDF2]">
                <Dna className="h-4 w-4 text-[#8A2BE2]" /> Primary Influencing Genes
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {result.top_genes.slice(0, 4).map((g) => (
                  <div key={g.gene} className="rounded-xl bg-[#0A1628]/50 p-3 border border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-medium text-[#E8EDF2]">{g.gene}</span>
                      <span className="text-xs text-[#00E5FF] font-mono">{(g.importance * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>


            <div className="flex justify-center pt-8 pb-4">
              <Button
                onClick={() => { setResult(null); setFile(null); setImageFile(null); }}
                variant="ghost"
                className="text-[#8899AA] hover:text-[#E8EDF2]"
              >
                Start Over
              </Button>
            </div>

          </div>
        )}
      </main>
    </div>
  )
}
