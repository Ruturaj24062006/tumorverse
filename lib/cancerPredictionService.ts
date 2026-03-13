/**
 * Cancer Prediction API Service
 * Frontend integration for the FastAPI backend
 * 
 * Usage:
 * import { cancerPredictionService } from '@/services/cancerPredictionService';
 * 
 * const result = await cancerPredictionService.predict(geneExpressionArray);
 */

interface PredictionResponse {
  predicted_cancer: string;
  confidence: number;
}

interface BatchPredictionResponse {
  predictions: PredictionResponse[];
}

interface HealthCheckResponse {
  status: string;
  models_loaded: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Cancer Prediction Service
 * Handles all API calls to the cancer prediction backend
 */
export const cancerPredictionService = {
  /**
   * Check if the API is healthy and models are loaded
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },

  /**
   * Predict cancer type from gene expression data
   * @param geneExpression - Array of 20531 gene expression values
   * @returns Prediction result with cancer type and confidence
   */
  async predict(geneExpression: number[]): Promise<PredictionResponse> {
    if (geneExpression.length !== 20531) {
      throw new Error(
        `Expected 20531 gene features, got ${geneExpression.length}`
      );
    }

    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gene_expression: geneExpression,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Prediction failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Prediction error:', error);
      throw error;
    }
  },

  /**
   * Predict cancer types for multiple samples
   * @param samples - Array of gene expression arrays (each with 20531 features)
   * @returns Array of prediction results
   */
  async batchPredict(samples: number[][]): Promise<BatchPredictionResponse> {
    // Validate all samples have correct length
    for (let i = 0; i < samples.length; i++) {
      if (samples[i].length !== 20531) {
        throw new Error(
          `Sample ${i}: Expected 20531 features, got ${samples[i].length}`
        );
      }
    }

    try {
      const response = await fetch(`${API_BASE_URL}/batch_predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          samples: samples,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Batch prediction failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Batch prediction error:', error);
      throw error;
    }
  },

  /**
   * Format confidence as percentage
   * @param confidence - Confidence value (0-1)
   * @returns Formatted percentage string
   */
  formatConfidence(confidence: number): string {
    return `${(confidence * 100).toFixed(2)}%`;
  },
};

export type { PredictionResponse, BatchPredictionResponse, HealthCheckResponse };
