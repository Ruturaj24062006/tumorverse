"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import DashboardBG from "./DashboardBG"
import { CancerDistribution, GeneRadar } from "@/components/dashboard/DashboardBG"
import { Activity, Database, Shield } from "lucide-react"

export default function Dashboard() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((json) => setData(json))
  }, [])

  if (!data) return <div className="flex h-screen items-center justify-center text-white">Loading Analytics...</div>

  return (
    <div className="relative min-h-screen text-white">
      <DashboardBG />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-7xl px-6 pt-24 pb-12">
        <header className="mb-10">
          <h1 className="text-4xl font-bold neon-text">System Intelligence</h1>
          <p className="text-[#8899AA]">Real-time model performance and genomic distribution metrics.</p>
        </header>

        {/* Top Stats */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
          <StatCard icon={Shield} label="Model Accuracy" value={`${(data.model_accuracy * 100).toFixed(1)}%`} color="#00E5FF" />
          <StatCard icon={Database} label="Total Samples" value={data.total_samples.toLocaleString()} color="#8A2BE2" />
          <StatCard icon={Activity} label="Cancer Types" value={data.cancer_types} color="#00FF9C" />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#8899AA] mb-6">Class Distribution</h3>
            <CancerDistribution data={data.class_distribution} />
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-white/10">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#8899AA] mb-6">Top Gene Importance</h3>
            <GeneRadar data={data.top_genes.slice(0, 6)} />
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/5 flex items-center gap-5">
      <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
        <Icon className="h-6 w-6" style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-[#8899AA] uppercase font-medium">{label}</p>
        <p className="text-2xl font-bold text-[#E8EDF2]">{value}</p>
      </div>
    </div>
  )
}