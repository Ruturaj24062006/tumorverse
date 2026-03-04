"use client"

import { motion } from "framer-motion"
import { AlertCircle, X } from "lucide-react"
import { Button } from "./button"

interface PredictionError {
  title: string
  message: string
  type: "invalid_file" | "prediction_failed" | "file_too_large" | "server_offline"
}

interface ErrorPanelProps {
  error: PredictionError
  onDismiss: () => void
}

export function ErrorPanel({ error, onDismiss }: ErrorPanelProps) {
  const getIcon = () => {
    if (error.type === "file_too_large") return "📦"
    if (error.type === "server_offline") return "🌐"
    if (error.type === "invalid_file") return "📄"
    return "⚙️"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-lg border border-[#FF3B5C]/30 bg-[#FF3B5C]/10 p-4 backdrop-blur-sm"
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          <AlertCircle className="h-5 w-5 text-[#FF3B5C]" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-[#FF3B5C]">{error.title}</h3>
          <p className="mt-1 text-sm text-[#FF3B5C]/80">{error.message}</p>
          {error.type === "server_offline" && (
            <p className="mt-2 text-xs text-[#FF3B5C]/70">
              💡 Tip: Try using demo mode or check your internet connection.
            </p>
          )}
          {error.type === "file_too_large" && (
            <p className="mt-2 text-xs text-[#FF3B5C]/70">
              💡 Tip: Please upload files smaller than 100MB.
            </p>
          )}
          {error.type === "invalid_file" && (
            <p className="mt-2 text-xs text-[#FF3B5C]/70">
              💡 Tip: Accepted formats: CSV, TSV, PNG, JPG, DICOM.
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="text-[#FF3B5C] hover:bg-[#FF3B5C]/10"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  )
}
