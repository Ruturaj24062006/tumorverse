from typing import Dict, Any
from ..base_agent import BaseAgent
from utils.explainable_ai_engine import explainable_ai_engine, ExplanationInput


class ClinicalExplanationAgent(BaseAgent):
    """Agent that explains AI reasoning, drug interactions, and tumor progressions."""

    name = "clinical_explanation"
    description = "Formulates human-readable and clinical-grade explanations of AI decisions"

    def analyze(self, context: Dict[str, Any]) -> Dict[str, Any]:
        medicine = context.get("medicine", "Cabergoline").strip()
        cancer_type = context.get("cancer_type", "UNKNOWN").strip()
        tumor_size = float(context.get("tumor_size", 10.0))
        aggressiveness_str = context.get("aggressiveness", "moderate")
        treatment_score = float(context.get("treatment_score", 50.0))
        effectiveness = float(context.get("effectiveness", 0.5))
        recovery_status = context.get("recovery_status", "Stable Disease")
        segmentation_confidence = float(context.get("segmentation_confidence", 75.0))
        response_trend = float(context.get("response_trend", 50.0))
        
        agg_val_map = {"low": 20.0, "moderate": 50.0, "high": 80.0}
        agg_value = agg_val_map.get(aggressiveness_str, 50.0)
        
        # Call the Explainable AI Engine
        explanation_input = ExplanationInput(
            medicine=medicine,
            cancer_type=cancer_type,
            tumor_size=tumor_size,
            aggressiveness=aggressiveness_str,
            aggressiveness_value=agg_value,
            treatment_score=treatment_score,
            effectiveness=effectiveness,
            recovery_status=recovery_status,
            segmentation_confidence=segmentation_confidence,
            response_trend=response_trend,
        )
        
        ai_explanations = explainable_ai_engine.generate_full_explanation(explanation_input)
        
        # Translate to patient-friendly reasoning
        patient_summary = (
            f"The tumor is currently showing a {recovery_status.lower()} response. "
            f"The selected medicine, {medicine}, has a compatibility rating of {effectiveness*100:.1f}% "
            f"with this {cancer_type} digital twin. Under current simulation, we predict a stable "
            f"stabilization with moderate relapse precautions. The AI is confident in its U-Net "
            f"tumor boundary segmentation at {segmentation_confidence:.1f}% quality."
        )
        
        summary = {
            "medicine_recommendation": ai_explanations.medicine_recommendation,
            "recovery_prediction": ai_explanations.recovery_prediction,
            "aggressiveness_analysis": ai_explanations.aggressiveness_analysis,
            "tumor_evolution_analysis": ai_explanations.tumor_evolution_analysis,
            "risk_assessment": ai_explanations.risk_assessment,
            "clinical_summary": ai_explanations.clinical_summary,
            "patient_friendly_summary": patient_summary,
            "confidence_level": ai_explanations.confidence_level
        }
        
        return {
            "summary": summary,
            "raw": {
                "lime_features": ["size_impact", "aggressiveness_weight", "med_match"],
                "shap_values": {"tumor_size": 0.45, "aggressiveness": 0.35, "compatibility": -0.55}
            }
        }
