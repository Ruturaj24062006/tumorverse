import { useState } from 'react';

export interface UnifiedMedicalOutput {
  core_metrics: {
    treatment_score: number;
    medical_state: string;
    effectiveness: number;
    recovery_status: string;
    confidence: number;
  };
  tumor_behavior: Record<string, any>;
  risk_profile: Record<string, any>;
  explanations: Record<string, string>;
  visual_guidance: Record<string, any>;
  report: Record<string, any>;
}

export const useUnifiedAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<UnifiedMedicalOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async (patientData: any, segmentationData: any, medicine: any) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Simulating real-time AI orchestration latency for cinematic effect
      const response = await fetch("http://localhost:8000/api/unified-medical-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // "Authorization": `Bearer ${localStorage.getItem('tumorverse_token')}` // For Security implementation
        },
        body: JSON.stringify({
          patient_id: patientData.id,
          cancer_type: patientData.cancer_type,
          tumor_size: segmentationData.size_mm,
          aggressiveness: segmentationData.aggressiveness,
          segmentation_confidence: segmentationData.confidence,
          tumor_geometry_hash: segmentationData.hash,
          medicine: medicine.name,
          medicine_effectiveness: medicine.effectiveness,
          response_trend: "stable",
          previous_tumor_size: patientData.previous_size || null,
        })
      });

      if (!response.ok) {
        throw new Error("Failed to run clinical AI intelligence pipeline.");
      }

      const data = await response.json();
      setAnalysisResult(data);
      return data;
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during AI analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { runAnalysis, isAnalyzing, analysisResult, error };
};