/**
 * Tumor Evolution Service
 * Handles API calls for tumor evolution simulation
 */

import { MorphFrameData } from "@/lib/meshMorphingEngine"

export interface EvolutionSimulationParams {
  volumeData: {
    mesh?: {
      vertices: number[][]
      faces: number[][]
      densityMap?: number[]
      opacityMap?: number[]
      tissueRegions?: number[]
    }
  }
  effectiveness: number // 0-1
  treatmentScore?: number // 0-100
  recoveryProgress?: number // 0-100
  aggressiveness: "low" | "moderate" | "high"
  medicineType?: "standard" | "targeted" | "immunotherapy"
  simulationDays?: number
}

export interface EvolutionSimulationResult {
  frames: MorphFrameData[]
  timeline_days: number[]
  status_progression: string[]
  volume_progression: number[]
  medicine_response_score: number
  final_aggressiveness: number
  success: boolean
}

class TumorEvolutionService {
  private baseUrl: string

  constructor(baseUrl: string = "http://localhost:8000/api/evolve") {
    this.baseUrl = baseUrl
  }

  /**
   * Request tumor evolution simulation from backend
   */
  async simulateTumorEvolution(
    params: EvolutionSimulationParams,
  ): Promise<EvolutionSimulationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/simulate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          volume_data: params.volumeData,
          effectiveness: params.effectiveness,
          treatment_score: params.treatmentScore,
          recovery_progress: params.recoveryProgress ?? 0,
          aggressiveness: params.aggressiveness,
          medicine_type: params.medicineType ?? "standard",
          simulation_days: params.simulationDays ?? 90,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          `Evolution simulation failed: ${errorData.detail || response.statusText}`,
        )
      }

      const result: EvolutionSimulationResult = await response.json()
      return result
    } catch (error) {
      console.error("Evolution simulation error:", error)
      throw error
    }
  }

  /**
   * Check if evolution service is available
   */
  async checkStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/status`)
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Simulate evolution with retry logic
   */
  async simulateWithRetry(
    params: EvolutionSimulationParams,
    maxRetries: number = 3,
  ): Promise<EvolutionSimulationResult | null> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(
          `Evolution simulation attempt ${attempt + 1}/${maxRetries}...`,
        )
        return await this.simulateTumorEvolution(params)
      } catch (error) {
        console.warn(`Attempt ${attempt + 1} failed:`, error)

        if (attempt < maxRetries - 1) {
          // Wait before retry (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000),
          )
        }
      }
    }

    console.error("Evolution simulation failed after all retries")
    return null
  }

  /**
   * Helper to convert mesh data to evolution parameters
   */
  static createSimulationParams(
    meshData: any,
    medicineEffectiveness: "effective" | "ineffective" | "none",
    tumorAggressiveness: "low" | "moderate" | "high",
    recoveryProgress: number = 0,
    treatmentScore?: number,
  ): EvolutionSimulationParams {
    const effectiveness =
      medicineEffectiveness === "effective"
        ? 0.8
        : medicineEffectiveness === "ineffective"
          ? 0.2
          : 0.5

    return {
      volumeData: {
        mesh: {
          vertices: meshData.vertices || [],
          faces: meshData.faces || [],
          densityMap: meshData.densityMap,
          opacityMap: meshData.opacityMap,
          tissueRegions: meshData.tissueRegions,
        },
      },
      effectiveness,
      treatmentScore,
      recoveryProgress,
      aggressiveness: tumorAggressiveness,
      medicineType: "standard",
      simulationDays: 90,
    }
  }
}

// Export singleton instance
export const tumorEvolutionService = new TumorEvolutionService()

export default tumorEvolutionService
