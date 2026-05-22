"""Unified medical data flow integration for TumorVerse.

This is the main orchestration endpoint that synchronizes all AI modules:
- Treatment Intelligence Engine
- Recovery Timeline Engine
- Patient-Specific Tumor Behavior Engine
- Tumor State System
- Advanced Risk Analysis Engine
- Explainable AI Engine
- AI Report Generator

All systems derive from core treatment_score and medical state.
Every module remains synchronized.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Optional

from utils.treatment_intelligence_engine import (
    treatment_intelligence_engine,
    TreatmentScoreInput,
)
from utils.recovery_timeline_engine import (
    recovery_timeline_engine,
    RecoveryContext,
)
from utils.patient_specific_tumor_engine import (
    patient_specific_tumor_engine,
    TumorBehaviorInput,
)
from utils.tumor_state_system import (
    tumor_state_system,
    TumorMedicalState,
)
from utils.advanced_risk_analysis import (
    advanced_risk_analysis,
    RiskAnalysisInput,
)
from utils.explainable_ai_engine import (
    explainable_ai_engine,
    ExplanationInput,
)
from utils.ai_report_generator import (
    ai_report_generator,
    ReportInput,
)
from config.medicine_database import is_medicine_recommended


@dataclass(frozen=True)
class UnifiedMedicalInput:
    """Input for unified medical pipeline."""
    # Patient/Tumor ID
    patient_id: str
    
    # Tumor characteristics
    cancer_type: str
    tumor_size: float  # mm
    aggressiveness: str  # "low", "moderate", "high"
    
    # Segmentation data
    segmentation_confidence: float  # 0-100
    tumor_geometry_hash: str  # Hash of segmentation for determinism
    
    # Treatment
    medicine: str
    medicine_effectiveness: float  # 0-1
    
    # Clinical context
    response_trend: float  # 0-100
    previous_tumor_size: Optional[float] = None
    previous_aggressiveness: Optional[float] = None


@dataclass(frozen=True)
class UnifiedMedicalOutput:
    """Complete unified medical analysis output."""
    # Core metrics
    patient_id: str
    treatment_score: float
    medical_state: TumorMedicalState
    recovery_status: str
    recovery_speed: str
    effectiveness: float
    
    # Behavioral profile
    tumor_behavior: Dict[str, Any]
    
    # Risk profile
    risk_profile: Dict[str, Any]
    
    # Explanations
    explanations: Dict[str, str]
    
    # Visual guidance
    visual_guidance: Dict[str, Any]
    
    # Report
    report: Dict[str, Any]
    
    # Serializable output
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON response."""
        return {
            "patient_id": self.patient_id,
            "core_metrics": {
                "treatment_score": self.treatment_score,
                "medical_state": self.medical_state.value,
                "recovery_status": self.recovery_status,
                "recovery_speed": self.recovery_speed,
                "effectiveness": self.effectiveness,
            },
            "tumor_behavior": self.tumor_behavior,
            "risk_profile": self.risk_profile,
            "explanations": self.explanations,
            "visual_guidance": self.visual_guidance,
            "report": self.report,
        }


