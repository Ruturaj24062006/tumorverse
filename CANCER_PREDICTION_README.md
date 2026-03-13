# Cancer Type Prediction System

A full-stack web application for predicting cancer types from gene expression data using a trained XGBoost machine learning model.

## 🎯 Project Overview

This system consists of:

- **Backend API**: FastAPI server that loads and serves a pre-trained XGBoost cancer classifier
- **Frontend**: Next.js React application with UI for cancer prediction
- **Models**: XGBoost classifier + PCA + Label Encoder (pre-trained)

**Model Performance:**
- Algorithm: XGBoost
- Accuracy: ~93%
- Input: 20,531 gene expression features
- Classes: 33 cancer types
- Preprocessing: StandardScaler + PCA (500 components)

---

## 📋 Requirements

### Backend
- Python 3.9+
- FastAPI
- Uvicorn
- XGBoost
- Scikit-learn
- NumPy
- Joblib

### Frontend
- Node.js 16+
- npm/yarn
- React/Next.js

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run API server
python -m uvicorn main:app --reload --port 8000
```

✅ API will be available at: `http://localhost:8000`

### 2. Frontend Setup

```bash
# In project root
npm install

# Create .env.local
cp .env.example .env.local

# Start development server
npm run dev
```

✅ App will be available at: `http://localhost:3000`

---

## 📁 Project Structure

```
tumorverse/
├── backend/
│   ├── main.py                      # FastAPI application
│   ├── config.py                    # Configuration
│   ├── requirements.txt              # Python dependencies
│   ├── .env.example                  # Environment template
│   ├── QUICKSTART.md                 # Quick start guide
│   ├── API_USAGE_GUIDE.md           # Detailed API docs
│   └── model/
│       ├── tumor_classifier.pkl      # XGBoost model
│       ├── pca_model.pkl             # PCA transformer
│       └── label_encoder.pkl         # Label encoder
│
├── lib/
│   └── cancerPredictionService.ts   # Frontend service
│
├── components/
│   └── CancerPredictorExample.tsx   # Example component
│
├── .env.example                      # Frontend env template
└── ... (rest of Next.js app)
```

---

## 🔌 API Endpoints

### Health Check
```bash
GET /health
```
Check if API is running and models are loaded.

### Single Prediction
```bash
POST /predict
```
**Request:**
```json
{
  "gene_expression": [0.5, 1.2, -0.8, ..., 0.3]  // 20,531 values
}
```

**Response:**
```json
{
  "predicted_cancer": "lung adenocarcinoma",
  "confidence": 0.9847
}
```

### Batch Prediction
```bash
POST /batch_predict
```
**Request:**
```json
{
  "samples": [
    [0.5, 1.2, -0.8, ..., 0.3],
    [0.1, -0.5, 1.3, ..., 0.2]
  ]
}
```

**Response:**
```json
{
  "predictions": [
    {"predicted_cancer": "lung adenocarcinoma", "confidence": 0.9847},
    {"predicted_cancer": "breast cancer", "confidence": 0.8923}
  ]
}
```

---

## 💻 Frontend Integration

### Using the Prediction Service

```typescript
import { cancerPredictionService } from '@/lib/cancerPredictionService';

// Single prediction
const result = await cancerPredictionService.predict(geneExpressionArray);
console.log(result.predicted_cancer);
console.log(result.confidence);

// Batch prediction
const batchResult = await cancerPredictionService.batchPredict(samples);
```

### Example Component

```tsx
import { CancerPredictorExample } from '@/components/CancerPredictorExample';

export default function PredictPage() {
  return <CancerPredictorExample />;
}
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
```env
API_HOST=0.0.0.0
API_PORT=8000
CLASSIFIER_PATH=model/tumor_classifier.pkl
PCA_MODEL_PATH=model/pca_model.pkl
LABEL_ENCODER_PATH=model/label_encoder.pkl
```

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 📚 Detailed Documentation

- **[Backend Quick Start](./backend/QUICKSTART.md)** - Step-by-step backend setup
- **[API Usage Guide](./backend/API_USAGE_GUIDE.md)** - Comprehensive API documentation
- **[Requirements](./backend/requirements.txt)** - Python dependencies

---

## 🧪 Testing

### Test with cURL

```bash
# Health check
curl http://localhost:8000/health

# Make prediction (requires real 20,531 features)
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{"gene_expression": [...]}'
```

### Test with Swagger UI

Visit: `http://localhost:8000/docs`

Interactive API documentation and testing interface.

---

## 🏗️ Production Deployment

### Using Gunicorn + Uvicorn

```bash
cd backend
pip install gunicorn
gunicorn main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

### Using Docker

```bash
# Build
docker build -t cancer-predictor -f backend/Dockerfile .

# Run
docker run -p 8000:8000 cancer-predictor
```

### Cloud Deployment

- **AWS**: Lambda + API Gateway, or ECS
- **GCP**: Cloud Run, or App Engine
- **Azure**: App Service, or Container Instances

---

## ⚙️ Configuration

### Model Settings

Configured in `backend/config.py`:
- Expected features: 20,531
- PCA components: 500
- Model paths: `backend/model/`

### CORS Settings

Update in `backend/main.py`:
```python
allow_origins=["https://your-domain.com"],  # Production
```

---

## 🐛 Troubleshooting

### ModuleNotFoundError
```bash
cd backend
pip install -r requirements.txt
```

### Models Not Found
Ensure all files exist:
```bash
ls backend/model/
# Should show: label_encoder.pkl, pca_model.pkl, tumor_classifier.pkl
```

### Connection Refused
Check if backend is running:
```bash
curl http://localhost:8000/health
```

### CORS Error
Configure CORS in `backend/main.py` for your frontend URL.

---

## 📊 Data Format

### Input Data
- **Type**: Array of floats
- **Length**: 20,531 (same as training data)
- **Values**: Preprocessed gene expression (StandardScaled)
- **Range**: Typically -3 to 3 after preprocessing

### Output Data
- **predicted_cancer**: String with cancer type name
- **confidence**: Float between 0 and 1 (probability)

---

## 🔄 Model Pipeline

1. **Input**: Raw gene expression (20,531 features)
2. **PCA Transform**: Reduce to 500 principal components
3. **XGBoost Predict**: Get prediction and probabilities
4. **Decode**: Convert predicted class to cancer type name
5. **Output**: Cancer type + confidence score

---

## 📈 Performance Metrics

- **Model Accuracy**: ~93%
- **Inference Time**: ~10-50ms per sample
- **Batch Processing**: ~50-100ms for 10 samples
- **API Response Time**: ~50-100ms (including network)

---

## 🔒 Security Considerations

- ✅ Input validation on all endpoints
- ✅ Error handling without exposing internals
- ✅ CORS configured for production
- ⚠️ Add authentication for production deployments
- ⚠️ Use HTTPS in production
- ⚠️ Validate and sanitize frontend inputs

---

## 📝 License

This project is provided as-is for research and development purposes.

---

## 🤝 Support

For issues or questions:

1. Check the documentation files
2. Review API documentation at `/docs`
3. Check logs for error messages
4. Verify model files are in place

---

## 📞 Contact

For questions or support, please refer to the documentation or contact the development team.

---

**Happy predicting! 🧬**
