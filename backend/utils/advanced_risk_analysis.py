"""Advanced risk analysis engine for TumorVerse.

Generates comprehensive risk assessments:
- Recurrence risk (0-1)
- Progression risk (0-1)
- Stabilization confidence (0-1)
- Treatment resistance probability (0-1)
- Risk stratification (low/intermediate/high)

Risk affects:
- Visualization intensity
- Recovery timeline
- Aggressiveness trajectory
- Medical recommendations
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

import math


@dataclass(frozen=True)
class RiskAnalysisInput:
    """Input data for risk analysis."""
    cancer_type: str
    tumor_size: float  # mm
    aggressiveness: str  # "low", "moderate", "high"
    treatment_score: float  # 0-100
    effectiveness: float  # 0-1
    response_trend: float  # 0-100
    segmentation_confidence: float  # 0-100
    recovery_status: str
    medicine: str
    medicine_effectiveness: float  # 0-1
    previous_size: Optional[float] = None
    time_on_treatment: Optional[float] = None  # months


@dataclass(frozen=True)
class RiskProfile:
    """Comprehensive risk assessment."""
    recurrence_risk: float  # 0-1
    progression_risk: float  # 0-1
    stabilization_confidence: float  # 0-1
    treatment_resistance_probability: float  # 0-1
    
    # Risk stratification
    overall_risk_level: str  # "low", "intermediate", "high"
    risk_score: float  # 0-100
    
    # Risk factors
    primary_risk_factors: List[str]
    protective_factors: List[str]
    
    # Predictions
    progression_likelihood_6month: float  # 0-1
    disease_free_survival_probability: float  # 0-1
    
    # Clinical summary
    risk_summary: str


class AdvancedRiskAnalysisEngine:
    """Analyze and predict patient risks comprehensively."""

    # Cancer type baseline risks
    _CANCER_RECURRENCE_BASELINE = {
        "GBM": 0.92,  # Glioblastoma very high recurrence
        "GLIOMA": 0.85,
        "LUAD": 0.65,  # Lung adenocarcinoma moderate
        "LUNG": 0.65,
        "BRCA": 0.55,  # Breast cancer moderate
        "BREAST": 0.55,
        "COREAD": 0.50,  # Colorectal moderate
        "COLORECTAL": 0.50,
        "KIRC": 0.60,  # Renal cell intermediate
        "KIDNEY": 0.60,
        "PITUITARY": 0.35,  # Pituitary low recurrence
        "SKIN": 0.40,
        "MELANOMA": 0.62,  # Melanoma moderate
    }

    # Cancer type progression risk
    _CANCER_PROGRESSION_BASELINE = {
        "GBM": 0.88,
        "GLIOMA": 0.80,
        "LUAD": 0.60,
        "LUNG": 0.60,
        "BRCA": 0.50,
        "BREAST": 0.50,
        "COREAD": 0.45,
        "COLORECTAL": 0.45,
        "KIRC": 0.55,
        "KIDNEY": 0.55,
        "PITUITARY": 0.25,
        "SKIN": 0.30,
        "MELANOMA": 0.58,
    }

    @staticmethod
    def _calculate_recurrence_risk(
        cancer_type: str,
        tumor_size: float,
        treatment_score: float,
        effectiveness: float,
        recovery_status: str,
    ) -> float:
        """Calculate recurrence risk probability."""
        
        # Baseline risk from cancer type
        baseline = AdvancedRiskAnalysisEngine._CANCER_RECURRENCE_BASELINE.get(cancer_type, 0.50)
        
        # Size factor: larger tumors have higher recurrence risk
        if tumor_size < 10:
            size_factor = 0.7
        elif tumor_size < 30:
            size_factor = 1.0
        elif tumor_size < 60:
            size_factor = 1.3
        else:
            size_factor = 1.5
        
        # Treatment response factor
        if treatment_score >= 80:
            treatment_factor = 0.3
        elif treatment_score >= 70:
            treatment_factor = 0.5
        elif treatment_score >= 55:
            treatment_factor = 0.8
        elif treatment_score >= 40:
            treatment_factor = 1.1
        else:
            treatment_factor = 1.4
        
        # Effectiveness factor
        effectiveness_reduction = 1.0 - (effectiveness * 0.6)
        
        # Recovery status factor
        recovery_factor = {
            "Excellent Response": 0.3,
            "Responding to Treatment": 0.5,
            "Partial Regression": 0.7,
            "Stable Disease": 0.9,
            "Progressive Disease": 1.4,
        }.get(recovery_status, 1.0)
        
        # Combine factors
        combined_risk = baseline * size_factor * treatment_factor * effectiveness_reduction * recovery_factor
        
        # Clamp to [0, 1]
        return min(1.0, max(0.0, combined_risk))

    @staticmethod
    def _calculate_progression_risk(
        cancer_type: str,
        aggressiveness: str,
        treatment_score: float,
        response_trend: float,
        medicine_effectiveness: float,
    ) -> float:
        """Calculate progression risk probability."""
        
        # Baseline from cancer type
        baseline = AdvancedRiskAnalysisEngine._CANCER_PROGRESSION_BASELINE.get(cancer_type, 0.50)
        
        # Aggressiveness multiplier
        agg_mult = {
            "low": 0.5,
            "moderate": 1.0,
            "high": 1.8,
        }.get(aggressiveness, 1.0)
        
        # Treatment score inversely affects progression risk
        if treatment_score >= 80:
            treatment_factor = 0.2
        elif treatment_score >= 70:
            treatment_factor = 0.4
        elif treatment_score >= 55:
            treatment_factor = 0.7
        elif treatment_score >= 40:
            treatment_factor = 1.0
        else:
            treatment_factor = 1.3
        
        # Response trend
        if response_trend > 75:
            response_factor = 0.3
        elif response_trend > 50:
            response_factor = 0.7
        elif response_trend > 25:
            response_factor = 1.0
        else:
            response_factor = 1.4
        
        # Medicine effectiveness
        med_factor = 1.0 - (medicine_effectiveness * 0.5)
        
        # Combine
        combined_risk = baseline * agg_mult * treatment_factor * response_factor * med_factor
        
        return min(1.0, max(0.0, combined_risk))

    @staticmethod
    def _calculate_stabilization_confidence(
        treatment_score: float,
        effectiveness: float,
        segmentation_confidence: float,
        response_trend: float,
    ) -> float:
        """Calculate confidence in tumor stabilization."""
        
        # Treatment score is primary factor
        score_confidence = min(1.0, max(0.0, treatment_score / 100.0))
        
        # Effectiveness contributes
        effect_confidence = effectiveness
        
        # Segmentation confidence matters
        seg_confidence = segmentation_confidence / 100.0
        
        # Response trend
        if response_trend > 70:
            response_confidence = 0.95
        elif response_trend > 50:
            response_confidence = 0.80
        elif response_trend > 30:
            response_confidence = 0.60
        else:
            response_confidence = 0.40
        
        # Combine (geometric mean for conservative estimate)
        combined = (
            (score_confidence * effect_confidence * seg_confidence * response_confidence) ** 0.25
        )
        
        return min(1.0, combined)

    @staticmethod
    def _calculate_treatment_resistance_probability(
        effectiveness: float,
        treatment_score: float,
        aggressiveness: str,
        response_trend: float,
    ) -> float:
        """Calculate probability of treatment resistance."""
        
        # Low effectiveness indicates resistance
        resistance_base = 1.0 - effectiveness
        
        # Poor treatment score indicates resistance
        if treatment_score < 40:
            score_mult = 1.3
        elif treatment_score < 55:
            score_mult = 1.1
        elif treatment_score < 70:
            score_mult = 0.9
        else:
            score_mult = 0.5
        
        # High aggressiveness indicates resistance potential
        agg_mult = {
            "low": 0.4,
            "moderate": 1.0,
            "high": 1.6,
        }.get(aggressiveness, 1.0)
        
        # Poor response trend
        if response_trend < 25:
            response_mult = 1.3
        elif response_trend < 50:
            response_mult = 1.1
        else:
            response_mult = 0.7
        
        # Combine
        combined = resistance_base * score_mult * agg_mult * response_mult
        
        return min(1.0, max(0.0, combined))

    @staticmethod
    def _calculate_progression_6month(
        progression_risk: float,
        treatment_score: float,
        response_trend: float,
    ) -> float:
        """Estimate likelihood of progression in 6 months."""
        
        base_prob = progression_risk
        
        # Time factor: with ongoing treatment, risk decreases over time
        if treatment_score >= 80:
            time_reduction = 0.5  # 50% reduction over 6 months
        elif treatment_score >= 70:
            time_reduction = 0.6
        elif treatment_score >= 55:
            time_reduction = 0.75
        else:
            time_reduction = 0.9
        
        adjusted_prob = base_prob * time_reduction
        
        return min(1.0, adjusted_prob)

    @staticmethod
    def _calculate_disease_free_survival(
        recurrence_risk: float,
        progression_risk: float,
        treatment_score: float,
        stabilization_confidence: float,
    ) -> float:
        """Estimate probability of disease-free survival."""
        
        # Disease-free = no recurrence AND no progression
        # Approximate as 1 - (recurrence + progression) / 2
        combined_risk = (recurrence_risk + progression_risk) / 2.0
        
        base_dfs = 1.0 - combined_risk
        
        # Treatment and stabilization improve DFS
        if treatment_score >= 80:
            boost = 0.15
        elif treatment_score >= 70:
            boost = 0.10
        elif treatment_score >= 55:
            boost = 0.05
        else:
            boost = 0.0
        
        stabilization_boost = stabilization_confidence * 0.15
        
        dfs = min(1.0, base_dfs + boost + stabilization_boost)
        
        return max(0.0, dfs)

    @staticmethod
    def _identify_risk_factors(
        cancer_type: str,
        tumor_size: float,
        aggressiveness: str,
        effectiveness: float,
        treatment_score: float,
        response_trend: float,
    ) -> Tuple[List[str], List[str]]:
        """Identify primary risk factors and protective factors."""
        
        risk_factors = []
        protective_factors = []
        
        # Cancer type factors
        high_risk_cancers = ["GBM", "GLIOMA", "MELANOMA"]
        if cancer_type in high_risk_cancers:
            risk_factors.append(f"{cancer_type} is biologically aggressive")
        else:
            protective_factors.append(f"{cancer_type} has moderate-to-favorable prognosis")
        
        # Size factors
        if tumor_size > 50:
            risk_factors.append(f"Large tumor burden ({tumor_size:.0f}mm) reduces treatment penetration")
        elif tumor_size < 10:
            protective_factors.append("Small tumor size (<10mm) favorable for treatment")
        
        # Aggressiveness factors
        if aggressiveness == "high":
            risk_factors.append("High tumor aggressiveness indicates rapid growth")
        elif aggressiveness == "low":
            protective_factors.append("Low tumor aggressiveness predicts slower progression")
        
        # Effectiveness factors
        if effectiveness < 0.40:
            risk_factors.append(f"Low medicine effectiveness ({effectiveness:.1%}) suggests poor response")
        elif effectiveness > 0.75:
            protective_factors.append(f"High medicine effectiveness ({effectiveness:.1%}) indicates good response")
        
        # Treatment score factors
        if treatment_score < 40:
            risk_factors.append("Poor treatment score indicates inadequate disease control")
        elif treatment_score > 80:
            protective_factors.append("Excellent treatment score indicates strong disease control")
        
        # Response trend factors
        if response_trend < 30:
            risk_factors.append("Poor response trend suggests developing resistance")
        elif response_trend > 70:
            protective_factors.append("Strong response trend indicates maintained treatment efficacy")
        
        return risk_factors, protective_factors

    @staticmethod
    def analyze_risk(input_data: RiskAnalysisInput) -> RiskProfile:
        """Generate comprehensive risk analysis."""
        
        # Calculate component risks
        recurrence_risk = AdvancedRiskAnalysisEngine._calculate_recurrence_risk(
            input_data.cancer_type,
            input_data.tumor_size,
            input_data.treatment_score,
            input_data.effectiveness,
            input_data.recovery_status,
        )
        
        progression_risk = AdvancedRiskAnalysisEngine._calculate_progression_risk(
            input_data.cancer_type,
            input_data.aggressiveness,
            input_data.treatment_score,
            input_data.response_trend,
            input_data.medicine_effectiveness,
        )
        
        stabilization_confidence = AdvancedRiskAnalysisEngine._calculate_stabilization_confidence(
            input_data.treatment_score,
            input_data.effectiveness,
            input_data.segmentation_confidence,
            input_data.response_trend,
        )
        
        treatment_resistance_prob = AdvancedRiskAnalysisEngine._calculate_treatment_resistance_probability(
            input_data.effectiveness,
            input_data.treatment_score,
            input_data.aggressiveness,
            input_data.response_trend,
        )
        
        # Overall risk stratification
        avg_risk = (recurrence_risk + progression_risk) / 2.0
        
        if avg_risk < 0.35:
            risk_level = "low"
            risk_score = avg_risk * 35
        elif avg_risk < 0.65:
            risk_level = "intermediate"
            risk_score = 35 + (avg_risk - 0.35) * 30
        else:
            risk_level = "high"
            risk_score = 65 + (avg_risk - 0.65) * 35
        
        # Identify risk factors
        risk_factors, protective_factors = AdvancedRiskAnalysisEngine._identify_risk_factors(
            input_data.cancer_type,
            input_data.tumor_size,
            input_data.aggressiveness,
            input_data.effectiveness,
            input_data.treatment_score,
            input_data.response_trend,
        )
        
        # 6-month progression likelihood
        progression_6mo = AdvancedRiskAnalysisEngine._calculate_progression_6month(
            progression_risk,
            input_data.treatment_score,
            input_data.response_trend,
        )
        
        # Disease-free survival
        dfs_prob = AdvancedRiskAnalysisEngine._calculate_disease_free_survival(
            recurrence_risk,
            progression_risk,
            input_data.treatment_score,
            stabilization_confidence,
        )
        
        # Clinical summary
        if risk_level == "low":
            summary = f"Low-risk disease ({risk_score:.0f}/100). Patient demonstrates excellent treatment response with minimal progression risk."
        elif risk_level == "intermediate":
            summary = f"Intermediate-risk disease ({risk_score:.0f}/100). Ongoing monitoring and treatment adherence critical."
        else:
            summary = f"High-risk disease ({risk_score:.0f}/100). Consider aggressive treatment modifications. Close surveillance required."
        
        return RiskProfile(
            recurrence_risk=recurrence_risk,
            progression_risk=progression_risk,
            stabilization_confidence=stabilization_confidence,
            treatment_resistance_probability=treatment_resistance_prob,
            overall_risk_level=risk_level,
            risk_score=risk_score,
            primary_risk_factors=risk_factors,
            protective_factors=protective_factors,
            progression_likelihood_6month=progression_6mo,
            disease_free_survival_probability=dfs_prob,
            risk_summary=summary,
        )


# Singleton instance
advanced_risk_analysis = AdvancedRiskAnalysisEngine()
