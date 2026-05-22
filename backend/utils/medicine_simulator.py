"""Medicine-specific tumor shrink simulation using exponential kinetics."""

from __future__ import annotations

import hashlib
import math
from typing import Dict, Optional, Tuple

from config.medicine_database import get_medicine_profile
from utils.recovery_timeline_engine import recovery_timeline_engine
from utils.treatment_intelligence_engine import treatment_intelligence_engine


class MedicineSimulator:
    """Simulates medicine response from medicine kinetics and dosage over time."""

    @staticmethod
    def _stable_bucket_code(text: str, bucket_size: int = 100) -> int:
        digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
        return int(digest[:8], 16) % bucket_size

    @classmethod
    def _resolve_medicine_kinetics(cls, medicine_type: str) -> Dict[str, float]:
        """Resolve medicine kinetics from unified database.
        
        Uses the unified medicine database which ensures consistency
        between recommendation and simulation modules.
        """
        return get_medicine_profile(medicine_type)

    @staticmethod
    def _normalize_dosage(dosage: float) -> float:
        return max(0.1, min(3.0, float(dosage) / 50.0))

    @staticmethod
    def _normalize_aggressiveness(aggressiveness: str | float) -> float:
        if isinstance(aggressiveness, str):
            mapping = {"low": 0.3, "moderate": 0.6, "high": 0.9}
            return mapping.get(aggressiveness.strip().lower(), 0.6)
        return max(0.0, min(1.0, float(aggressiveness) / 100.0))

    @staticmethod
    def _build_treatment_score(
        medicine: str,
        cancer_type: str,
        tumor_size: float,
        aggressiveness: str | float,
        dosage: float,
        treatment_score: float | None = None,
        recommendation_confidence: float | None = None,
        segmentation_confidence: float = 75.0,
        response_trend: float = 50.0,
        previous_treatment_response: float = 50.0,
        medicine_category: str | None = None,
    ) -> dict[str, object]:
        if treatment_score is None:
            score_input = {
                "medicine": medicine,
                "cancer_type": cancer_type,
                "tumor_size": tumor_size,
                "aggressiveness": aggressiveness,
                "recommendation_confidence": recommendation_confidence if recommendation_confidence is not None else 55.0,
                "segmentation_confidence": segmentation_confidence,
                "response_trend": response_trend,
                "previous_treatment_response": previous_treatment_response,
                "medicine_category": medicine_category,
            }
            score_details = treatment_intelligence_engine.calculate_treatment_score(score_input)
            score = float(score_details["treatment_score"])
        else:
            score = max(0.0, min(100.0, float(treatment_score)))
            score_details = treatment_intelligence_engine.calculate_treatment_score(
                {
                    "medicine": medicine,
                    "cancer_type": cancer_type,
                    "tumor_size": tumor_size,
                    "aggressiveness": aggressiveness,
                    "recommendation_confidence": recommendation_confidence if recommendation_confidence is not None else score,
                    "segmentation_confidence": segmentation_confidence,
                    "response_trend": response_trend,
                    "previous_treatment_response": previous_treatment_response,
                    "medicine_category": medicine_category,
                }
            )
            score_details["treatment_score"] = score
            effectiveness_details = treatment_intelligence_engine.calculate_effectiveness(
                {
                    **score_details,
                    "treatment_score": score,
                    "medicine": medicine,
                    "cancer_type": cancer_type,
                    "aggressiveness": aggressiveness,
                    "tumor_size": tumor_size,
                    "response_trend": response_trend,
                    "previous_treatment_response": previous_treatment_response,
                    "medicine_category": medicine_category,
                }
            )
            score_details["effectiveness"] = effectiveness_details["effectiveness"]
            score_details["effectiveness_ratio"] = round(float(effectiveness_details["effectiveness"]) / 100.0, 4)
            score_details["response_category"] = effectiveness_details["response_category"]
            score_details["stabilization_probability"] = effectiveness_details["stabilization_probability"]
            score_details["tumor_behavior"] = effectiveness_details["tumor_behavior"]
            score_details["biological_modifier"] = effectiveness_details["biological_modifier"]
            score_details["dynamic_profile"] = treatment_intelligence_engine.tumor_dynamics_from_score(score)

        return score_details

    @staticmethod
    def _tumor_burden_factor(tumor_size: float) -> float:
        # Larger tumors are harder to control due to burden and heterogeneity.
        return 1.0 + 0.35 * math.log1p(max(0.0, float(tumor_size)))

    @staticmethod
    def _growth_rate(tumor_size: float) -> float:
        """Baseline tumor growth rate before medicine effect is applied."""
        size = max(0.0, float(tumor_size))
        return max(0.02, min(0.05, 0.028 + 0.006 * math.log1p(size)))

    @staticmethod
    def _drug_effect(profile: Dict[str, float], dosage: float) -> float:
        dosage_term = MedicineSimulator._normalize_dosage(dosage)
        k = max(0.0001, float(profile["k"]))
        effectiveness = max(0.01, min(1.0, float(profile["effectiveness"])))
        dosage_sensitivity = max(0.1, float(profile["dosage_sensitivity"]))
        return k * effectiveness * dosage_term * dosage_sensitivity

    @staticmethod
    def _classify_status(growth_rate: float, drug_effect: float) -> str:
        delta = growth_rate - drug_effect
        if delta < -0.003:
            return "shrinking"
        if delta > 0.003:
            return "growing"
        return "stable"

    def simulate_tumor(
        self,
        tumor_size: float,
        medicine: str,
        dosage: float,
        months: float,
        treatment_score: float | None = None,
        cancer_type: str = "UNKNOWN",
        aggressiveness: str | float = "moderate",
    ) -> Tuple[float, float]:
        """Return simulated tumor size and percentage reduction at a given month horizon."""
        initial_size = max(0.01, float(tumor_size))
        time_months = max(0.0, float(months))
        profile = self._resolve_medicine_kinetics(medicine)

        score_details = self._build_treatment_score(
            medicine=medicine,
            cancer_type=cancer_type,
            tumor_size=initial_size,
            aggressiveness=aggressiveness,
            dosage=dosage,
            treatment_score=treatment_score,
        )
        score_ratio = float(score_details["effectiveness_ratio"])
        aggressiveness_ratio = self._normalize_aggressiveness(aggressiveness)

        growth_rate = self._growth_rate(initial_size) / self._tumor_burden_factor(initial_size)
        growth_rate *= 1.15 - 0.45 * score_ratio + 0.12 * aggressiveness_ratio
        drug_effect = (0.012 + 0.11 * score_ratio) * self._normalize_dosage(dosage) * float(profile["effectiveness"])

        # new_size = size * exp((growth_rate - drug_effect) * time)
        new_size = initial_size * math.exp((growth_rate - drug_effect) * time_months)
        reduction_pct = (1.0 - (new_size / initial_size)) * 100.0
        return new_size, reduction_pct

    def recovery_time(
        self,
        tumor_size: float,
        medicine: str,
        dosage: float,
        target_reduction: float,
        aggressiveness: str = "moderate",
        cancer_type: str = "UNKNOWN",
        treatment_score: float | None = None,
    ) -> Optional[float]:
        """Return months required to reach a target percentage reduction.

        Returns None when the target is not reached inside the simulation horizon.
        """
        prediction = recovery_timeline_engine.predict_recovery_timeline(
            tumor_size=tumor_size,
            aggressiveness=aggressiveness,
            medicine=medicine,
            effectiveness=treatment_intelligence_engine.effectiveness_from_score(treatment_score if treatment_score is not None else 50.0),
            cancer_type=cancer_type,
            dosage=dosage,
            treatment_score=treatment_score,
        )

        target = int(round(max(0.0, min(100.0, float(target_reduction)))))
        key = f"recovery_{target if target in (25, 50, 75) else 25}"
        if target not in (25, 50, 75):
            target = 25 if target < 37 else 50 if target < 62 else 75
            key = f"recovery_{target}"

        value = prediction.get(key)
        return float(value) if value is not None else None

    def simulate_response(
        self,
        tumor_size: float,
        medicine_type: str,
        dosage: float,
        treatment_score: float | None = None,
        cancer_type: str = "UNKNOWN",
        aggressiveness: str | float = "moderate",
        recommendation_confidence: float | None = None,
        segmentation_confidence: float = 75.0,
        response_trend: float = 50.0,
        previous_treatment_response: float = 50.0,
        medicine_category: str | None = None,
    ) -> Dict[str, object]:
        profile = self._resolve_medicine_kinetics(medicine_type)
        score_details = self._build_treatment_score(
            medicine=medicine_type,
            cancer_type=cancer_type,
            tumor_size=tumor_size,
            aggressiveness=aggressiveness,
            dosage=dosage,
            treatment_score=treatment_score,
            recommendation_confidence=recommendation_confidence,
            segmentation_confidence=segmentation_confidence,
            response_trend=response_trend,
            previous_treatment_response=previous_treatment_response,
            medicine_category=medicine_category,
        )
        score = float(score_details["treatment_score"])
        effectiveness_ratio = float(score_details["effectiveness_ratio"])
        visual_profile = score_details["dynamic_profile"]
        timeline = recovery_timeline_engine.predict_recovery_timeline(
            tumor_size=tumor_size,
            aggressiveness=aggressiveness if isinstance(aggressiveness, str) else "moderate",
            medicine=medicine_type,
            effectiveness=effectiveness_ratio,
            cancer_type=cancer_type,
            dosage=dosage,
            treatment_score=score,
        )

        horizon_months = 6.0
        final_size, tumor_reduction = self.simulate_tumor(
            tumor_size=tumor_size,
            medicine=medicine_type,
            dosage=dosage,
            months=horizon_months,
            treatment_score=score,
            cancer_type=cancer_type,
            aggressiveness=aggressiveness,
        )

        growth_rate = self._growth_rate(tumor_size) / self._tumor_burden_factor(tumor_size)
        drug_effect = (0.012 + 0.11 * effectiveness_ratio) * self._normalize_dosage(dosage) * float(profile["effectiveness"])
        status = str(timeline.get("status") or self._classify_status(growth_rate, drug_effect))

        complete_response_possible = float(timeline.get("max_reduction", 0.0)) >= 0.90 and score >= 75.0

        recovery_months = {
            "25%": timeline.get("recovery_25"),
            "50%": timeline.get("recovery_50"),
            "75%": timeline.get("recovery_75"),
        }

        recovery_timeline = {
            "25%": f"{timeline['recovery_25']:.2f} months" if timeline.get("recovery_25") is not None else "Not achieved",
            "50%": f"{timeline['recovery_50']:.2f} months" if timeline.get("recovery_50") is not None else "Not achieved",
            "75%": f"{timeline['recovery_75']:.2f} months" if timeline.get("recovery_75") is not None else "Not achieved",
            "stabilization": f"{timeline['stabilization_time']:.2f} months" if timeline.get("stabilization_time") is not None else "Not achieved",
        }

        treatment_status = str(timeline.get("treatment_status", treatment_intelligence_engine.status_from_score(score)))
        risk_level = str(timeline.get("risk_level", treatment_intelligence_engine.risk_level_from_score(score)))

        return {
            "medicine": (medicine_type or "unknown").strip().lower(),
            "treatment_score": round(score, 2),
            "effectiveness": round(effectiveness_ratio, 4),
            "effectiveness_ratio": round(effectiveness_ratio, 4),
            "response_category": score_details.get("response_category"),
            "stabilization_probability": score_details.get("stabilization_probability"),
            "biological_modifier": score_details.get("biological_modifier"),
            "tumor_behavior": score_details.get("tumor_behavior"),
            "tumor_reduction": round(max(0.0, tumor_reduction), 4),
            "tumor_change_pct": round(tumor_reduction, 4),
            "status": status,
            "treatment_status": treatment_status,
            "risk_level": risk_level,
            "recovery_score": timeline.get("recovery_score"),
            "recovery_probability": score_details["recovery_probability"],
            "recovery_probability_score": timeline.get("recovery_probability"),
            "response_band": timeline.get("response_band"),
            "recovery_months": recovery_months,
            "recovery_timeline": recovery_timeline,
            "stabilization_time": timeline.get("stabilization_time"),
            "response_curve": timeline.get("response_curve", []),
            "timeline_curve": timeline.get("timeline_curve", []),
            "stage_probabilities": timeline.get("stage_probabilities", {}),
            "stage_likelihoods": timeline.get("stage_likelihoods", {}),
            "confidence_interval": timeline.get("confidence_interval"),
            "relapse_probability": timeline.get("relapse_probability"),
            "resistance_estimation": timeline.get("resistance_estimation"),
            "response_trend": timeline.get("response_trend"),
            "projected_tumor_size": round(float(final_size), 4),
            "max_projected_reduction": round(float(timeline.get("max_reduction", 0.0) * 100.0), 4),
            "complete_response_possible": complete_response_possible,
            "complete_response_note": (
                "Near-complete response is achievable within the simulation window."
                if complete_response_possible
                else "Literal 100% reduction is not reached within the model horizon; response remains asymptotic."
            ),
            "visual_profile": visual_profile,
            "kinetics": {
                "k": round(float(profile["k"]), 5),
                "effectiveness": round(float(profile["effectiveness"]), 4),
                "dosage_sensitivity": round(float(profile["dosage_sensitivity"]), 4),
                "growth_rate": round(float(growth_rate), 5),
                "drug_effect": round(float(drug_effect), 5),
            },
            "timeline": timeline,
            "model": "rule_based_biological_timeline",
            "equation": "response_curve = max_reduction * (1 - exp(-(t/onset)^steepness)) - resistance",
        }

    def predict_reduction(self, tumor_size: float, medicine_type: str, dosage: float) -> Tuple[float, float]:
        response = self.simulate_response(tumor_size=tumor_size, medicine_type=medicine_type, dosage=dosage)
        tumor_reduction = float(response["tumor_reduction"])
        confidence = float(response["treatment_score"]) / 100.0
        return tumor_reduction, confidence


medicine_simulator = MedicineSimulator()
