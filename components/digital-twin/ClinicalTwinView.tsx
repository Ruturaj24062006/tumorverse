"use client"

interface ClinicalTwinViewProps {
  aggressiveness: "low" | "moderate" | "high"
  medicineEffect: "none" | "effective" | "ineffective"
  recoveryProgress: number
  time: number
  tumorIntensity: number
  lesionCoverage?: number
  lesionConfidence?: number
  lesionFocus?: {
    x: number
    y: number
  } | null
  sourceImageUrl?: string
  sourceImageName?: string
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function ClinicalTwinView({
  aggressiveness,
  medicineEffect,
  recoveryProgress,
  time,
  tumorIntensity,
  lesionCoverage = 0,
  lesionConfidence = 0,
  lesionFocus,
  sourceImageUrl,
  sourceImageName,
}: ClinicalTwinViewProps) {
  const focusX = lesionFocus ? clamp(22 + lesionFocus.x * 56, 18, 78) : 50
  const focusY = lesionFocus ? clamp(22 + lesionFocus.y * 56, 18, 78) : 50
  const baseLesion = 8 + lesionCoverage * 18 + tumorIntensity * 6
  const effectiveScale = 1 - clamp(recoveryProgress / 100, 0, 1) * 0.55
  const ineffectiveScale = 1 + Math.min(0.75, time * 0.045)
  const responseScale =
    medicineEffect === "effective" ? effectiveScale : medicineEffect === "ineffective" ? ineffectiveScale : 1
  const lesionRadius = clamp(baseLesion * responseScale, 5, 28)

  const trendLabel =
    medicineEffect === "effective" ? "Tumor shrinking over time" : medicineEffect === "ineffective" ? "Tumor expanding over time" : "Awaiting medicine response"
  const trendColor =
    medicineEffect === "effective" ? "#00FF9C" : medicineEffect === "ineffective" ? "#FF3B5C" : "#8899AA"

  const riskColor = aggressiveness === "high" ? "#FF3B5C" : aggressiveness === "moderate" ? "#FF9F43" : "#00FF9C"

  return (
    <div className="h-full w-full p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#E8EDF2]">Clinical MRI Twin View</h3>
        <span className="rounded-md border border-white/10 bg-[#0A1628]/80 px-2 py-1 text-xs" style={{ color: trendColor }}>
          {trendLabel}
        </span>
      </div>

      <div className="grid h-[calc(100%-64px)] gap-4 lg:grid-cols-[0.9fr,2.1fr]">
        <div className="rounded-xl border border-white/10 bg-[#081325] p-3">
          <p className="mb-2 text-xs uppercase tracking-wider text-[#8899AA]">Uploaded Scan</p>
          {sourceImageUrl ? (
            <img
              src={sourceImageUrl}
              alt={sourceImageName ? `Source scan ${sourceImageName}` : "Uploaded source scan"}
              className="h-56 w-full rounded-lg border border-white/10 object-cover"
            />
          ) : (
            <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-white/15 bg-[#0A1628]/70 text-xs text-[#8899AA]">
              No uploaded image available
            </div>
          )}
          <p className="mt-2 line-clamp-2 text-[11px] text-[#8899AA]">
            {sourceImageName || "This scan is used to create the digital twin and monitor medicine response over time."}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#081325] p-3">
          <p className="mb-2 text-xs uppercase tracking-wider text-[#8899AA]">Digital Twin Slices</p>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { label: "Axial Slice", x: focusX, y: focusY },
              { label: "Coronal Slice", x: focusX * 0.9 + 5, y: 100 - focusY * 0.85 },
              { label: "Sagittal Slice", x: 100 - focusX * 0.85, y: focusY * 0.9 + 5 },
            ].map((slice) => (
              <div key={slice.label} className="rounded-xl border border-white/10 bg-[#0A1628]/55 p-3">
                <p className="mb-2 text-xs uppercase tracking-wider text-[#8899AA]">{slice.label}</p>
                <svg viewBox="0 0 100 100" className="h-44 w-full rounded-lg border border-white/10 bg-[#071021]">
                  <defs>
                    <radialGradient id={`brain-${slice.label}`} cx="50%" cy="50%" r="55%">
                      <stop offset="0%" stopColor="#4A7FA8" stopOpacity="0.38" />
                      <stop offset="70%" stopColor="#3D6F94" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#274666" stopOpacity="0.12" />
                    </radialGradient>
                  </defs>
                  <ellipse cx="50" cy="50" rx="38" ry="32" fill={`url(#brain-${slice.label})`} stroke="#73B0D8" strokeOpacity="0.32" />
                  <ellipse cx="50" cy="50" rx="24" ry="19" fill="none" stroke="#8FC4E6" strokeOpacity="0.18" />
                  <circle cx={slice.x} cy={slice.y} r={lesionRadius} fill="#FF3B5C" fillOpacity={0.2 + lesionConfidence * 0.35} />
                  <circle cx={slice.x} cy={slice.y} r={Math.max(3, lesionRadius * 0.45)} fill="#FF5A86" fillOpacity="0.52" />
                  <circle cx={slice.x} cy={slice.y} r={Math.max(1.5, lesionRadius * 0.2)} fill="#FFD1DB" fillOpacity="0.9" />
                </svg>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-white/10 bg-[#0A1628]/70 p-2">
          <p className="text-[10px] uppercase tracking-wider text-[#8899AA]">Lesion Radius</p>
          <p className="mt-1 text-sm font-bold text-[#E8EDF2]">{lesionRadius.toFixed(1)} px</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#0A1628]/70 p-2">
          <p className="text-[10px] uppercase tracking-wider text-[#8899AA]">Coverage</p>
          <p className="mt-1 text-sm font-bold text-[#E8EDF2]">{(lesionCoverage * 100).toFixed(1)}%</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#0A1628]/70 p-2">
          <p className="text-[10px] uppercase tracking-wider text-[#8899AA]">Confidence</p>
          <p className="mt-1 text-sm font-bold text-[#00E5FF]">{(lesionConfidence * 100).toFixed(0)}%</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-[#0A1628]/70 p-2">
          <p className="text-[10px] uppercase tracking-wider text-[#8899AA]">Risk</p>
          <p className="mt-1 text-sm font-bold capitalize" style={{ color: riskColor }}>{aggressiveness}</p>
        </div>
      </div>
    </div>
  )
}
