"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { PredictionHistoryPanel, type PredictionHistory } from "@/components/ui/prediction-history"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function PredictionHistoryPage() {
  const [history, setHistory] = useState<PredictionHistory[]>([])

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = JSON.parse(localStorage.getItem("predictionHistory") || "[]")
    setHistory(stored)
  }, [])

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A1628" }}>
      <Navbar />

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-24">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-2 -ml-3 text-[#8899AA] hover:text-[#E8EDF2]">
              <Link href="/predict">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Prediction
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-[#E8EDF2]">Prediction History</h1>
            <p className="mt-2 text-sm text-[#8899AA]">
              Review previous tumor predictions and medicine simulation outcomes.
            </p>
          </div>
        </div>

        <PredictionHistoryPanel predictions={history} />
      </main>
    </div>
  )
}
