/**
 * useEvolutionSimulation Hook
 * Manages tumor evolution simulation state and API calls
 */

import { useState, useEffect, useCallback, useRef } from "react"
import { EvolutionSimulationParams, EvolutionSimulationResult } from "@/lib/tumorEvolutionService"
import { tumorEvolutionService } from "@/lib/tumorEvolutionService"
import { MorphFrameData } from "@/lib/meshMorphingEngine"

interface UseEvolutionSimulationProps {
  meshData?: any
  medicineEffect?: "effective" | "ineffective" | "none"
  aggressiveness?: "low" | "moderate" | "high"
  recoveryProgress?: number
  treatmentScore?: number
  autoFetch?: boolean
  enabled?: boolean
}

interface UseEvolutionSimulationReturn {
  frames: MorphFrameData[]
  isLoading: boolean
  error: Error | null
  simulationResult: EvolutionSimulationResult | null
  refetch: (params?: Partial<EvolutionSimulationParams>) => Promise<void>
  isAvailable: boolean
  estimatedDays: number
}

export function useEvolutionSimulation({
  meshData,
  medicineEffect = "none",
  aggressiveness = "moderate",
  recoveryProgress = 0,
  treatmentScore,
  autoFetch = true,
  enabled = true,
}: UseEvolutionSimulationProps): UseEvolutionSimulationReturn {
  const [frames, setFrames] = useState<MorphFrameData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [simulationResult, setSimulationResult] = useState<EvolutionSimulationResult | null>(null)
  const [isAvailable, setIsAvailable] = useState(false)
  const paramsRef = useRef<EvolutionSimulationParams | null>(null)

  // Check if evolution service is available
  useEffect(() => {
    const checkAvailability = async () => {
      const available = await tumorEvolutionService.checkStatus()
      setIsAvailable(available)
    }

    checkAvailability()
  }, [])

  // Auto-fetch when dependencies change
  useEffect(() => {
    if (!autoFetch || !enabled || !isAvailable || !meshData) return

    const params = tumorEvolutionService.createSimulationParams(
      meshData,
      medicineEffect,
      aggressiveness,
      recoveryProgress,
      treatmentScore,
    )

    paramsRef.current = params
    performFetch(params)
  }, [meshData, medicineEffect, aggressiveness, recoveryProgress, treatmentScore, autoFetch, enabled, isAvailable])

  const performFetch = useCallback(
    async (params: EvolutionSimulationParams) => {
      setIsLoading(true)
      setError(null)

      try {
        console.log("Fetching tumor evolution simulation...")

        const result = await tumorEvolutionService.simulateWithRetry(params, 3)

        if (!result) {
          throw new Error("Evolution simulation returned no result")
        }

        setSimulationResult(result)
        setFrames(result.frames || [])

        console.log(
          `Evolution simulation complete: ${result.frames?.length || 0} frames`,
        )
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        console.error("Evolution simulation failed:", error)

        // Fall back to empty frames
        setFrames([])
        setSimulationResult(null)
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  // Manual refetch function
  const refetch = useCallback(
    async (overrideParams?: Partial<EvolutionSimulationParams>) => {
      if (!isAvailable) {
        setError(new Error("Evolution service not available"))
        return
      }

      const params = overrideParams
        ? { ...paramsRef.current, ...overrideParams }
        : paramsRef.current

      if (!params) {
        setError(new Error("No parameters for evolution simulation"))
        return
      }

      paramsRef.current = params
      await performFetch(params)
    },
    [isAvailable, performFetch],
  )

  const estimatedDays = simulationResult?.timeline_days?.[simulationResult.timeline_days.length - 1] || 90

  return {
    frames,
    isLoading,
    error,
    simulationResult,
    refetch,
    isAvailable,
    estimatedDays,
  }
}

export default useEvolutionSimulation
