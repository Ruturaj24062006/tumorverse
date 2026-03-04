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
  aggressiveness: string
  top_genes: GeneImportance[]
  medicines: {
    recommended: MedicineRec[]
    notRecommended: MedicineRec[]
  }
  sample_count: number
  model_version: string
}

export default function PredictionPage() {
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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
      setFile(droppedFile)
      setError(null)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
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
      } else if (file) {
        const formData = new FormData()
        formData.append("file", file)
        res = await fetch("/api/predict", { method: "POST", body: formData })
      } else {
        setError("Please upload a file or use demo mode.")
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
            Upload gene expression data or use demo mode to predict cancer type, view gene importance, and get medicine recommendations.
          </p>
        </div>

        {/* Upload Area */}
        {!result && (
          <div className="mx-auto max-w-2xl">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`glass-panel cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
                dragActive
                  ? "border-[#00E5FF] bg-[#00E5FF]/5"
                  : "border-[#00E5FF]/20 hover:border-[#00E5FF]/40"
              }`}
              role="button"
              tabIndex={0}
              aria-label="Upload gene expression file"
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="mx-auto mb-4 h-12 w-12 text-[#00E5FF]/60" />
              <p className="text-lg font-medium" style={{ color: "#E8EDF2" }}>
                {file ? file.name : "Drop gene expression file here"}
              </p>
              <p className="mt-2 text-sm" style={{ color: "#8899AA" }}>
                Supports CSV, TSV formats with gene expression data
              </p>
              {file && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#00E5FF]/10 px-3 py-1.5">
                  <FileText className="h-4 w-4 text-[#00E5FF]" />
                  <span className="text-sm text-[#00E5FF]">{(file.size / 1024).toFixed(1)} KB</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null) }}
                    className="ml-1 text-[#8899AA] hover:text-[#FF3B5C]"
                    aria-label="Remove file"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button
                onClick={() => predict(false)}
                disabled={!file || loading}
                className="w-full rounded-xl bg-[#00E5FF] px-8 text-[#0A1628] hover:bg-[#00E5FF]/90 font-semibold sm:w-auto disabled:opacity-40"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0A1628] border-t-transparent" />
                    Analyzing...
                  </span>
                ) : (
                  <>
                    <FlaskConical className="mr-1 h-4 w-4" /> Predict from File
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
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Top Summary */}
            <div className="glass-panel rounded-2xl p-6 neon-border">
              <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <p className="text-sm font-medium" style={{ color: "#8899AA" }}>Predicted Cancer Type</p>
                  <h2 className="mt-1 text-2xl font-bold neon-text" style={{ color: "#00E5FF" }}>
                    {result.cancer_type}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="rounded-lg border-0 px-3 py-1 text-sm font-semibold" style={{ backgroundColor: `${aggrColor(result.aggressiveness)}20`, color: aggrColor(result.aggressiveness) }}>
                    {result.aggressiveness.charAt(0).toUpperCase() + result.aggressiveness.slice(1)} Risk
                  </Badge>
                  <Badge className="rounded-lg border-0 bg-[#00E5FF]/10 px-3 py-1 text-sm font-semibold text-[#00E5FF]">
                    {result.model_version}
                  </Badge>
                </div>
              </div>

              {/* Confidence bar */}
              <div className="mt-6">
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: "#8899AA" }}>Confidence Score</span>
                  <span className="font-mono font-bold" style={{ color: "#00E5FF" }}>
                    {(result.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full" style={{ backgroundColor: "rgba(0,229,255,0.1)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${result.confidence * 100}%`,
                      background: "linear-gradient(90deg, #00E5FF, #8A2BE2)",
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Gene Importance */}
              <div className="glass-panel rounded-2xl p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold" style={{ color: "#E8EDF2" }}>
                  <Dna className="h-5 w-5 text-[#00E5FF]" /> Top Influencing Genes
                </h3>
                <div className="space-y-3">
                  {result.top_genes.map((g) => (
                    <div key={g.gene}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-mono font-medium" style={{ color: "#E8EDF2" }}>{g.gene}</span>
                        <span className="font-mono" style={{ color: "#00E5FF" }}>{(g.importance * 100).toFixed(0)}%</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full" style={{ backgroundColor: "rgba(0,229,255,0.1)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${g.importance * 100}%`,
                            background: `linear-gradient(90deg, #00E5FF, #00FF9C)`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Medicine Recommendations */}
              <div className="glass-panel rounded-2xl p-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold" style={{ color: "#E8EDF2" }}>
                  <Pill className="h-5 w-5 text-[#00FF9C]" /> Medicine Recommendation
                </h3>
                <div className="space-y-3">
                  <p className="text-xs font-medium" style={{ color: "#00FF9C" }}>Recommended</p>
                  {result.medicines.recommended.map((m) => (
                    <div key={m.name} className="flex items-start gap-3 rounded-xl p-3" style={{ backgroundColor: "rgba(0,255,156,0.05)" }}>
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#00FF9C]" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold" style={{ color: "#E8EDF2" }}>{m.name}</span>
                          <span className="text-xs font-mono" style={{ color: "#00FF9C" }}>
                            {(m.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "#8899AA" }}>{m.mechanism}</p>
                      </div>
                    </div>
                  ))}
                  <p className="mt-2 text-xs font-medium" style={{ color: "#FF3B5C" }}>Not Recommended</p>
                  {result.medicines.notRecommended.map((m) => (
                    <div key={m.name} className="flex items-start gap-3 rounded-xl p-3" style={{ backgroundColor: "rgba(255,59,92,0.05)" }}>
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF3B5C]" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold" style={{ color: "#E8EDF2" }}>{m.name}</span>
                          <span className="text-xs font-mono" style={{ color: "#FF3B5C" }}>
                            {(m.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "#8899AA" }}>{m.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button asChild className="rounded-xl bg-[#8A2BE2] px-6 text-[#E8EDF2] hover:bg-[#8A2BE2]/80 font-semibold">
                <Link href={`/tumor-twin?cancer=${encodeURIComponent(result.cancer_type)}&aggr=${result.aggressiveness}&conf=${result.confidence}`}>
                  <Activity className="mr-1 h-4 w-4" /> View Digital Twin
                </Link>
              </Button>
              <Button
                onClick={() => { setResult(null); setFile(null) }}
                variant="outline"
                className="rounded-xl border-[#00E5FF]/30 text-[#00E5FF] hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]"
              >
                New Prediction
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
