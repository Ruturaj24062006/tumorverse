"""FastAPI route for CNN-based tumor image prediction."""

from __future__ import annotations

import os
import tempfile
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile

try:
    from utils.image_predict import predictor
    IMAGE_PREDICTION_IMPORT_ERROR = None
except ModuleNotFoundError as exc:
    predictor = None
    IMAGE_PREDICTION_IMPORT_ERROR = exc


router = APIRouter(tags=["image-prediction"])


@router.post("/predict-image")
async def predict_image(file: UploadFile = File(...)):
    """Predict tumor type and confidence from an uploaded medical image."""
    if predictor is None:
        missing_dependency = getattr(IMAGE_PREDICTION_IMPORT_ERROR, "name", "unknown")
        raise HTTPException(
            status_code=503,
            detail=(
                "Image prediction dependencies are not available. "
                f"Missing module: {missing_dependency}. "
                "Use Python 3.11-3.13 and install backend requirements to enable this endpoint."
            ),
        )

    filename = file.filename or "uploaded_image"
    suffix = Path(filename).suffix.lower()

    allowed_suffixes = {".jpg", ".jpeg", ".png"}
    if suffix not in allowed_suffixes:
        raise HTTPException(status_code=400, detail="Only JPG and PNG images are supported.")

    if file.content_type and file.content_type not in {"image/jpeg", "image/png"}:
        raise HTTPException(status_code=400, detail="Invalid image MIME type. Use JPG or PNG.")

    temp_path = None
    try:
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Uploaded image is empty.")

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(image_bytes)
            temp_path = Path(temp_file.name)

        result = predictor.predict_image(temp_path)
        return result
    except HTTPException:
        raise
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Image prediction failed: {exc}") from exc
    finally:
        await file.close()
        if temp_path and temp_path.exists():
            os.remove(temp_path)
