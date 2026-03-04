import { NextResponse } from "next/server"

// Mock database of medicines
const medicines = [
  { name: "Imatinib", typicalTarget: "leukemia, gist" },
  { name: "Paclitaxel", typicalTarget: "breast, ovarian, lung" },
  { name: "Cisplatin", typicalTarget: "lung, ovarian, testicular" },
  { name: "Doxorubicin", typicalTarget: "breast, bladder, lymphoma" },
  { name: "Trastuzumab", typicalTarget: "breast (HER2+), stomach" },
  { name: "Gefitinib", typicalTarget: "lung (EGFR)" }
]

export async function POST(req: Request) {
  try {
    const { cancer_type, medicine } = await req.json()

    if (!cancer_type || !medicine) {
      return NextResponse.json({ error: "Missing cancer_type or medicine" }, { status: 400 })
    }

    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    const targetMed = medicines.find(m => m.name.toLowerCase() === medicine.toLowerCase())
    const cancerText = cancer_type.toLowerCase()

    let response = "low effectiveness" // Default
    let confidence = 0.4 + Math.random() * 0.2 // 0.4 - 0.6

    // Simple heuristic match for simulation
    if (targetMed && targetMed.typicalTarget.split(",").some(t => cancerText.includes(t.trim().split(" ")[0]))) {
      response = "effective"
      confidence = 0.75 + Math.random() * 0.2 // 0.75 - 0.95
    }

    // Add a bit of randomness so it's not strictly deterministic for the same cancer type
    if (Math.random() < 0.1) {
      response = response === "effective" ? "low effectiveness" : "effective"
      confidence = Math.max(0.3, confidence - 0.2)
    }


    return NextResponse.json({
      cancer_type,
      medicine,
      response,
      confidence
    })

  } catch (error) {
    console.error("Simulation error:", error)
    return NextResponse.json({ error: "Failed to simulate drug effect" }, { status: 500 })
  }
}
