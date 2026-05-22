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
  if (tumorType.includes("pituitary")) return "PITUITARY"
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
  if (med.includes("temozolomide") || med.includes("lomustine")) {
    return { pathway: "DNA replication", target: "DNA alkylator" }
  }
  if (med.includes("bevacizumab")) {
    return { pathway: "Angiogenesis", target: "VEGF" }
  }
  if (med.includes("cabergoline")) {
    return { pathway: "Dopaminergic signaling", target: "D2 receptor" }
  }
  if (med.includes("octreotide") || med.includes("pasireotide")) {
    return { pathway: "Somatostatin signaling", target: "SSTR" }
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
  dosage: number
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

async function requestRecoveryTimeline(payload: {
  tumor_size: number
  aggressiveness: string
  medicine: string
  effectiveness: number
  cancer_type: string
  response_trend: number
  dosage: number
  treatment_score: number
}) {
  const response = await fetch(`${API_BASE_URL}/predict_recovery_timeline`, {
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
    const aggressivenessRaw = typeof body?.aggressiveness === "string" ? body.aggressiveness : "moderate"
    const tumorSize = Number(body?.tumor_size)
    const dosage = Number(body?.dosage ?? 50)

    if (!tumorTypeRaw || !medicineRaw || !Number.isFinite(tumorSize) || tumorSize <= 0 || !Number.isFinite(dosage) || dosage <= 0) {
      return NextResponse.json({ error: "Missing or invalid tumor_type, medicine, tumor_size, or dosage" }, { status: 400 })
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
      dosage,
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
        dosage,
        medicine: medicineRaw,
      })
      recommendationResponse = retry.response
      recommendationData = retry.data
    }

    if (!recommendationResponse.ok) {
      const detail = recommendationData?.detail || recommendationData?.error || "Failed to get recommendation"
      return NextResponse.json({ error: detail }, { status: recommendationResponse.status })
    }

    const timelineRequest = await requestRecoveryTimeline({
      tumor_size: tumorSize,
      aggressiveness: aggressivenessRaw,
      medicine: medicineRaw,
      effectiveness: Number(recommendationData?.effectiveness_ratio ?? recommendationData?.confidence ?? 0),
      cancer_type: cancerType,
      response_trend: Math.max(
        0,
        Math.min(
          1,
          Number(recommendationData?.tumor_change_pct ?? 0) / 100 +
            Number(recommendationData?.effectiveness_ratio ?? recommendationData?.confidence ?? 0) * 0.5,
        ),
      ),
      dosage,
      treatment_score: Number(recommendationData?.treatment_score ?? 0),
    })

    const timelineData = timelineRequest.response.ok ? timelineRequest.data : {}
    const formatMonth = (value: unknown) => {
      if (value === null || value === undefined || value === "") return "Not achieved"
      const numeric = Number(value)
      if (!Number.isFinite(numeric)) return String(value)
      return `${numeric.toFixed(2)} months`
    }

    const confidence = Number(recommendationData?.confidence || 0)
    const tumorReduction = Number(recommendationData?.tumor_reduction || 0)
    const treatmentScore = Number(recommendationData?.treatment_score || 0)
    const recoveryMonths = recommendationData?.recovery_months || {}
    const recoveryTimeline = recommendationData?.recovery || {}
    const status = typeof recommendationData?.status === "string" ? recommendationData.status : tumorReduction > 0 ? "shrinking" : tumorReduction < 0 ? "growing" : "stable"
    const treatmentStatus = typeof timelineData?.treatment_status === "string" ? timelineData.treatment_status : status
    const effective = !["Treatment Ineffective", "Minimal Response", "Poor Response", "Progressive Disease"].includes(treatmentStatus)

    return NextResponse.json({
      selected_drug: recommendationData?.selected_drug || medicineRaw,
      best_drug: recommendationData?.best_drug,
      confidence,
      effectiveness: Number(recommendationData?.effectiveness_ratio ?? confidence),
      treatment_score: treatmentScore,
      status: treatmentStatus,
      tumor_reduction: tumorReduction,
      tumor_change_pct: Number(recommendationData?.tumor_change_pct || tumorReduction),
      growth_rate: Number(recommendationData?.kinetics?.growth_rate || 0),
      drug_effect: Number(recommendationData?.kinetics?.drug_effect || 0),
      projected_tumor_size: Number(recommendationData?.projected_tumor_size || tumorSize),
      recovery_months: recoveryMonths,
      recovery_timeline: {
        "25%": formatMonth(timelineData?.recovery_25 ?? recommendationData?.recovery_timeline?.["25%"] ?? recoveryMonths?.["25%"]),
        "50%": formatMonth(timelineData?.recovery_50 ?? recommendationData?.recovery_timeline?.["50%"] ?? recoveryMonths?.["50%"]),
        "75%": formatMonth(timelineData?.recovery_75 ?? recommendationData?.recovery_timeline?.["75%"] ?? recoveryMonths?.["75%"]),
        stabilization: formatMonth(timelineData?.stabilization_time ?? recommendationData?.stabilization_time),
      },
      recovery_score: Number(timelineData?.recovery_score ?? recommendationData?.recovery_score ?? 0),
      recovery_probability: Number(timelineData?.recovery_probability ?? recommendationData?.recovery_probability ?? 0),
      stabilization_time: timelineData?.stabilization_time ?? recommendationData?.stabilization_time ?? null,
      treatment_status: treatmentStatus,
      risk_level: timelineData?.risk_level || recommendationData?.risk_level || "moderate",
      response_curve: Array.isArray(timelineData?.response_curve) ? timelineData.response_curve : recommendationData?.response_curve || [],
      timeline_curve: Array.isArray(timelineData?.timeline_curve) ? timelineData.timeline_curve : recommendationData?.timeline_curve || [],
      stage_probabilities: timelineData?.stage_probabilities || recommendationData?.stage_probabilities || {},
      stage_likelihoods: timelineData?.stage_likelihoods || recommendationData?.stage_likelihoods || {},
      response_band: timelineData?.response_band || recommendationData?.response_band || "moderate",
      confidence_interval: timelineData?.confidence_interval || recommendationData?.confidence_interval || null,
      relapse_probability: Number(timelineData?.relapse_probability ?? recommendationData?.relapse_probability ?? 0),
      resistance_estimation: Number(timelineData?.resistance_estimation ?? recommendationData?.resistance_estimation ?? 0),
      months_to_stability: timelineData?.months_to_stability ?? recommendationData?.stabilization_time ?? null,
      top_3_drugs: Array.isArray(recommendationData?.top_3_drugs) ? recommendationData.top_3_drugs : [],
      recovery: recommendationData?.recovery || {},
      effective,
      explanation: treatmentScore >= 70
        ? "Master treatment score indicates a strong synchronized response across recovery, tumor control, and visualization."
        : treatmentScore >= 40
          ? "Master treatment score indicates a partial or unstable response with limited recovery momentum."
          : "Master treatment score indicates poor compatibility, weak recovery, and aggressive tumor behavior.",
      risk_message: treatmentScore >= 70
        ? "High treatment score. Treatment response should remain stable and visually calmer."
        : treatmentScore >= 40
          ? "Intermediate treatment score. Response is partially controlled but not fully stable."
          : "Low treatment score. Expect poor recovery and more aggressive tumor behavior.",
    })
  } catch (error) {
    console.error("simulate-medicine error", error)
    return NextResponse.json({ error: "Failed to simulate medicine" }, { status: 500 })
  }
}
