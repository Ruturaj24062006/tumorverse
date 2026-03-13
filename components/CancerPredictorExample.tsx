/**
 * Example Cancer Prediction Component
 * Demonstrates how to use the cancerPredictionService with React/Next.js
 * 
 * Usage:
 * import { CancerPredictorExample } from '@/components/CancerPredictorExample';
 * 
 * export default function Page() {
 *   return <CancerPredictorExample />;
 * }
 */

'use client';

import React, { useState } from 'react';
import {
  cancerPredictionService,
  type PredictionResponse,
} from '@/lib/cancerPredictionService';

// Example component using button and card from UI library
// Adjust imports based on your actual UI components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

interface PredictionState {
  result: PredictionResponse | null;
  loading: boolean;
  error: string | null;
}

/**
 * Example component showing cancer type prediction UI
 */
export function CancerPredictorExample() {
  const [state, setState] = useState<PredictionState>({
    result: null,
    loading: false,
    error: null,
  });

  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);

  /**
   * Handle prediction request
   */
  const handlePredict = async () => {
    setState({ result: null, loading: true, error: null });

    try {
      // Generate mock gene expression data for demo
      // In production, this would come from your data source
      const mockGeneData = Array(20531)
        .fill(0)
        .map(() => {
          // Generate realistic values with mean~0 and std~1
          // (simulating preprocessed data)
          return Math.random() * 2 - 1;
        });

      // Call the prediction service
      const prediction = await cancerPredictionService.predict(mockGeneData);

      setState({
        result: prediction,
        loading: false,
        error: null,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setState({
        result: null,
        loading: false,
        error: errorMessage,
      });
    }
  };

  /**
   * Check API health
   */
  const checkHealth = async () => {
    try {
      const health = await cancerPredictionService.healthCheck();
      setApiHealthy(health.models_loaded);
    } catch (err) {
      setApiHealthy(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-6">
      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Cancer Type Prediction</h2>
          <p className="text-gray-600">
            Predict cancer type from gene expression data (20,531 features)
          </p>
        </div>

        {/* API Health Status */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700">API Status</p>
            {apiHealthy === null ? (
              <p className="text-sm text-gray-500">Not checked</p>
            ) : apiHealthy ? (
              <p className="text-sm text-green-600 font-medium">✓ Healthy</p>
            ) : (
              <p className="text-sm text-red-600 font-medium">✗ Unavailable</p>
            )}
          </div>
          <Button
            onClick={checkHealth}
            variant="outline"
            size="sm"
            disabled={state.loading}
          >
            Check Health
          </Button>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handlePredict}
            disabled={state.loading || !apiHealthy}
            className="flex-1"
          >
            {state.loading ? (
              <>
                <Spinner className="mr-2 h-4 w-4 animate-spin" />
                Predicting...
              </>
            ) : (
              'Run Prediction'
            )}
          </Button>
        </div>

        {/* Error Message */}
        {state.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800">
              Prediction Error
            </p>
            <p className="text-sm text-red-600 mt-1">{state.error}</p>
          </div>
        )}

        {/* Result Display */}
        {state.result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Predicted Cancer Type
              </p>
              <p className="text-lg font-bold text-green-700 mt-1">
                {state.result.predicted_cancer}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700">Confidence</p>
              <div className="mt-2">
                {/* Confidence Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${state.result.confidence * 100}%`,
                    }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {cancerPredictionService.formatConfidence(
                    state.result.confidence
                  )}
                </p>
              </div>
            </div>

            {/* Copy Result Button */}
            <Button
              onClick={() => {
                navigator.clipboard.writeText(
                  JSON.stringify(state.result, null, 2)
                );
                alert('Result copied to clipboard');
              }}
              variant="outline"
              size="sm"
              className="w-full mt-4"
            >
              Copy Result as JSON
            </Button>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Mock data is used in this example</p>
          <p>• Replace with real gene expression data in production</p>
          <p>• Ensure API is running on port 8000</p>
        </div>
      </Card>
    </div>
  );
}

/**
 * Example: Batch Prediction Component
 * For predicting multiple samples at once
 */
export function BatchCancerPredictorExample() {
  const [results, setResults] = useState<
    Array<PredictionResponse & { id: number }> | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBatchPredict = async (numSamples: number = 5) => {
    setLoading(true);
    setError(null);

    try {
      // Generate mock samples
      const samples = Array(numSamples)
        .fill(0)
        .map(() =>
          Array(20531)
            .fill(0)
            .map(() => Math.random() * 2 - 1)
        );

      const batchResult = await cancerPredictionService.batchPredict(samples);

      // Add IDs for rendering
      const resultsWithIds = batchResult.predictions.map((pred, idx) => ({
        ...pred,
        id: idx,
      }));

      setResults(resultsWithIds);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <Card className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Batch Cancer Prediction</h2>
          <p className="text-gray-600">Predict cancer types for multiple samples</p>
        </div>

        <div className="flex gap-3">
          <Button onClick={() => handleBatchPredict(5)} disabled={loading}>
            {loading ? 'Processing...' : 'Predict 5 Samples'}
          </Button>
          <Button
            onClick={() => handleBatchPredict(10)}
            disabled={loading}
            variant="outline"
          >
            Predict 10 Samples
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {results && (
          <div className="space-y-3">
            <p className="font-medium">Results ({results.length} samples)</p>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="p-3 bg-gray-50 rounded border border-gray-200"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Sample {result.id + 1}
                      </p>
                      <p className="text-sm text-gray-600">
                        {result.predicted_cancer}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-green-600">
                      {cancerPredictionService.formatConfidence(
                        result.confidence
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default CancerPredictorExample;
