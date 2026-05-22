"""Centralized treatment intelligence scoring for TumorVerse.

This module acts as the shared source of truth for treatment quality across
recommendation, recovery, visualization, and tumor evolution systems.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Mapping

import math

from config.medicine_database import (
    CANCER_RECOMMENDED,
    get_medicine_profile,
    get_medicines_for_cancer,
    is_medicine_recommended,
)


@dataclass(frozen=True)
class TreatmentScoreInput:
    medicine: str
    cancer_type: str
    tumor_size: float
    aggressiveness: float | str
    recommendation_confidence: float
    segmentation_confidence: float = 75.0
    response_trend: float = 50.0
    medicine_category: str | None = None
    previous_treatment_response: float = 50.0


class TreatmentIntelligenceEngine:
    """Compute one deterministic treatment score and its downstream projections."""

    _STATUS_BANDS = [
        (85.0, "Excellent Response"),
        (70.0, "Responding to Treatment"),
        (55.0, "Partial Regression"),
        (40.0, "Stable Disease"),
        (0.0, "Progressive Disease"),
    ]

    _RECOVERY_LABELS = [
        (82.0, "highly likely"),
        (66.0, "possible"),
        (48.0, "difficult"),
        (30.0, "unlikely"),
        (0.0, "not predicted"),
    ]

    _MEDICINE_CATEGORY_MAP: Dict[str, str] = {
        "cabergoline": "dopamine_agonist",
        "octreotide": "somatostatin_analog",
        "pasireotide": "somatostatin_analog",
        "temozolomide": "alkylating_agent",
        "cisplatin": "platinum_agent",
        "oxaliplatin": "platinum_agent",
        "docetaxel": "taxane",
        "paclitaxel": "taxane",
        "pembrolizumab": "checkpoint_inhibitor",
        "nivolumab": "checkpoint_inhibitor",
        "gefitinib": "egfr_inhibitor",
        "tamoxifen": "hormonal_agent",
        "imatinib": "tyrosine_kinase_inhibitor",
        "gemcitabine": "antimetabolite",
        "sorafenib": "multikinase_inhibitor",
        "lenvatinib": "multikinase_inhibitor",
        "everolimus": "mtor_inhibitor",
        "enzalutamide": "androgen_receptor_inhibitor",
        "abiraterone": "androgen_synthesis_inhibitor",
        "vemurafenib": "braf_inhibitor",
        "dabrafenib": "braf_inhibitor",
        "olaparib": "parp_inhibitor",
        "trastuzumab": "her2_targeted",
        "cetuximab": "egfr_antibody",
        "ipilimumab": "checkpoint_inhibitor",
    }

    _CATEGORY_POTENCY = {
        "dopamine_agonist": 0.92,
        "somatostatin_analog": 0.88,
        "alkylating_agent": 0.90,
        "platinum_agent": 0.84,
        "taxane": 0.78,
        "checkpoint_inhibitor": 0.86,
        "egfr_inhibitor": 0.80,
        "hormonal_agent": 0.74,
        "tyrosine_kinase_inhibitor": 0.82,
        "antimetabolite": 0.76,
        "multikinase_inhibitor": 0.83,
        "mtor_inhibitor": 0.73,
        "androgen_receptor_inhibitor": 0.72,
        "androgen_synthesis_inhibitor": 0.71,
        "braf_inhibitor": 0.84,
        "parp_inhibitor": 0.79,
        "her2_targeted": 0.81,
        "egfr_antibody": 0.79,
    }

    _CANCER_COMPATIBILITY = {
        "PITUITARY": {
            "cabergoline": 92,
            "octreotide": 84,
            "pasireotide": 80,
            "cisplatin": 18,
            "paclitaxel": 22,
        },
        "GBM": {
            "temozolomide": 94,
            "cabergoline": 88,
            "bevacizumab": 79,
            "cisplatin": 24,
            "paclitaxel": 16,
        },
        "LUAD": {
            "docetaxel": 90,
            "pembrolizumab": 86,
            "gefitinib": 84,
            "cisplatin": 64,
            "paclitaxel": 34,
        },
        "BRCA": {
            "tamoxifen": 92,
            "docetaxel": 84,
            "pembrolizumab": 72,
            "cisplatin": 62,
            "paclitaxel": 48,
        },
        "COREAD": {
            "cisplatin": 90,
            "oxaliplatin": 88,
            "docetaxel": 72,
            "paclitaxel": 30,
            "cabergoline": 20,
        },
        "KIRC": {
            "nivolumab": 91,
            "pembrolizumab": 88,
            "cabergoline": 58,
            "cisplatin": 34,
            "paclitaxel": 26,
        },
        "MELANOMA": {
            "ipilimumab": 90,
            "pembrolizumab": 88,
            "nivolumab": 88,
            "vemurafenib": 84,
            "paclitaxel": 24,
        },
    }

    _AGGRESSIVENESS_DEFAULTS = {
        "low": 28.0,
        "moderate": 55.0,
        "high": 82.0,
    }

    @staticmethod
    def _clamp(value: float, lower: float, upper: float) -> float:
        return max(lower, min(upper, value))

    @staticmethod
    def _normalize_text(value: str | None) -> str:
        return (value or "").strip().lower()

    @staticmethod
    def _normalize_cancer_type(value: str | None) -> str:
        text = (value or "").strip().upper()
        if "GBM" in text or "GLIOMA" in text:
            return "GBM"
        if "LUAD" in text or "LUNG" in text:
            return "LUAD"
        if "BRCA" in text or "BREAST" in text:
            return "BRCA"
        if "COREAD" in text or "COLON" in text or "COLO" in text:
            return "COREAD"
        if "KIRC" in text or "KIDNEY" in text:
            return "KIRC"
        if "PITUITARY" in text:
            return "PITUITARY"
        if "MELANOMA" in text or "SKIN" in text:
            return "MELANOMA"
        return text or "UNKNOWN"

    @classmethod
    def _normalize_aggressiveness(cls, aggressiveness: float | str) -> float:
        if isinstance(aggressiveness, str):
            return cls._AGGRESSIVENESS_DEFAULTS.get(aggressiveness.strip().lower(), 55.0)
        return cls._clamp(float(aggressiveness), 0.0, 100.0)

    @classmethod
    def _medicine_category(cls, medicine: str, override: str | None = None) -> str:
        if override:
            return cls._normalize_text(override)
        normalized = cls._normalize_text(medicine)
        return cls._MEDICINE_CATEGORY_MAP.get(normalized, "general_oncology")

    @classmethod
    def _compatibility_score(cls, medicine: str, cancer_type: str, category: str) -> float:
        normalized_medicine = cls._normalize_text(medicine)
        cancer_key = cls._normalize_cancer_type(cancer_type)
        explicit = cls._CANCER_COMPATIBILITY.get(cancer_key, {}).get(normalized_medicine)
        if explicit is not None:
            return float(explicit)

        profile = get_medicine_profile(medicine)
        cancer_bonus = 18.0 if is_medicine_recommended(medicine, cancer_key) else 0.0
        category_bonus = {
            "dopamine_agonist": 18.0,
            "somatostatin_analog": 15.0,
            "alkylating_agent": 14.0,
            "checkpoint_inhibitor": 12.0,
            "platinum_agent": 10.0,
            "taxane": 8.0,
            "egfr_inhibitor": 10.0,
            "hormonal_agent": 9.0,
            "multikinase_inhibitor": 11.0,
            "parp_inhibitor": 8.0,
        }.get(category, 5.0)

        base = float(profile["effectiveness"]) * 100.0
        return cls._clamp(base * 0.55 + cancer_bonus + category_bonus, 0.0, 100.0)

    @classmethod
    def _medicine_potency_score(cls, medicine: str, category: str) -> float:
        profile = get_medicine_profile(medicine)
        normalized_category = cls._normalize_text(category)
        category_factor = cls._CATEGORY_POTENCY.get(normalized_category, 0.76)
        potency = (
            float(profile["effectiveness"]) * 100.0 * 0.55
            + cls._clamp(float(profile["k"]) / 0.08 * 100.0, 0.0, 100.0) * 0.18
            + cls._clamp(float(profile["dosage_sensitivity"]) * 100.0, 0.0, 100.0) * 0.12
            + category_factor * 100.0 * 0.15
        )
        return cls._clamp(potency, 0.0, 100.0)

    @staticmethod
    def _tumor_size_penalty(tumor_size: float) -> float:
        size = max(0.0, float(tumor_size))
        if size <= 1.0:
            size *= 100.0
        normalized = math.log1p(size) / math.log1p(140.0)
        return 1.0 + 6.0 * max(0.0, min(1.0, normalized))

    @staticmethod
    def _aggressiveness_penalty(aggressiveness: float) -> float:
        normalized = max(0.0, min(1.0, aggressiveness / 100.0))
        return 1.0 + 7.0 * (normalized ** 1.12)

    @staticmethod
    def _segmentation_bonus(segmentation_confidence: float) -> float:
        return max(0.0, min(100.0, float(segmentation_confidence)))

    @staticmethod
    def _previous_response_value(previous_treatment_response: float, response_trend: float) -> float:
        previous = max(0.0, min(100.0, float(previous_treatment_response)))
        trend = max(0.0, min(100.0, float(response_trend)))
        return 0.6 * previous + 0.4 * trend

    @classmethod
    def _resistance_penalty(cls, previous_treatment_response: float, response_trend: float) -> float:
        previous = cls._previous_response_value(previous_treatment_response, response_trend)
        return cls._clamp(5.0 - previous * 0.03, 0.5, 5.0)

    @classmethod
    def _compatibility_gate(cls, compatibility_score: float, recommended: bool) -> float:
        if compatibility_score < 30.0:
            return 0.30
        if compatibility_score < 45.0:
            return 0.48 if not recommended else 0.62
        if compatibility_score < 60.0:
            return 0.70 if not recommended else 0.82
        if compatibility_score < 75.0:
            return 0.84 if recommended else 0.76
        return 1.06 if recommended else 0.88

    @staticmethod
    def _tiered_effectiveness_base(score: float) -> float:
        value = max(0.0, min(100.0, float(score)))
        tiers = [
            (85.0, 100.0, 80.0, 95.0),
            (70.0, 85.0, 65.0, 80.0),
            (55.0, 70.0, 40.0, 65.0),
            (40.0, 55.0, 20.0, 45.0),
            (0.0, 40.0, 0.0, 20.0),
        ]
        for lower_score, upper_score, lower_effect, upper_effect in tiers:
            if value >= lower_score or lower_score == 0.0:
                if upper_score == lower_score:
                    return upper_effect
                if value <= upper_score:
                    fraction = (value - lower_score) / (upper_score - lower_score)
                    return lower_effect + (upper_effect - lower_effect) * fraction
        return 0.0

    @classmethod
    def _effectiveness_modifiers(
        cls,
        *,
        medicine: str,
        cancer_type: str,
        aggressiveness: float,
        tumor_size: float,
        response_trend: float,
        compatibility_score: float,
        medicine_potency: float,
    ) -> Dict[str, float]:
        recommended = is_medicine_recommended(medicine, cancer_type)
        aggressiveness_modifier = cls._clamp(1.0 - (aggressiveness / 100.0) * 0.30, 0.55, 1.0)
        size_normalized = math.log1p(max(0.0, tumor_size)) / math.log1p(140.0)
        size_modifier = cls._clamp(1.0 - size_normalized * 0.26, 0.68, 1.0)
        potency_modifier = cls._clamp(0.82 + (medicine_potency / 100.0) * 0.34, 0.82, 1.16)
        trend_modifier = cls._clamp(0.84 + (response_trend / 100.0) * 0.28, 0.84, 1.12)
        compatibility_modifier = cls._compatibility_gate(compatibility_score, recommended)

        return {
            "aggressiveness_modifier": round(aggressiveness_modifier, 4),
            "size_modifier": round(size_modifier, 4),
            "potency_modifier": round(potency_modifier, 4),
            "trend_modifier": round(trend_modifier, 4),
            "compatibility_modifier": round(compatibility_modifier, 4),
            "recommended_bonus": 1.0 if recommended else 0.0,
        }

    @classmethod
    def _effectiveness_response_category(cls, effectiveness: float) -> str:
        value = cls._clamp(float(effectiveness), 0.0, 100.0)
        if value >= 82.0:
            return "Excellent Response"
        if value >= 68.0:
            return "Strong Response"
        if value >= 38.0:
            return "Partial Response"
        if value >= 25.0:
            return "Weak Response"
        if value >= 15.0:
            return "Resistant Tumor"
        return "Progressive Disease"

    @classmethod
    def _recovery_probability_label(cls, effectiveness: float, compatibility_score: float) -> str:
        value = cls._clamp(float(effectiveness), 0.0, 100.0)
        if value >= 70.0 and compatibility_score >= 55.0:
            return "high"
        if value >= 45.0:
            return "moderate"
        if value >= 25.0:
            return "low"
        return "very low"

    @classmethod
    def _stabilization_probability(cls, effectiveness: float, compatibility_score: float, response_trend: float) -> float:
        probability = (
            cls._clamp(float(effectiveness), 0.0, 100.0) * 0.0065
            + cls._clamp(float(compatibility_score), 0.0, 100.0) * 0.0020
            + cls._clamp(float(response_trend), 0.0, 100.0) * 0.0015
        )
        return cls._clamp(probability, 0.0, 0.98)

    @classmethod
    def _tumor_behavior_from_effectiveness(cls, effectiveness: float, compatibility_score: float) -> str:
        value = cls._clamp(float(effectiveness), 0.0, 100.0)
        if value >= 50.0 and compatibility_score >= 30.0:
            return "shrinking"
        if value >= 30.0:
            return "stable"
        return "growing"

    @classmethod
    def _base_score(cls, inputs: TreatmentScoreInput) -> Dict[str, float]:
        medicine = cls._normalize_text(inputs.medicine)
        cancer_type = cls._normalize_cancer_type(inputs.cancer_type)
        category = cls._medicine_category(medicine, inputs.medicine_category)

        recommendation_confidence = cls._clamp(float(inputs.recommendation_confidence), 0.0, 100.0)
        segmentation_confidence = cls._segmentation_bonus(inputs.segmentation_confidence)
        response_trend = cls._clamp(float(inputs.response_trend), 0.0, 100.0)
        previous_response = cls._previous_response_value(inputs.previous_treatment_response, response_trend)
        aggressiveness = cls._normalize_aggressiveness(inputs.aggressiveness)

        compatibility_score = cls._compatibility_score(medicine, cancer_type, category)
        potency_score = cls._medicine_potency_score(medicine, category)
        tumor_stability = cls._clamp(0.55 * response_trend + 0.45 * previous_response, 0.0, 100.0)

        weighted = (
            recommendation_confidence * 0.35
            + compatibility_score * 0.25
            + response_trend * 0.15
            + potency_score * 0.10
            + segmentation_confidence * 0.05
            + tumor_stability * 0.10
        )

        aggressiveness_penalty = cls._aggressiveness_penalty(aggressiveness)
        tumor_size_penalty = cls._tumor_size_penalty(inputs.tumor_size)
        resistance_penalty = cls._resistance_penalty(inputs.previous_treatment_response, response_trend)
        compatibility_gate = cls._compatibility_gate(compatibility_score, is_medicine_recommended(medicine, cancer_type))

        score = weighted - aggressiveness_penalty - tumor_size_penalty - resistance_penalty
        score += 6.0 if cancer_type != "UNKNOWN" and is_medicine_recommended(medicine, cancer_type) else 0.0
        score *= compatibility_gate
        score = cls._clamp(score, 0.0, 100.0)

        return {
            "treatment_score": round(score, 2),
            "recommendation_confidence": recommendation_confidence,
            "compatibility_score": round(compatibility_score, 2),
            "medicine_potency": round(potency_score, 2),
            "segmentation_confidence": round(segmentation_confidence, 2),
            "response_trend": round(response_trend, 2),
            "previous_treatment_response": round(previous_response, 2),
            "tumor_stability": round(tumor_stability, 2),
            "aggressiveness": round(aggressiveness, 2),
            "aggressiveness_penalty": round(aggressiveness_penalty, 2),
            "tumor_size_penalty": round(tumor_size_penalty, 2),
            "resistance_penalty": round(resistance_penalty, 2),
            "compatibility_gate": round(compatibility_gate, 2),
            "medicine_category": category,
            "cancer_type": cancer_type,
        }

    @staticmethod
    def status_from_score(score: float) -> str:
        value = max(0.0, min(100.0, float(score)))
        if value >= 85.0:
            return "Excellent Response"
        if value >= 70.0:
            return "Responding to Treatment"
        if value >= 55.0:
            return "Partial Regression"
        if value >= 40.0:
            return "Stable Disease"
        if value >= 20.0:
            return "Resistant Tumor"
        return "Progressive Disease"

    @staticmethod
    def recovery_label_from_score(score: float) -> str:
        value = max(0.0, min(100.0, float(score)))
        for threshold, label in TreatmentIntelligenceEngine._RECOVERY_LABELS:
            if value >= threshold:
                return label
        return "not predicted"

    @staticmethod
    def risk_level_from_score(score: float) -> str:
        value = max(0.0, min(100.0, float(score)))
        if value >= 80.0:
            return "low"
        if value >= 62.0:
            return "moderate"
        if value >= 40.0:
            return "high"
        return "critical"

    @staticmethod
    def effectiveness_from_score(score: float) -> float:
        return round(max(0.0, min(1.0, float(score) / 100.0)), 4)

    @staticmethod
    def effectiveness_percent_from_score(score: float) -> float:
        return round(max(0.0, min(100.0, float(score))), 2)

    @staticmethod
    def tumor_dynamics_from_score(score: float) -> Dict[str, float]:
        normalized = max(0.0, min(1.0, float(score) / 100.0))
        return {
            "shrink_strength": round(0.08 + 0.20 * normalized, 4),
            "aggressiveness_shift": round(0.55 - 0.42 * normalized, 4),
            "visual_softness": round(0.25 + 0.55 * normalized, 4),
            "pulsation_intensity": round(0.28 - 0.18 * normalized, 4),
            "growth_pressure": round(0.60 - 0.52 * normalized, 4),
        }

    @staticmethod
    def response_band_from_score(score: float) -> str:
        value = max(0.0, min(100.0, float(score)))
        if value >= 85.0:
            return "excellent"
        if value >= 70.0:
            return "strong"
        if value >= 55.0:
            return "partial"
        if value >= 40.0:
            return "stable"
        return "poor"

    def calculate_effectiveness(self, payload: float | Mapping[str, Any] | TreatmentScoreInput) -> float | Dict[str, Any]:
        if isinstance(payload, (int, float)):
            return round(self._tiered_effectiveness_base(float(payload)), 2)

        if isinstance(payload, TreatmentScoreInput):
            payload_map: Dict[str, Any] = {
                "treatment_score": self._base_score(payload)["treatment_score"],
                "medicine": payload.medicine,
                "cancer_type": payload.cancer_type,
                "aggressiveness": payload.aggressiveness,
                "tumor_size": payload.tumor_size,
                "response_trend": payload.response_trend,
                "previous_treatment_response": payload.previous_treatment_response,
                "recommendation_confidence": payload.recommendation_confidence,
                "segmentation_confidence": payload.segmentation_confidence,
                "medicine_category": payload.medicine_category,
            }
        else:
            payload_map = dict(payload)

        score = self._clamp(float(payload_map.get("treatment_score", payload_map.get("score", 0.0))), 0.0, 100.0)
        medicine = str(payload_map.get("medicine", "unknown"))
        cancer_type = str(payload_map.get("cancer_type", payload_map.get("TCGA_DESC", "UNKNOWN")))
        aggressiveness = self._normalize_aggressiveness(payload_map.get("aggressiveness", 55.0))
        tumor_size = float(payload_map.get("tumor_size", 0.0))
        response_trend = self._clamp(float(payload_map.get("response_trend", 50.0)), 0.0, 100.0)
        medicine_category = self._medicine_category(medicine, payload_map.get("medicine_category"))
        compatibility_score = self._compatibility_score(medicine, cancer_type, medicine_category)
        medicine_potency = self._medicine_potency_score(medicine, medicine_category)
        recommended = is_medicine_recommended(medicine, cancer_type)

        base_effectiveness = self._tiered_effectiveness_base(score)
        modifiers = self._effectiveness_modifiers(
            medicine=medicine,
            cancer_type=cancer_type,
            aggressiveness=aggressiveness,
            tumor_size=tumor_size,
            response_trend=response_trend,
            compatibility_score=compatibility_score,
            medicine_potency=medicine_potency,
        )

        effectiveness = base_effectiveness
        modifier_product = (
            modifiers["aggressiveness_modifier"]
            * modifiers["size_modifier"]
            * modifiers["potency_modifier"]
            * modifiers["trend_modifier"]
            * modifiers["compatibility_modifier"]
        )
        effectiveness *= 0.86 + 0.14 * modifier_product

        if not recommended:
            if compatibility_score < 30.0:
                effectiveness *= 0.30
                effectiveness = min(effectiveness, 20.0)
            elif compatibility_score < 45.0:
                effectiveness *= 0.52
                effectiveness = min(effectiveness, 35.0)
            elif compatibility_score < 60.0:
                effectiveness *= 0.72
                effectiveness = min(effectiveness, 50.0)
            else:
                effectiveness *= 0.82
                effectiveness = min(effectiveness, 60.0)

        if recommended and compatibility_score >= 80.0 and score >= 85.0:
            effectiveness = min(95.0, effectiveness * 1.05)
        elif recommended and compatibility_score >= 80.0 and score >= 55.0:
            effectiveness = min(95.0, effectiveness * 1.12)

        effectiveness = self._clamp(effectiveness, 0.0, 95.0)
        response_category = self._effectiveness_response_category(effectiveness)
        recovery_probability = self._recovery_probability_label(effectiveness, compatibility_score)
        stabilization_probability = self._stabilization_probability(effectiveness, compatibility_score, response_trend)
        tumor_behavior = self._tumor_behavior_from_effectiveness(effectiveness, compatibility_score)

        return {
            "effectiveness": round(effectiveness, 2),
            "response_category": response_category,
            "recovery_probability": recovery_probability,
            "stabilization_probability": round(stabilization_probability, 4),
            "tumor_behavior": tumor_behavior,
            "biological_modifier": round(
                modifiers["aggressiveness_modifier"]
                * modifiers["size_modifier"]
                * modifiers["potency_modifier"]
                * modifiers["trend_modifier"]
                * modifiers["compatibility_modifier"],
                4,
            ),
            "compatibility_score": round(compatibility_score, 2),
            "medicine_potency": round(medicine_potency, 2),
            "medicine_category": medicine_category,
            "recommended": recommended,
            "modifiers": modifiers,
        }

    def calculate_aggressiveness(self, score: float) -> float:
        value = max(0.0, min(100.0, float(score)))
        return round(100.0 - value, 2)

    def generate_status(self, score: float) -> str:
        return self.status_from_score(score)

    def predict_recovery(self, score: float) -> Dict[str, str]:
        value = max(0.0, min(100.0, float(score)))
        if value >= 85.0:
            return {
                "25%": "3 months",
                "50%": "7 months",
                "75%": "12 months",
                "stabilization": "likely",
            }
        if value >= 70.0:
            return {
                "25%": "5 months",
                "50%": "9 months",
                "75%": "15 months",
                "stabilization": "likely",
            }
        if value >= 55.0:
            return {
                "25%": "8 months",
                "50%": "14 months",
                "75%": "Not achievable",
                "stabilization": "possible",
            }
        if value >= 40.0:
            return {
                "25%": "12 months",
                "50%": "Unstable",
                "75%": "Not achievable",
                "stabilization": "uncertain",
            }
        if value >= 20.0:
            return {
                "25%": "18 months",
                "50%": "Unlikely",
                "75%": "Not achievable",
                "stabilization": "unlikely",
            }
        return {
            "25%": "Slow / not predicted",
            "50%": "Not predicted",
            "75%": "Not predicted",
            "stabilization": "not predicted",
        }

    def simulate_tumor_behavior(self, score: float) -> Dict[str, float]:
        value = max(0.0, min(100.0, float(score)))
        normalized = value / 100.0
        return {
            "shrink_strength": round(0.03 + 0.22 * normalized, 4),
            "growth_pressure": round(0.85 - 0.72 * normalized, 4),
            "aggressiveness": round(100.0 - value, 2),
            "deformation_strength": round(0.15 + 0.85 * (1.0 - normalized), 4),
            "pulsation_strength": round(0.04 + 0.26 * (1.0 - normalized), 4),
            "visual_softness": round(0.22 + 0.58 * normalized, 4),
        }

    def calculate_treatment_score(self, payload: Mapping[str, Any] | TreatmentScoreInput) -> Dict[str, Any]:
        if isinstance(payload, TreatmentScoreInput):
            inputs = payload
        else:
            inputs = TreatmentScoreInput(
                medicine=str(payload.get("medicine", "unknown")),
                cancer_type=str(payload.get("cancer_type", payload.get("TCGA_DESC", "UNKNOWN"))),
                tumor_size=float(payload.get("tumor_size", 0.0)),
                aggressiveness=payload.get("aggressiveness", payload.get("aggressiveness_level", payload.get("aggressiveness_score", 55.0))),
                recommendation_confidence=float(payload.get("recommendation_confidence", payload.get("confidence", 50.0))),
                segmentation_confidence=float(payload.get("segmentation_confidence", 75.0)),
                response_trend=float(payload.get("response_trend", payload.get("previous_treatment_response", 50.0))),
                medicine_category=payload.get("medicine_category"),
                previous_treatment_response=float(payload.get("previous_treatment_response", payload.get("response_trend", 50.0))),
            )

        result = self._base_score(inputs)
        score = float(result["treatment_score"])
        effectiveness_details = self.calculate_effectiveness(
            {
                **result,
                "treatment_score": score,
                "medicine": inputs.medicine,
                "cancer_type": inputs.cancer_type,
                "aggressiveness": inputs.aggressiveness,
                "tumor_size": inputs.tumor_size,
                "response_trend": result["response_trend"],
                "previous_treatment_response": result["previous_treatment_response"],
                "recommendation_confidence": result["recommendation_confidence"],
                "segmentation_confidence": result["segmentation_confidence"],
                "medicine_category": result["medicine_category"],
            }
        )

        return {
            **result,
            "status": self.status_from_score(score),
            "risk_level": self.risk_level_from_score(score),
            "recovery_probability": effectiveness_details["recovery_probability"],
            "recovery_probability_label": self.recovery_label_from_score(score),
            "response_band": self.response_band_from_score(score),
            "response_category": effectiveness_details["response_category"],
            "effectiveness": effectiveness_details["effectiveness"],
            "effectiveness_ratio": round(float(effectiveness_details["effectiveness"]) / 100.0, 4),
            "biological_modifier": effectiveness_details["biological_modifier"],
            "stabilization_probability": effectiveness_details["stabilization_probability"],
            "tumor_behavior": effectiveness_details["tumor_behavior"],
            "compatibility_score": effectiveness_details["compatibility_score"],
            "medicine_potency": effectiveness_details["medicine_potency"],
            "dynamic_profile": self.simulate_tumor_behavior(score),
            "recovery_profile": self.predict_recovery(score),
            "compatible_medicines": get_medicines_for_cancer(result["cancer_type"]),
            "recommended_for_cancer": is_medicine_recommended(inputs.medicine, result["cancer_type"]),
            "compatibility_matrix_size": len(CANCER_RECOMMENDED.get(result["cancer_type"], [])),
        }


treatment_intelligence_engine = TreatmentIntelligenceEngine()
