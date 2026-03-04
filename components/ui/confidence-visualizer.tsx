"use client"

import { motion } from "framer-motion"
import { Card } from "./card"

interface ConfidenceVisualizerProps {
  confidence: number
  label?: string
  showPercentage?: boolean
}

export function ConfidenceVisualizer({
  confidence,
  label = "Confidence Level",
  showPercentage = true,
}: ConfidenceVisualizerProps) {
  const percentage = Math.round(confidence * 100)
  const color =
    percentage >= 80
      ? "#00FF9C"
      : percentage >= 60
        ? "#00E5FF"
        : percentage >= 40
          ? "#FF9F43"
          : "#FF3B5C"

  const barVariants = {
    hidden: { width: 0 },
    visible: {
      width: `${percentage}%`,
      transition: { duration: 1.2, ease: "easeOut" as const },
    },
  }

  const textVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { delay: 0.5, duration: 0.6 } },
  }

  return (
    <Card
      className="border-0 p-4"
      style={{ background: "linear-gradient(135deg, rgba(0,229,255,0.05), rgba(0,255,156,0.05))" }}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">{label}</label>
          {showPercentage && (
            <motion.span
              className="text-lg font-bold"
              style={{ color }}
              variants={textVariants}
              initial="hidden"
              animate="visible"
            >
              {percentage}%
            </motion.span>
          )}
        </div>

        {/* Confidence bar */}
        <div className="h-3 overflow-hidden rounded-full bg-gray-800">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            variants={barVariants}
            initial="hidden"
            animate="visible"
          />
        </div>

        {/* Confidence description */}
        <p className="text-xs text-gray-400">
          {percentage >= 80
            ? "✓ Very High Confidence"
            : percentage >= 60
              ? "✓ High Confidence"
              : percentage >= 40
                ? "△ Moderate Confidence"
                : "⚠ Low Confidence"}
        </p>

        {/* Segmented display */}
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((segment) => (
            <motion.div
              key={segment}
              className="h-1 flex-1 rounded-full bg-gray-700"
              animate={{
                backgroundColor:
                  segment < (percentage / 100) * 5
                    ? color
                    : "rgb(55, 65, 81)",
              }}
              transition={{ duration: 0.6, delay: segment * 0.1 }}
            />
          ))}
        </div>
      </div>
    </Card>
  )
}
