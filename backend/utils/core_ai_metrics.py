"""Unified CoreAI Metrics System for TumorVerse.

This is the SINGLE SOURCE OF TRUTH for all AI metrics.

All systems MUST derive from:
- treatment_score (0-100)
- effectiveness (0-1)
- aggressiveness (0-1 or "low"/"moderate"/"high")
- recovery_timeline (days)
- medicine_compatibility (0-1)
- risk_analysis (comprehensive risk profile)

NO disconnected logic allowed.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
import math

from config.medicine_database import get_medicine_profile, is_medicine_recommended
from utils.treatment_intelligence_engine import treatment_intelligence_engine, TreatmentScoreInput
from utils.recovery_timeline_engine import recovery_timeline_engine, RecoveryContext
from utils.advanced_risk_analysis import advanced_risk_analysis, RiskAnalysisInput
from utils.explainable_ai_engine import explainable_ai_engine, ExplanationInput


@dataclass(frozen=True)
class CoreAIMetrics:
    """Unified synchronized AI metrics - SINGLE SOURCE OF TRUTH."""
    
    # Core metrics
    treatment_score: float  # 0-100
    effectiveness: float  # 0-1
    aggressiveness: float  # 0-1
    aggressiveness_label: str  # "low", "moderate", "high"
    
    # Treatment & Recovery
    medicine_compatibility: float  # 0-1
    recovery_timeline_days: int  # days to recovery
    recovery_status: str  # clinical status
    recovery_speed: str  # "very_fast", "fast", "moderate", "slow", "very_slow"
    
    # Risk Profile
    recurrence_risk: float  # 0-1
    progression_risk: float  # 0-1
    treatment_resistance_probability: float  # 0-1
    stabilization_confidence: float  # 0-1
    overall_risk_level: str  # "low", "intermediate", "high"
    risk_score: float  # 0-100
    
    # AI Explanations
    medicine_explanation: str
    recovery_explanation: str
    aggressiveness_explanation: str
    tumor_evolution_explanation: str
    risk_summary: str
    
    # Visualization hints
    visualization_intensity: float  # 0-1 (for shader/color intensity)
    visualization_aggressiveness_color: str  # HEX color
    
    # Timeline data
    timeline_keypoints: List[Dict[str, float]]  # [{"day": 0, "size": 100, "agg": 1.0}, ...]
    
    # Clinical summary
    clinical_summary: str


class CoreAIMetricsEngine:
    """Unified CoreAI metrics computation - SINGLE SOURCE OF TRUTH."""
    
    @staticmethod
    def _normalize_aggressiveness(value: str | float) -> Tuple[float, str]:
        """Normalize aggressiveness to (0-1, label)."""
        if isinstance(value, str):
            mapping = {
                "low": (0.3, "low"),
                "moderate": (0.6, "moderate"),
                "high": (0.9, "high"),
            }
            return mapping.get(value.strip().lower(), (0.6, "moderate"))
        
        numeric = max(0.0, min(1.0, float(value)))
        if numeric < 0.4:
            return (numeric, "low")
        elif numeric < 0.7:
            return (numeric, "moderate")
        else:
            return (numeric, "high")
    
    @staticmethod
    def _aggressiveness_to_color(aggressiveness: float) -> str:
        """Map aggressiveness (0-1) to visualization color."""
        # Map from green (0.0) -> yellow (0.5) -> red (1.0)
        if aggressiveness < 0.33:
            # Green to yellow
            t = aggressiveness / 0.33
            r = int(128 + t * 127)
            g = 255
            b = 0
        elif aggressiveness < 0.67:
            # Yellow to orange
            t = (aggressiveness - 0.33) / 0.34
            r = 255
            g = int(255 - t * 100)
            b = 0
        else:
            # Orange to red
            t = (aggressiveness - 0.67) / 0.33
            r = 255
            g = int(155 - t * 155)
            b = int(t * 50)
        
        return f"#{r:02x}{g:02x}{b:02x}"
    
    @staticmethod
    def _compute_timeline_keypoints(
        treatment_score: float,
        effectiveness: float,
        aggressiveness: float,
        recovery_timeline_days: int,
        tumor_size: float = 100.0,
    ) -> List[Dict[str, float]]:
        """Generate timeline keypoints for Day 0, 30, 60, 90, 180, 365."""
        keypoints = []
        
        # Day 0: Baseline
        keypoints.append({
            "day": 0,
            "tumor_size": tumor_size,
            "aggressiveness": aggressiveness * 100,
            "treatment_effect": 0.0,
        })
        
        # Response curve parameters
        response_rate = effectiveness * treatment_score / 100.0
        max_shrinkage = 0.7 + (effectiveness * 0.25)  # Up to 95%
        
        # Days 30, 60, 90, 180, 365
        for day in [30, 60, 90, 180, 365]:
            # Exponential response curve
            response_fraction = 1.0 - math.exp(-response_rate * day / 100.0)
            shrinkage = min(max_shrinkage, response_fraction)
            
            new_size = tumor_size * (1.0 - shrinkage)
            new_agg = aggressiveness * (1.0 - shrinkage * 0.8)  # Aggressiveness decreases faster
            
            keypoints.append({
                "day": day,
                "tumor_size": round(new_size, 2),
                "aggressiveness": round(new_agg * 100, 2),
                "treatment_effect": round(response_fraction * 100, 2),
            })
        
        return keypoints
    
    @classmethod
    def compute_core_metrics(
        cls,
        medicine: str,
        cancer_type: str,
        tumor_size: float,
        aggressiveness: str | float,
        treatment_score: float | None = None,
        recommendation_confidence: float = 75.0,
        segmentation_confidence: float = 75.0,
        response_trend: float = 50.0,
        previous_treatment_response: float = 50.0,
        medicine_category: str | None = None,
    ) -> CoreAIMetrics:
        """
        Compute UNIFIED CoreAI metrics from core inputs.
        
        This is the SINGLE SOURCE OF TRUTH for all AI metrics.
        All visualization, timeline, recovery, and risk analysis
        MUST derive from these core metrics.
        """
        
        # Normalize aggressiveness
        agg_normalized, agg_label = cls._normalize_aggressiveness(aggressiveness)
        
        # 1. Calculate Treatment Score (if not provided)
        if treatment_score is None:
            score_input = TreatmentScoreInput(
                medicine=medicine,
                cancer_type=cancer_type,
                tumor_size=tumor_size,
                aggressiveness=agg_label,
                recommendation_confidence=recommendation_confidence,
                segmentation_confidence=segmentation_confidence,
                response_trend=response_trend,
                previous_treatment_response=previous_treatment_response,
                medicine_category=medicine_category,
            )
            score_details = treatment_intelligence_engine._base_score(score_input)
            treatment_score = float(score_details["treatment_score"])
        
        # 2. Calculate Effectiveness (0-1)
        medicine_profile = get_medicine_profile(medicine)
        effectiveness = float(medicine_profile.get("effectiveness", 0.5))
        effectiveness = max(0.0, min(1.0, effectiveness))
        
        # 3. Calculate Medicine Compatibility (0-1)
        is_recommended = is_medicine_recommended(medicine, cancer_type)
        base_compat = effectiveness
        if is_recommended:
            medicine_compatibility = min(1.0, base_compat * 1.15)  # 15% bonus for recommended
        else:
            medicine_compatibility = max(0.0, base_compat * 0.7)  # 30% penalty for not recommended
        
        # 4. Calculate Recovery Timeline
        recovery_context = RecoveryContext(
            tumor_size=tumor_size,
            aggressiveness=agg_label,
            medicine=medicine,
            effectiveness=effectiveness,
            cancer_type=cancer_type,
            response_trend=response_trend,
            dosage=50.0,
            treatment_score=treatment_score,
        )
        recovery_details = recovery_timeline_engine.predict_recovery_timeline(
            tumor_size=tumor_size,
            aggressiveness=agg_label,
            medicine=medicine,
            effectiveness=effectiveness,
            cancer_type=cancer_type,
            response_trend=response_trend,
            dosage=50.0,
            treatment_score=treatment_score,
        )
        raw_stabilization = recovery_details.get("stabilization_time")
        # Convert stabilization months to days (e.g. months * 30), or fallback to default 180 days
        recovery_timeline_days = int(raw_stabilization * 30) if raw_stabilization is not None else 180
        
        # Match keys from recovery_details return dictionary
        recovery_status = recovery_details.get("status", "Stable Disease")
        
        # Map response_band to recovery_speed labels
        response_band = recovery_details.get("response_band", "moderate")
        speed_mapping = {
            "excellent": "very_fast",
            "strong": "fast",
            "moderate": "moderate",
            "weak": "slow",
            "minimal": "very_slow",
        }
        recovery_speed = speed_mapping.get(response_band, "moderate")

        
        # 5. Calculate Risk Profile
        risk_input = RiskAnalysisInput(
            cancer_type=cancer_type,
            tumor_size=tumor_size,
            aggressiveness=agg_label,
            treatment_score=treatment_score,
            effectiveness=effectiveness,
            response_trend=response_trend,
            segmentation_confidence=segmentation_confidence,
            recovery_status=recovery_status,
            medicine=medicine,
            medicine_effectiveness=effectiveness,
        )
        risk_profile_obj = advanced_risk_analysis.analyze_risk(risk_input)
        risk_profile = {
            "recurrence_risk": risk_profile_obj.recurrence_risk,
            "progression_risk": risk_profile_obj.progression_risk,
            "treatment_resistance_probability": risk_profile_obj.treatment_resistance_probability,
            "stabilization_confidence": risk_profile_obj.stabilization_confidence,
            "overall_risk_level": risk_profile_obj.overall_risk_level,
            "risk_score": risk_profile_obj.risk_score,
        }
        
        # 6. Generate AI Explanations
        explanation_input = ExplanationInput(
            medicine=medicine,
            cancer_type=cancer_type,
            tumor_size=tumor_size,
            aggressiveness=agg_label,
            aggressiveness_value=agg_normalized * 100,
            treatment_score=treatment_score,
            effectiveness=effectiveness,
            recovery_status=recovery_status,
            segmentation_confidence=segmentation_confidence,
            response_trend=response_trend,
            previous_aggressiveness=None,
            medicine_category=medicine_category,
        )
        explanations_obj = explainable_ai_engine.generate_full_explanation(explanation_input)
        explanations = {
            "medicine_recommendation": explanations_obj.medicine_recommendation,
            "recovery_prediction": explanations_obj.recovery_prediction,
            "aggressiveness_analysis": explanations_obj.aggressiveness_analysis,
            "tumor_evolution_analysis": explanations_obj.tumor_evolution_analysis,
            "risk_assessment": explanations_obj.risk_assessment,
        }
        
        # 7. Compute Timeline Keypoints
        timeline_keypoints = cls._compute_timeline_keypoints(
            treatment_score=treatment_score,
            effectiveness=effectiveness,
            aggressiveness=agg_normalized,
            recovery_timeline_days=recovery_timeline_days,
            tumor_size=tumor_size,
        )
        
        # 8. Visualization hints
        visualization_intensity = min(1.0, (treatment_score / 100.0) * 1.2)
        visualization_color = cls._aggressiveness_to_color(agg_normalized)
        
        # 9. Clinical Summary
        clinical_summary = (
            f"AI analysis indicates {medicine} is "
            f"{'highly recommended' if is_recommended else 'not typically recommended'} "
            f"for {cancer_type}. Expected effectiveness: {effectiveness*100:.1f}%. "
            f"Predicted recovery: {recovery_status.lower()} with {recovery_speed} response. "
            f"Overall risk level: {risk_profile.get('overall_risk_level', 'intermediate')}."
        )
        
        return CoreAIMetrics(
            treatment_score=round(treatment_score, 2),
            effectiveness=round(effectiveness, 4),
            aggressiveness=round(agg_normalized, 4),
            aggressiveness_label=agg_label,
            medicine_compatibility=round(medicine_compatibility, 4),
            recovery_timeline_days=recovery_timeline_days,
            recovery_status=recovery_status,
            recovery_speed=recovery_speed,
            recurrence_risk=round(risk_profile.get("recurrence_risk", 0.5), 4),
            progression_risk=round(risk_profile.get("progression_risk", 0.5), 4),
            treatment_resistance_probability=round(risk_profile.get("treatment_resistance_probability", 0.3), 4),
            stabilization_confidence=round(risk_profile.get("stabilization_confidence", 0.5), 4),
            overall_risk_level=risk_profile.get("overall_risk_level", "intermediate"),
            risk_score=round(risk_profile.get("risk_score", 50), 2),
            medicine_explanation=explanations.get("medicine_recommendation", ""),
            recovery_explanation=explanations.get("recovery_prediction", ""),
            aggressiveness_explanation=explanations.get("aggressiveness_analysis", ""),
            tumor_evolution_explanation=explanations.get("tumor_evolution_analysis", ""),
            risk_summary=explanations.get("risk_assessment", ""),
            visualization_intensity=round(visualization_intensity, 4),
            visualization_aggressiveness_color=visualization_color,
            timeline_keypoints=timeline_keypoints,
            clinical_summary=clinical_summary,
        )


# Singleton instance
core_ai_metrics_engine = CoreAIMetricsEngine()