class UnifiedMedicalPipeline:
    """Orchestrates all medical AI modules in synchronized pipeline."""

    @staticmethod
    def analyze(input_data: UnifiedMedicalInput) -> UnifiedMedicalOutput:
        """Execute complete unified medical analysis pipeline."""
        
        # STEP 1: Calculate treatment score (foundation for all other systems)
        treatment_score_input = TreatmentScoreInput(
            medicine=input_data.medicine,
            cancer_type=input_data.cancer_type,
            tumor_size=input_data.tumor_size,
            aggressiveness=input_data.aggressiveness,
            recommendation_confidence=input_data.medicine_effectiveness,
            segmentation_confidence=input_data.segmentation_confidence,
            response_trend=input_data.response_trend,
        )
        
        treatment_result = treatment_intelligence_engine.compute_treatment_score(treatment_score_input)
        treatment_score = treatment_result["treatment_score"]
        effectiveness = treatment_result["effectiveness"]
        recovery_status = treatment_result["recovery_status"]
        
        # STEP 2: Generate recovery timeline (driven by treatment_score)
        recovery_context = RecoveryContext(
            tumor_size=input_data.tumor_size,
            aggressiveness=input_data.aggressiveness,
            medicine=input_data.medicine,
            effectiveness=effectiveness,
            cancer_type=input_data.cancer_type,
            response_trend=input_data.response_trend,
            treatment_score=treatment_score,
        )
        
        recovery_timeline = recovery_timeline_engine.predict_recovery(recovery_context)
        recovery_speed = recovery_timeline.get("speed_label", "moderate")
        
        # STEP 3: Determine medical state (driven by treatment_score)
        medical_state = tumor_state_system.determine_state(
            treatment_score=treatment_score,
            effectiveness=effectiveness,
            aggressiveness=input_data.aggressiveness,
            response_trend=input_data.response_trend,
            tumor_size=input_data.tumor_size,
            previous_size=input_data.previous_tumor_size,
        )
        
        # STEP 4: Generate patient-specific tumor behavior
        tumor_behavior_input = TumorBehaviorInput(
            cancer_type=input_data.cancer_type,
            aggressiveness=input_data.aggressiveness,
            tumor_size=input_data.tumor_size,
            medicine=input_data.medicine,
            medicine_effectiveness=effectiveness,
            tumor_geometry_hash=input_data.tumor_geometry_hash,
            segmentation_confidence=input_data.segmentation_confidence,
            response_trend=input_data.response_trend,
            previous_growth_rate=None,
        )
        
        tumor_behavior_profile = patient_specific_tumor_engine.generate_tumor_behavior(tumor_behavior_input)
        
        # STEP 5: Risk analysis (informed by all above factors)
        risk_input = RiskAnalysisInput(
            cancer_type=input_data.cancer_type,
            tumor_size=input_data.tumor_size,
            aggressiveness=input_data.aggressiveness,
            treatment_score=treatment_score,
            effectiveness=effectiveness,
            response_trend=input_data.response_trend,
            segmentation_confidence=input_data.segmentation_confidence,
            recovery_status=recovery_status,
            medicine=input_data.medicine,
            medicine_effectiveness=input_data.medicine_effectiveness,
            previous_size=input_data.previous_tumor_size,
        )
        
        risk_profile = advanced_risk_analysis.analyze_risk(risk_input)
        
        # STEP 6: Generate explainable AI explanations
        # Convert aggressiveness string to numeric value for explanations
        agg_value_map = {"low": 20.0, "moderate": 50.0, "high": 80.0}
        agg_value = agg_value_map.get(input_data.aggressiveness, 50.0)
        
        explanation_input = ExplanationInput(
            medicine=input_data.medicine,
            cancer_type=input_data.cancer_type,
            tumor_size=input_data.tumor_size,
            aggressiveness=input_data.aggressiveness,
            aggressiveness_value=agg_value,
            treatment_score=treatment_score,
            effectiveness=effectiveness,
            recovery_status=recovery_status,
            segmentation_confidence=input_data.segmentation_confidence,
            response_trend=input_data.response_trend,
            previous_aggressiveness=input_data.previous_aggressiveness,
        )
        
        ai_explanation = explainable_ai_engine.generate_full_explanation(explanation_input)
        
        # STEP 7: Get visual properties from medical state
        visual_props = tumor_state_system.get_visual_properties(medical_state)
        behavior_props = tumor_state_system.get_behavior_properties(medical_state)
        
        # STEP 8: Generate medical report
        report_input = ReportInput(
            cancer_type=input_data.cancer_type,
            tumor_size=input_data.tumor_size,
            aggressiveness=input_data.aggressiveness,
            segmentation_confidence=input_data.segmentation_confidence,
            treatment_score=treatment_score,
            effectiveness=effectiveness,
            recovery_status=recovery_status,
            recovery_speed=recovery_speed,
            medicine=input_data.medicine,
            medicine_effectiveness=input_data.medicine_effectiveness,
            medical_state=medical_state.value,
            risk_level=risk_profile.overall_risk_level,
            risk_score=risk_profile.risk_score,
            medicine_explanation=ai_explanation.medicine_recommendation,
            recovery_explanation=ai_explanation.recovery_prediction,
            aggressiveness_explanation=ai_explanation.aggressiveness_analysis,
            evolution_explanation=ai_explanation.tumor_evolution_analysis,
            recurrence_risk=risk_profile.recurrence_risk,
            progression_risk=risk_profile.progression_risk,
            treatment_resistance_prob=risk_profile.treatment_resistance_probability,
        )
        
        medical_report = ai_report_generator.generate_report(report_input)
        
        # STEP 9: Construct unified output
        return UnifiedMedicalOutput(
            patient_id=input_data.patient_id,
            treatment_score=treatment_score,
            medical_state=medical_state,
            recovery_status=recovery_status,
            recovery_speed=recovery_speed,
            effectiveness=effectiveness,
            tumor_behavior={
                "base_growth_rate": tumor_behavior_profile.base_growth_rate,
                "morphology_complexity": tumor_behavior_profile.morphology_complexity,
                "deformation_tendency": tumor_behavior_profile.deformation_tendency,
                "invasion_style": tumor_behavior_profile.invasion_style,
                "hypoxia_pattern": tumor_behavior_profile.hypoxia_pattern,
                "necrosis_propensity": tumor_behavior_profile.necrosis_propensity,
                "response_sensitivity": tumor_behavior_profile.response_sensitivity,
                "shape_evolution_factor": tumor_behavior_profile.shape_evolution_factor,
                "size_evolution_factor": tumor_behavior_profile.size_evolution_factor,
                "pulsation_frequency": tumor_behavior_profile.pulsation_frequency,
                "pulsation_amplitude": tumor_behavior_profile.pulsation_amplitude,
                "fragmentation_tendency": tumor_behavior_profile.fragmentation_tendency,
                "calcification_propensity": tumor_behavior_profile.calcification_propensity,
                "treatment_resistance_phenotype": tumor_behavior_profile.treatment_resistance_phenotype,
                "description": patient_specific_tumor_engine.get_behavior_description(tumor_behavior_profile),
            },
            risk_profile={
                "recurrence_risk": risk_profile.recurrence_risk,
                "progression_risk": risk_profile.progression_risk,
                "stabilization_confidence": risk_profile.stabilization_confidence,
                "treatment_resistance_probability": risk_profile.treatment_resistance_probability,
                "overall_risk_level": risk_profile.overall_risk_level,
                "risk_score": risk_profile.risk_score,
                "primary_risk_factors": risk_profile.primary_risk_factors,
                "protective_factors": risk_profile.protective_factors,
                "progression_likelihood_6month": risk_profile.progression_likelihood_6month,
                "disease_free_survival_probability": risk_profile.disease_free_survival_probability,
                "risk_summary": risk_profile.risk_summary,
            },
            explanations={
                "medicine_recommendation": ai_explanation.medicine_recommendation,
                "recovery_prediction": ai_explanation.recovery_prediction,
                "aggressiveness_analysis": ai_explanation.aggressiveness_analysis,
                "tumor_evolution_analysis": ai_explanation.tumor_evolution_analysis,
                "risk_assessment": ai_explanation.risk_assessment,
                "clinical_summary": ai_explanation.clinical_summary,
                "confidence_level": ai_explanation.confidence_level,
            },
            visual_guidance={
                "medical_state": medical_state.value,
                "state_description": tumor_state_system.get_state_description(medical_state),
                "state_recommendation": tumor_state_system.get_clinical_recommendation(medical_state),
                "visual_properties": {
                    "glow_intensity": visual_props.glow_intensity,
                    "glow_color_rgb": visual_props.glow_color,
                    "base_color_rgb": visual_props.base_color,
                    "roughness": visual_props.roughness,
                    "metallic": visual_props.metallic,
                    "emission_intensity": visual_props.emission_intensity,
                    "deformation_intensity": visual_props.deformation_intensity,
                    "deformation_frequency": visual_props.deformation_frequency,
                    "pulsation_speed": visual_props.pulsation_speed,
                    "pulsation_amplitude": visual_props.pulsation_amplitude,
                    "tissue_density": visual_props.tissue_density,
                    "hypoxia_visibility": visual_props.hypoxia_visibility,
                    "necrosis_visibility": visual_props.necrosis_visibility,
                    "mesh_opacity": visual_props.mesh_opacity,
                    "shader_noise_level": visual_props.shader_noise_level,
                    "animation_intensity": visual_props.animation_intensity,
                },
                "behavior_properties": {
                    "growth_rate_multiplier": behavior_props.growth_rate_multiplier,
                    "treatment_response_factor": behavior_props.treatment_response_factor,
                    "stability_factor": behavior_props.stability_factor,
                    "aggressiveness_trend": behavior_props.aggressiveness_trend,
                    "morphology_change_speed": behavior_props.morphology_change_speed,
                },
            },
            report=ai_report_generator.report_to_dict(medical_report),
        )


# Singleton instance
unified_medical_pipeline = UnifiedMedicalPipeline()
