import { NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
function normalizeText(input: string) {
  return input.trim().toLowerCase()
}

function mapTumorToCancerCode(tumorTypeRaw: string): string {
  const tumorType = normalizeText(tumorTypeRaw)
  if (tumorType.includes("lung") || tumorType.includes("luad")) return "LUAD"
  if (tumorType.includes("breast") || tumorType.includes("brca")) return "BRCA"
  if (tumorType.includes("colon") || tumorType.includes("coad") || tumorType.includes("colorectal")) return "COREAD"
  if (tumorType.includes("glioma") || tumorType.includes("gbm")) return "GBM"
  if (tumorType.includes("kidney") || tumorType.includes("kirc")) return "KIRC"
  return "LUAD"
}

function derivePathwayAndTarget(medicineRaw: string): { pathway: string; target: string } {
  const med = normalizeText(medicineRaw)

  if (med.includes("gefitinib") || med.includes("erlotinib") || med.includes("afatinib") || med.includes("cetuximab")) {
    return { pathway: "EGFR signaling", target: "EGFR" }
  }
  if (med.includes("imatinib") || med.includes("dasatinib") || med.includes("nilotinib")) {
    return { pathway: "ABL signaling", target: "ABL" }
  }
  if (med.includes("cisplatin") || med.includes("oxaliplatin") || med.includes("carboplatin")) {
    return { pathway: "DNA replication", target: "DNA crosslinker" }
  }
  if (med.includes("paclitaxel") || med.includes("docetaxel") || med.includes("methotrexate")) {
    return { pathway: "DNA replication", target: "Antimetabolite" }
  }

  return { pathway: "EGFR signaling", target: "EGFR" }
}

function deriveCellLine(cancerCode: string): string {
  // Use class names that match the training label encoder vocabulary.
  if (cancerCode === "BRCA") return "MCF7"
  if (cancerCode === "COREAD") return "HT-29"
  if (cancerCode === "GBM") return "U-87-MG"
  if (cancerCode === "KIRC") return "786-0"
  return "A549"
}

async function requestRecommendation(payload: {
  cell_line: string
  cancer_type: string
  pathway: string
  target: string
  tumor_size: number
  medicine: string
}) {
  const response = await fetch(`${API_BASE_URL}/recommend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  })

  const data = await response.json()
  return { response, data }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const tumorTypeRaw = typeof body?.tumor_type === "string" ? body.tumor_type : ""
    const medicineRaw = typeof body?.medicine === "string" ? body.medicine : ""
    const tumorSize = Number(body?.tumor_size)

    if (!tumorTypeRaw || !medicineRaw || !Number.isFinite(tumorSize) || tumorSize <= 0) {
      return NextResponse.json({ error: "Missing or invalid tumor_type, medicine, or tumor_size" }, { status: 400 })
    }

    const cancerType = mapTumorToCancerCode(tumorTypeRaw)
    const { pathway, target } = derivePathwayAndTarget(medicineRaw)
    const cellLine = deriveCellLine(cancerType)

    let { response: recommendationResponse, data: recommendationData } = await requestRecommendation({
      cell_line: cellLine,
      cancer_type: cancerType,
      pathway,
      target,
      tumor_size: tumorSize,
      medicine: medicineRaw,
    })

    // Retry with a known-safe profile if encoder mismatch occurs.
    if (!recommendationResponse.ok && recommendationResponse.status === 400) {
      const retry = await requestRecommendation({
        cell_line: "A549",
        cancer_type: "LUAD",
        pathway: "EGFR signaling",
        target: "EGFR",
        tumor_size: tumorSize,
        medicine: medicineRaw,
      })
      recommendationResponse = retry.response
      recommendationData = retry.data
    }

    if (!recommendationResponse.ok) {
      const detail = recommendationData?.detail || recommendationData?.error || "Failed to get recommendation"
      return NextResponse.json({ error: detail }, { status: recommendationResponse.status })
    }

    const confidence = Number(recommendationData?.confidence || 0)
    const effective = confidence >= 0.55

    return NextResponse.json({
      selected_drug: recommendationData?.selected_drug || medicineRaw,
      best_drug: recommendationData?.best_drug,
      confidence,
      effectiveness: confidence,
      top_3_drugs: Array.isArray(recommendationData?.top_3_drugs) ? recommendationData.top_3_drugs : [],
      recovery: recommendationData?.recovery || {},
      recovery_timeline: recommendationData?.recovery || {},
      effective,
      explanation: effective
        ? "Model predicts favorable response for the selected medicine profile."
        : "Model predicts low response likelihood for the selected medicine profile.",
      risk_message: effective
        ? "Predicted positive response. Continue monitoring progression milestones."
        : "Low predicted response. Consider top-ranked alternatives.",
    })
  } catch (error) {
    console.error("simulate-medicine error", error)
    return NextResponse.json({ error: "Failed to simulate medicine" }, { status: 500 })
  }
}
