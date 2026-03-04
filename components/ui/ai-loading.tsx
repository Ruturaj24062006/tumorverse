"use client"

import { motion } from "framer-motion"
import { Card } from "./card"

interface LoadingStep {
  label: string
  completed: boolean
}

interface AILoadingProps {
  currentStep: number
  steps: string[]
}

export function AILoading({ currentStep, steps }: AILoadingProps) {
  const loadingSteps: LoadingStep[] = steps.map((step, index) => ({
    label: step,
    completed: index < currentStep,
  }))

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
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5 },
    },
  }

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="border-0 bg-black/40 p-6 backdrop-blur-sm">
        <div className="space-y-4">
          {loadingSteps.map((step, index) => (
            <motion.div
              key={index}
              className="flex items-center gap-3"
              variants={itemVariants}
            >
              {step.completed ? (
                <motion.div
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00FF9C]/20"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <svg
                    className="h-5 w-5 text-[#00FF9C]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </motion.div>
              ) : index === currentStep ? (
                <motion.div
                  className="h-8 w-8 rounded-full bg-[#00E5FF]/20 flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <div className="h-3 w-3 rounded-full bg-[#00E5FF] animate-pulse" />
                </motion.div>
              ) : (
                <div className="h-8 w-8 rounded-full bg-gray-700/50" />
              )}
              <span
                className={`text-sm font-medium transition-colors ${
                  step.completed
                    ? "text-[#00FF9C]"
                    : index === currentStep
                      ? "text-[#00E5FF]"
                      : "text-gray-500"
                }`}
              >
                {step.label}
              </span>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Animated progress bar */}
      <div className="h-1 overflow-hidden rounded-full bg-gray-800">
        <motion.div
          className="h-full"
          style={{ background: "linear-gradient(90deg, #00E5FF, #00FF9C)" }}
          initial={{ width: "0%" }}
          animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>

      <p className="text-center text-sm text-gray-400">
        Processing step {currentStep + 1} of {steps.length}...
      </p>
    </motion.div>
  )
}
