"use client"

import { motion } from "framer-motion"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table"
import { Badge } from "./badge"
import { Card } from "./card"
import { CheckCircle2, AlertTriangle, Clock } from "lucide-react"

export interface PredictionHistory {
  id: string
  patientId: string
  cancerType: string
  medicineTested: string
  result: "effective" | "moderate" | "ineffective"
  effectiveness: number
  date: string
  confidence: number
}

interface PredictionHistoryPanelProps {
  predictions: PredictionHistory[]
}

export function PredictionHistoryPanel({
  predictions,
}: PredictionHistoryPanelProps) {
  const getResultIcon = (result: string) => {
    if (result === "effective") return <CheckCircle2 className="h-4 w-4 text-[#00FF9C]" />
    if (result === "moderate") return <Clock className="h-4 w-4 text-[#FF9F43]" />
    return <AlertTriangle className="h-4 w-4 text-[#FF3B5C]" />
  }

  const getResultColor = (result: string) => {
    if (result === "effective") return "bg-[#00FF9C]/10 text-[#00FF9C]"
    if (result === "moderate") return "bg-[#FF9F43]/10 text-[#FF9F43]"
    return "bg-[#FF3B5C]/10 text-[#FF3B5C]"
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const rowVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 },
    },
  }

  return (
    <Card className="border-0 bg-black/40 p-4">
      <h3 className="mb-4 text-sm font-semibold text-[#E8EDF2]">Prediction History</h3>

      {predictions.length === 0 ? (
        <div className="rounded-lg bg-black/40 p-6 text-center">
          <p className="text-sm text-gray-400">No prediction history yet</p>
        </div>
      ) : (
        <motion.div
          className="overflow-hidden rounded-lg border border-gray-700"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-700 hover:bg-transparent">
                <TableHead className="text-xs text-gray-400">Patient ID</TableHead>
                <TableHead className="text-xs text-gray-400">Cancer Type</TableHead>
                <TableHead className="text-xs text-gray-400">Medicine</TableHead>
                <TableHead className="text-xs text-gray-400">Result</TableHead>
                <TableHead className="text-xs text-gray-400">Effectiveness</TableHead>
                <TableHead className="text-xs text-gray-400">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {predictions.map((prediction) => (
                <motion.tr
                  key={prediction.id}
                  className="border-b border-gray-700/50 hover:bg-gray-900/30 transition-colors"
                  variants={rowVariants}
                >
                  <TableCell className="text-xs font-mono text-gray-300">
                    {prediction.patientId}
                  </TableCell>
                  <TableCell className="text-xs text-gray-300">
                    {prediction.cancerType}
                  </TableCell>
                  <TableCell className="text-xs text-gray-300">
                    {prediction.medicineTested}
                  </TableCell>
                  <TableCell className="text-xs">
                    <Badge className={`border-0 capitalize ${getResultColor(prediction.result)}`}>
                      <span className="mr-1.5">{getResultIcon(prediction.result)}</span>
                      {prediction.result}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="w-16">
                      <div className="h-2 overflow-hidden rounded-full bg-gray-700">
                        <motion.div
                          className="h-full bg-[#00E5FF]"
                          initial={{ width: 0 }}
                          animate={{ width: `${prediction.effectiveness * 100}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                      <span className="mt-1 text-xs text-gray-400">
                        {Math.round(prediction.effectiveness * 100)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-gray-400">
                    {new Date(prediction.date).toLocaleDateString()}
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      )}
    </Card>
  )
}
