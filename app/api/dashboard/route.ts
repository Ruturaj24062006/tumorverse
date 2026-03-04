import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    model_accuracy: 0.946,
    total_samples: 11284,
    cancer_types: 10,
    model_version: "TumorVerse-v2.4",
    class_distribution: [
      { name: "Lung Adeno.", count: 1450 },
      { name: "Breast Inv.", count: 1680 },
      { name: "Colon Adeno.", count: 980 },
      { name: "Glioblastoma", count: 720 },
      { name: "Kidney RCC", count: 1120 },
      { name: "Liver HCC", count: 890 },
      { name: "Prostate Adeno.", count: 1340 },
      { name: "Melanoma", count: 1050 },
      { name: "Thyroid Carc.", count: 1210 },
      { name: "Ovarian Serous", count: 844 },
    ],
    top_genes: [
      { gene: "TP53", importance: 0.95 },
      { gene: "EGFR", importance: 0.89 },
      { gene: "BRCA1", importance: 0.86 },
      { gene: "KRAS", importance: 0.84 },
      { gene: "PTEN", importance: 0.81 },
      { gene: "BRAF", importance: 0.79 },
      { gene: "PIK3CA", importance: 0.76 },
      { gene: "VHL", importance: 0.73 },
      { gene: "IDH1", importance: 0.71 },
      { gene: "APC", importance: 0.68 },
    ],
    confusion_matrix: {
      labels: ["Lung", "Breast", "Colon", "GBM", "Kidney", "Liver", "Prostate", "Melanoma", "Thyroid", "Ovarian"],
      matrix: [
        [92, 2, 1, 0, 1, 1, 0, 1, 1, 1],
        [1, 95, 0, 0, 0, 1, 1, 0, 1, 1],
        [1, 0, 93, 1, 1, 2, 0, 1, 0, 1],
        [0, 0, 1, 94, 1, 1, 0, 1, 1, 1],
        [1, 0, 1, 1, 93, 2, 1, 0, 0, 1],
        [1, 1, 2, 1, 2, 90, 1, 1, 0, 1],
        [0, 1, 0, 0, 1, 1, 95, 0, 1, 1],
        [1, 0, 1, 1, 0, 1, 0, 94, 1, 1],
        [1, 1, 0, 1, 0, 0, 1, 1, 94, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 91],
      ],
    },
  })
}
