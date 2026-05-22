"use client"

import React, { useState } from "react"

interface MeshData {
  vertices: number[][]
  faces: number[][]
}

interface UploadMeshProps {
  onMesh: (mesh: MeshData) => void
}

function parseAsciiPLY(text: string): MeshData {
  const lines = text.split(/\r?\n/)
  let i = 0
  let nvert = 0
  let nface = 0
  // header
  while (i < lines.length) {
    const l = lines[i].trim()
    if (l.startsWith("element vertex")) {
      nvert = parseInt(l.split(" ")[2], 10)
    } else if (l.startsWith("element face")) {
      nface = parseInt(l.split(" ")[2], 10)
    } else if (l === "end_header") {
      i++
      break
    }
    i++
  }

  const vertices: number[][] = []
  for (let vi = 0; vi < nvert && i < lines.length; vi++, i++) {
    const parts = lines[i].trim().split(/\s+/).map(Number)
    if (parts.length >= 3) {
      // assume x y z are first three (or z,y,x) — keep as-is
      vertices.push([parts[0], parts[1], parts[2]])
    }
  }

  const faces: number[][] = []
  for (let fi = 0; fi < nface && i < lines.length; fi++, i++) {
    const parts = lines[i].trim().split(/\s+/).map(Number)
    if (parts.length >= 4 && parts[0] === 3) {
      faces.push([parts[1], parts[2], parts[3]])
    }
  }

  return { vertices, faces }
}

export default function UploadMesh({ onMesh }: UploadMeshProps) {
  const [threshold, setThreshold] = useState(0.5)
  const [busy, setBusy] = useState(false)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setBusy(true)
    try {
      const form = new FormData()
      form.append("file", f)
      if (threshold != null) {
        form.append("threshold", String(threshold))
      }

      const resp = await fetch("/volume/mesh", { method: "POST", body: form })
      if (!resp.ok) throw new Error(`Upload failed: ${resp.status}`)
      const text = await resp.text()
      const mesh = parseAsciiPLY(text)
      onMesh(mesh)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("mesh upload failed", err)
      alert("Mesh extraction failed: " + (err as any)?.message)
    } finally {
      setBusy(false)
      // clear input value so same file can be re-selected
      ;(e.target as HTMLInputElement).value = ""
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input type="file" accept=".nii,.nii.gz,.npz" onChange={handleUpload} disabled={busy} />
      <label className="text-xs text-[#8899AA]">Threshold</label>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={threshold}
        onChange={(e) => setThreshold(Number(e.target.value))}
        className="w-24"
      />
      <span className="text-xs text-[#8899AA]">{threshold.toFixed(2)}</span>
    </div>
  )
}
