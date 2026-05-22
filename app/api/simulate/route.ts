import { NextResponse } from "next/server"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface SimulateRequestBody {
  effectiveness: number
  mask_image: string
  original_image?: string
  steps?: number
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SimulateRequestBody

    const effectiveness = Number(body?.effectiveness)
    const steps = Number(body?.steps ?? 8)
    const maskImage = typeof body?.mask_image === "string" ? body.mask_image : ""
    const originalImage = typeof body?.original_image === "string" ? body.original_image : undefined

    if (!Number.isFinite(effectiveness) || effectiveness < 0 || effectiveness > 1) {
      return NextResponse.json({ error: "Invalid effectiveness. Expected number in range [0, 1]." }, { status: 400 })
    }

    if (!Number.isFinite(steps) || steps < 5 || steps > 15) {
      return NextResponse.json({ error: "Invalid steps. Expected integer in range [5, 15]." }, { status: 400 })
    }

    if (!maskImage.startsWith("data:image/")) {
      return NextResponse.json({ error: "mask_image must be a base64 image data URL." }, { status: 400 })
    }

    const response = await fetch(`${API_BASE_URL}/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        effectiveness,
        steps: Math.round(steps),
        mask_image: maskImage,
        original_image: originalImage,
      }),
      cache: "no-store",
    })

    const data = await response.json()
    if (!response.ok) {
      return NextResponse.json({ error: data?.detail || data?.error || "Failed to simulate tumor progression" }, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("simulate route error", error)
    return NextResponse.json({ error: "Failed to generate tumor simulation" }, { status: 500 })
  }
}