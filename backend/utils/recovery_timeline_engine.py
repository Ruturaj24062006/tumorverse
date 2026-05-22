"""Score-driven recovery timeline simulation for TumorVerse.

The model is intentionally biological in shape, but it remains a simulation.
It uses weighted recovery scoring, nonlinear response curves, and stage
probabilities instead of hard failure thresholds.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional

import math

from config.medicine_database import get_medicine_profile, is_medicine_recommended
from utils.treatment_intelligence_engine import treatment_intelligence_engine


@dataclass(frozen=True)
class RecoveryContext:
    tumor_size: float
    aggressiveness: str
    medicine: str
    effectiveness: float
    cancer_type: str
    response_trend: float = 0.0
    dosage: float = 50.0
    treatment_score: float | None = None


class RecoveryTimelineEngine:
    """Predict recovery milestones and status from a weighted recovery score."""

    _AGGRESSIVENESS_FACTORS = {
        "low": 0.86,
        "moderate": 1.0,
        "high": 1.22,
    }

    _CANCER_FACTORS = {
        "GBM": 1.28,
        "GLIOMA": 1.28,
        "LUAD": 1.02,
        "LUNG": 1.02,
        "BRCA": 0.95,
        "BREAST": 0.95,
        "COREAD": 1.0,
        "COLORECTAL": 1.0,
        "KIRC": 0.94,
        "KIDNEY": 0.94,
        "PITUITARY": 0.82,
        "SKIN": 0.9,
        "MELANOMA": 0.92,
    }

    _MEDICINE_CATEGORY_FACTORS = {
        "cabergoline": 1.08,
        "octreotide": 1.05,
        "pasireotide": 1.04,
        "temozolomide": 1.10,
        "docetaxel": 1.03,
        "pembrolizumab": 1.02,
        "gefitinib": 1.01,
        "cisplatin": 1.04,
        "paclitaxel": 0.88,
        "imatinib": 0.92,
        "gemcitabine": 0.9,
    }

    _STATUS_LABELS = [
        (85.0, "Excellent Recovery"),
        (70.0, "Responding to Treatment"),
        (55.0, "Partial Regression"),
        (40.0, "Stable Disease"),
        (25.0, "Resistant Tumor"),
        (-math.inf, "Progressive Disease"),
    ]

    @staticmethod
    def _clamp(value: float, lower: float, upper: float) -> float:
        return max(lower, min(upper, value))

    @staticmethod
    def _sigmoid(value: float) -> float:
        if value >= 0:
            z = math.exp(-value)
            return 1.0 / (1.0 + z)
        z = math.exp(value)
        return z / (1.0 + z)

    @staticmethod
    def _curve_signature(text: str) -> float:
        normalized = (text or "unknown").strip().lower()
        total = sum((index + 1) * ord(char) for index, char in enumerate(normalized))
        return (total % 1000) / 1000.0

    @staticmethod
    def _normalize_ratio(value: float) -> float:
        numeric = float(value)
        if numeric > 1.0:
            numeric /= 100.0
        return max(0.0, min(1.0, numeric))

    def _normalize_cancer_key(self, cancer_type: str) -> str:
        text = (cancer_type or "").strip().upper()
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
        if "SKIN" in text or "MELANOMA" in text:
            return "SKIN"
        return text or "UNKNOWN"

    def _aggressiveness_factor(self, aggressiveness: str) -> float:
        return self._AGGRESSIVENESS_FACTORS.get((aggressiveness or "").strip().lower(), 1.0)

    def _cancer_factor(self, cancer_type: str) -> float:
        return self._CANCER_FACTORS.get(self._normalize_cancer_key(cancer_type), 1.0)

    @staticmethod
    def _tumor_size_factor(tumor_size: float) -> float:
        size = max(0.0, float(tumor_size))
        if size <= 1.0:
            size *= 100.0
        size = min(size, 100.0)
        # Larger tumors are harder to treat but the penalty is soft, not binary.
        return 1.0 + 0.35 * math.sqrt(size / 100.0)

    def _medicine_profile(self, medicine: str) -> Dict[str, float]:
        profile = get_medicine_profile(medicine)
        profile["effectiveness"] = self._clamp(float(profile.get("effectiveness", 0.0)), 0.01, 1.0)
        profile["k"] = max(0.0001, float(profile.get("k", 0.01)))
        profile["dosage_sensitivity"] = max(0.1, float(profile.get("dosage_sensitivity", 0.8)))
        return profile

    def _medicine_power(self, medicine: str, profile: Dict[str, float], cancer_type: str) -> float:
        normalized = (medicine or "").strip().lower()
        profile_effect = float(profile["effectiveness"])
        k = float(profile["k"])
        dosage_sensitivity = float(profile["dosage_sensitivity"])
        category_factor = self._MEDICINE_CATEGORY_FACTORS.get(normalized, 0.98)
        recommendation_bonus = 1.07 if is_medicine_recommended(medicine, cancer_type) else 0.97
        signature = self._curve_signature(medicine)

        medicine_power = (
            0.46 * profile_effect
            + 0.24 * self._clamp(k / 0.08, 0.0, 1.5)
            + 0.18 * self._clamp(dosage_sensitivity, 0.1, 1.2)
            + 0.12 * category_factor
        ) * recommendation_bonus
        medicine_power *= 0.95 + 0.1 * signature
        return self._clamp(medicine_power, 0.0, 1.35)

    def _response_trend(self, medicine_power: float, effectiveness: float, aggressiveness_factor: float) -> float:
        trend = 0.42 * medicine_power + 0.38 * effectiveness - 0.18 * (aggressiveness_factor - 1.0)
        return self._clamp(trend, 0.0, 1.0)

    def _tumor_stability(self, aggressiveness_factor: float, cancer_factor: float, response_trend: float) -> float:
        stability = 1.0 - (0.42 * (aggressiveness_factor - 0.75) + 0.22 * (cancer_factor - 0.9)) + 0.18 * response_trend
        return self._clamp(stability, 0.0, 1.0)

    def _size_factor_score(self, tumor_size_factor: float) -> float:
        return self._clamp(1.15 - (tumor_size_factor - 1.0), 0.0, 1.0)

    def _compatibility_score(self, medicine: str, cancer_type: str) -> float:
        profile = self._medicine_profile(medicine)
        normalized_medicine = (medicine or "").strip().lower()
        recommended = is_medicine_recommended(medicine, cancer_type)
        if recommended:
            return self._clamp(68.0 + float(profile["effectiveness"]) * 32.0, 0.0, 100.0)
        penalty = 38.0 + (1.0 - float(profile["effectiveness"])) * 25.0
        if normalized_medicine in {"cisplatin", "paclitaxel", "gemcitabine"} and self._normalize_cancer_key(cancer_type) == "PITUITARY":
            penalty += 18.0
        return self._clamp(100.0 - penalty, 0.0, 100.0)

    def _recovery_stage_label(self, probability: float) -> str:
        value = self._clamp(probability, 0.0, 1.0)
        if value >= 0.82:
            return "highly likely"
        if value >= 0.62:
            return "possible"
        if value >= 0.38:
            return "difficult"
        if value >= 0.18:
            return "unlikely"
        return "not predicted"

    def _recovery_confidence(self, score: float, recovery_probability: float, stage_probabilities: Dict[str, float], response_trend: float) -> int:
        confidence = (
            0.42 * score
            + 28.0 * recovery_probability
            + 16.0 * stage_probabilities.get("50", 0.0)
            + 10.0 * stage_probabilities.get("75", 0.0)
            + 8.0 * response_trend
        )
        return int(round(self._clamp(confidence, 0.0, 100.0)))

    def _recommended_stage_months(
        self,
        score: float,
        effectiveness: float,
        aggressiveness_factor: float,
        size_factor: float,
        medicine_power: float,
        compatibility_score: float,
    ) -> Dict[str, Optional[float]]:
        score_ratio = self._clamp(score / 100.0, 0.0, 1.0)
        effectiveness = self._normalize_ratio(effectiveness)

        aggressiveness_term = max(0.0, aggressiveness_factor - 0.86)
        size_term = max(0.0, size_factor - 1.0)
        medicine_term = 0.92 + 0.08 * medicine_power + 0.10 * effectiveness + 0.08 * (compatibility_score / 100.0)

        stage_25 = round(
            self._clamp(
                (2.0 + 14.0 * ((1.0 - score_ratio) ** 1.32) + 1.8 * aggressiveness_term + 1.4 * size_term) / medicine_term,
                1.5,
                36.0,
            ),
            2,
        )
        stage_50 = round(
            self._clamp(
                stage_25 + 2.2 + 7.5 * ((1.0 - score_ratio) ** 1.12) + 1.4 * aggressiveness_term + 1.0 * size_term,
                stage_25 + 0.9,
                48.0,
            ),
            2,
        )

        if score >= 82.0 and compatibility_score >= 70.0 and effectiveness >= 0.68:
            stage_75 = round(self._clamp(stage_50 + 3.0 + 4.5 * ((1.0 - score_ratio) ** 1.05) + 1.2 * size_term, stage_50 + 2.5, 30.0), 2)
            stabilization_time = round(self._clamp(stage_75 + 3.5 + 4.0 * ((1.0 - score_ratio) ** 1.05) + 1.5 * aggressiveness_term, stage_75 + 3.0, 32.0), 2)
        elif score >= 68.0 and compatibility_score >= 55.0 and effectiveness >= 0.55:
            stage_75 = round(self._clamp(stage_50 + 4.5 + 6.0 * ((1.0 - score_ratio) ** 1.05) + 1.5 * aggressiveness_term, stage_50 + 4.0, 36.0), 2)
            stabilization_time = round(self._clamp(stage_75 + 4.0 + 4.0 * ((1.0 - score_ratio) ** 1.05), stage_75 + 3.0, 40.0), 2)
        elif score >= 55.0 and compatibility_score >= 45.0 and effectiveness >= 0.4:
            stage_75 = None
            stabilization_time = round(self._clamp(stage_50 + 7.0 + 5.0 * ((1.0 - score_ratio) ** 1.05), stage_50 + 6.0, 48.0), 2)
        elif score >= 40.0:
            stage_75 = None
            stabilization_time = None
        else:
            stage_75 = None
            stabilization_time = None

        # Weak or incompatible medicines plateau early and cannot sprint to 75%.
        if compatibility_score < 30.0 or score < 40.0:
            stage_50 = None
            stage_75 = None
            stabilization_time = None
            stage_25 = round(self._clamp(12.0 + 8.0 * ((1.0 - score_ratio) ** 1.08) + 4.0 * aggressiveness_term + 3.0 * size_term, 12.0, 36.0), 2)
        elif score < 55.0:
            stage_75 = None

        return {
            "recovery_25": stage_25,
            "recovery_50": stage_50,
            "recovery_75": stage_75,
            "stabilization_time": stabilization_time,
        }

    def _recovery_score_components(self, context: RecoveryContext) -> Dict[str, float]:
        profile = self._medicine_profile(context.medicine)
        aggressiveness_factor = self._aggressiveness_factor(context.aggressiveness)
        cancer_factor = self._cancer_factor(context.cancer_type)
        size_factor = self._tumor_size_factor(context.tumor_size)
        medicine_power = self._medicine_power(context.medicine, profile, context.cancer_type)
        effective_response = self._normalize_ratio(float(context.effectiveness))
        response_trend = self._response_trend(medicine_power, effective_response, aggressiveness_factor)
        tumor_stability = self._tumor_stability(aggressiveness_factor, cancer_factor, response_trend)
        size_score = self._size_factor_score(size_factor)
        category_bonus = self._MEDICINE_CATEGORY_FACTORS.get((context.medicine or "").strip().lower(), 0.98)

        if context.treatment_score is not None:
            recovery_score = self._clamp(float(context.treatment_score), 0.0, 100.0)
            dynamic = treatment_intelligence_engine.tumor_dynamics_from_score(recovery_score)
            response_trend = self._clamp(dynamic["visual_softness"], 0.0, 1.0)
            tumor_stability = self._clamp(1.0 - dynamic["aggressiveness_shift"], 0.0, 1.0)
        else:
            recovery_score = (
                effective_response * 0.38
                + response_trend * 0.20
                + medicine_power * 0.16
                + tumor_stability * 0.14
                + size_score * 0.12
            ) * 100.0
            recovery_score *= 0.95 + 0.03 * category_bonus
            recovery_score /= (0.92 + 0.08 * cancer_factor)
            recovery_score = self._clamp(recovery_score, 0.0, 100.0)

        return {
            "recovery_score": recovery_score,
            "effective_response": effective_response,
            "aggressiveness_factor": aggressiveness_factor,
            "cancer_factor": cancer_factor,
            "size_factor": size_factor,
            "medicine_power": medicine_power,
            "response_trend": response_trend,
            "tumor_stability": tumor_stability,
            "size_score": size_score,
            "category_bonus": category_bonus,
            "profile_effectiveness": float(profile["effectiveness"]),
            "dosage_sensitivity": float(profile["dosage_sensitivity"]),
            "k": float(profile["k"]),
        }

    def _recovery_probability(self, recovery_score: float) -> float:
        return self._sigmoid((recovery_score - 52.0) / 8.5)

    def _stage_probability(self, recovery_score: float, target: int) -> float:
        target_score = {25: 44.0, 50: 60.0, 75: 72.0}.get(target, 60.0)
        return self._sigmoid((recovery_score - target_score) / 7.0)

    def _stage_months(self, recovery_score: float, context: RecoveryContext, stage_index: int) -> float:
        profile = self._medicine_profile(context.medicine)
        aggressiveness_factor = self._aggressiveness_factor(context.aggressiveness)
        cancer_factor = self._cancer_factor(context.cancer_type)
        size_factor = self._tumor_size_factor(context.tumor_size)
        medicine_power = self._medicine_power(context.medicine, profile, context.cancer_type)
        effectiveness = self._normalize_ratio(float(context.effectiveness))

        base_months = [3.0, 6.8, 12.5][stage_index]
        difficulty = 1.0 + 0.55 * (1.0 - recovery_score / 100.0)
        difficulty += 0.20 * (aggressiveness_factor - 1.0)
        difficulty += 0.14 * (cancer_factor - 1.0)
        difficulty += 0.10 * (size_factor - 1.0)

        medicine_speed = 1.0 - 0.18 * effectiveness - 0.10 * medicine_power
        medicine_speed = self._clamp(medicine_speed, 0.48, 1.08)

        trend_speed = 1.0 - 0.15 * self._response_trend(medicine_power, effectiveness, aggressiveness_factor)
        trend_speed = self._clamp(trend_speed, 0.72, 1.05)

        months = base_months * difficulty * medicine_speed * trend_speed

        if stage_index == 0:
            months *= 0.92 + 0.12 * (1.0 - effectiveness)
        elif stage_index == 1:
            months *= 1.04 + 0.08 * (1.0 - effectiveness)
        else:
            months *= 1.12 + 0.10 * (1.0 - effectiveness)

        return round(self._clamp(months, 1.0, 36.0), 2)

    def _target_reductions(self, recovery_score: float, medicine_power: float) -> Dict[str, float]:
        base_25 = 0.25 + 0.10 * self._sigmoid((recovery_score - 42.0) / 7.0)
        base_50 = 0.50 + 0.20 * self._sigmoid((recovery_score - 58.0) / 7.0)
        base_75 = 0.72 + 0.22 * self._sigmoid((recovery_score - 72.0) / 6.5)

        if medicine_power > 0.95:
            base_75 += 0.03
        elif medicine_power < 0.45:
            base_75 -= 0.04

        return {
            "25": self._clamp(base_25, 0.18, 0.48),
            "50": self._clamp(base_50, 0.38, 0.72),
            "75": self._clamp(base_75, 0.60, 0.88),
        }

    def _timeline_curve_point(self, month: float, context: RecoveryContext, score: float, stage_75_time: float) -> Dict[str, float]:
        profile = self._medicine_profile(context.medicine)
        aggressiveness_factor = self._aggressiveness_factor(context.aggressiveness)
        cancer_factor = self._cancer_factor(context.cancer_type)
        size_factor = self._tumor_size_factor(context.tumor_size)
        medicine_power = self._medicine_power(context.medicine, profile, context.cancer_type)
        trend = self._response_trend(medicine_power, self._normalize_ratio(context.effectiveness), aggressiveness_factor)

        midpoint = max(2.0, stage_75_time * 0.55)
        steepness = 0.22 + 0.10 * medicine_power + 0.06 * trend
        raw_curve = self._sigmoid((month - midpoint) * (2.4 * steepness))

        ceiling = self._clamp(
            0.18 + 0.62 * (score / 100.0) + 0.10 * trend + 0.06 * medicine_power - 0.05 * (aggressiveness_factor - 1.0),
            0.08,
            0.95,
        )
        tumor_fraction = self._clamp(1.0 - ceiling * raw_curve + 0.03 * (cancer_factor - 1.0) + 0.02 * (size_factor - 1.0), 0.05, 1.4)

        response_probability = self._recovery_probability(score)
        response_fraction = self._clamp((1.0 - tumor_fraction) + 0.08 * trend, 0.0, 0.99)
        return {
            "month": round(month, 2),
            "response_fraction": round(response_fraction, 6),
            "tumor_fraction": round(tumor_fraction, 6),
            "recovery_probability": round(response_probability * (0.42 + 0.58 * raw_curve), 6),
            "reduction_pct": round(response_fraction * 100.0, 4),
        }

    def _status_from_score(self, score: float, recovery_probability: float) -> str:
        for threshold, label in self._STATUS_LABELS:
            if score >= threshold:
                if label == "Stable Disease" and recovery_probability < 0.38:
                    return "Resistant Tumor"
                return label
        return "Progressive Disease"

    @staticmethod
    def _risk_level(score: float, aggressiveness_factor: float, cancer_factor: float, stage_75_probability: float) -> str:
        composite = score * 0.75 + (100.0 * stage_75_probability) * 0.25
        if composite >= 78:
            return "low"
        if composite >= 58:
            return "moderate"
        if composite >= 38:
            return "high"
        return "critical"

    @staticmethod
    def _confidence_interval(months: Optional[float], volatility: float) -> Optional[Dict[str, float]]:
        if months is None:
            return None
        spread = max(0.6, months * volatility)
        return {"lower": round(max(0.0, months - spread), 2), "upper": round(months + spread, 2)}

    def predict_recovery_timeline(
        self,
        tumor_size: float,
        aggressiveness: str,
        medicine: str,
        effectiveness: float,
        cancer_type: str,
        response_trend: float = 0.0,
        dosage: float = 50.0,
        treatment_score: float | None = None,
        horizon_months: float = 36.0,
        step_months: float = 0.5,
    ) -> Dict[str, object]:
        """Predict recovery milestones, score, and nonlinear timeline curves."""
        context = RecoveryContext(
            tumor_size=float(tumor_size),
            aggressiveness=aggressiveness,
            medicine=medicine,
            effectiveness=float(effectiveness),
            cancer_type=cancer_type,
            response_trend=float(response_trend),
            dosage=float(dosage),
            treatment_score=treatment_score,
        )
        components = self._recovery_score_components(context)
        score = float(components["recovery_score"])
        response_trend_score = self._clamp(0.5 * components["response_trend"] + 0.5 * self._normalize_ratio(float(response_trend)), 0.0, 1.0)
        recovery_probability = self._recovery_probability(score)
        recovery_probability_label = self._recovery_stage_label(recovery_probability)

        stage_probabilities = {
            "25": self._stage_probability(score, 25),
            "50": self._stage_probability(score, 50),
            "75": self._stage_probability(score, 75),
        }

        if context.treatment_score is not None:
            compatibility_score = self._compatibility_score(context.medicine, context.cancer_type)
            recovery_months = self._recommended_stage_months(
                score=score,
                effectiveness=self._normalize_ratio(context.effectiveness),
                aggressiveness_factor=components["aggressiveness_factor"],
                size_factor=components["size_factor"],
                medicine_power=components["medicine_power"],
                compatibility_score=compatibility_score,
            )
            recovery_25 = recovery_months["recovery_25"]
            recovery_50 = recovery_months["recovery_50"]
            recovery_75 = recovery_months["recovery_75"]
            stabilization_time = recovery_months["stabilization_time"]
        else:
            recovery_25 = self._stage_months(score, context, 0)
            recovery_50 = max(recovery_25 + 0.75, self._stage_months(score, context, 1))
            recovery_75 = max(recovery_50 + 1.25, self._stage_months(score, context, 2)) if score >= 62.0 else None
            stabilization_time = round(max(recovery_50 + 0.8, recovery_75 * (0.94 + 0.16 * (1.0 - recovery_probability))) if recovery_75 is not None else recovery_50 + 5.0, 2)

        stability_bias = 0.42 + 0.28 * components["tumor_stability"] + 0.18 * response_trend_score + 0.12 * stage_probabilities["50"]
        stabilization_probability = self._sigmoid((score - 55.0) / 7.5) * stability_bias

        months: List[float] = []
        current = 0.0
        while current <= horizon_months + 1e-9:
            months.append(round(current, 2))
            current += step_months

        timeline_curve = [self._timeline_curve_point(month, context, score, float(recovery_75 or 12.0)) for month in months]

        recovery_status = self._status_from_score(score, recovery_probability)
        risk_level = self._risk_level(score, components["aggressiveness_factor"], components["cancer_factor"], stage_probabilities["75"])

        resistance_estimation = self._clamp(1.0 - components["tumor_stability"] + 0.35 * (1.0 - components["response_trend"]), 0.0, 1.0)
        relapse_probability = self._clamp(0.22 + 0.30 * resistance_estimation + 0.18 * (components["aggressiveness_factor"] - 0.86) + 0.12 * (1.0 - stage_probabilities["75"]), 0.02, 0.8)

        volatility = self._clamp(0.10 + 0.18 * (1.0 - components["response_trend"]) + 0.10 * (1.0 - stage_probabilities["50"]), 0.08, 0.42)

        # Stage likelihood is the key replacement for the old binary "Not achieved" behaviour.
        stage_labels = {
            "25": self._recovery_stage_label(stage_probabilities["25"]),
            "50": self._recovery_stage_label(stage_probabilities["50"]),
            "75": self._recovery_stage_label(stage_probabilities["75"]),
        }

        recovery_confidence = self._recovery_confidence(score, recovery_probability, stage_probabilities, response_trend_score)

        confidence_interval = {
            "recovery_25": self._confidence_interval(recovery_25, volatility) if recovery_25 is not None else None,
            "recovery_50": self._confidence_interval(recovery_50, volatility * 1.05) if recovery_50 is not None else None,
            "recovery_75": self._confidence_interval(recovery_75, volatility * 1.12) if recovery_75 is not None else None,
            "stabilization_time": self._confidence_interval(stabilization_time, volatility * 0.9) if stabilization_time is not None else None,
        }

        if score >= 85.0 and recovery_probability >= 0.76:
            response_band = "excellent"
        elif score >= 70.0 and recovery_probability >= 0.60:
            response_band = "strong"
        elif score >= 55.0 and recovery_probability >= 0.42:
            response_band = "moderate"
        elif score >= 40.0:
            response_band = "weak"
        else:
            response_band = "minimal"

        recovery_curve_parameters = {
            "score_ratio": round(self._clamp(score / 100.0, 0.0, 1.0), 4),
            "effectiveness_ratio": round(self._normalize_ratio(context.effectiveness), 4),
            "aggressiveness_factor": round(components["aggressiveness_factor"], 4),
            "size_factor": round(components["size_factor"], 4),
            "medicine_power": round(components["medicine_power"], 4),
            "compatibility_score": round(self._compatibility_score(context.medicine, context.cancer_type), 2),
            "response_trend": round(response_trend_score, 4),
            "tumor_stability": round(components["tumor_stability"], 4),
        }

        return {
            "recovery_score": round(score, 2),
            "recovery_probability": round(recovery_probability, 4),
            "recovery_probability_label": recovery_probability_label,
            "recovery_confidence": recovery_confidence,
            "recovery_25": recovery_25,
            "recovery_50": recovery_50,
            "recovery_75": recovery_75,
            "stabilization_time": stabilization_time,
            "status": recovery_status,
            "treatment_status": recovery_status,
            "risk_level": risk_level,
            "timeline_curve": timeline_curve,
            "response_curve": timeline_curve,
            "stage_probabilities": {key: round(value, 4) for key, value in stage_probabilities.items()},
            "stage_likelihoods": stage_labels,
            "confidence_interval": confidence_interval,
            "relapse_probability": round(relapse_probability, 4),
            "resistance_estimation": round(resistance_estimation, 4),
            "max_reduction": round(self._clamp(score / 100.0 + 0.12 * components["response_trend"], 0.0, 0.98), 4),
            "final_reduction": round(self._clamp(0.55 * recovery_probability + 0.35 * components["response_trend"], 0.0, 0.98), 4),
            "final_tumor_fraction": round(timeline_curve[-1]["tumor_fraction"], 4),
            "status_summary": {
                "excellent": response_band == "excellent",
                "responding": response_band in {"excellent", "strong"},
                "partial": response_band == "moderate",
                "stable": recovery_status == "Stable Disease",
                "poor": response_band in {"weak", "minimal"},
            },
            "curve_parameters": {
                **recovery_curve_parameters,
            },
            "months_to_stability": stabilization_time,
            "response_band": response_band,
            "dosage": float(dosage),
            "cancer_type": self._normalize_cancer_key(cancer_type),
            "medicine": (medicine or "unknown").strip().lower(),
            "effectiveness": round(float(effectiveness), 4),
            "response_trend": round(response_trend_score, 4),
            "treatment_score": round(float(score), 2),
            "recovery_probability_label": recovery_probability_label,
            "recovery_confidence": recovery_confidence,
        }


recovery_timeline_engine = RecoveryTimelineEngine()