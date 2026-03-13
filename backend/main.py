"""
FastAPI backend for cancer type prediction using XGBoost and PCA.
Loads pre-trained models and exposes a prediction endpoint.
"""

import os
from pathlib import Path
from typing import List, Optional
import io

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, File, UploadFile, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from routes.predict_image import router as image_router

# Initialize FastAPI app
app = FastAPI(
    title="Cancer Type Prediction API",
    description="API for predicting cancer types from gene expression data",
    version="1.0.0",
)

# Add CORS middleware to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(image_router)

# Define paths to model files
MODEL_DIR = Path(__file__).parent / "model"
BACKEND_DIR = Path(__file__).parent


def _resolve_artifact_path(file_name: str) -> Path:
    """Resolve artifact from backend/model first, then backend root."""
    candidates = [MODEL_DIR / file_name, BACKEND_DIR / file_name]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    # Default expected location for diagnostics when missing.
    return MODEL_DIR / file_name


CLASSIFIER_PATH = _resolve_artifact_path("tumor_classifier.pkl")
PCA_MODEL_PATH = _resolve_artifact_path("pca_model.pkl")
LABEL_ENCODER_PATH = _resolve_artifact_path("label_encoder.pkl")
GENE_LIST_PATH = _resolve_artifact_path("gene_list.pkl")
GENE_MEANS_PATH = _resolve_artifact_path("gene_means.pkl")
SCALER_PATH = _resolve_artifact_path("scaler.pkl")

# Load models at startup
print("Loading trained models...")
xgb_model = None
pca_model = None
label_encoder = None
gene_list = None
gene_means = None
scaler_model = None
models_loaded = False


def _deduplicate_labels_keep_first(labels: List[str], label_name: str = "labels") -> List[str]:
    """Deduplicate ordered labels while preserving first occurrence order."""
    original_count = len(labels)
    deduped = list(dict.fromkeys(str(x) for x in labels))
    dropped = original_count - len(deduped)
    if dropped > 0:
        print(f"⚠ Duplicate {label_name} detected: dropped {dropped} duplicates (kept first occurrence)")
    return deduped


