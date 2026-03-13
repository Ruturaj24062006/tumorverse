# Cancer Type Prediction API - Usage Guide

## Setup and Installation

### 1. Install Dependencies

Use Python 3.11, 3.12, or 3.13 for the backend environment. The `/predict-image` endpoint depends on PyTorch, which is not currently available in this workspace's Python 3.14 environment.

```bash
cd backend
pip install -r requirements.txt
```

### 2. Run the API Server
```bash
# Development mode (with auto-reload)
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or production mode (without reload)
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

The API will be available at `http://localhost:8000`

### 3. Access API Documentation
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## API Endpoints

### Health Check
```
GET /health
```
Returns the status of the API and models.

**Example Response:**
```json
{
  "status": "healthy",
  "models_loaded": true
}
```

---

### Single Prediction
```
POST /predict
```

**Request Body:**
```json
{
  "gene_expression": [0.5, 1.2, -0.8, 2.1, ..., 0.3]  // 20531 values
}
```

**Response:**
```json
{
  "predicted_cancer": "lung adenocarcinoma",
  "confidence": 0.9847
}
```

---

### Batch Prediction
```
POST /batch_predict
```

**Request Body:**
```json
{
  "samples": [
    [0.5, 1.2, -0.8, 2.1, ..., 0.3],
    [0.1, -0.5, 1.3, 0.8, ..., 0.2]
  ]
}
```

**Response:**
```json
{
  "predictions": [
    {
      "predicted_cancer": "lung adenocarcinoma",
      "confidence": 0.9847
    },
    {
      "predicted_cancer": "breast cancer",
      "confidence": 0.8923
    }
  ]
}
```

---

## Frontend Integration Examples

### Using Fetch API (JavaScript/React)

```javascript
// Example 1: Single Prediction
async function predictCancerType(geneExpressionData) {
  try {
    const response = await fetch('http://localhost:8000/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gene_expression: geneExpressionData  // Array of 20531 numbers
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Predicted Cancer:', data.predicted_cancer);
    console.log('Confidence:', data.confidence);
    
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Usage:
const geneData = new Array(20531).fill(0).map(() => Math.random() * 2 - 1);
predictCancerType(geneData);
```

### Using Fetch API (Batch Prediction)

```javascript
async function batchPredictCancerTypes(samples) {
  try {
    const response = await fetch('http://localhost:8000/batch_predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        samples: samples  // Array of arrays, each with 20531 features
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Predictions:', data.predictions);
    
    return data.predictions;
  } catch (error) {
    console.error('Error:', error);
  }
}

// Usage:
const samples = [
  new Array(20531).fill(0).map(() => Math.random() * 2 - 1),
  new Array(20531).fill(0).map(() => Math.random() * 2 - 1),
];
batchPredictCancerTypes(samples);
```

### Using Axios (Alternative)

```javascript
import axios from 'axios';

async function predictWithAxios(geneExpressionData) {
  try {
    const response = await axios.post('http://localhost:8000/predict', {
      gene_expression: geneExpressionData
    });
    
    console.log('Prediction:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}
```

### React Component Example

```jsx
import React, { useState } from 'react';

function CancerPredictorComponent() {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePredict = async (geneData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gene_expression: geneData
        }),
      });

      if (!response.ok) throw new Error('Prediction failed');
      
      const result = await response.json();
      setPrediction(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Cancer Type Prediction</h2>
      
      {loading && <p>Predicting...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      {prediction && (
        <div>
          <p><strong>Predicted Cancer Type:</strong> {prediction.predicted_cancer}</p>
          <p><strong>Confidence:</strong> {(prediction.confidence * 100).toFixed(2)}%</p>
        </div>
      )}
      
      <button onClick={() => {
        const mockData = new Array(20531).fill(0).map(() => Math.random() * 2 - 1);
        handlePredict(mockData);
      }}>
        Run Prediction
      </button>
    </div>
  );
}

export default CancerPredictorComponent;
```

---

## Using CURL for Testing

```bash
# Single prediction
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "gene_expression": [0.5, 1.2, -0.8, 2.1, ..., 0.3]
  }'

# Health check
curl "http://localhost:8000/health"
```

---

## Error Handling

The API returns appropriate HTTP status codes:

- **200 OK**: Successful prediction
- **400 Bad Request**: Invalid input (wrong number of features, malformed JSON)
- **500 Internal Server Error**: Model loading or prediction error

**Example Error Response:**
```json
{
  "detail": "Expected 20531 features, got 100"
}
```

---

## Performance Considerations

1. **Model Loading**: Models are loaded once at startup for efficiency
2. **Batch Predictions**: Use the `/batch_predict` endpoint for multiple samples to reduce overhead
3. **CORS**: Configured to allow requests from any origin (change in production)
4. **Workers**: Use multiple Uvicorn workers for production deployments:
   ```bash
   uvicorn main:app --workers 4 --port 8000
   ```

---

## Production Deployment

### Using Gunicorn + Uvicorn (Recommended)
```bash
pip install gunicorn
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Using Docker

Create a `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:
```bash
docker build -t cancer-predictor .
docker run -p 8000:8000 cancer-predictor
```

---

## Environment Variables (Optional)

Create a `.env` file for configuration:
```
API_HOST=0.0.0.0
API_PORT=8000
LOG_LEVEL=info
CORS_ORIGINS=["http://localhost:3000"]
```

Update `main.py` to load these if needed.
