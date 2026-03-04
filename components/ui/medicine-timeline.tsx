"use client"

import { motion } from "framer-motion"
import { Card } from "./card"

interface RecoveryTimeline {
  [key: string]: string
}

interface MedicineTimelineProps {
  timeline: RecoveryTimeline
  medicineEffect: "effective" | "ineffective"
  activeMedicine: string
}

export function MedicineTimeline({
  timeline,
  medicineEffect,
  activeMedicine,
}: MedicineTimelineProps) {
  const timelinePoints = [
    { percent: "25%", label: "1st Phase" },
    { percent: "50%", label: "Halfway" },
    { percent: "75%", label: "Late Stage" },
    { percent: "100%", label: "Complete" },
  ]

  const isEffective = medicineEffect === "effective"
  const color = isEffective ? "#00FF9C" : "#FF3B5C"

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  }

  return (
    <Card className="border-0 bg-black/40 p-4">
      <h3 className="mb-4 text-sm font-semibold text-[#E8EDF2]">Recovery Timeline</h3>

      <motion.div
        className="space-y-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Timeline visualization */}
        <div className="relative pt-8 pb-2">
          {/* Progress line */}
          <div className="absolute left-0 top-0 h-1 w-full rounded-full bg-gray-700" />
          <motion.div
            className="absolute left-0 top-0 h-1 rounded-full transition-all"
            style={{ backgroundColor: color }}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeOut" }}
          />

          {/* Timeline points */}
          <div className="flex items-center justify-between">
            {timelinePoints.map((point, index) => (
              <motion.div
                key={index}
                className="flex flex-col items-center"
                variants={itemVariants}
              >
                <motion.div
                  className="mb-2 h-3 w-3 rounded-full border-2"
                  style={{
                    borderColor: color,
                    backgroundColor: index < timelinePoints.length - 1 ? "transparent" : color,
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: index * 0.3,
                    repeat: Infinity,
                  }}
                />
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-300">{point.label}</p>
                  <p className="text-xs text-gray-500">{point.percent}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Timeline details */}
        <div className="mt-6 space-y-2 border-t border-gray-700 pt-4">
          {timelinePoints.map((point) => (
            <motion.div
              key={point.percent}
              className="flex items-center justify-between rounded-lg bg-gray-900/20 p-2"
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
            >
              <span className="text-xs text-gray-400">{point.percent} recovery</span>
              <span
                className="font-mono text-sm font-semibold"
                style={{ color }}
              >
                {timeline[point.percent]}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Status indicator */}
        <div className="mt-4 rounded-lg border border-gray-700/50 bg-gray-900/30 p-3">
          <p className="text-xs text-gray-400">
            {isEffective
              ? "✓ Medicine is showing positive response. Tumor shrinking expected."
              : "⚠ Medicine may not be effective. Consider alternatives."}
          </p>
        </div>
      </motion.div>
    </Card>
  )
}