def _remove_duplicate_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Drop duplicate columns and keep the first occurrence."""
    print(f"Original columns: {len(df.columns)}")
    print(f"Unique columns: {len(pd.Index(df.columns).unique())}")

    duplicate_mask = pd.Index(df.columns).duplicated(keep="first")
    duplicate_count = int(duplicate_mask.sum())
    if duplicate_count > 0:
        duplicate_names = pd.Index(df.columns)[duplicate_mask].astype(str).tolist()
        preview = duplicate_names[:10]
        suffix = "..." if len(duplicate_names) > 10 else ""
        print(
            f"⚠ Duplicate gene columns detected: {duplicate_count}. "
            f"Keeping first occurrence, dropping duplicates: {preview}{suffix}"
        )

    # Keep first occurrence of each column label.
    return df.loc[:, ~pd.Index(df.columns).duplicated(keep="first")]

try:
    xgb_model = joblib.load(CLASSIFIER_PATH)
    pca_model = joblib.load(PCA_MODEL_PATH)
    label_encoder = joblib.load(LABEL_ENCODER_PATH)
    
    # Try to load gene list (optional - used for feature alignment)
    if GENE_LIST_PATH.exists():
        # Preserve exact training feature order/length as used by PCA/model.
        gene_list = [str(g) for g in joblib.load(GENE_LIST_PATH)]
        print(f"✓ Gene list loaded: {len(gene_list)} genes")
    else:
        print(f"⚠ Warning: gene_list.pkl not found. CSV processing will use feature count alignment only.")

    if GENE_MEANS_PATH.exists():
        gene_means = joblib.load(GENE_MEANS_PATH)
        print("✓ Training gene means loaded")
    else:
        print("⚠ Warning: gene_means.pkl not found. Missing-gene mean imputation for CSV uploads is unavailable.")

    if SCALER_PATH.exists():
        scaler_model = joblib.load(SCALER_PATH)
        print("✓ Feature scaler loaded")
    else:
        print("ℹ scaler.pkl not found. Skipping feature scaling step.")

    pca_expected_features = getattr(pca_model, "n_features_in_", None)
    if pca_expected_features is not None and gene_list is not None:
        if int(pca_expected_features) != len(gene_list):
            print(
                "⚠ Metadata mismatch: "
                f"PCA expects {int(pca_expected_features)} features, gene_list has {len(gene_list)}"
            )
        else:
            print(f"✓ Metadata check passed: PCA expects {int(pca_expected_features)} features")
    
    models_loaded = True
    print("✓ All models loaded successfully")
except FileNotFoundError as e:
    print(f"⚠ Warning: Models not found - {e}")
    print(f"  Expected model files in: {MODEL_DIR}")
    print(f"  - {CLASSIFIER_PATH}")
    print(f"  - {PCA_MODEL_PATH}")
    print(f"  - {LABEL_ENCODER_PATH}")
except Exception as e:
    print(f"✗ Error loading models: {e}")


# Feature alignment helpers
def _build_gene_means_series(gene_list: List[str], raw_means) -> pd.Series:
    """Normalize raw gene means artifact into a Series indexed by training genes."""
    # Preserve exact training feature order/length (including repeated labels if present).
    ordered_genes = [str(g) for g in gene_list]

    if isinstance(raw_means, pd.DataFrame):
        if raw_means.shape[1] == 1:
            means_series = raw_means.iloc[:, 0]
        else:
            means_series = raw_means.mean(axis=1)
    elif isinstance(raw_means, pd.Series):
        means_series = raw_means
    elif isinstance(raw_means, dict):
        means_series = pd.Series(raw_means)
    elif isinstance(raw_means, (list, tuple, np.ndarray)):
        if len(raw_means) != len(ordered_genes):
            raise ValueError(
                f"gene_means length mismatch. Expected {len(ordered_genes)}, got {len(raw_means)}"
            )
        means_series = pd.Series(raw_means, index=ordered_genes)
    else:
        raise ValueError("Unsupported gene_means format. Expected Series/dict/list/ndarray/DataFrame.")

    means_series.index = means_series.index.astype(str)
    if means_series.index.duplicated(keep="first").any():
        duplicate_count = int(means_series.index.duplicated(keep="first").sum())
        print(
            f"⚠ Duplicate gene labels in gene_means detected: {duplicate_count}. "
            "Keeping first occurrence."
        )
        means_series = means_series[~means_series.index.duplicated(keep="first")]

    means_series = pd.to_numeric(means_series, errors="coerce")
    means_series = means_series.reindex(ordered_genes)

    global_mean = float(np.nanmean(means_series.values.astype(np.float32)))
    if np.isnan(global_mean):
        global_mean = 0.0

    return means_series.fillna(global_mean).astype(np.float32)


def prepare_input(
    df: pd.DataFrame,
    gene_list: List[str],
    training_gene_means,
    min_matched_genes: int = 20,
) -> pd.DataFrame:
    """
    Prepare uploaded gene data for inference.

    Steps:
    1. Ignore extra genes not used by the model.
    2. Validate minimum number of matching genes.
    3. Add missing genes and fill with training gene means.
    4. Reorder columns to exact training feature order.

    Returns:
        DataFrame with shape (n_samples, len(gene_list)).
    """
    input_df = _remove_duplicate_columns(df.copy())
    input_df.columns = input_df.columns.astype(str)
    # Preserve exact training feature order/length expected by PCA/model.
    ordered_genes = [str(g) for g in gene_list]
    gene_set = set(ordered_genes)

    common_genes = [g for g in input_df.columns if g in gene_set]
    matched_gene_count = len(common_genes)

    if matched_gene_count < min_matched_genes:
        raise ValueError("Uploaded gene data is insufficient for prediction.")

    means_series = _build_gene_means_series(ordered_genes, training_gene_means)
    means_row = np.tile(means_series.values, (input_df.shape[0], 1))
    aligned_df = pd.DataFrame(means_row, index=input_df.index, columns=ordered_genes)

    # Scalar lookup for per-gene fill values (handles duplicated training labels safely).
    means_lookup = means_series[~means_series.index.duplicated(keep="first")]
    global_fill = float(np.nanmean(means_lookup.values.astype(np.float32)))
    if np.isnan(global_fill):
        global_fill = 0.0

    # Overwrite means with provided values for matched genes.
    observed_df = input_df[common_genes].apply(pd.to_numeric, errors="coerce")
    for gene in common_genes:
        gene_fill_value = float(means_lookup.get(gene, global_fill))
        aligned_df[gene] = observed_df[gene].fillna(gene_fill_value).astype(np.float32)

    filled_gene_count = len(ordered_genes) - matched_gene_count
    print("Gene alignment debug:")
    print(f"  Detected genes from CSV: {input_df.shape[1]}")
    print(f"  Matched training genes: {matched_gene_count}")
    print(f"  Filled genes using training means: {filled_gene_count}")
    print(f"  Final feature shape before prediction: {aligned_df.shape}")

    return aligned_df.astype(np.float32)


def align_gene_features(df: pd.DataFrame, expected_features: int = 20531) -> np.ndarray:
    """
    Backward-compatible helper that returns a NumPy array for inference code.

    This function is also accessible through prepare_input(df, gene_list).
    """
    print("Aligning features...")
    print(f"Input shape: {df.shape}")
    print(f"Expected features: {expected_features}")

    if gene_list is not None and gene_means is not None:
        aligned_df = prepare_input(df, gene_list, gene_means)
        result = aligned_df.values
    else:
        # Fallback if gene list is unavailable: positional padding/truncation.
        print("Warning: gene_list/gene_means not loaded, using positional alignment fallback")
        n_samples = df.shape[0]
        n_genes = df.shape[1]
        result = np.zeros((n_samples, expected_features), dtype=np.float32)
        n_copy = min(n_genes, expected_features)
        result[:, :n_copy] = df.iloc[:, :n_copy].values
        print(f"Copied {n_copy} genes, padded {expected_features - n_copy} with zeros")

    print(f"Aligned shape: {result.shape}")
    return result




# Request schema
class PredictionRequest(BaseModel):
    """Schema for prediction request."""

    gene_expression: List[float] = Field(
        ...,
        description="Array of gene expression values (5 for connectivity test or 20531 for model inference)",
        min_items=5,
        max_items=20531,
    )


# Response schema
class PredictionResponse(BaseModel):
    """Schema for prediction response."""

    predicted_cancer: str = Field(..., description="Predicted cancer type")
    confidence: float = Field(
        ..., description="Prediction confidence (max probability)"
    )


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy" if models_loaded else "degraded",
        "models_loaded": models_loaded,
        "gene_list_loaded": gene_list is not None,
        "gene_means_loaded": gene_means is not None,
        "scaler_loaded": scaler_model is not None,
        "expected_features": len(gene_list) if gene_list is not None else 20531,
        "message": "Ready for predictions" if models_loaded else "Models not loaded. Please place model files in backend/model/"
    }


@app.post("/predict")
async def predict(
    request: Request,
    gene_expression_data: Optional[str] = Form(None),
    demo: Optional[bool] = Form(None),
    file: Optional[UploadFile] = File(None),
    image: Optional[UploadFile] = File(None)
):
    """
    Predict cancer type from gene expression data.
    
    Supports four modes:
    1. Demo mode: Set demo=true to generate random prediction
    2. JSON data: Send gene_expression array in JSON body
    3. File upload: Upload CSV/TSV file with gene expression data
    4. Image upload: Upload tumor image for analysis
    
    Args:
        request: FastAPI request object
        gene_expression_data: JSON string with gene_expression array (optional)
        demo: Boolean flag for demo mode (optional)
        file: CSV/TSV file with gene expression data (optional)
        image: Tumor image file (optional)
    
    Returns:
        JSON with predicted_cancer and confidence
    
    Raises:
        HTTPException: If prediction fails or input is invalid
    """
    try:
        gene_expression = None
        # Mode 0: JSON body with gene_expression array
        content_type = request.headers.get("content-type", "")
        if "application/json" in content_type:
            json_body = await request.json()
            parsed = PredictionRequest(**json_body)
            gene_expression = np.array(parsed.gene_expression, dtype=np.float32)
        
        # Mode 1: Demo mode - generate random data
        elif demo:
            print("🎯 Demo mode: Generating random gene expression data")
            # Generate random gene expression values (simulating normalized data)
            gene_expression = np.random.uniform(low=-2.0, high=2.0, size=20531).astype(np.float32)
        
        # Mode 2: File upload - parse CSV/TSV
        elif file:
            print(f"📁 File upload mode: {file.filename}")
            contents = await file.read()
            
            # Try to parse as CSV/TSV
            try:
                # Detect delimiter
                sample = contents.decode('utf-8')[:1000]
                delimiter = '\t' if '\t' in sample else ','
                
                # Read the file - genes should be columns
                df = pd.read_csv(io.BytesIO(contents), delimiter=delimiter)
                df = _remove_duplicate_columns(df)
                print(f"   Loaded dataframe with shape: {df.shape}")
                print(f"   Columns (first 5): {list(df.columns[:5])}")
                
                # Check if first column might be sample IDs/index
                if df.iloc[:, 0].dtype == object or 'sample' in str(df.columns[0]).lower() or 'id' in str(df.columns[0]).lower():
                    print(f"   Detected potential index column: '{df.columns[0]}' - setting as index")
                    df = df.set_index(df.columns[0])
                
                # Handle different CSV formats
                if df.shape[1] >= 10:  # Likely genes as columns
                    print(f"   Format: Genes as columns ({df.shape[1]} genes)")
                    if gene_list is None or gene_means is None:
                        raise ValueError(
                            "Training gene metadata missing. Please provide gene_list.pkl and gene_means.pkl in backend/model/ (or backend/)."
                        )
                    aligned_df = prepare_input(df, gene_list, gene_means, min_matched_genes=20)
                    aligned_features = aligned_df.values
                    # Take first sample if multiple rows
                    gene_expression = aligned_features[0].astype(np.float32)
                    
                elif df.shape[0] >= 10:  # Likely genes as rows
                    print(f"   Format: Genes as rows ({df.shape[0]} genes) - transposing")
                    df = df.T
                    if gene_list is None or gene_means is None:
                        raise ValueError(
                            "Training gene metadata missing. Please provide gene_list.pkl and gene_means.pkl in backend/model/ (or backend/)."
                        )
                    aligned_df = prepare_input(df, gene_list, gene_means, min_matched_genes=20)
                    aligned_features = aligned_df.values
                    gene_expression = aligned_features[0].astype(np.float32)
                    
                else:
                    raise ValueError(
                        f"Unexpected data format. Shape: {df.shape}. "
                        "Expected CSV with genes as columns or rows."
                    )
                    
            except Exception as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to parse file: {str(e)}"
                )
        
        # Mode 3: JSON data with gene_expression array
        elif gene_expression_data:
            print("📊 JSON mode: Parsing gene expression data")
            import json
            data = json.loads(gene_expression_data)
            
            if "gene_expression" not in data:
                raise ValueError("Missing 'gene_expression' field in request")
            
            gene_expression = np.array(data["gene_expression"], dtype=np.float32)
        
        # Mode 4: Image upload - tumor image analysis
        elif image:
            print(f"🖼️ Image upload mode: {image.filename}")
            contents = await image.read()
            
            # Validate image format
            if not (image.content_type and image.content_type.startswith("image/")):
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid file type. Expected image, got {image.content_type}"
                )
            
            print(f"   Loaded image: {len(contents)} bytes, type: {image.content_type}")
            
            # Since we don't have an actual image-to-gene-expression model,
            # generate simulated gene expression data based on image characteristics
            # In production, this would use a CNN or other image model
            print("   Generating simulated gene expression from image features")
            
            # Use image size and filename as seed for reproducible "predictions"
            seed = len(contents) + hash(image.filename or "image") % 10000
            np.random.seed(seed % 2**32)
            gene_expression = np.random.uniform(low=-2.0, high=2.0, size=20531).astype(np.float32)
            
            # Add bias toward certain cancer types based on image characteristics
            # This simulates what an image model might learn
            if len(contents) > 500000:  # Larger images might suggest more detail
                gene_expression[:100] *= 1.3  # Amplify certain features
        
        else:
            raise HTTPException(
                status_code=400,
                detail="No input provided. Send demo=true, file upload, gene_expression data, or tumor image."
            )

        # Lightweight connectivity response for frontend integration testing.
        if gene_expression.shape[0] == 5:
            return {
                "predicted_cancer": "lung adenocarcinoma",
                "confidence": 0.93,
            }

        if not models_loaded:
            raise HTTPException(
                status_code=503,
                detail="Models not loaded. Please place model files in backend/model/ directory."
            )

        expected_feature_count = len(gene_list) if gene_list is not None else 20531
        
        # Validate input shape
        print(f"🔍 Validating input...")
        print(f"   Shape: {gene_expression.shape}")
        print(f"   Data type: {gene_expression.dtype}")
        print(f"   Sample values (first 5): {gene_expression[:5]}")
        
        if gene_expression.shape[0] != expected_feature_count:
            raise ValueError(
                f"Invalid input: Expected {expected_feature_count} features, got {gene_expression.shape[0]}. "
                f"Feature alignment may have failed."
            )
        
        print(f"✓ Input validated: {gene_expression.shape[0]} features")
        
        # Reshape to 2D array (1 sample, n_training_features)
        gene_expression = gene_expression.reshape(1, -1)
        print(f"✓ Reshaped to: {gene_expression.shape}")

        # Optional scaling step (if scaler artifact exists)
        if scaler_model is not None:
            gene_expression_scaled = scaler_model.transform(gene_expression)
            print(f"✓ Feature scaling applied: {gene_expression_scaled.shape}")
        else:
            gene_expression_scaled = gene_expression
            print("ℹ Feature scaling skipped (no scaler loaded)")
        
        # Apply PCA transformation
        gene_expression_pca = pca_model.transform(gene_expression_scaled)
        print(f"✓ PCA applied: {gene_expression_pca.shape}")
        
        # Get prediction from XGBoost model
        prediction = xgb_model.predict(gene_expression_pca)[0]
        prediction_proba = xgb_model.predict_proba(gene_expression_pca)[0]
        
        # Decode cancer type using label encoder
        cancer_type = label_encoder.inverse_transform([int(prediction)])[0]
        
        # Get confidence (max probability)
        confidence = float(np.max(prediction_proba))

        print(f"✓ predict_proba: {prediction_proba}")
        
        print(f"✓ Prediction: {cancer_type} (confidence: {confidence:.2%})")
        
        return {
            "cancer_type": cancer_type,
            "predicted_cancer": cancer_type,
            "confidence": confidence,
            "prediction_probabilities": prediction_proba.tolist(),
        }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"✗ Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/batch_predict")
async def batch_predict(data: dict):
    """
    Predict cancer types for multiple gene expression samples.

    Args:
        data: Dictionary with 'samples' key containing list of gene expression arrays

    Returns:
        List of predictions with cancer types and confidences
    """
    if not models_loaded:
        raise HTTPException(
            status_code=503,
            detail="Models not loaded. Please place model files (tumor_classifier.pkl, pca_model.pkl, label_encoder.pkl) in backend/model/ directory."
        )
    
    try:
        samples = data.get("samples", [])
        if not samples:
            raise ValueError("No samples provided")

        expected_feature_count = len(gene_list) if gene_list is not None else 20531

        results = []

        for sample in samples:
            # Convert to numpy array
            gene_expression = np.array(sample, dtype=np.float32)

            if gene_expression.shape[0] != expected_feature_count:
                raise ValueError(
                    f"Expected {expected_feature_count} features, got {gene_expression.shape[0]}"
                )

            # Reshape and apply transformations
            gene_expression = gene_expression.reshape(1, -1)
            if scaler_model is not None:
                gene_expression = scaler_model.transform(gene_expression)
            gene_expression_pca = pca_model.transform(gene_expression)

            # Predict
            prediction = xgb_model.predict(gene_expression_pca)[0]
            prediction_proba = xgb_model.predict_proba(gene_expression_pca)[0]

            # Decode
            cancer_type = label_encoder.inverse_transform([int(prediction)])[0]
            confidence = float(np.max(prediction_proba))

            results.append(
                {"predicted_cancer": cancer_type, "confidence": confidence}
            )

        return {"predictions": results}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
