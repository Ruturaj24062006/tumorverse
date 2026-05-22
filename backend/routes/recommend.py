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
    get_medicines_for_cancer,
    is_medicine_recommended,
)
from utils.medicine_simulator import medicine_simulator
from utils.treatment_intelligence_engine import treatment_intelligence_engine


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
    status: str
    recovery_months: dict[str, float | None]
    recovery: dict[str, str]
    recovery_timeline: dict[str, str]
    stabilization_time: float | None = None
    top_3_drugs: List[str]
    recommended: bool
    complete_response_possible: bool
    max_projected_reduction: float
    complete_response_note: str
    explanation: str
    treatment_status: str | None = None
    risk_level: str | None = None
    treatment_score: float | None = None
    response_category: str | None = None
    recovery_probability: str | None = None
    effectiveness: float | None = None
    stabilization_probability: float | None = None
    biological_modifier: float | None = None
    tumor_behavior: str | None = None
    compatibility_score: float | None = None
    response_curve: list[dict] | None = None
    confidence_interval: dict | None = None
    relapse_probability: float | None = None
    resistance_estimation: float | None = None


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
        return set(get_medicines_for_cancer(cancer_type))

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
        treatment_score: float,
        score_details: dict[str, object],
    ) -> tuple[float, dict[str, float], bool, str]:
        is_recommended = cls._normalize(medicine) in cls._recommended_set(cancer_type)

        _, tumor_reduction = medicine_simulator.simulate_tumor(
            tumor_size=tumor_size,
            medicine=medicine,
            dosage=float(dosage),
            months=6.0,
            treatment_score=treatment_score,
            cancer_type=cancer_type,
        )

        status = "shrinking" if tumor_reduction > 0.5 else "growing" if tumor_reduction < -0.5 else "stable"

        simulation = medicine_simulator.simulate_response(
            tumor_size=tumor_size,
            medicine_type=medicine,
            dosage=float(dosage),
            treatment_score=treatment_score,
            cancer_type=cancer_type,
            aggressiveness="moderate",
            recommendation_confidence=float(score_details["recommendation_confidence"]),
            segmentation_confidence=float(score_details["segmentation_confidence"]),
            response_trend=float(score_details["response_trend"]),
            previous_treatment_response=float(score_details["previous_treatment_response"]),
            medicine_category=str(score_details["medicine_category"]),
        )
        timeline = simulation.get("timeline", {}) if isinstance(simulation.get("timeline", {}), dict) else {}

        recovery_months = {
            "25%": medicine_simulator.recovery_time(tumor_size, medicine, dosage, 25.0, aggressiveness="moderate", cancer_type=cancer_type, treatment_score=treatment_score),
            "50%": medicine_simulator.recovery_time(tumor_size, medicine, dosage, 50.0, aggressiveness="moderate", cancer_type=cancer_type, treatment_score=treatment_score),
            "75%": medicine_simulator.recovery_time(tumor_size, medicine, dosage, 75.0, aggressiveness="moderate", cancer_type=cancer_type, treatment_score=treatment_score),
        }
        return round(tumor_reduction, 4), recovery_months, is_recommended, status

    def recommend(self, request_data: RecommendationRequest) -> RecommendationResponse:
        candidates = sorted(self.MEDICINE_DB.keys(), key=lambda med: self._medicine_score(med, request_data.cancer_type), reverse=True)
        top_3_drugs = candidates[:3]
        best_drug = top_3_drugs[0]

        selected = self._normalize(request_data.medicine) if request_data.medicine else best_drug
        score_details = treatment_intelligence_engine.calculate_treatment_score(
            {
                "medicine": selected,
                "cancer_type": request_data.cancer_type,
                "tumor_size": request_data.tumor_size,
                "aggressiveness": 70.0,
                "recommendation_confidence": float(self._resolve_profile(selected)["effectiveness"] * 100.0),
                "segmentation_confidence": 75.0,
                "response_trend": 65.0,
                "previous_treatment_response": 60.0,
            }
        )
        treatment_score = float(score_details["treatment_score"])
        tumor_reduction, recovery_months, is_recommended, status = self._simulate_with_context(
            tumor_size=request_data.tumor_size,
            dosage=request_data.dosage,
            medicine=selected,
            cancer_type=request_data.cancer_type,
            treatment_score=treatment_score,
            score_details=score_details,
        )

        confidence = float(score_details["effectiveness_ratio"])
        simulation = medicine_simulator.simulate_response(
            tumor_size=request_data.tumor_size,
            medicine_type=selected,
            dosage=request_data.dosage,
            treatment_score=treatment_score,
            cancer_type=request_data.cancer_type,
            recommendation_confidence=float(score_details["recommendation_confidence"]),
            segmentation_confidence=float(score_details["segmentation_confidence"]),
            response_trend=float(score_details["response_trend"]),
            previous_treatment_response=float(score_details["previous_treatment_response"]),
            medicine_category=str(score_details["medicine_category"]),
        )
        explanation = (
            "The selected medicine is being evaluated by the master treatment score engine; "
            "all downstream outputs now share the same treatment signal."
            if is_recommended
            else "The selected medicine has lower compatibility for this cancer profile, so the master score reduces effectiveness, recovery, and tumor shrinkage together."
        )

        recovery = {key: (f"{value:.2f} months" if value is not None else "Not achieved") for key, value in recovery_months.items()}
        complete_response_possible = bool(simulation.get("complete_response_possible", False))
        max_projected_reduction = float(simulation.get("max_projected_reduction", 0.0))
        complete_response_note = str(simulation.get("complete_response_note", ""))
        timeline = simulation.get("timeline", {}) if isinstance(simulation.get("timeline", {}), dict) else {}

        return RecommendationResponse(
            medicine=selected,
            selected_drug=selected,
            best_drug=best_drug,
            confidence=round(confidence, 4),
            tumor_size=round(float(request_data.tumor_size), 4),
            tumor_reduction=tumor_reduction,
            status=status,
            recovery_months=recovery_months,
            recovery=recovery,
            recovery_timeline={
                "25%": recovery.get("25%", "Not achieved"),
                "50%": recovery.get("50%", "Not achieved"),
                "75%": recovery.get("75%", "Not achieved"),
                "stabilization": f"{timeline.get('stabilization_time'):.2f} months" if timeline.get("stabilization_time") is not None else "Not achieved",
            },
            stabilization_time=timeline.get("stabilization_time"),
            top_3_drugs=top_3_drugs,
            recommended=is_recommended,
            complete_response_possible=complete_response_possible,
            max_projected_reduction=round(max_projected_reduction, 4),
            complete_response_note=complete_response_note,
            explanation=f"{explanation} {complete_response_note}".strip(),
            treatment_status=simulation.get("treatment_status"),
            risk_level=simulation.get("risk_level"),
            treatment_score=treatment_score,
            response_category=score_details.get("response_category") or simulation.get("response_category"),
            recovery_probability=simulation.get("recovery_probability"),
            effectiveness=float(simulation.get("effectiveness", 0.0)),
            stabilization_probability=simulation.get("stabilization_probability"),
            biological_modifier=simulation.get("biological_modifier"),
            tumor_behavior=simulation.get("tumor_behavior"),
            compatibility_score=simulation.get("compatibility_score") or score_details.get("compatibility_score"),
            response_curve=simulation.get("response_curve"),
            confidence_interval=simulation.get("confidence_interval"),
            relapse_probability=simulation.get("relapse_probability"),
            resistance_estimation=simulation.get("resistance_estimation"),
        )


medicine_recommender = MedicineRecommender()


@router.post("/recommend", response_model=RecommendationResponse)
async def recommend_drug(payload: RecommendationRequest):
    """Recommend and simulate medicine response via rule-based exponential kinetics."""
    return medicine_recommender.recommend(payload)
