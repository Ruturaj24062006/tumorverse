"use client"

import { useEffect, useRef } from "react"

export function DNAHelix() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    let time = 0

    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = []
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * 2000,
        y: Math.random() * 2000,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.4 + 0.1,
      })
    }

    function resize() {
      if (!canvas) return
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resize()
    window.addEventListener("resize", resize)

    function draw() {
      if (!canvas || !ctx) return
      const w = canvas.offsetWidth
      const h = canvas.offsetHeight
      ctx.clearRect(0, 0, w, h)

      time += 0.008

      // Background grid
      ctx.strokeStyle = "rgba(0, 229, 255, 0.03)"
      ctx.lineWidth = 1
      const gridSize = 40
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, h)
        ctx.stroke()
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }

      // Particles
      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > w) p.vx *= -1
        if (p.y < 0 || p.y > h) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0, 229, 255, ${p.alpha})`
        ctx.fill()
      }

      // DNA Double Helix
      const centerX = w / 2
      const centerY = h / 2
      const helixHeight = h * 0.7
      const amplitude = w * 0.12
      const numPoints = 60
      const verticalSpacing = helixHeight / numPoints

      const strand1: { x: number; y: number; z: number }[] = []
      const strand2: { x: number; y: number; z: number }[] = []

      for (let i = 0; i <= numPoints; i++) {
        const t = (i / numPoints) * Math.PI * 4 + time * 2
        const y = centerY - helixHeight / 2 + i * verticalSpacing
        const z1 = Math.cos(t)
        const z2 = Math.cos(t + Math.PI)
        strand1.push({ x: centerX + Math.sin(t) * amplitude, y, z: z1 })
        strand2.push({ x: centerX + Math.sin(t + Math.PI) * amplitude, y, z: z2 })
      }

      // Draw base pairs (connections between strands)
      for (let i = 0; i < strand1.length; i += 3) {
        const s1 = strand1[i]
        const s2 = strand2[i]
        const avgZ = (s1.z + s2.z) / 2
        const alpha = 0.15 + (avgZ + 1) * 0.15
        const gradient = ctx.createLinearGradient(s1.x, s1.y, s2.x, s2.y)
        gradient.addColorStop(0, `rgba(0, 229, 255, ${alpha})`)
        gradient.addColorStop(0.5, `rgba(138, 43, 226, ${alpha * 0.8})`)
        gradient.addColorStop(1, `rgba(0, 255, 156, ${alpha})`)
        ctx.beginPath()
        ctx.moveTo(s1.x, s1.y)
        ctx.lineTo(s2.x, s2.y)
        ctx.strokeStyle = gradient
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      // Draw strands
      function drawStrand(points: { x: number; y: number; z: number }[], color: string) {
        if (!ctx) return
        for (let i = 0; i < points.length - 1; i++) {
          const p = points[i]
          const alpha = 0.4 + (p.z + 1) * 0.3
          const lineW = 1.5 + (p.z + 1) * 1
          ctx.beginPath()
          ctx.moveTo(points[i].x, points[i].y)
          ctx.lineTo(points[i + 1].x, points[i + 1].y)
          ctx.strokeStyle = color.replace("ALPHA", String(alpha))
          ctx.lineWidth = lineW
          ctx.stroke()
        }

        // Nucleotide nodes
        for (let i = 0; i < points.length; i += 2) {
          const p = points[i]
          const size = 2.5 + (p.z + 1) * 1.5
          const alpha = 0.5 + (p.z + 1) * 0.25
          ctx.beginPath()
          ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
          ctx.fillStyle = color.replace("ALPHA", String(alpha))
          ctx.fill()
          ctx.beginPath()
          ctx.arc(p.x, p.y, size + 3, 0, Math.PI * 2)
          ctx.fillStyle = color.replace("ALPHA", String(alpha * 0.2))
          ctx.fill()
        }
      }

      drawStrand(strand1, "rgba(0, 229, 255, ALPHA)")
      drawStrand(strand2, "rgba(0, 255, 156, ALPHA)")

      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  )
}
