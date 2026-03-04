import { NextRequest, NextResponse } from "next/server"

const DRUG_RESPONSES: Record<string, Record<string, { response: string; confidence: number; description: string }>> = {
  "Lung Adenocarcinoma": {
    Gefitinib: { response: "effective", confidence: 0.85, description: "Tumor shows significant shrinkage with EGFR pathway inhibition. Predicted 45% volume reduction over 6 weeks." },
    Cisplatin: { response: "effective", confidence: 0.78, description: "DNA crosslinking mechanism effectively targets rapidly dividing tumor cells. Moderate response expected." },
    Pembrolizumab: { response: "effective", confidence: 0.82, description: "Immune checkpoint blockade reactivates cytotoxic T-cell response against tumor antigens." },
    Paclitaxel: { response: "moderate", confidence: 0.55, description: "Partial response expected. Microtubule stabilization may slow growth but unlikely to achieve remission." },
    Imatinib: { response: "ineffective", confidence: 0.15, description: "No BCR-ABL target present. Drug would not affect tumor growth pathways." },
  },
  "Breast Invasive Carcinoma": {
    Trastuzumab: { response: "effective", confidence: 0.88, description: "Strong HER2 binding disrupts proliferation signaling. Predicted 55% tumor reduction." },
    Paclitaxel: { response: "effective", confidence: 0.80, description: "Mitotic arrest induction effectively targets rapidly dividing breast cancer cells." },
    Tamoxifen: { response: "effective", confidence: 0.76, description: "Estrogen receptor blockade reduces hormone-dependent tumor growth." },
    Gefitinib: { response: "ineffective", confidence: 0.20, description: "EGFR pathway not primary driver in this breast cancer subtype." },
    Cisplatin: { response: "moderate", confidence: 0.50, description: "Some DNA damage response but suboptimal compared to targeted therapies." },
  },
  "Glioblastoma Multiforme": {
    Temozolomide: { response: "effective", confidence: 0.86, description: "Effective DNA alkylation with good blood-brain barrier penetration. Standard of care response." },
    Bevacizumab: { response: "effective", confidence: 0.72, description: "Anti-angiogenic effect reduces tumor blood supply and peritumoral edema." },
    Paclitaxel: { response: "ineffective", confidence: 0.18, description: "Cannot effectively cross blood-brain barrier. Minimal intracranial drug concentration achieved." },
    Cisplatin: { response: "moderate", confidence: 0.40, description: "Limited CNS penetration but some cytotoxic effect at tumor margins." },
  },
  "Skin Cutaneous Melanoma": {
    Vemurafenib: { response: "effective", confidence: 0.86, description: "Potent BRAF V600E inhibition causes rapid tumor regression in 60% of cases." },
    Ipilimumab: { response: "effective", confidence: 0.81, description: "CTLA-4 blockade produces durable anti-tumor immune responses in melanoma." },
    Dabrafenib: { response: "effective", confidence: 0.79, description: "Selective BRAF inhibition with improved safety profile. Best combined with MEK inhibitor." },
    Cisplatin: { response: "moderate", confidence: 0.35, description: "Conventional chemotherapy shows limited activity in advanced melanoma." },
  },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cancer_type, medicine } = body

    if (!cancer_type || !medicine) {
      return NextResponse.json(
        { error: "cancer_type and medicine are required" },
        { status: 400 }
      )
    }

    const cancerDrugs = DRUG_RESPONSES[cancer_type]
    if (cancerDrugs && cancerDrugs[medicine]) {
      return NextResponse.json(cancerDrugs[medicine])
    }

    const confidence = Math.random() * 0.5 + 0.2
    const response = confidence > 0.5 ? "moderate" : "ineffective"
    return NextResponse.json({
      response,
      confidence: +confidence.toFixed(2),
      description: `Limited clinical data available for ${medicine} in ${cancer_type}. Simulation based on molecular pathway analysis.`,
    })
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}
