"""FastAPI route for rule-based cancer medicine recommendation and simulation."""

from __future__ import annotations

import hashlib
from typing import Dict, List

from fastapi import APIRouter
from pydantic import AliasChoices, BaseModel, ConfigDict, Field

from config.medicine_database import (
    UNIFIED_MEDICINE_DATABASE,
    CANCER_RECOMMENDED,
    get_medicine_profile,
    is_medicine_recommended,
)
from utils.medicine_simulator import medicine_simulator


router = APIRouter(tags=["medicine-recommendation"])


class RecommendationRequest(BaseModel):
    """Input payload for medicine recommendation."""

    model_config = ConfigDict(populate_by_name=True)

    cell_line: str = Field(..., min_length=1)
    cancer_type: str = Field(
        ...,
        min_length=1,
        validation_alias=AliasChoices("cancer_type", "TCGA_DESC"),
    )
    pathway: str = Field(..., min_length=1)
    target: str = Field(..., min_length=1)
    tumor_size: float = Field(..., gt=0)
    dosage: float = Field(default=50.0, gt=0)
    medicine: str | None = Field(default=None, validation_alias=AliasChoices("medicine", "drug"))


class RecommendationResponse(BaseModel):
    """Output payload for medicine recommendation."""

    medicine: str
    selected_drug: str
    best_drug: str
    confidence: float
    tumor_size: float
    tumor_reduction: float
    recovery_months: dict[str, float]
    recovery: dict[str, str]
    top_3_drugs: List[str]
    recommended: bool
    complete_response_possible: bool
    max_projected_reduction: float
    complete_response_note: str
    explanation: str


class MedicineRecommender:
    """Interpretable medicine recommender and simulator using explicit rules."""

    # Use unified medicine database (single source of truth)
    MEDICINE_DB = UNIFIED_MEDICINE_DATABASE
    CANCER_RECOMMENDED = CANCER_RECOMMENDED

    @staticmethod
    def _normalize(value: str | None) -> str:
        return (value or "").strip().lower()

    @staticmethod
    def _stable_bucket_code(text: str, bucket_size: int = 1000) -> int:
        digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
        return int(digest[:8], 16) % bucket_size

    @classmethod
    def _resolve_profile(cls, medicine: str) -> Dict[str, float]:
        """Resolve medicine profile from unified database."""
        return get_medicine_profile(medicine)

    @classmethod
    def _recommended_set(cls, cancer_type: str) -> set[str]:
        key = cls._normalize(cancer_type).upper()
        return set(cls.CANCER_RECOMMENDED.get(key, ["docetaxel", "pembrolizumab", "cabergoline"]))

    @classmethod
    def _medicine_score(cls, medicine: str, cancer_type: str) -> float:
        profile = cls._resolve_profile(medicine)
        score = float(profile["k"] * profile["effectiveness"] * profile["dosage_sensitivity"])
        if cls._normalize(medicine) in cls._recommended_set(cancer_type):
            score *= 1.40
        else:
            score *= 0.35
        return score

    @classmethod
    def _simulate_with_context(
        cls,
        tumor_size: float,
        dosage: float,
        medicine: str,
        cancer_type: str,
    ) -> tuple[float, dict[str, float], bool]:
        is_recommended = cls._normalize(medicine) in cls._recommended_set(cancer_type)

        # Keep all mechanics explainable: non-recommended medicines are penalized,
        # recommended medicines keep full modeled exposure.
        adjusted_dosage = float(dosage) * (1.0 if is_recommended else 0.40)
        _, tumor_reduction = medicine_simulator.simulate_tumor(
            tumor_size=tumor_size,
            medicine=medicine,
            dosage=adjusted_dosage,
            months=6.0,
        )

        recovery_months = {
            "25%": round(medicine_simulator.recovery_time(tumor_size, medicine, adjusted_dosage, 25.0), 4),
            "50%": round(medicine_simulator.recovery_time(tumor_size, medicine, adjusted_dosage, 50.0), 4),
            "75%": round(medicine_simulator.recovery_time(tumor_size, medicine, adjusted_dosage, 75.0), 4),
        }
        return round(tumor_reduction, 4), recovery_months, is_recommended

    def recommend(self, request_data: RecommendationRequest) -> RecommendationResponse:
        candidates = sorted(self.MEDICINE_DB.keys(), key=lambda med: self._medicine_score(med, request_data.cancer_type), reverse=True)
        top_3_drugs = candidates[:3]
        best_drug = top_3_drugs[0]

        selected = self._normalize(request_data.medicine) if request_data.medicine else best_drug
        tumor_reduction, recovery_months, is_recommended = self._simulate_with_context(
            tumor_size=request_data.tumor_size,
            dosage=request_data.dosage,
            medicine=selected,
            cancer_type=request_data.cancer_type,
        )

        # CONFIDENCE: Based on medicine's actual effectiveness score (not tumor_reduction)
        # This ensures confidence aligns with simulation quality
        medicine_profile = self._resolve_profile(selected)
        base_effectiveness = float(medicine_profile["effectiveness"])
        confidence = max(0.05, min(0.99, base_effectiveness))
        simulation = medicine_simulator.simulate_response(
            tumor_size=request_data.tumor_size,
            medicine_type=selected,
            dosage=request_data.dosage,
        )
        explanation = (
            "Selected medicine is in the rule-based recommended set for this cancer profile; "
            "full exposure dynamics were applied."
            if is_recommended
            else "Selected medicine is outside the recommended set; a response penalty was applied to model weaker benefit."
        )

        recovery = {key: f"{value:.2f} months" for key, value in recovery_months.items()}
        complete_response_possible = bool(simulation.get("complete_response_possible", False))
        max_projected_reduction = float(simulation.get("max_projected_reduction", 0.0))
        complete_response_note = str(simulation.get("complete_response_note", ""))

        return RecommendationResponse(
            medicine=selected,
            selected_drug=selected,
            best_drug=best_drug,
            confidence=round(confidence, 4),
            tumor_size=round(float(request_data.tumor_size), 4),
            tumor_reduction=tumor_reduction,
            recovery_months=recovery_months,
            recovery=recovery,
            top_3_drugs=top_3_drugs,
            recommended=is_recommended,
            complete_response_possible=complete_response_possible,
            max_projected_reduction=round(max_projected_reduction, 4),
            complete_response_note=complete_response_note,
            explanation=f"{explanation} {complete_response_note}".strip(),
        )


medicine_recommender = MedicineRecommender()


@router.post("/recommend", response_model=RecommendationResponse)
async def recommend_drug(payload: RecommendationRequest):
    """Recommend and simulate medicine response via rule-based exponential kinetics."""
    return medicine_recommender.recommend(payload)
