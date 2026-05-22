"use client"

import { useState, useEffect, useRef } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Settings,
  ChevronDown,
  Zap,
  Activity,
  Pill,
  Shield,
  Clock,
  TrendingDown,
  Brain,
  Sparkles,
  Briefcase,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type DemoPhase = 
  | "intro" 
  | "problem" 
  | "solution" 
  | "upload" 
  | "analysis" 
  | "twin" 
  | "medicine" 
  | "simulation" 
  | "timeline" 
  | "results" 
  | "impact"

interface DemoState {
  phase: DemoPhase
  isPlaying: boolean
  progress: number
  isMuted: boolean
  isFullscreen: boolean
  speed: number
}

export default function PresentationPage() {
  const [state, setState] = useState<DemoState>({
    phase: "intro",
    isPlaying: false,
    progress: 0,
    isMuted: false,
    isFullscreen: false,
    speed: 1,
  })

  const fullscreenRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<NodeJS.Timeout | null>(null)

  const phases: DemoPhase[] = [
    "intro",
    "problem",
    "solution",
    "upload",
    "analysis",
    "twin",
    "medicine",
    "simulation",
    "timeline",
    "results",
    "impact",
  ]

  const phaseContent: Record<DemoPhase, { title: string; duration: number; description: string }> = {
    intro: {
      title: "Welcome to TumorVerse",
      duration: 8,
      description: "AI-Powered Digital Tumor Twin Platform",
    },
    problem: {
      title: "The Challenge",
      duration: 10,
      description: "Cancer treatment decisions are complex and often made with limited information.",
    },
    solution: {
      title: "Our Solution",
      duration: 10,
      description: "AI-powered digital tumor twins enable predictive treatment simulation.",
    },
    upload: {
      title: "Step 1: Image Upload",
      duration: 6,
      description: "Doctors upload medical imaging (CT, MRI) of the tumor.",
    },
    analysis: {
      title: "Step 2: AI Analysis",
      duration: 8,
      description: "Deep learning segmentation and cancer type classification.",
    },
    twin: {
      title: "Step 3: Digital Twin",
      duration: 10,
      description: "3D reconstruction with biological parameters from the image.",
    },
    medicine: {
      title: "Step 4: Medicine Recommendation",
      duration: 8,
      description: "AI evaluates compatibility of 26 medicines with the specific tumor.",
    },
    simulation: {
      title: "Step 5: Treatment Simulation",
      duration: 12,
      description: "Watch the tumor respond to the recommended medicine in real-time.",
    },
    timeline: {
      title: "Step 6: Recovery Timeline",
      duration: 10,
      description: "AI predicts recovery trajectory over 6 months with confidence levels.",
    },
    results: {
      title: "Clinical Results",
      duration: 10,
      description: "Comprehensive analysis, risk assessment, and treatment recommendations.",
    },
    impact: {
      title: "The Impact",
      duration: 12,
      description: "Faster decisions, better outcomes, more confident clinicians.",
    },
  }

  // Auto-advance through phases
  useEffect(() => {
    if (!state.isPlaying) return

    const currentPhaseIndex = phases.indexOf(state.phase)
    const currentPhase = phaseContent[state.phase]
    const duration = currentPhase.duration / state.speed

    animationRef.current = setTimeout(() => {
      const progress = state.progress + (100 / duration) * 0.1

      if (progress >= 100) {
        if (currentPhaseIndex < phases.length - 1) {
          setState((s) => ({
            ...s,
            phase: phases[currentPhaseIndex + 1],
            progress: 0,
          }))
        } else {
          setState((s) => ({ ...s, isPlaying: false, progress: 100 }))
        }
      } else {
        setState((s) => ({ ...s, progress }))
      }
    }, 100 / state.speed)

    return () => clearTimeout(animationRef.current!)
  }, [state.isPlaying, state.phase, state.progress, state.speed])

  const handlePlayPause = () => {
    setState((s) => ({ ...s, isPlaying: !s.isPlaying }))
  }

  const handleReset = () => {
    setState((s) => ({ ...s, phase: "intro", progress: 0, isPlaying: false }))
  }

  const handleFullscreen = async () => {
    if (!fullscreenRef.current) return

    try {
      if (!document.fullscreenElement) {
        await fullscreenRef.current.requestFullscreen()
        setState((s) => ({ ...s, isFullscreen: true }))
      } else {
        await document.exitFullscreen()
        setState((s) => ({ ...s, isFullscreen: false }))
      }
    } catch (err) {
      console.error("Fullscreen error:", err)
    }
  }

  const getPhaseVisuals = () => {
    switch (state.phase) {
      case "intro":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full text-center"
          >
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="mb-8"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-[#00E5FF] to-[#8A2BE2] flex items-center justify-center">
                <Brain className="w-12 h-12 text-white" />
              </div>
            </motion.div>
            <h1 className="text-6xl font-bold text-[#E8EDF2] mb-4">TumorVerse</h1>
            <p className="text-2xl text-[#8899AA]">AI-Powered Digital Tumor Twin Platform</p>
            <p className="text-lg text-[#00E5FF] mt-8">Simulating Treatment Before Reality</p>
          </motion.div>
        )

      case "problem":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center h-full"
          >
            <div className="max-w-2xl text-center">
              <h2 className="text-4xl font-bold text-[#E8EDF2] mb-8">The Clinical Challenge</h2>
              <div className="space-y-6">
                <motion.div
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="bg-[#FF3B5C]/10 border border-[#FF3B5C]/30 rounded-lg p-6"
                >
                  <p className="text-xl text-[#E8EDF2]">❌ Limited Treatment Options</p>
                  <p className="text-[#8899AA]">Standard protocols don't account for tumor uniqueness</p>
                </motion.div>
                <motion.div
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 2 }}
                  className="bg-[#FF3B5C]/10 border border-[#FF3B5C]/30 rounded-lg p-6"
                >
                  <p className="text-xl text-[#E8EDF2]">❌ Unpredictable Outcomes</p>
                  <p className="text-[#8899AA]">Doctors can't predict how patients will respond</p>
                </motion.div>
                <motion.div
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 3 }}
                  className="bg-[#FF3B5C]/10 border border-[#FF3B5C]/30 rounded-lg p-6"
                >
                  <p className="text-xl text-[#E8EDF2]">❌ Trial-and-Error</p>
                  <p className="text-[#8899AA]">Treatment decisions are made with high uncertainty</p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )

      case "solution":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center h-full"
          >
            <div className="max-w-2xl text-center">
              <h2 className="text-4xl font-bold text-[#E8EDF2] mb-8">The TumorVerse Solution</h2>
              <div className="space-y-6">
                <motion.div
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="bg-[#00E5FF]/10 border border-[#00E5FF]/30 rounded-lg p-6"
                >
                  <p className="text-xl text-[#00E5FF]">✅ Digital Tumor Twin</p>
                  <p className="text-[#8899AA]">AI recreates your tumor in 3D with biological accuracy</p>
                </motion.div>
                <motion.div
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 2 }}
                  className="bg-[#00E5FF]/10 border border-[#00E5FF]/30 rounded-lg p-6"
                >
                  <p className="text-xl text-[#00E5FF]">✅ Predictive Simulation</p>
                  <p className="text-[#8899AA]">Simulate medicine effects before real treatment</p>
                </motion.div>
                <motion.div
                  initial={{ x: 100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 3 }}
                  className="bg-[#00E5FF]/10 border border-[#00E5FF]/30 rounded-lg p-6"
                >
                  <p className="text-xl text-[#00E5FF]">✅ Informed Decisions</p>
                  <p className="text-[#8899AA]">Doctors choose optimal treatment with AI confidence</p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )

      case "upload":
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center h-full"
          >
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-32 h-32 rounded-lg bg-gradient-to-r from-[#00E5FF] to-[#00FF9C] flex items-center justify-center mx-auto mb-8"
              >
                <activity className="w-16 h-16 text-white" />
              </motion.div>
              <h2 className="text-4xl font-bold text-[#E8EDF2] mb-4">Medical Image Upload</h2>
              <p className="text-xl text-[#8899AA]">CT/MRI scan of patient's tumor</p>
            </div>
          </motion.div>
        )

      case "analysis":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center h-full"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 rounded-full border-4 border-[#00E5FF]/30 border-t-[#00E5FF] mx-auto mb-8"
              />
              <h2 className="text-4xl font-bold text-[#E8EDF2] mb-4">AI Analysis</h2>
              <p className="text-xl text-[#8899AA]">Segmentation • Classification • Feature Extraction</p>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${state.progress}%` }}
                className="h-1 bg-[#00E5FF] rounded mt-8"
                style={{ width: `${state.progress}%` }}
              />
            </div>
          </motion.div>
        )

      case "twin":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center h-full"
          >
            <div className="text-center">
              <motion.div
                animate={{ rotateX: 360, rotateY: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                className="w-32 h-32 rounded-full bg-gradient-to-r from-[#8A2BE2] to-[#00E5FF] flex items-center justify-center mx-auto mb-8"
              >
                <Activity className="w-16 h-16 text-white" />
              </motion.div>
              <h2 className="text-4xl font-bold text-[#E8EDF2] mb-4">Digital Twin Creation</h2>
              <p className="text-xl text-[#8899AA]">3D Reconstruction with Biological Parameters</p>
            </div>
          </motion.div>
        )

      case "medicine":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center h-full"
          >
            <div className="max-w-2xl">
              <h2 className="text-4xl font-bold text-[#E8EDF2] mb-8 text-center">Medicine Recommendation</h2>
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 2 }}
                className="bg-[#00FF9C]/10 border border-[#00FF9C]/50 rounded-lg p-8"
              >
                <p className="text-3xl font-bold text-[#00FF9C] mb-4">Cabergoline</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[#8899AA] mb-2">Effectiveness</p>
                    <p className="text-2xl font-bold text-[#E8EDF2]">94.2%</p>
                  </div>
                  <div>
                    <p className="text-[#8899AA] mb-2">Treatment Score</p>
                    <p className="text-2xl font-bold text-[#E8EDF2]">88/100</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )

      case "simulation":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center h-full"
          >
            <div className="text-center">
              <h2 className="text-4xl font-bold text-[#E8EDF2] mb-8">Treatment Simulation</h2>
              <div className="grid grid-cols-3 gap-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1 }}
                  className="text-center"
                >
                  <div className="w-24 h-24 rounded-full bg-[#FF3B5C]/30 flex items-center justify-center mx-auto mb-4">
                    <p className="text-2xl font-bold text-[#FF3B5C]">Start</p>
                  </div>
                  <p className="text-[#8899AA]">Tumor: 45mm</p>
                </motion.div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 3 }}
                  className="text-center"
                >
                  <div className="w-24 h-24 rounded-full bg-[#FF9F43]/30 flex items-center justify-center mx-auto mb-4">
                    <p className="text-2xl font-bold text-[#FF9F43]">Month 2</p>
                  </div>
                  <p className="text-[#8899AA]">Tumor: 28mm</p>
                </motion.div>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 5 }}
                  className="text-center"
                >
                  <div className="w-24 h-24 rounded-full bg-[#00FF9C]/30 flex items-center justify-center mx-auto mb-4">
                    <p className="text-2xl font-bold text-[#00FF9C]">Month 6</p>
                  </div>
                  <p className="text-[#8899AA]">Tumor: 8mm</p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )

      case "timeline":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center h-full"
          >
            <div className="w-full max-w-3xl">
              <h2 className="text-4xl font-bold text-[#E8EDF2] mb-8 text-center">Recovery Timeline</h2>
              <motion.div className="relative h-16 bg-[#0F1E35] rounded-lg overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(state.progress * 2, 100)}%` }}
                  className="h-full bg-gradient-to-r from-[#00E5FF] to-[#00FF9C]"
                />
              </motion.div>
              <div className="grid grid-cols-5 mt-4 text-center text-sm text-[#8899AA]">
                <p>Day 0</p>
                <p>Day 30</p>
                <p>Day 60</p>
                <p>Day 120</p>
                <p>Day 180</p>
              </div>
            </div>
          </motion.div>
        )

      case "results":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center h-full"
          >
            <div className="max-w-3xl w-full">
              <h2 className="text-4xl font-bold text-[#E8EDF2] mb-8 text-center">Clinical Results</h2>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { label: "Treatment Score", value: "88/100", color: "#00E5FF" },
                  { label: "Effectiveness", value: "94.2%", color: "#00FF9C" },
                  { label: "Recovery Status", value: "Responding", color: "#00FF9C" },
                  { label: "Risk Level", value: "Low", color: "#00E5FF" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.5 }}
                    className="bg-[#0F1E35]/60 border border-[#00E5FF]/20 rounded-lg p-6"
                  >
                    <p className="text-[#8899AA] mb-2">{item.label}</p>
                    <p className="text-3xl font-bold" style={{ color: item.color }}>
                      {item.value}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )

      case "impact":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center h-full"
          >
            <div className="max-w-2xl text-center">
              <h2 className="text-5xl font-bold text-[#E8EDF2] mb-12">The Impact</h2>
              <div className="space-y-8">
                <motion.div
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-2xl text-[#00E5FF]"
                >
                  ⚡ Faster Clinical Decisions
                </motion.div>
                <motion.div
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 2 }}
                  className="text-2xl text-[#00FF9C]"
                >
                  📈 Better Patient Outcomes
                </motion.div>
                <motion.div
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 3 }}
                  className="text-2xl text-[#8A2BE2]"
                >
                  🧠 AI-Powered Confidence
                </motion.div>
                <motion.div
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 4 }}
                  className="text-2xl text-[#FF9F43]"
                >
                  🚀 Next-Generation Healthcare
                </motion.div>
              </div>
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 5 }}
                className="mt-12 pt-8 border-t border-[#00E5FF]/20"
              >
                <p className="text-xl text-[#8899AA]">Transforming Cancer Treatment</p>
                <p className="text-3xl font-bold text-[#00E5FF] mt-4">TumorVerse</p>
              </motion.div>
            </div>
          </motion.div>
        )

      default:
        return null
    }
  }

  const currentPhaseIndex = phases.indexOf(state.phase)

  return (
    <div
      ref={fullscreenRef}
      className={`${
        state.isFullscreen ? "" : "min-h-screen"
      } bg-gradient-to-b from-[#0A1628] via-[#0A1628] to-[#0F1E35]`}
    >
      {!state.isFullscreen && <Navbar />}

      <main className={`${state.isFullscreen ? "h-screen" : "min-h-[calc(100vh-80px)] pt-20"} flex flex-col`}>
        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-6xl">
            <AnimatePresence mode="wait">{getPhaseVisuals()}</AnimatePresence>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-[#0F1E35]/80 backdrop-blur border-t border-[#00E5FF]/20 px-6 py-6">
          <div className="max-w-6xl mx-auto space-y-4">
            {/* Progress Bar */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#8899AA]">
                {currentPhaseIndex + 1} / {phases.length}
              </span>
              <Progress value={(currentPhaseIndex / phases.length) * 100} className="flex-1 h-2" />
              <span className="text-sm text-[#8899AA]">{phaseContent[state.phase].title}</span>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex gap-3">
                <Button
                  size="sm"
                  className="bg-[#00E5FF]/20 text-[#00E5FF] hover:bg-[#00E5FF]/30 border border-[#00E5FF]/50"
                  onClick={handlePlayPause}
                >
                  {state.isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Play
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  className="bg-[#8A2BE2]/20 text-[#8A2BE2] hover:bg-[#8A2BE2]/30 border border-[#8A2BE2]/50"
                  onClick={handleReset}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>

                <Button
                  size="sm"
                  className="bg-[#00FF9C]/20 text-[#00FF9C] hover:bg-[#00FF9C]/30 border border-[#00FF9C]/50"
                  onClick={() => setState((s) => ({ ...s, isMuted: !s.isMuted }))}
                >
                  {state.isMuted ? (
                    <>
                      <VolumeX className="w-4 h-4 mr-2" />
                      Muted
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 mr-2" />
                      Sound
                    </>
                  )}
                </Button>
              </div>

              <div className="flex gap-3">
                <Button
                  size="sm"
                  className="bg-[#FF9F43]/20 text-[#FF9F43] hover:bg-[#FF9F43]/30 border border-[#FF9F43]/50"
                  onClick={handleFullscreen}
                >
                  <Maximize2 className="w-4 h-4 mr-2" />
                  {state.isFullscreen ? "Exit" : "Fullscreen"}
                </Button>

                <Button
                  size="sm"
                  className="bg-[#00E5FF]/20 text-[#00E5FF] hover:bg-[#00E5FF]/30 border border-[#00E5FF]/50"
                  asChild
                >
                  <Link href="/analyze">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Try Now
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
