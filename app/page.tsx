"use client"

import { Navbar } from "@/components/navbar"
import { DNAHelix } from "@/components/dna-helix"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  FlaskConical,
  Activity,
  BarChart3,
  Pill,
  Upload,
  Sparkles,
  ArrowRight,
  Dna,
  Brain,
  Shield,
} from "lucide-react"

const stats = [
  { value: "94.6%", label: "Model Accuracy" },
  { value: "11,284", label: "Training Samples" },
  { value: "10", label: "Cancer Types" },
  { value: "20,000+", label: "Gene Features" },
]

const features = [
  {
    icon: FlaskConical,
    title: "AI Cancer Prediction",
    description: "Upload gene expression data (CSV/TSV) and get instant tumor classification across 10 cancer types using deep learning.",
    color: "#00E5FF",
  },
  {
    icon: Activity,
    title: "Digital Tumor Twin",
    description: "Interactive 3D simulation of tumor behavior with real-time visualization of aggressiveness, gene markers, and growth patterns.",
    color: "#8A2BE2",
  },
  {
    icon: Pill,
    title: "Medicine Recommendation",
    description: "AI-powered drug compatibility analysis with confidence scores and mechanism-of-action details for each cancer type.",
    color: "#00FF9C",
  },
  {
    icon: Brain,
    title: "Drug Response Simulation",
    description: "Simulate medicine effects on the digital tumor twin and watch the tumor respond in real-time to treatment.",
    color: "#FF9F43",
  },
  {
    icon: Upload,
    title: "Multi-Format Upload",
    description: "Support for CSV, TSV gene expression files and tumor image uploads (JPG, PNG) for comprehensive analysis.",
    color: "#00E5FF",
  },
  {
    icon: BarChart3,
    title: "Visual Dashboard",
    description: "Comprehensive analytics with confusion matrices, gene importance charts, and model performance metrics.",
    color: "#8A2BE2",
  },
]

const workflow = [
  { step: "01", title: "Upload Data", desc: "Gene expression CSV/TSV or tumor image", icon: Upload },
  { step: "02", title: "AI Prediction", desc: "Deep learning classifies cancer type", icon: Brain },
  { step: "03", title: "Digital Twin", desc: "3D tumor simulation generated", icon: Activity },
  { step: "04", title: "Medicine Analysis", desc: "Drug compatibility evaluated", icon: Pill },
  { step: "05", title: "Drug Simulation", desc: "Watch tumor respond to treatment", icon: Sparkles },
]

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A1628" }}>
      <Navbar />

      {/* Hero Section */}
      <section className="relative flex min-h-screen items-center overflow-hidden pt-16">
        <div className="absolute inset-0">
          <DNAHelix />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A1628]/30 to-[#0A1628]" />

        <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#00E5FF]/20 bg-[#00E5FF]/5 px-4 py-1.5">
            <Sparkles className="h-4 w-4 text-[#00E5FF]" />
            <span className="text-sm font-medium text-[#00E5FF]">AI-Powered Cancer Genomics Platform</span>
          </div>

          <h1 className="max-w-4xl text-balance text-5xl font-bold leading-tight tracking-tight md:text-7xl">
            <span style={{ color: "#E8EDF2" }}>Predict Cancer.</span>
            <br />
            <span className="neon-text" style={{ color: "#00E5FF" }}>Simulate Treatment.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-pretty text-lg leading-relaxed" style={{ color: "#8899AA" }}>
            TumorVerse combines deep learning with digital twin technology to predict cancer types from gene expression data, recommend medicines, and simulate drug response in real-time 3D.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg" className="rounded-xl bg-[#00E5FF] px-8 text-[#0A1628] hover:bg-[#00E5FF]/90 font-semibold">
              <Link href="/predict">
                Start Prediction <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-xl border-[#00E5FF]/30 text-[#00E5FF] hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]">
              <Link href="/tumor-twin">
                Explore Tumor Twin
              </Link>
            </Button>
          </div>

          {/* Stats Row */}
          <div className="mt-16 grid w-full max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="glass-panel rounded-xl px-4 py-5 text-center">
                <div className="text-2xl font-bold neon-text" style={{ color: "#00E5FF" }}>{stat.value}</div>
                <div className="mt-1 text-xs font-medium" style={{ color: "#8899AA" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold md:text-4xl" style={{ color: "#E8EDF2" }}>
              Complete Cancer Analysis Platform
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-pretty leading-relaxed" style={{ color: "#8899AA" }}>
              From gene data upload to drug simulation, TumorVerse provides an end-to-end pipeline for AI-driven oncology research.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="group glass-panel rounded-2xl p-6 transition-all hover:border-[rgba(0,229,255,0.3)]"
                >
                  <div
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${feature.color}15`, border: `1px solid ${feature.color}30` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: feature.color }} />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold" style={{ color: "#E8EDF2" }}>{feature.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#8899AA" }}>{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="relative py-24" style={{ backgroundColor: "rgba(0, 229, 255, 0.02)" }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold md:text-4xl" style={{ color: "#E8EDF2" }}>How It Works</h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed" style={{ color: "#8899AA" }}>
              Five steps from raw data to actionable treatment insights.
            </p>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:gap-0">
            {workflow.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={step.step} className="flex flex-1 flex-col items-center text-center">
                  <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00E5FF]/10 neon-border">
                    <Icon className="h-7 w-7 text-[#00E5FF]" />
                    <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#8A2BE2] text-xs font-bold" style={{ color: "#E8EDF2" }}>
                      {step.step}
                    </span>
                  </div>
                  <h3 className="mb-1 text-sm font-semibold" style={{ color: "#E8EDF2" }}>{step.title}</h3>
                  <p className="text-xs" style={{ color: "#8899AA" }}>{step.desc}</p>
                  {i < workflow.length - 1 && (
                    <ArrowRight className="mt-4 hidden h-5 w-5 text-[#00E5FF]/30 md:block md:rotate-0" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="glass-panel rounded-3xl p-12 neon-border">
            <Dna className="mx-auto mb-6 h-12 w-12 text-[#00E5FF] animate-pulse-glow" />
            <h2 className="text-3xl font-bold md:text-4xl" style={{ color: "#E8EDF2" }}>
              Ready to Analyze?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-pretty leading-relaxed" style={{ color: "#8899AA" }}>
              Upload your gene expression data and let TumorVerse predict, visualize, and simulate your cancer analysis.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button asChild size="lg" className="rounded-xl bg-[#00E5FF] px-8 text-[#0A1628] hover:bg-[#00E5FF]/90 font-semibold">
                <Link href="/predict">
                  Upload Gene Data <Upload className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-xl border-[#00E5FF]/30 text-[#00E5FF] hover:bg-[#00E5FF]/10 hover:text-[#00E5FF]">
                <Link href="/dashboard">
                  View Dashboard <Shield className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#00E5FF]/10 py-8">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="text-sm" style={{ color: "#556677" }}>
            TumorVerse - AI Cancer Prediction & Digital Tumor Twin Platform. For research purposes only.
          </p>
        </div>
      </footer>
    </div>
  )
}
