export type TwinAggressiveness = "low" | "moderate" | "high"

export interface TwinBoundingBox {
  x_min: number
  y_min: number
  x_max: number
  y_max: number
}

export interface DigitalTwinAnalysis {
  available: boolean
  mask_area_ratio: number
  mask_coverage_pct: number
  segmentation_confidence: number
  aggressiveness: TwinAggressiveness
  bounding_box?: TwinBoundingBox | null
  image_width: number
  image_height: number
  overlay_image: string
  error?: string
}

export interface StoredDigitalTwinAnalysis extends DigitalTwinAnalysis {
  sourceImageName?: string
  tumorType?: string
  createdAt?: string
}

export const DIGITAL_TWIN_STORAGE_KEY = "latestDigitalTwinAnalysis"

function toAggressiveness(value: unknown): TwinAggressiveness {
  const normalized = String(value || "").toLowerCase()
  if (normalized === "high" || normalized === "moderate" || normalized === "low") {
    return normalized
  }
  return "moderate"
}

export function toDigitalTwinAnalysis(raw: unknown): DigitalTwinAnalysis | null {
  if (!raw || typeof raw !== "object") return null
  const item = raw as Record<string, unknown>

  if (!item.available) return null

  return {
    available: true,
    mask_area_ratio: Number(item.mask_area_ratio || 0),
    mask_coverage_pct: Number(item.mask_coverage_pct || 0),
    segmentation_confidence: Number(item.segmentation_confidence || 0),
    aggressiveness: toAggressiveness(item.aggressiveness),
    bounding_box: (item.bounding_box as TwinBoundingBox | null) || null,
    image_width: Number(item.image_width || 0),
    image_height: Number(item.image_height || 0),
    overlay_image: String(item.overlay_image || ""),
    error: item.error ? String(item.error) : undefined,
  }
}

export function saveLatestDigitalTwin(
  raw: unknown,
  meta?: {
    sourceImageName?: string
    tumorType?: string
  },
): void {
  if (typeof window === "undefined") return

  const analysis = toDigitalTwinAnalysis(raw)
  if (!analysis) {
    localStorage.removeItem(DIGITAL_TWIN_STORAGE_KEY)
    return
  }

  const payload: StoredDigitalTwinAnalysis = {
    ...analysis,
    sourceImageName: meta?.sourceImageName || "",
    tumorType: meta?.tumorType || "unknown",
    createdAt: new Date().toISOString(),
  }

  localStorage.setItem(DIGITAL_TWIN_STORAGE_KEY, JSON.stringify(payload))
}

export function loadLatestDigitalTwin(currentImageName?: string): StoredDigitalTwinAnalysis | null {
  if (typeof window === "undefined") return null

  const raw = localStorage.getItem(DIGITAL_TWIN_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw) as StoredDigitalTwinAnalysis
    if (!parsed.available) return null

    if (currentImageName && parsed.sourceImageName && parsed.sourceImageName !== currentImageName) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}
