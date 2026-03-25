"""Medicine response simulation using a trained RandomForestRegressor."""

from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Dict, Optional, Tuple

import joblib
import numpy as np


class MedicineSimulator:
    """Loads medicine model and predicts tumor reduction from tumor size, medicine, and dosage."""

    _MEDICINE_CODES: Dict[str, int] = {
        "gefitinib": 0,
        "cisplatin": 1,
        "pembrolizumab": 2,
        "trastuzumab": 3,
        "imatinib": 4,
        "paclitaxel": 5,
        "tamoxifen": 6,
        "oxaliplatin": 7,
        "cetuximab": 8,
        "temozolomide": 9,
        "sorafenib": 10,
        "lenvatinib": 11,
        "nivolumab": 12,
        "everolimus": 13,
        "enzalutamide": 14,
        "abiraterone": 15,
        "docetaxel": 16,
        "vemurafenib": 17,
        "ipilimumab": 18,
        "dabrafenib": 19,
        "olaparib": 20,
    }

    def __init__(self, model_path: Optional[Path] = None) -> None:
        backend_dir = Path(__file__).resolve().parent.parent
        self.model_path = model_path or backend_dir / "model" / "medicine_model.pkl"
        self.model = None
        self.model_load_error: Optional[str] = None

        try:
            self.model = joblib.load(self.model_path)
        except Exception as exc:
            self.model_load_error = str(exc)

    @staticmethod
    def _stable_bucket_code(text: str, bucket_size: int = 100) -> int:
        digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
        return int(digest[:8], 16) % bucket_size

    @classmethod
    def encode_medicine(cls, medicine_type: str) -> int:
        normalized = (medicine_type or "").strip().lower()
        if not normalized:
            return 0

        if normalized in cls._MEDICINE_CODES:
            return cls._MEDICINE_CODES[normalized]

        # Keep unknown medicines deterministic without retraining artifacts.
        return cls._stable_bucket_code(normalized)

    @staticmethod
    def _build_confidence(estimator_predictions: np.ndarray) -> float:
        if estimator_predictions.size == 0:
            return 0.0

        std = float(np.std(estimator_predictions))
        # Confidence in [0, 1], lower spread across trees means higher confidence.
        return float(1.0 / (1.0 + std))

    def _build_feature_vector(self, tumor_size: float, medicine_type: str, dosage: float) -> np.ndarray:
        if self.model is None:
            raise RuntimeError(
                "Medicine model is not available. "
                f"Load error: {self.model_load_error or 'unknown error'}"
            )

        medicine_code = float(self.encode_medicine(medicine_type))
        feature_lookup = {
            "tumor_size": float(tumor_size),
            "medicine": medicine_code,
            "dosage": float(dosage),
        }

        feature_names = getattr(self.model, "feature_names_in_", None)
        if feature_names is not None and len(feature_names) > 0:
            ordered = [feature_lookup.get(str(name), 0.0) for name in feature_names]
            return np.array([ordered], dtype=np.float32)

        return np.array([[feature_lookup["tumor_size"], feature_lookup["medicine"], feature_lookup["dosage"]]], dtype=np.float32)

    def predict_reduction(self, tumor_size: float, medicine_type: str, dosage: float) -> Tuple[float, float]:
        if self.model is None:
            raise RuntimeError(
                "Medicine model is not available. "
                f"Load error: {self.model_load_error or 'unknown error'}"
            )

        features = self._build_feature_vector(tumor_size=tumor_size, medicine_type=medicine_type, dosage=dosage)
        prediction = float(self.model.predict(features)[0])

        estimators = getattr(self.model, "estimators_", [])
        tree_predictions = np.array([float(est.predict(features)[0]) for est in estimators], dtype=np.float32)
        confidence = self._build_confidence(tree_predictions)

        return prediction, confidence


medicine_simulator = MedicineSimulator()
