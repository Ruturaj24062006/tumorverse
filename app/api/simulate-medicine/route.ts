import { NextResponse } from "next/server"

const MEDICINE_RULES: Record<string, { recommended: string[]; notRecommended: string[] }> = {
  "lung adenocarcinoma": {
    recommended: ["gefitinib", "cisplatin", "pembrolizumab"],
    notRecommended: ["trastuzumab", "imatinib"],
  },
  "breast invasive carcinoma": {
    recommended: ["trastuzumab", "paclitaxel", "tamoxifen"],
    notRecommended: ["gefitinib", "sorafenib"],
  },
  "colon adenocarcinoma": {
    recommended: ["5-fluorouracil", "oxaliplatin", "cetuximab"],
    notRecommended: ["trastuzumab", "imatinib"],
  },
}

function normalizeText(input: string) {
  return input.trim().toLowerCase()
}

function buildRecoveryTimeline(effectiveness: number) {
  const fast = effectiveness >= 0.8
  const medium = effectiveness >= 0.65 && effectiveness < 0.8

  if (fast) {
    return {
      "25%": "2 months",
      "50%": "5 months",
      "75%": "9 months",
      "100%": "14 months",
    }
  }

  if (medium) {
    return {
      "25%": "3 months",
      "50%": "6 months",
      "75%": "10 months",
      "100%": "16 months",
    }
  }

  return {
    "25%": "5 months",
    "50%": "10 months",
    "75%": "18 months",
    "100%": "Not expected with this medicine",
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const tumorTypeRaw = typeof body?.tumor_type === "string" ? body.tumor_type : ""
    const medicineRaw = typeof body?.medicine === "string" ? body.medicine : ""

    if (!tumorTypeRaw || !medicineRaw) {
      return NextResponse.json({ error: "Missing tumor_type or medicine" }, { status: 400 })
    }

    const tumorType = normalizeText(tumorTypeRaw)
    const medicine = normalizeText(medicineRaw)

    const matchedRule = Object.entries(MEDICINE_RULES).find(([key]) => tumorType.includes(key))?.[1]

    let effectiveness = 0.45
    let explanation = "No strong evidence for this medicine with the detected tumor profile."
    let effective = false

    if (matchedRule?.recommended.some((med) => medicine.includes(med))) {
      effectiveness = +(0.78 + Math.random() * 0.16).toFixed(2)
      explanation = "Medicine aligns with known target pathways for this tumor profile."
      effective = true
    } else if (matchedRule?.notRecommended.some((med) => medicine.includes(med))) {
      effectiveness = +(0.25 + Math.random() * 0.2).toFixed(2)
      explanation = "Medicine is generally not preferred for this tumor profile."
      effective = false
    } else if (medicine.includes("gefitinib") || medicine.includes("cisplatin") || medicine.includes("trastuzumab")) {
      effectiveness = +(0.62 + Math.random() * 0.2).toFixed(2)
      explanation = "Medicine has partial compatibility with the current tumor characteristics."
      effective = effectiveness >= 0.65
    } else {
      effectiveness = +(0.35 + Math.random() * 0.2).toFixed(2)
      explanation = "Insufficient compatibility markers for confident treatment response."
      effective = false
    }

    const recovery_timeline = buildRecoveryTimeline(effectiveness)

    return NextResponse.json({
      effectiveness,
      recovery_timeline,
      effective,
      explanation,
      risk_message: effective
        ? "Predicted positive response. Continue monitoring progression milestones."
        : "This medicine may worsen the tumor condition. Consider recommended alternatives.",
    })
  } catch (error) {
    console.error("simulate-medicine error", error)
    return NextResponse.json({ error: "Failed to simulate medicine" }, { status: 500 })
  }
}
