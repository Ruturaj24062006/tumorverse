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

try:
    from utils.digital_twin_predict import digital_twin_predictor
except ModuleNotFoundError:
    digital_twin_predictor = None


router = APIRouter(tags=["image-prediction"])


def _medicine_recommendations_for_tumor(tumor_type: str):
    normalized = (tumor_type or "").strip().lower()

    if normalized == "glioma":
        return {
            "recommended": [
                {"name": "temozolomide", "confidence": 0.86, "mechanism": "DNA alkylating agent for glioma treatment"},
                {"name": "bevacizumab", "confidence": 0.74, "mechanism": "VEGF inhibition to reduce angiogenesis"},
                {"name": "lomustine", "confidence": 0.68, "mechanism": "Nitrosourea chemotherapy crossing BBB"},
            ],
            "notRecommended": [
                {"name": "trastuzumab", "confidence": 0.2, "reason": "HER2 targeting is generally not relevant for glioma"},
                {"name": "tamoxifen", "confidence": 0.16, "reason": "Hormonal pathway targeting is usually ineffective"},
            ],
        }

    if normalized == "meningioma":
        return {
            "recommended": [
                {"name": "hydroxyurea", "confidence": 0.71, "mechanism": "Cytoreductive antimetabolite used in selected cases"},
                {"name": "bevacizumab", "confidence": 0.7, "mechanism": "Anti-angiogenic therapy in progressive disease"},
                {"name": "sunitinib", "confidence": 0.63, "mechanism": "Multi-kinase inhibition for resistant tumors"},
            ],
            "notRecommended": [
                {"name": "gefitinib", "confidence": 0.19, "reason": "EGFR-targeted response is limited in most meningiomas"},
                {"name": "imatinib", "confidence": 0.21, "reason": "Weak clinical activity for typical meningioma profiles"},
            ],
        }

    if normalized == "pituitary":
        return {
            "recommended": [
                {"name": "cabergoline", "confidence": 0.88, "mechanism": "Dopamine agonist for prolactin-secreting pituitary tumors"},
                {"name": "octreotide", "confidence": 0.76, "mechanism": "Somatostatin analog for hormone-secreting adenomas"},
                {"name": "pasireotide", "confidence": 0.7, "mechanism": "Broad somatostatin receptor targeting"},
            ],
            "notRecommended": [
                {"name": "cisplatin", "confidence": 0.18, "reason": "Cytotoxic platinum therapy is generally not first-line"},
                {"name": "paclitaxel", "confidence": 0.14, "reason": "Taxane response is usually poor for pituitary adenoma"},
            ],
        }

    return {
        "recommended": [
            {"name": "temozolomide", "confidence": 0.62, "mechanism": "General CNS tumor chemotherapy fallback option"},
        ],
        "notRecommended": [
            {"name": "tamoxifen", "confidence": 0.2, "reason": "Low expected response for this tumor profile"},
        ],
    }


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
        result["medicines"] = _medicine_recommendations_for_tumor(result.get("tumor_type", ""))
        if digital_twin_predictor is not None:
            try:
                result["digital_twin"] = digital_twin_predictor.predict_image(temp_path)
            except Exception as exc:
                result["digital_twin"] = {
                    "available": False,
                    "error": str(exc),
                }
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
