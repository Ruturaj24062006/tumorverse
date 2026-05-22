from typing import Dict, Any, List
from ..base_agent import BaseAgent
from utils.recovery_timeline_engine import recovery_timeline_engine, RecoveryContext
from utils.advanced_risk_analysis import advanced_risk_analysis, RiskAnalysisInput


class RecoveryPredictionAgent(BaseAgent):
    """Agent that predicts recovery stages, stabilization windows, relapse risk, and resistance."""

    name = "recovery_prediction"
    description = "Predicts recovery stages, relapse timelines, and disease-free survival likelihoods"

    def analyze(self, context: Dict[str, Any]) -> Dict[str, Any]:
        medicine = context.get("medicine", "Cabergoline").strip()
        cancer_type = context.get("cancer_type", "UNKNOWN").strip()
        tumor_size = float(context.get("tumor_size", 10.0))
        aggressiveness_str = context.get("aggressiveness", "moderate")
        effectiveness = float(context.get("effectiveness", 0.5))
        treatment_score = float(context.get("treatment_score", 50.0))
        response_trend = float(context.get("response_trend", 50.0))
        segmentation_confidence = float(context.get("segmentation_confidence", 75.0))
        
        # 1. Recovery Engine Predictor
        recovery_details = recovery_timeline_engine.predict_recovery_timeline(
            tumor_size=tumor_size,
            aggressiveness=aggressiveness_str,
            medicine=medicine,
            effectiveness=effectiveness,
            cancer_type=cancer_type,
            response_trend=response_trend,
            dosage=50.0,
            treatment_score=treatment_score,
        )
        
        stabilization_months = recovery_details.get("stabilization_time", 6.0)
        if stabilization_months is None:
            stabilization_months = 6.0
            
        recovery_speed = recovery_details.get("recovery_speed_label", "moderate")
        recovery_status = recovery_details.get("recovery_status", "Stable Disease")
        
        # 2. Risk Engine Predictor
        risk_input = RiskAnalysisInput(
            cancer_type=cancer_type,
            tumor_size=tumor_size,
            aggressiveness=aggressiveness_str,
            treatment_score=treatment_score,
            effectiveness=effectiveness,
            response_trend=response_trend,
            segmentation_confidence=segmentation_confidence,
            recovery_status=recovery_status,
            medicine=medicine,
            medicine_effectiveness=effectiveness,
        )
        risk_profile = advanced_risk_analysis.analyze_risk(risk_input)
        
        # Staging predictions for Day 0, 30, 90, 180, 365, Year 2
        day_projections = []
        for day in [0, 30, 90, 180, 365, 730]:
            # Simple biological response solver
            response_rate = effectiveness * treatment_score / 100.0
            max_shrinkage = 0.7 + (effectiveness * 0.25)
            time_fraction = 1.0 - 2.71828 ** (-response_rate * day / 100.0)
            shrinkage = min(max_shrinkage, time_fraction)
            
            projected_size = tumor_size * (1.0 - shrinkage)
            projected_agg = max(0.1, 0.9 * (1.0 - shrinkage * 0.8) if aggressiveness_str == "high" else 0.5 * (1.0 - shrinkage * 0.8))
            
            day_projections.append({
                "day": day,
                "projected_volume_pct": round(float((1.0 - shrinkage) * 100.0), 2),
                "projected_size_mm": round(float(projected_size), 2),
                "projected_aggressiveness": round(float(projected_agg), 4)
            })
            
        summary = {
            "months_to_stabilization": round(float(stabilization_months), 2),
            "recovery_status": recovery_status,
            "recovery_speed": recovery_speed,
            "relapse_probability": round(float(risk_profile.recurrence_risk), 4),
            "resistance_estimation": round(float(risk_profile.treatment_resistance_probability), 4),
            "progression_risk": round(float(risk_profile.progression_risk), 4),
            "stabilization_confidence": round(float(risk_profile.stabilization_confidence), 4),
            "overall_risk_level": risk_profile.overall_risk_level,
            "stage_timeline_projections": day_projections
        }
        
        return {
            "summary": summary,
            "raw": {
                "risk_score": risk_profile.risk_score,
                "disease_free_survival_probability": risk_profile.disease_free_survival_probability
            }
        }
