"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { 
  Cpu, Brain, Shield, Terminal, Volume2, Play, Pause, RefreshCw, 
  Send, ShieldCheck, FileText, ChevronRight, Lock, Activity, 
  Database, UserCheck, AlertTriangle, HelpCircle, HardDrive, Info
} from "lucide-react"
import * as THREE from "three"
import { Navbar } from "@/components/navbar"

// Define types for state management
interface Patient {
  patient_id: string
  name: string
  age: number
  gender: string
  cancer_type: string
  status: string
  treatment_score: number
  effectiveness: number
  aggressiveness: number
  current_medicine: string | null
  risk_level: string
  stabilization_confidence: number
}

interface LogLine {
  text: string
  type: "sys" | "tumor" | "chemo" | "prognosis" | "explain" | "render"
  timestamp: string
}

export default function CognitionHub() {
  // Session & Secure Patient State
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [sessionId, setSessionId] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  // Consensus Results State
  const [consensus, setConsensus] = useState<any>(null)
  const [agentOutputs, setAgentOutputs] = useState<any>(null)
  const [timelineProjections, setTimelineProjections] = useState<any[]>([])
  const [selectedMedicine, setSelectedMedicine] = useState<string>("Cabergoline")

  // Terminal & Console Logs
  const [terminalLogs, setTerminalLogs] = useState<LogLine[]>([])
  const terminalEndRef = useRef<HTMLDivElement>(null)

  // Interactive Timeline state (Days 0 to 730)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const timelineInterval = useRef<any>(null)

  // Copilot Chat Console
  const [chatMessage, setChatMessage] = useState("")
  const [chatHistory, setChatHistory] = useState<Array<{ sender: "user" | "copilot", text: string }>>([
    { sender: "copilot", text: "TumorVerse OS Cognition Core online. Secure session active. Ask me about patient staging, treatment indexes, or shader parameters." }
  ])
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Browser TTS Narration state
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [speechVolume, setSpeechVolume] = useState(0.8)
  const speechUtt = useRef<SpeechSynthesisUtterance | null>(null)

  // Hospital-Grade Security Uploads
  const [uploadedFile, setUploadedFile] = useState<any>(null)
  const [secureLogs, setSecureLogs] = useState<string[]>([])

  // Three.js Canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const sphereRef = useRef<THREE.Mesh | null>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial | null>(null)
  const lightRef = useRef<THREE.PointLight | null>(null)

  // List of medical alternatives
  const medicinesList = ["Cabergoline", "Temozolomide", "Gefitinib", "Tamoxifen", "Pembrolizumab"]

  // 1. Initial Data Fetch: Patients
  useEffect(() => {
    async function fetchPatients() {
      try {
        setLoading(true)
        const res = await fetch("http://127.0.0.1:8000/api/ecosystem/patients")
        if (!res.ok) throw new Error("Failed to load patients")
        const data = await res.json()
        
        if (data && data.length > 0) {
          setPatients(data)
          // Default to first patient
          handlePatientSelect(data[0])
        } else {
          // If empty, create a mock default patient for simulation
          const createRes = await fetch("http://127.0.0.1:8000/api/ecosystem/patients/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: "Eleanor Vance",
              age: 46,
              gender: "F",
              cancer_type: "glioblastoma",
              initial_tumor_volume: 4520.4,
              initial_aggressiveness: 72.5,
              stage: "IV"
            })
          })
          if (createRes.ok) {
            const listRes = await fetch("http://127.0.0.1:8000/api/ecosystem/patients")
            const listData = await listRes.json()
            setPatients(listData)
            if (listData.length > 0) handlePatientSelect(listData[0])
          }
        }
      } catch (err) {
        console.error("Error loading patient ecosystem data:", err)
        addTerminalLog("Ecosystem communication error. Operating in offline diagnostic mode.", "sys")
      } finally {
        setLoading(false)
      }
    }
    fetchPatients()
  }, [])

  // 2. Select Patient and Initialize Session
  async function handlePatientSelect(patient: Patient) {
    setSelectedPatient(patient)
    setConsensus(null)
    setAgentOutputs(null)
    setUploadedFile(null)
    setSecureLogs([])
    setCurrentTime(0)
    setIsPlaying(false)
    
    addTerminalLog(`Ecosystem target selected: Patient ID [${patient.patient_id.substring(0,8)}...]`, "sys")
    
    try {
      // Create session
      const res = await fetch("http://127.0.0.1:8000/api/ecosystem/sessions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: patient.patient_id })
      })
      if (!res.ok) throw new Error("Session init failed")
      const sessionData = await res.json()
      
      setSessionId(sessionData.session_id)
      setSelectedMedicine(patient.current_medicine || "Cabergoline")
      
      addTerminalLog(`Establishing HIPAA Secure Patient Session: SUCCESS`, "sys")
      addTerminalLog(`Session ID: ${sessionData.session_id.substring(0,18)}...`, "sys")
      
      // Automatically run cognition manager on load
      triggerCognitionAnalysis(sessionData.session_id, patient.current_medicine || "Cabergoline")
    } catch (err) {
      console.error(err)
      addTerminalLog("Session initialization aborted: connection timeout.", "sys")
    }
  }

  // 3. Trigger 5-Agent Cognition Analysis
  async function triggerCognitionAnalysis(activeSessId: string, medicine: string) {
    if (!activeSessId) return
    setAnalyzing(true)
    setTerminalLogs([])
    
    addTerminalLog("[SYS] Initializing HIPAA secure environment...", "sys")
    addTerminalLog("[SYS] Spawning 5-Agent Clinical Cognition Network...", "sys")
    
    setTimeout(() => addTerminalLog("[TUMOR] Geometrical bounding box loaded. Computing surface roughness.", "tumor"), 200)
    setTimeout(() => addTerminalLog("[CHEMO] Accessing oncology medicine registry. Computing binding index.", "chemo"), 450)
    setTimeout(() => addTerminalLog("[PROGNOSIS] Solving stage-progression equation for days 0 to 730.", "prognosis"), 600)
    setTimeout(() => addTerminalLog("[EXPLAIN] Training local SHAP/LIME decision explanation models.", "explain"), 800)
    setTimeout(() => addTerminalLog("[RENDER] Exporting visualization glow arrays & cinematic zoom vectors.", "render"), 950)

    try {
      const res = await fetch("http://127.0.0.1:8000/api/cognition/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: activeSessId,
          selected_medicine: medicine
        })
      })
      
      if (!res.ok) throw new Error("Consensus failed")
      const data = await res.json()
      
      const analysis = data.analysis
      setConsensus(analysis.consensus)
      setAgentOutputs(analysis.outputs)
      setTimelineProjections(analysis.consensus.timeline_projections || [])
      
      addTerminalLog("[SYS] Multi-Agent consensus calculations resolved: SUCCESS.", "sys")
      addTerminalLog(`[SYS] Agreement state: ${analysis.consensus.status}`, "sys")
      addTerminalLog(`[SYS] Combined confidence score: ${(analysis.consensus.confidence * 100).toFixed(1)}%`, "sys")
      
    } catch (err) {
      console.error(err)
      addTerminalLog("[SYS] Consensus network execution failed. Reverting to baseline metrics.", "sys")
    } finally {
      setAnalyzing(false)
    }
  }

  // Helper: Append Terminal Logs
  function addTerminalLog(text: string, type: "sys" | "tumor" | "chemo" | "prognosis" | "explain" | "render") {
    const timestamp = new Date().toLocaleTimeString()
    setTerminalLogs(prev => [...prev, { text, type, timestamp }])
  }

  // Scroll Terminal and Chat automatically
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [terminalLogs])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatHistory])

  // 4. Three.js Volumetric Evolving Tumor Rendering
  useEffect(() => {
    if (!canvasRef.current) return

    // Scene Setup
    const width = canvasRef.current.clientWidth
    const height = canvasRef.current.clientHeight
    const scene = new THREE.Scene()
    scene.background = null // Transparent to support background CSS gradients

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
    camera.position.z = 8

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Geometry: High-resolution Icosahedron to allow detailed vertex deformation
    const geometry = new THREE.IcosahedronGeometry(2, 6)
    
    // Save original vertex positions for deformation calculations
    const positionAttribute = geometry.attributes.position
    const originalPositions = new Float32Array(positionAttribute.count * 3)
    for (let i = 0; i < positionAttribute.count * 3; i++) {
      originalPositions[i] = positionAttribute.array[i]
    }

    // Material setup: Highly premium metallic-roughness shader with glowing emissive values
    const material = new THREE.MeshStandardMaterial({
      color: 0x8a2be2,
      roughness: 0.4,
      metalness: 0.6,
      emissive: 0x8a2be2,
      emissiveIntensity: 0.4,
      wireframe: false,
      flatShading: false
    })

    const sphere = new THREE.Mesh(geometry, material)
    scene.add(sphere)
    sphereRef.current = sphere
    materialRef.current = material

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
    scene.add(ambientLight)

    const pointLight = new THREE.PointLight(0x00e5ff, 2, 50)
    pointLight.position.set(5, 5, 5)
    scene.add(pointLight)
    lightRef.current = pointLight

    const backlight = new THREE.PointLight(0xff3b5c, 1, 50)
    backlight.position.set(-5, -5, -5)
    scene.add(backlight)

    // Animation Loop
    let animationFrameId: number
    let clock = new THREE.Clock()

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)
      const elapsedTime = clock.getElapsedTime()

      // Read real-time consensus parameters
      let glowColorHex = "#8a2be2"
      let glowIntensity = 0.4
      let roughness = 0.4
      let metalness = 0.6
      let defIntensity = 0.25
      let defFreq = 1.5
      let pulseSpeed = 1.2
      let pulseAmp = 0.2

      if (consensus && consensus.rendering_parameters && consensus.rendering_parameters.summary) {
        const sum = consensus.rendering_parameters.summary
        glowColorHex = sum.glow_color || "#8a2be2"
        glowIntensity = sum.glow_intensity || 0.4
        roughness = sum.roughness || 0.4
        metalness = sum.metallic || 0.6
        defIntensity = sum.deformation_intensity || 0.25
        defFreq = sum.deformation_frequency || 1.5
        pulseSpeed = sum.pulsation_speed || 1.2
        pulseAmp = sum.pulsation_amplitude || 0.2
      }

      // 3. Evolving biological size projection
      // Compute shrinkage modifier based on current scrubber time
      let sizeModifier = 1.0
      if (timelineProjections.length > 0) {
        // Find projection corresponding to currentTime
        const sortedProj = [...timelineProjections].sort((a,b) => a.day - b.day)
        let matched = sortedProj[0]
        for (let p of sortedProj) {
          if (currentTime >= p.day) matched = p
        }
        sizeModifier = matched.projected_volume_pct / 100.0
      }

      // Apply consensus colors & materials
      const colorHex = new THREE.Color(glowColorHex)
      material.color.copy(colorHex)
      material.emissive.copy(colorHex)
      material.emissiveIntensity = glowIntensity * (0.8 + Math.sin(elapsedTime * pulseSpeed * 2.0) * 0.2)
      material.roughness = roughness
      material.metalness = metalness

      // Pulsation scale
      const scaleVal = sizeModifier * (1.0 + Math.sin(elapsedTime * pulseSpeed) * pulseAmp * 0.15)
      sphere.scale.set(scaleVal, scaleVal, scaleVal)

      // Geometry Deformation: Organic cancer cell pulsation via noise formula
      const positions = geometry.attributes.position.array as Float32Array
      for (let i = 0; i < positionAttribute.count; i++) {
        const x = originalPositions[i * 3]
        const y = originalPositions[i * 3 + 1]
        const z = originalPositions[i * 3 + 2]

        // Length of original vector
        const len = Math.sqrt(x*x + y*y + z*z)
        if (len === 0) continue

        // Direction vector
        const dx = x / len
        const dy = y / len
        const dz = z / len

        // Organic biological wave using sinusoidal noise
        const wave = Math.sin(dx * defFreq + elapsedTime * pulseSpeed) * 
                     Math.cos(dy * defFreq + elapsedTime * pulseSpeed * 0.8) * 
                     Math.sin(dz * defFreq + elapsedTime * pulseSpeed * 1.2)

        const displacement = len + wave * defIntensity * sizeModifier
        positions[i * 3] = dx * displacement
        positions[i * 3 + 1] = dy * displacement
        positions[i * 3 + 2] = dz * displacement
      }
      geometry.attributes.position.needsUpdate = true

      // Slow rotation for cinematic showcase
      sphere.rotation.y = elapsedTime * 0.12
      sphere.rotation.x = elapsedTime * 0.06

      renderer.render(scene, camera)
    }

    animate()

    // Handle Resize
    const handleResize = () => {
      if (!canvasRef.current) return
      const w = canvasRef.current.clientWidth
      const h = canvasRef.current.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener("resize", handleResize)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [consensus, timelineProjections, currentTime])

  // 5. Timeline Play/Pause Logic (Days 0 to 730)
  useEffect(() => {
    if (isPlaying) {
      timelineInterval.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= 730) {
            setIsPlaying(false)
            return 730
          }
          // Increment time steps: 0 -> 30 -> 90 -> 180 -> 365 -> 730
          const days = [0, 30, 90, 180, 365, 730]
          const currentIndex = days.findIndex(d => d === prev)
          if (currentIndex !== -1 && currentIndex < days.length - 1) {
            return days[currentIndex + 1]
          }
          return prev + 10 > 730 ? 730 : prev + 10
        })
      }, 1000)
    } else {
      if (timelineInterval.current) clearInterval(timelineInterval.current)
    }

    return () => {
      if (timelineInterval.current) clearInterval(timelineInterval.current)
    }
  }, [isPlaying])

  const handlePlayPause = () => {
    if (currentTime >= 730) {
      setCurrentTime(0)
    }
    setIsPlaying(!isPlaying)
  }

  // 6. Interactive Copilot Chat submission
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!chatMessage.trim() || !sessionId) return

    const userMsg = chatMessage
    setChatMessage("")
    setChatHistory(prev => [...prev, { sender: "user", text: userMsg }])

    try {
      const res = await fetch("http://127.0.0.1:8000/api/cognition/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: userMsg
        })
      })

      if (!res.ok) throw new Error("Chat failed")
      const data = await res.json()
      
      setChatHistory(prev => [...prev, { sender: "copilot", text: data.reply }])
    } catch (err) {
      console.error(err)
      setChatHistory(prev => [...prev, { sender: "copilot", text: "Error syncing with clinical copilot network. Please check API connection." }])
    }
  }

  // 7. Browser TTS SpeechSynthesis Narration
  function speakClinicalReport() {
    if (!consensus || !selectedPatient) return

    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }

    const narrationScript = `
      Spawning clinical narration matrix for patient ${selectedPatient.name}. 
      Status consensus: ${consensus.status}.
      Consensus confidence resolved at ${(consensus.confidence * 100).toFixed(1)} percent.
      Primary therapy selected is ${selectedMedicine}. Treatment score is ${consensus.treatment_score} out of 100.
      Predictive staging projects stabilization will be achieved in ${consensus.months_to_stabilization} months.
      Relapse probability is estimated at ${(consensus.relapse_risk * 100).toFixed(1)} percent, with therapeutic resistance index of ${(consensus.resistance_risk * 100).toFixed(1)} percent.
      The biological digital twin visualization vectors have been updated, aligning structural red-shift shaders with active cellular deformation.
      Recommended strategy: ${consensus.recommended_strategy}.
      Clinical notes: ${consensus.clinical_narrative}
    `

    speechUtt.current = new SpeechSynthesisUtterance(narrationScript)
    speechUtt.current.lang = "en-US" // Force English language parsing
    speechUtt.current.volume = speechVolume
    
    // Attempt to locate a natural English clinical sound profile
    const voices = window.speechSynthesis.getVoices()
    const englishVoices = voices.filter(v => v.lang.startsWith("en"))
    const premiumVoice = englishVoices.find(v => v.name.includes("Google US English") || v.name.includes("Natural")) || englishVoices[0]
    if (premiumVoice) speechUtt.current.voice = premiumVoice

    speechUtt.current.onend = () => setIsSpeaking(false)
    speechUtt.current.onerror = () => setIsSpeaking(false)

    setIsSpeaking(true)
    window.speechSynthesis.speak(speechUtt.current)
  }

  // Cancel voice on component unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel()
    }
  }, [])

  // 8. Hospital-Grade Secure Upload
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !sessionId) return

    setUploading(true)
    setSecureLogs(prev => [...prev, `[INIT] Validating active session token...`])
    
    const formData = new FormData()
    formData.append("session_id", sessionId)
    formData.append("file", file)

    try {
      const res = await fetch("http://127.0.0.1:8000/api/cognition/secure-upload", {
        method: "POST",
        body: formData
      })

      if (!res.ok) throw new Error("Upload security error")
      const data = await res.json()

      setUploadedFile(data)
      setSecureLogs(prev => [
        ...prev,
        `[AUDIT] Cryptographic SHA-256 Checksum generated: ${data.integrity_checksum.substring(0,24)}...`,
        `[VAULT] Encrypting asset using ${data.encryption_cipher}... SUCCESS`,
        `[COMPLIANCE] HIPAA Access Logged: Secure upload verified. Session integrity intact.`
      ])
      
      addTerminalLog(`[SYS] Secure Clinical Asset uploaded: ${file.name}`, "sys")
    } catch (err) {
      console.error(err)
      setSecureLogs(prev => [...prev, `[FAIL] Upload rejected. Integrity breach or expired session token.`])
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A1628" }}>
      <Navbar />
      <main className="min-h-screen text-[#F3F4F6] font-sans pb-12 pt-24 relative overflow-hidden">
        
        {/* Background Neon Glowing Orbs */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-[#00E5FF]/5 rounded-full filter blur-[100px] pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#8A2BE2]/5 rounded-full filter blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6">
        
        {/* Top Control Header: Patient Selector & Security Status */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-xl mb-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#00E5FF] via-[#8A2BE2] to-emerald-500" />
          
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#00E5FF]/10 rounded-xl border border-[#00E5FF]/20 animate-pulse">
              <Cpu className="h-6 w-6 text-[#00E5FF]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                TumorVerse OS <span className="text-xs px-2 py-0.5 rounded-full bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20">v4.0 Executive</span>
              </h1>
              <p className="text-xs text-[#8899AA] mt-0.5">Clinical Cognition & Volumetric Biological Twin Network</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            
            {/* Patient Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#8899AA]">Patient Focus:</span>
              <select 
                className="bg-slate-900 border border-slate-800 text-[#00E5FF] text-xs font-medium rounded-lg px-3 py-2 outline-none focus:border-[#00E5FF]/50 transition-colors"
                value={selectedPatient?.patient_id || ""}
                onChange={(e) => {
                  const pat = patients.find(p => p.patient_id === e.target.value)
                  if (pat) handlePatientSelect(pat)
                }}
              >
                {patients.map(p => (
                  <option key={p.patient_id} value={p.patient_id}>{p.name} ({p.age}y / {p.cancer_type.replace('_',' ').toUpperCase()})</option>
                ))}
              </select>
            </div>

            {/* Session Indicator Badge */}
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">SECURE PATIENT SESSION</span>
            </div>
          </div>
        </div>

        {/* Loading overlay for entire section */}
        {loading && (
          <div className="flex flex-col items-center justify-center p-20 bg-slate-950/40 rounded-2xl border border-slate-900 border-dashed">
            <RefreshCw className="h-10 w-10 text-[#00E5FF] animate-spin mb-4" />
            <p className="text-sm text-[#8899AA]">Establishing connection with the clinical database...</p>
          </div>
        )}

        {!loading && selectedPatient && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Section: Three.js 3D Twin Workspace (Occupies 2 columns on large screens) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              
              <div className="flex flex-col h-[520px] rounded-2xl bg-slate-950/60 border border-slate-900 overflow-hidden relative shadow-2xl group hover:border-slate-800/80 transition-all duration-300">
                
                {/* 3D Viewport Title Overlay */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-950/80 px-3.5 py-1.5 rounded-xl border border-slate-800/50 backdrop-blur-md">
                  <Activity className="h-4 w-4 text-[#8A2BE2]" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">BIOLOGICAL TWIN SIMULATION</span>
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                </div>

                {/* 3D Viewport Shader Stats Overlay (HUD) */}
                {consensus && consensus.rendering_parameters && consensus.rendering_parameters.summary && (
                  <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5 items-end text-[10px] font-mono text-[#8899AA] bg-slate-950/80 p-3 rounded-xl border border-slate-800/50 backdrop-blur-md">
                    <span className="text-white font-bold mb-1 border-b border-slate-800 pb-0.5 w-full text-right uppercase text-[9px] tracking-wider">Shader Telemetry</span>
                    <div>Deformation: <span className="text-[#00E5FF] font-bold">{(consensus.rendering_parameters.summary.deformation_intensity).toFixed(3)}</span></div>
                    <div>Pulsation: <span className="text-[#8A2BE2] font-bold">{(consensus.rendering_parameters.summary.pulsation_speed).toFixed(2)} rad/s</span></div>
                    <div>Glow vector: <span className="font-bold" style={{ color: consensus.rendering_parameters.summary.glow_color }}>{consensus.rendering_parameters.summary.glow_color}</span></div>
                    <div>Opac_multiplier: <span className="text-[#00FF9C] font-bold">{consensus.rendering_parameters.summary.mesh_opacity}</span></div>
                  </div>
                )}

                {/* Three.js Canvas */}
                <div className="flex-1 w-full relative">
                  <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
                  
                  {analyzing && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20">
                      <RefreshCw className="h-8 w-8 text-[#00E5FF] animate-spin" />
                      <p className="text-sm font-semibold text-[#00E5FF] tracking-wider uppercase font-mono animate-pulse">Running AI Staging Network...</p>
                    </div>
                  )}
                </div>

                {/* Timeline play scrubber */}
                <div className="p-4 bg-slate-950 border-t border-slate-900 flex flex-col gap-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={handlePlayPause}
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/20 text-[#00E5FF] hover:bg-[#00E5FF]/20 transition-all cursor-pointer shadow-lg shadow-[#00E5FF]/5"
                        disabled={analyzing}
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                      </button>

                      <div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider block">Temporal Timeline Progression</span>
                        <span className="text-[10px] font-mono text-[#8899AA]">Staged projection steps for multi-year prognosis</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black font-mono text-[#00E5FF] neon-text">DAY {currentTime}</span>
                      <span className="text-[10px] text-[#8899AA] block">Prognosis Limit: 730 days</span>
                    </div>
                  </div>

                  {/* Scrubber track */}
                  <div className="flex items-center gap-2 select-none relative">
                    <div className="flex-1 h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden relative">
                      {/* Active Fill */}
                      <div 
                        className="h-full bg-gradient-to-r from-[#00E5FF] to-[#8A2BE2] transition-all duration-300"
                        style={{ width: `${(currentTime / 730) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Milestone ticks */}
                  <div className="flex justify-between px-1 text-[9px] font-mono text-[#8899AA]">
                    <button onClick={() => setCurrentTime(0)} className={`hover:text-white cursor-pointer ${currentTime === 0 ? "text-[#00E5FF] font-bold" : ""}`}>Day 0</button>
                    <button onClick={() => setCurrentTime(30)} className={`hover:text-white cursor-pointer ${currentTime === 30 ? "text-[#00E5FF] font-bold" : ""}`}>Day 30</button>
                    <button onClick={() => setCurrentTime(90)} className={`hover:text-white cursor-pointer ${currentTime === 90 ? "text-[#00E5FF] font-bold" : ""}`}>Day 90</button>
                    <button onClick={() => setCurrentTime(180)} className={`hover:text-white cursor-pointer ${currentTime === 180 ? "text-[#00E5FF] font-bold" : ""}`}>Day 180</button>
                    <button onClick={() => setCurrentTime(365)} className={`hover:text-white cursor-pointer ${currentTime === 365 ? "text-[#00E5FF] font-bold" : ""}`}>Day 365</button>
                    <button onClick={() => setCurrentTime(730)} className={`hover:text-white cursor-pointer ${currentTime === 730 ? "text-[#00E5FF] font-bold" : ""}`}>Year 2 (730d)</button>
                  </div>
                </div>

              </div>

              {/* Staging slider volume trend panel */}
              {consensus && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Staging Metrics */}
                  <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-900 hover:border-slate-800/80 transition-all duration-300 flex flex-col gap-4">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                      <Database className="h-4 w-4 text-[#00E5FF]" /> Multi-Year Staging Estimates
                    </h3>
                    <div className="flex flex-col gap-2">
                      {timelineProjections.map((p, idx) => (
                        <div key={idx} className={`flex items-center justify-between p-2 rounded-lg border text-xs font-mono transition-all ${currentTime === p.day ? "bg-[#00E5FF]/5 border-[#00E5FF]/20" : "bg-slate-900/40 border-slate-800/50"}`}>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${currentTime === p.day ? "bg-[#00E5FF]" : "bg-slate-700"}`} />
                            <span className="text-white font-bold">Day {p.day}</span>
                          </div>
                          <div>Size: <span className="text-[#00E5FF] font-bold">{p.projected_size_mm.toFixed(1)} mm³</span></div>
                          <div>Volume: <span className="text-emerald-400 font-bold">{p.projected_volume_pct.toFixed(0)}%</span></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Primary Recommendation Narrative card */}
                  <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-900 hover:border-slate-800/80 transition-all duration-300 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 mb-3">
                        <FileText className="h-4 w-4 text-emerald-400" /> Primary AI Recommendation
                      </h3>
                      <p className="text-sm font-semibold text-[#00E5FF] mb-2">{consensus.recommended_strategy} Therapy Protocol</p>
                      <p className="text-xs text-[#8899AA] leading-relaxed italic border-l-2 border-[#8A2BE2] pl-3 py-1">
                        "{consensus.primary_recommendation}"
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-900 flex items-center gap-3">
                      <span className="text-[10px] text-[#8899AA] uppercase tracking-wider font-mono">Select Alternative Medicine:</span>
                      <select 
                        className="bg-slate-900 border border-slate-800 text-white text-xs rounded px-2.5 py-1 outline-none"
                        value={selectedMedicine}
                        onChange={(e) => {
                          setSelectedMedicine(e.target.value)
                          triggerCognitionAnalysis(sessionId, e.target.value)
                        }}
                      >
                        {medicinesList.map(med => (
                          <option key={med} value={med}>{med}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Right Section: Clinical Cognition Consensus Center */}
            <div className="flex flex-col gap-6">
              
              {/* Consensus Banner & Dashboard Metrics */}
              {consensus ? (
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-900 hover:border-slate-800/80 transition-all duration-300 flex flex-col gap-4 shadow-2xl">
                  
                  {/* Consensus Ring */}
                  <div className="flex items-center justify-between border-b border-slate-900 pb-4">
                    <div>
                      <span className="text-[10px] text-[#8899AA] font-mono uppercase tracking-wider">Multi-Agent Agreement</span>
                      <h2 className="text-sm font-bold text-white mt-0.5">{consensus.status}</h2>
                    </div>

                    <div className="h-12 w-12 rounded-full border-2 border-dashed border-[#00E5FF]/40 flex items-center justify-center text-xs font-mono font-black text-[#00E5FF] animate-pulse">
                      {(consensus.confidence * 100).toFixed(0)}%
                    </div>
                  </div>

                  {/* Core Metrics displaying harmonized consensus values */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/50">
                      <span className="text-[9px] text-[#8899AA] uppercase font-mono tracking-wider">Treatment Score</span>
                      <span className="text-xl font-bold block text-white mt-1">{consensus.treatment_score}/100</span>
                    </div>

                    <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/50">
                      <span className="text-[9px] text-[#8899AA] uppercase font-mono tracking-wider">Effectiveness Index</span>
                      <span className="text-xl font-bold block text-white mt-1">{(consensus.effectiveness * 100).toFixed(1)}%</span>
                    </div>

                    <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/50">
                      <span className="text-[9px] text-[#8899AA] uppercase font-mono tracking-wider">Relapse Risk</span>
                      <span className="text-xl font-bold block text-red-400 mt-1">{(consensus.relapse_risk * 100).toFixed(1)}%</span>
                    </div>

                    <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/50">
                      <span className="text-[9px] text-[#8899AA] uppercase font-mono tracking-wider">Resistance Probability</span>
                      <span className="text-xl font-bold block text-orange-400 mt-1">{(consensus.resistance_risk * 100).toFixed(1)}%</span>
                    </div>
                  </div>

                  {/* 5-Agent Status Monitors (Ring display with telemetries) */}
                  <div className="flex flex-col gap-2 mt-2">
                    <h4 className="text-[10px] text-[#8899AA] uppercase font-mono tracking-wider border-b border-slate-900 pb-1.5 mb-1">Agent Telemetry Feeds</h4>
                    
                    {/* Agent 1: TumorAnalysisAgent */}
                    <div className="flex items-center justify-between text-xs font-mono p-2 rounded-lg bg-slate-900/30 border border-slate-800/30 hover:border-slate-800 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#8A2BE2] animate-pulse" />
                        <span className="text-white font-bold">Tumor Analysis Agent</span>
                      </div>
                      <span className="text-[#8899AA] text-[10px]">Aggressiveness: {consensus.aggressiveness.toFixed(2)}</span>
                    </div>

                    {/* Agent 2: TreatmentIntelligenceAgent */}
                    <div className="flex items-center justify-between text-xs font-mono p-2 rounded-lg bg-slate-900/30 border border-slate-800/30 hover:border-slate-800 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] animate-pulse" />
                        <span className="text-white font-bold">Treatment Intel Agent</span>
                      </div>
                      <span className="text-[#8899AA] text-[10px]">Compatible: Yes</span>
                    </div>

                    {/* Agent 3: RecoveryPredictionAgent */}
                    <div className="flex items-center justify-between text-xs font-mono p-2 rounded-lg bg-slate-900/30 border border-slate-800/30 hover:border-slate-800 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-white font-bold">Recovery Prediction Agent</span>
                      </div>
                      <span className="text-[#8899AA] text-[10px]">Stability: {consensus.months_to_stabilization}m</span>
                    </div>

                    {/* Agent 4: ClinicalExplanationAgent */}
                    <div className="flex items-center justify-between text-xs font-mono p-2 rounded-lg bg-slate-900/30 border border-slate-800/30 hover:border-slate-800 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
                        <span className="text-white font-bold">Clinical Explain Agent</span>
                      </div>
                      <span className="text-[#8899AA] text-[10px]">SHAP Confidence: High</span>
                    </div>

                    {/* Agent 5: VisualizationIntelligenceAgent */}
                    <div className="flex items-center justify-between text-xs font-mono p-2 rounded-lg bg-slate-900/30 border border-slate-800/30 hover:border-slate-800 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-pink-400 animate-pulse" />
                        <span className="text-white font-bold">Visualization Intel Agent</span>
                      </div>
                      <span className="text-[#8899AA] text-[10px]">Shader Sync: ACTIVE</span>
                    </div>

                  </div>

                </div>
              ) : (
                <div className="p-10 text-center rounded-2xl bg-slate-950/60 border border-slate-900 border-dashed">
                  <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-3 animate-bounce" />
                  <p className="text-sm font-semibold text-white">Consensus Layer Offline</p>
                  <p className="text-xs text-[#8899AA] mt-1">Please select an active patient target or trigger re-analysis.</p>
                </div>
              )}

              {/* Immersive voice speech console */}
              {consensus && (
                <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-900 hover:border-slate-800/80 transition-all duration-300 flex flex-col gap-4 shadow-2xl relative overflow-hidden">
                  
                  {/* Waveform graphic overlay when speaking */}
                  {isSpeaking && (
                    <div className="absolute inset-0 bg-[#00E5FF]/5 backdrop-blur-sm pointer-events-none flex items-center justify-center">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-10 bg-[#00E5FF] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <span className="w-1.5 h-16 bg-[#8A2BE2] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                        <span className="w-1.5 h-12 bg-[#00E5FF] rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
                        <span className="w-1.5 h-20 bg-[#8A2BE2] rounded-full animate-bounce" style={{ animationDelay: '0.7s' }} />
                        <span className="w-1.5 h-10 bg-[#00E5FF] rounded-full animate-bounce" style={{ animationDelay: '0.9s' }} />
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-[#8A2BE2]" /> Immersive Voice Narration
                    </h3>
                    <p className="text-xs text-[#8899AA] mt-1.5 leading-relaxed">
                      Listen to a superintelligent clinical presentation of the patient's biological twin status and multi-year recovery stages.
                    </p>
                  </div>

                  <button 
                    onClick={speakClinicalReport}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${isSpeaking ? "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20" : "bg-[#8A2BE2]/10 border border-[#8A2BE2]/20 text-[#8A2BE2] hover:bg-[#8A2BE2]/20"}`}
                  >
                    <Volume2 className="h-4 w-4" />
                    {isSpeaking ? "Terminate Clinical Readout" : "Synthesize Narrative Readout"}
                  </button>
                </div>
              )}

            </div>

          </div>
        )}

        {/* Bottom Section: Multi-Agent Process Terminal & AI Copilot Chat Console & HIPAA Secure Upload */}
        {!loading && selectedPatient && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            
            {/* Terminal Process Viewport */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-900 hover:border-slate-800/80 transition-all duration-300 flex flex-col h-[380px] shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">MULTI-AGENT CONSOLE LOGS</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest animate-pulse">● RUNNING</span>
              </div>

              {/* Scrolling Log Output */}
              <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-2.5 pr-2 custom-scrollbar">
                {terminalLogs.length === 0 ? (
                  <p className="text-[#8899AA] italic">Loading telemetry logs... consensus idle.</p>
                ) : (
                  terminalLogs.map((log, idx) => {
                    let typeColor = "text-[#8899AA]"
                    if (log.type === "sys") typeColor = "text-emerald-400"
                    if (log.type === "tumor") typeColor = "text-[#8A2BE2] font-bold"
                    if (log.type === "chemo") typeColor = "text-[#00E5FF] font-bold"
                    if (log.type === "prognosis") typeColor = "text-emerald-300"
                    if (log.type === "explain") typeColor = "text-yellow-400"
                    if (log.type === "render") typeColor = "text-pink-400"

                    return (
                      <div key={idx} className="flex gap-2.5 leading-relaxed items-start">
                        <span className="text-[#556677] select-none text-[9px] mt-0.5">{log.timestamp}</span>
                        <p className={`${typeColor} flex-1 break-all`}>{log.text}</p>
                      </div>
                    )
                  })
                )}
                <div ref={terminalEndRef} />
              </div>
            </div>

            {/* AI Copilot Console */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-900 hover:border-slate-800/80 transition-all duration-300 flex flex-col h-[380px] shadow-2xl relative">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-[#00E5FF]" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">CLINICAL COPILOT CONSOLE</span>
                </div>
                <span className="text-[9px] font-mono text-[#00E5FF] uppercase border border-[#00E5FF]/20 px-2 py-0.5 rounded bg-[#00E5FF]/5">SYNCED</span>
              </div>

              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-3 text-xs custom-scrollbar">
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col gap-1 max-w-[85%] ${msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}>
                    <span className="text-[9px] font-mono text-[#8899AA] uppercase tracking-wider">
                      {msg.sender === "user" ? "Practitioner" : "Copilot Core"}
                    </span>
                    <div className={`p-3 rounded-2xl border leading-relaxed ${msg.sender === "user" ? "bg-[#00E5FF]/10 border-[#00E5FF]/20 text-[#00E5FF] rounded-tr-none" : "bg-slate-900/60 border-slate-800 text-slate-300 rounded-tl-none"}`}>
                      {msg.text.split('\n').map((line, i) => (
                        <p key={i} className={i > 0 ? "mt-2" : ""}>{line}</p>
                      ))}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Message inputs */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input 
                  type="text" 
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Ask about staging, alternate medicines, or shader specs..."
                  className="flex-1 bg-slate-900 border border-slate-800 text-xs text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-[#00E5FF]/40 transition-colors"
                  disabled={!sessionId}
                />
                <button 
                  type="submit"
                  className="h-9 w-9 flex items-center justify-center rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/20 text-[#00E5FF] hover:bg-[#00E5FF]/20 transition-all cursor-pointer"
                  disabled={!sessionId}
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Hospital-Grade Secure Vault */}
            <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-900 hover:border-slate-800/80 transition-all duration-300 flex flex-col h-[380px] shadow-2xl relative justify-between">
              
              <div>
                <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">HIPAA SECURE DATA VAULT</span>
                  </div>
                  <Lock className="h-3.5 w-3.5 text-emerald-400" />
                </div>

                <p className="text-xs text-[#8899AA] leading-relaxed mb-4">
                  Clinical asset file verification. Submit scans or sequencing sheets to simulate AES-256 integrity-logged HIPAA audits.
                </p>

                {/* Upload drag drop box */}
                <div className="border border-dashed border-slate-850 hover:border-[#00E5FF]/40 transition-all rounded-xl p-5 text-center relative overflow-hidden bg-slate-900/20 group">
                  <input 
                    type="file" 
                    onChange={handleFileUpload} 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    disabled={uploading || !sessionId}
                  />
                  {uploading ? (
                    <RefreshCw className="h-6 w-6 text-[#00E5FF] animate-spin mx-auto mb-2" />
                  ) : (
                    <ShieldCheck className="h-6 w-6 text-emerald-400 group-hover:scale-110 transition-transform mx-auto mb-2" />
                  )}
                  <span className="text-xs font-bold text-white block">Select Scans / Sequencing PDF</span>
                  <span className="text-[10px] text-[#8899AA] block mt-0.5">HIPAA secure channel verification</span>
                </div>
              </div>

              {/* Secure Log Display */}
              <div className="flex-1 mt-4 overflow-y-auto space-y-1.5 text-[9px] font-mono text-emerald-400/90 custom-scrollbar max-h-[110px]">
                {secureLogs.length === 0 ? (
                  <span className="text-[#556677] italic">Vault ready. Cryptographic keys primed.</span>
                ) : (
                  secureLogs.map((lg, idx) => (
                    <p key={idx} className="break-all">{lg}</p>
                  ))
                )}
              </div>

              {/* Encrypted preview representation */}
              {uploadedFile && (
                <div className="mt-3 p-2 bg-slate-900 border border-slate-850 rounded-lg text-[9px] font-mono text-[#8899AA]">
                  <span className="text-white font-bold block mb-1">Encrypted Ciphertext Fragment:</span>
                  <span className="break-all text-[8px] block">{uploadedFile.encrypted_preview}</span>
                </div>
              )}

            </div>

          </div>
        )}

      </div>
    </main>
    </div>
  )
}
