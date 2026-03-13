"""
Complete FastAPI Cancer Prediction Backend with Gene Alignment
TumorVerse - Handles CSV files with any number of genes (10-20531)

This example demonstrates the complete implementation of:
1. Gene list loading from gene_list.pkl
2. CSV file upload and parsing
3. Gene alignment (prepare_input function)
4. PCA transformation
5. XGBoost prediction
6. JSON response with cancer type and confidence
"""

import io
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

# Initialize FastAPI app
app = FastAPI(title="TumorVerse Cancer Prediction API", version="2.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model paths
MODEL_DIR = Path(__file__).parent / "model"
CLASSIFIER_PATH = MODEL_DIR / "tumor_classifier.pkl"
PCA_MODEL_PATH = MODEL_DIR / "pca_model.pkl"
LABEL_ENCODER_PATH = MODEL_DIR / "label_encoder.pkl"
GENE_LIST_PATH = MODEL_DIR / "gene_list.pkl"

# Global variables for loaded models
xgb_model = None
pca_model = None
label_encoder = None
gene_list = None
models_loaded = False


def prepare_input(df: pd.DataFrame, gene_list: list) -> np.ndarray:
    """
    Prepare input gene expression data for model prediction.
    
    This function aligns the uploaded CSV genes with the training gene list by:
    1. Creating a DataFrame with all expected genes (filled with 0)
    2. Copying values for genes that exist in both CSV and training data
    3. Ignoring extra genes not used in training
    4. Maintaining the exact gene order from training
    
    Args:
        df: pandas DataFrame with gene expression data (genes as columns)
        gene_list: List of gene names used during model training (20531 genes)
    
    Returns:
        numpy array with shape (n_samples, 20531) ready for model input
    
    Example:
        Input CSV with 10 genes:
            TP53,EGFR,KRAS,BRCA1,BRCA2,MYC,PTEN,APC,RB1,NF1
            0.8,0.6,0.4,0.5,0.7,0.3,0.9,0.2,0.6,0.5
        
        Output array:
            [0.8, 0.6, 0.4, 0.5, 0.7, 0.3, 0.9, 0.2, 0.6, 0.5, 0, 0, ..., 0]
            <---- 10 genes from CSV ----> <---- 20,521 zeros ---->
            Total: 20,531 features in training order
    """
    print(f"\n{'='*60}")
    print(f"GENE ALIGNMENT: prepare_input()")
    print(f"{'='*60}")
    print(f"Input CSV shape: {df.shape}")
    print(f"Expected features: {len(gene_list)}")
    
    # Step 1: Create DataFrame with all expected genes, initialized to 0
    aligned_df = pd.DataFrame(0.0, index=df.index, columns=gene_list)
    print(f"Created aligned DataFrame: {aligned_df.shape}")
    
    # Step 2: Find common genes between CSV and training data
    common_genes = set(df.columns) & set(gene_list)
    print(f"Common genes found: {len(common_genes)}")
    
    # Step 3: Copy values for common genes
    for gene in common_genes:
        aligned_df[gene] = df[gene]
    
    # Step 4: Report missing and extra genes
    missing_genes = len(gene_list) - len(common_genes)
    extra_genes = set(df.columns) - set(gene_list)
    
    print(f"Missing genes (set to 0): {missing_genes}")
    if extra_genes:
        print(f"Extra genes (ignored): {len(extra_genes)}")
        print(f"  Examples: {list(extra_genes)[:5]}")
    
    # Step 5: Convert to numpy array
    result = aligned_df.values.astype(np.float32)
    
    print(f"Final aligned array shape: {result.shape}")
    print(f"Final gene feature count: {result.shape[1]}")
    print(f"{'='*60}\n")
    
    return result


@app.on_event("startup")
async def load_models():
    """Load ML models and gene list at application startup."""
    global xgb_model, pca_model, label_encoder, gene_list, models_loaded
    
    print("\n" + "="*60)
    print("LOADING MODELS AND GENE LIST")
    print("="*60)
    
    try:
        # Load XGBoost classifier
        print(f"Loading classifier from: {CLASSIFIER_PATH}")
        xgb_model = joblib.load(CLASSIFIER_PATH)
        print("✓ XGBoost classifier loaded")
        
        # Load PCA model
        print(f"Loading PCA model from: {PCA_MODEL_PATH}")
        pca_model = joblib.load(PCA_MODEL_PATH)
        print("✓ PCA model loaded")
        
        # Load label encoder
        print(f"Loading label encoder from: {LABEL_ENCODER_PATH}")
        label_encoder = joblib.load(LABEL_ENCODER_PATH)
        print("✓ Label encoder loaded")
        
        # Load gene list (important for alignment!)
        if GENE_LIST_PATH.exists():
            print(f"Loading gene list from: {GENE_LIST_PATH}")
            gene_list = joblib.load(GENE_LIST_PATH)
            print(f"✓ Gene list loaded: {len(gene_list)} genes")
            print(f"  First 5 genes: {gene_list[:5]}")
            print(f"  Last 5 genes: {gene_list[-5:]}")
        else:
            print(f"⚠ WARNING: gene_list.pkl not found at {GENE_LIST_PATH}")
            print("  Gene alignment will not work properly!")
            print("  Please create gene_list.pkl using create_gene_list.py")
        
        models_loaded = True
        print("\n✓ All models loaded successfully!")
        print("="*60 + "\n")
        
    except FileNotFoundError as e:
        print(f"✗ ERROR: Model files not found - {e}")
        print(f"  Expected files in: {MODEL_DIR}")
        models_loaded = False
    except Exception as e:
        print(f"✗ ERROR: Failed to load models - {e}")
        models_loaded = False


@app.get("/health")
async def health_check():
    """Check API and model status."""
    return {
        "status": "healthy" if models_loaded else "degraded",
        "models_loaded": models_loaded,
        "gene_list_loaded": gene_list is not None,
        "expected_features": len(gene_list) if gene_list else 20531,
        "message": "Ready for predictions" if models_loaded else "Models not loaded"
    }


@app.post("/predict")
async def predict(file: Optional[UploadFile] = File(None)):
    """
    Predict cancer type from gene expression CSV file.
    
    Args:
        file: CSV file with gene expression data
              - Can contain any number of genes (10, 100, 1000, etc.)
              - Genes should be column headers
              - Values should be numeric
    
    Returns:
        JSON response:
        {
            "cancer_type": "Lung Adenocarcinoma",
            "confidence": 0.92
        }
    
    Example CSV formats supported:
    
    Format 1: Simple genes as columns
        TP53,EGFR,KRAS,BRCA1,BRCA2
        0.8,0.6,0.4,0.5,0.7
    
    Format 2: With sample ID
        sample_id,TP53,EGFR,KRAS,BRCA1,BRCA2
        patient_001,0.8,0.6,0.4,0.5,0.7
    
    Format 3: Genes as rows (auto-transposed)
        Gene,Value
        TP53,0.8
        EGFR,0.6
    """
    
    # Validation: Check if models are loaded
    if not models_loaded:
        raise HTTPException(
            status_code=503,
            detail="Models not loaded. Please place model files in backend/model/"
        )
    
    # Validation: Check if gene list is available
    if gene_list is None:
        raise HTTPException(
            status_code=503,
            detail="Gene list not loaded. Please create gene_list.pkl"
        )
    
    # Validation: Check if file was uploaded
    if file is None:
        raise HTTPException(
            status_code=400,
            detail="No file uploaded. Please upload a CSV file with gene expression data."
        )
    
    try:
        print(f"\n{'='*60}")
        print(f"PROCESSING FILE: {file.filename}")
        print(f"{'='*60}")
        
        # Step 1: Read the uploaded CSV file
        contents = await file.read()
        print(f"File size: {len(contents)} bytes")
        
        # Detect delimiter (comma or tab)
        sample = contents.decode('utf-8')[:1000]
        delimiter = '\t' if '\t' in sample else ','
        print(f"Detected delimiter: {'TAB' if delimiter == '\t' else 'COMMA'}")
        
        # Step 2: Parse CSV into pandas DataFrame
        df = pd.read_csv(io.BytesIO(contents), delimiter=delimiter)
        print(f"CSV parsed: {df.shape}")
        print(f"Columns: {list(df.columns[:10])}{'...' if len(df.columns) > 10 else ''}")
        
        # Step 3: Handle sample ID column if present
        first_col = df.columns[0]
        if (df[first_col].dtype == object or 
            'sample' in first_col.lower() or 
            'id' in first_col.lower() or
            'patient' in first_col.lower()):
            print(f"Detected ID column: '{first_col}' - removing from features")
            df = df.set_index(first_col)
        
        # Step 4: Handle genes as rows (transpose if needed)
        if df.shape[0] >= 10 and df.shape[1] < 10:
            print(f"Detected genes as rows - transposing")
            df = df.T
            print(f"After transpose: {df.shape}")
        
        # Step 5: Align genes using prepare_input function
        aligned_features = prepare_input(df, gene_list)
        
        # Validation: Check final shape
        if aligned_features.shape[1] != 20531:
            raise ValueError(
                f"Gene alignment failed: Expected 20531 features, got {aligned_features.shape[1]}"
            )
        
        print(f"✓ Shape validation passed: {aligned_features.shape}")
        
        # Step 6: Take first sample (if multiple rows)
        gene_expression = aligned_features[0].astype(np.float32)
        print(f"Selected sample shape: {gene_expression.shape}")
        print(f"Sample values (first 5): {gene_expression[:5]}")
        
        # Step 7: Reshape for model input
        gene_expression = gene_expression.reshape(1, -1)
        print(f"Reshaped for model: {gene_expression.shape}")
        
        # Step 8: Apply PCA transformation
        gene_expression_pca = pca_model.transform(gene_expression)
        print(f"After PCA: {gene_expression_pca.shape}")
        
        # Step 9: Get prediction from XGBoost
        prediction = xgb_model.predict(gene_expression_pca)[0]
        prediction_proba = xgb_model.predict_proba(gene_expression_pca)[0]
        
        # Step 10: Decode cancer type
        cancer_type = label_encoder.inverse_transform([int(prediction)])[0]
        confidence = float(np.max(prediction_proba))
        
        print(f"\n{'='*60}")
        print(f"PREDICTION RESULT")
        print(f"{'='*60}")
        print(f"Cancer Type: {cancer_type}")
        print(f"Confidence: {confidence:.4f} ({confidence*100:.2f}%)")
        print(f"{'='*60}\n")
        
        # Step 11: Return JSON response
        return {
            "cancer_type": cancer_type,
            "confidence": confidence
        }
    
    except ValueError as e:
        print(f"✗ Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        print(f"✗ Prediction error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )


# Main entry point
if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "="*60)
    print("STARTING TUMORVERSE BACKEND SERVER")
    print("="*60)
    print("Features:")
    print("  ✓ Gene alignment (handles any number of genes)")
    print("  ✓ PCA transformation")
    print("  ✓ XGBoost prediction")
    print("  ✓ Automatic CSV format detection")
    print("="*60 + "\n")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
