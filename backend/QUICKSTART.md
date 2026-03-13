# Cancer Type Prediction System - Quick Start Guide

## Overview

This guide walks you through setting up and running the cancer type prediction system with your trained XGBoost model.

**Project Structure:**
```
tumorverse/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── config.py               # Configuration settings
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example             # Environment variables template
│   ├── API_USAGE_GUIDE.md      # Detailed API documentation
│   └── model/
│       ├── tumor_classifier.pkl # XGBoost model
│       ├── pca_model.pkl        # PCA transformer
│       └── label_encoder.pkl    # Label encoder
├── lib/
│   └── cancerPredictionService.ts  # Frontend service
├── components/
│   └── CancerPredictorExample.tsx   # Example React component
└── ... (rest of Next.js app)
```

---

## Step 1: Backend Setup

### 1.1 Verify Model Files

Make sure you have all three pickle files in `backend/model/`:
```
backend/model/
├── tumor_classifier.pkl
├── pca_model.pkl
└── label_encoder.pkl
```

### 1.2 Install Python Dependencies

Use Python 3.11, 3.12, or 3.13 for the backend. The image prediction stack depends on PyTorch, and PyTorch wheels are typically not available yet for Python 3.14.

```bash
cd backend
pip install -r requirements.txt
```

**Dependencies installed:**
- FastAPI - Web framework
- Uvicorn - ASGI server
- Pydantic - Data validation
- Joblib - Model loading
- NumPy - Numerical operations
- XGBoost - Model inference
- Scikit-learn - PCA and preprocessing

### 1.3 (Optional) Configure Environment Variables

```bash
# Copy the example to .env
cp .env.example .env

# Edit .env with your settings if needed
```

---

## Step 2: Run the Backend API

### Development Mode (with auto-reload)

```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production Mode

```bash
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Expected Output

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
Loading trained models...
✓ All models loaded successfully
```

### Access API Documentation

Once running, visit:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

## Step 3: Test the API

### Health Check

```bash
curl http://localhost:8000/health
```

**Response:**
```json
{
  "status": "healthy",
  "models_loaded": true
}
```

### Make a Prediction

```bash
# Generate sample data and make prediction
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "gene_expression": [0.5, 1.2, -0.8, 2.1, 0.1, /* ...20527 more values... */, 0.3]
  }'
```

**Response:**
```json
{
  "predicted_cancer": "lung adenocarcinoma",
  "confidence": 0.9847
}
```

---

## Step 4: Frontend Integration

### 4.1 Update Next.js Environment

In the root directory, create or update `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 4.2 Use the Prediction Service

Import and use the service in your components:

```tsx
import { cancerPredictionService } from '@/lib/cancerPredictionService';

// In your component:
const result = await cancerPredictionService.predict(geneExpressionArray);
console.log(result.predicted_cancer);
console.log(result.confidence);
```

### 4.3 Example Component

A complete example component is included at:
```
components/CancerPredictorExample.tsx
```

Use it in your pages:

```tsx
import { CancerPredictorExample } from '@/components/CancerPredictorExample';

export default function PredictPage() {
  return <CancerPredictorExample />;
}
```

---

## Step 5: Running the Full Stack

### Terminal 1: Start Backend API

```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

### Terminal 2: Start Next.js Frontend

```bash
npm run dev
# or
yarn dev
```

Access the application at: **http://localhost:3000**

---

## API Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Check API health and model status |
| POST | `/predict` | Single cancer type prediction |
| POST | `/batch_predict` | Batch predictions for multiple samples |

---

## Example: Complete Prediction Flow

### JavaScript/TypeScript Frontend

```typescript
import { cancerPredictionService } from '@/lib/cancerPredictionService';

async function analyzeSample(geneData: number[]) {
  try {
    // Validate data
    if (geneData.length !== 20531) {
      throw new Error('Expected 20531 gene features');
    }

    // Make prediction
    const result = await cancerPredictionService.predict(geneData);

    // Display results
    console.log(`Predicted: ${result.predicted_cancer}`);
    console.log(`Confidence: ${(result.confidence * 100).toFixed(2)}%`);

    return result;
  } catch (error) {
    console.error('Prediction failed:', error);
  }
}
```

### Python Backend (for reference)

```python
import numpy as np
import joblib

# Load models
model = joblib.load('model/tumor_classifier.pkl')
pca = joblib.load('model/pca_model.pkl')
encoder = joblib.load('model/label_encoder.pkl')

# Prepare data
gene_data = np.array(raw_data).reshape(1, -1)  # (1, 20531)

# Transform and predict
gene_data_pca = pca.transform(gene_data)
prediction = model.predict(gene_data_pca)[0]

# Decode result
cancer_type = encoder.inverse_transform([int(prediction)])[0]
```

---

## Troubleshooting

### Models Not Loading

**Error:** `FileNotFoundError: No such file or directory...`

**Solution:** Ensure all three pickle files are in `backend/model/`:
```bash
ls backend/model/
# Output should show:
# label_encoder.pkl
# pca_model.pkl
# tumor_classifier.pkl
```

### Connection Refused

**Error:** `ConnectionRefusedError: [Errno 111] Connection refused`

**Solution:** Ensure backend is running:
```bash
# Check if API is accessible
curl http://localhost:8000/health
```

### Wrong Number of Features

**Error:** `Expected 20531 features, got X`

**Solution:** Ensure your data preprocessing produces exactly 20531 features before sending to API.

### CORS Error

**Error:** `Cross-Origin Request Blocked`

**Solution:** CORS is already enabled for all origins in development. For production, update `main.py`:
```python
allow_origins=["https://your-domain.com"],
```

### ModuleNotFoundError

**Error:** `ModuleNotFoundError: No module named 'fastapi'`

**Solution:** Install dependencies:
```bash
cd backend
pip install -r requirements.txt
```

---

## Performance Tips

1. **Batch Processing:** Use `/batch_predict` for multiple samples
2. **Multiple Workers:** For production, use multiple Uvicorn workers:
   ```bash
   uvicorn main:app --workers 4 --port 8000
   ```
3. **Model Optimization:** Consider quantizing the model for faster inference
4. **Caching:** Implement caching for frequently predicted samples

---

## Production Deployment

### Using Gunicorn + Uvicorn

```bash
pip install gunicorn
gunicorn main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile -
```

### Using Docker

1. Create `Dockerfile` in backend directory:
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

2. Build and run:
```bash
docker build -t cancer-predictor .
docker run -p 8000:8000 cancer-predictor
```

### Using AWS, GCP, or Azure

- Container Registry: Push Docker image
- Cloud Run / App Engine: Deploy container
- API Gateway: Configure endpoints
- Update frontend `NEXT_PUBLIC_API_URL` to point to deployed API

---

## Next Steps

1. ✅ Verify all model files are in place
2. ✅ Install backend dependencies
3. ✅ Start the API server
4. ✅ Test with curl or Swagger UI
5. ✅ Integrate into your Next.js frontend
6. ✅ Deploy to production

---

## Additional Resources

- **API Documentation:** See [API_USAGE_GUIDE.md](./API_USAGE_GUIDE.md)
- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **Uvicorn Docs:** https://www.uvicorn.org/
- **Deployment Guide:** https://fastapi.tiangolo.com/deployment/

---

## Support

If you encounter issues:

1. Check the detailed [API_USAGE_GUIDE.md](./API_USAGE_GUIDE.md)
2. Review Uvicorn/FastAPI logs
3. Validate model files exist
4. Test endpoints with Swagger UI at `/docs`

