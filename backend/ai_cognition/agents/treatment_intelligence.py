from typing import Dict, Any, List
from ..base_agent import BaseAgent
from config.medicine_database import get_medicine_profile, is_medicine_recommended
from utils.treatment_intelligence_engine import treatment_intelligence_engine, TreatmentScoreInput


class TreatmentIntelligenceAgent(BaseAgent):
    """Agent that evaluates medicine compatibility, estimates effectiveness, and compares treatment paths."""

    name = "treatment_intelligence"
    description = "Compares medicines, evaluates compatibility, and estimates pathway effectiveness"

    def analyze(self, context: Dict[str, Any]) -> Dict[str, Any]:
        medicine = context.get("medicine", "Cabergoline").strip()
        cancer_type = context.get("cancer_type", "UNKNOWN").strip()
        tumor_size = float(context.get("tumor_size", 10.0))
        aggressiveness_str = context.get("aggressiveness", "moderate")
        
        # Calculate base treatment score using the engine
        score_input = TreatmentScoreInput(
            medicine=medicine,
            cancer_type=cancer_type,
            tumor_size=tumor_size,
            aggressiveness=aggressiveness_str,
            recommendation_confidence=float(context.get("recommendation_confidence", 75.0)),
            segmentation_confidence=float(context.get("segmentation_confidence", 75.0)),
            response_trend=float(context.get("response_trend", 50.0)),
            previous_treatment_response=float(context.get("previous_treatment_response", 50.0)),
        )
        
        score_details = treatment_intelligence_engine._base_score(score_input)
        treatment_score = float(score_details.get("treatment_score", 50.0))
        
        # Pull profile details
        med_profile = get_medicine_profile(medicine)
        base_effectiveness = float(med_profile.get("effectiveness", 0.5))
        is_rec = is_medicine_recommended(medicine, cancer_type)
        
        # Compatibility index
        compatibility = base_effectiveness
        if is_rec:
            compatibility = min(1.0, compatibility * 1.15)
        else:
            compatibility = max(0.2, compatibility * 0.7)
            
        # Compile alternative therapies to rank
        alternatives = ["Temozolomide", "Gefitinib", "Cabergoline", "Tamoxifen", "Pembrolizumab"]
        alternative_scores = []
        for alt in alternatives:
            if alt.lower() != medicine.lower():
                alt_rec = is_medicine_recommended(alt, cancer_type)
                alt_profile = get_medicine_profile(alt)
                alt_eff = float(alt_profile.get("effectiveness", 0.5))
                alt_compat = alt_eff * 1.15 if alt_rec else alt_eff * 0.7
                alternative_scores.append({
                    "medicine": alt,
                    "compatibility": round(float(np_clip(alt_compat, 0.0, 1.0)), 4),
                    "is_recommended": alt_rec
                })
        
        # Sort alternative list
        alternative_scores.sort(key=lambda x: x["compatibility"], reverse=True)
        
        strategy = "monotherapy"
        if tumor_size > 50.0 or aggressiveness_str == "high":
            strategy = "combination"
        elif not is_rec:
            strategy = "adaptive"
            
        summary = {
            "treatment_score": round(treatment_score, 2),
            "effectiveness_estimate": round(base_effectiveness, 4),
            "compatibility_index": round(compatibility, 4),
            "is_primary_recommended": is_rec,
            "recommended_strategy": strategy,
            "alternative_options": alternative_scores[:3],
            "potency_multiplier": float(med_profile.get("potency", 1.0))
        }
        
        return {
            "summary": summary,
            "raw": {
                "medicine_category": med_profile.get("category", "Targeted"),
                "dosage_guidelines": med_profile.get("dosage_range", "Standard clinical dosing")
            }
        }


def np_clip(val: float, min_val: float, max_val: float) -> float:
    return max(min_val, min(max_val, val))
