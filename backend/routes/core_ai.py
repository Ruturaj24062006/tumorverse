"""FastAPI route for unified CoreAI metrics and clinical intelligence."""

from __future__ import annotations

from typing import Dict, List, Optional, Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from utils.core_ai_metrics import core_ai_metrics_engine, CoreAIMetrics

router = APIRouter(tags=["core-ai"])


class CoreAIRequest(BaseModel):
    """Request for unified CoreAI metrics computation."""
    medicine: str = Field(..., description="Medicine/drug name")
    cancer_type: str = Field(..., description="Cancer type classification")
    tumor_size: float = Field(..., description="Tumor size in mm")
    aggressiveness: str | float = Field(..., description="Aggressiveness: 'low'/'moderate'/'high' or 0-1")
    treatment_score: Optional[float] = Field(None, description="Pre-computed treatment score (0-100)")
    recommendation_confidence: float = Field(75.0, description="Recommendation confidence (0-100)")
    segmentation_confidence: float = Field(75.0, description="Segmentation confidence (0-100)")
    response_trend: float = Field(50.0, description="Response trend (0-100)")
    previous_treatment_response: float = Field(50.0, description="Previous treatment response (0-100)")
    medicine_category: Optional[str] = Field(None, description="Medicine category")


class TimelineKeypoint(BaseModel):
    """Timeline keypoint data."""
    day: int
    tumor_size: float
    aggressiveness: float
    treatment_effect: float


class CoreAIResponse(BaseModel):
    """Unified CoreAI metrics response."""
    # Core metrics
    treatment_score: float
    effectiveness: float
    aggressiveness: float
    aggressiveness_label: str
    
    # Treatment & Recovery
    medicine_compatibility: float
    recovery_timeline_days: int
    recovery_status: str
    recovery_speed: str
    
    # Risk Profile
    recurrence_risk: float
    progression_risk: float
    treatment_resistance_probability: float
    stabilization_confidence: float
    overall_risk_level: str
    risk_score: float
    
    # AI Explanations
    medicine_explanation: str
    recovery_explanation: str
    aggressiveness_explanation: str
    tumor_evolution_explanation: str
    risk_summary: str
    
    # Visualization
    visualization_intensity: float
    visualization_aggressiveness_color: str
    
    # Timeline
    timeline_keypoints: List[TimelineKeypoint]
    
    # Summary
    clinical_summary: str


@router.post("/core-ai-metrics", response_model=CoreAIResponse)
async def compute_core_ai_metrics(request: CoreAIRequest) -> CoreAIResponse:
    """
    Compute unified CoreAI metrics.
    
    This endpoint returns ALL synchronized AI metrics from a single computation:
    - Treatment score, effectiveness, aggressiveness
    - Recovery timeline and status
    - Complete risk profile
    - AI explanations for all decisions
    - Visualization parameters
    - Timeline keypoints for treatment progression
    
    This is the SINGLE SOURCE OF TRUTH for all AI metrics.
    All frontend components MUST use these metrics.
    """
    try:
        metrics = core_ai_metrics_engine.compute_core_metrics(
            medicine=request.medicine,
            cancer_type=request.cancer_type,
            tumor_size=request.tumor_size,
            aggressiveness=request.aggressiveness,
            treatment_score=request.treatment_score,
            recommendation_confidence=request.recommendation_confidence,
            segmentation_confidence=request.segmentation_confidence,
            response_trend=request.response_trend,
            previous_treatment_response=request.previous_treatment_response,
            medicine_category=request.medicine_category,
        )
        
        return CoreAIResponse(
            treatment_score=metrics.treatment_score,
            effectiveness=metrics.effectiveness,
            aggressiveness=metrics.aggressiveness,
            aggressiveness_label=metrics.aggressiveness_label,
            medicine_compatibility=metrics.medicine_compatibility,
            recovery_timeline_days=metrics.recovery_timeline_days,
            recovery_status=metrics.recovery_status,
            recovery_speed=metrics.recovery_speed,
            recurrence_risk=metrics.recurrence_risk,
            progression_risk=metrics.progression_risk,
            treatment_resistance_probability=metrics.treatment_resistance_probability,
            stabilization_confidence=metrics.stabilization_confidence,
            overall_risk_level=metrics.overall_risk_level,
            risk_score=metrics.risk_score,
            medicine_explanation=metrics.medicine_explanation,
            recovery_explanation=metrics.recovery_explanation,
            aggressiveness_explanation=metrics.aggressiveness_explanation,
            tumor_evolution_explanation=metrics.tumor_evolution_explanation,
            risk_summary=metrics.risk_summary,
            visualization_intensity=metrics.visualization_intensity,
            visualization_aggressiveness_color=metrics.visualization_aggressiveness_color,
            timeline_keypoints=[
                TimelineKeypoint(
                    day=int(kp["day"]),
                    tumor_size=kp["tumor_size"],
                    aggressiveness=kp["aggressiveness"],
                    treatment_effect=kp["treatment_effect"],
                )
                for kp in metrics.timeline_keypoints
            ],
            clinical_summary=metrics.clinical_summary,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CoreAI metrics computation failed: {str(e)}")


@router.get("/core-ai-metrics/example")
async def get_core_ai_metrics_example() -> Dict[str, Any]:
    """Get example CoreAI metrics for testing."""
    example_request = CoreAIRequest(
        medicine="Cabergoline",
        cancer_type="Pituitary Adenoma",
        tumor_size=45.0,
        aggressiveness="moderate",
    )
    
    metrics = core_ai_metrics_engine.compute_core_metrics(
        medicine=example_request.medicine,
        cancer_type=example_request.cancer_type,
        tumor_size=example_request.tumor_size,
        aggressiveness=example_request.aggressiveness,
    )
    
    return {
        "example_request": example_request.model_dump(),
        "example_response": CoreAIResponse(
            treatment_score=metrics.treatment_score,
            effectiveness=metrics.effectiveness,
            aggressiveness=metrics.aggressiveness,
            aggressiveness_label=metrics.aggressiveness_label,
            medicine_compatibility=metrics.medicine_compatibility,
            recovery_timeline_days=metrics.recovery_timeline_days,
            recovery_status=metrics.recovery_status,
            recovery_speed=metrics.recovery_speed,
            recurrence_risk=metrics.recurrence_risk,
            progression_risk=metrics.progression_risk,
            treatment_resistance_probability=metrics.treatment_resistance_probability,
            stabilization_confidence=metrics.stabilization_confidence,
            overall_risk_level=metrics.overall_risk_level,
            risk_score=metrics.risk_score,
            medicine_explanation=metrics.medicine_explanation,
            recovery_explanation=metrics.recovery_explanation,
            aggressiveness_explanation=metrics.aggressiveness_explanation,
            tumor_evolution_explanation=metrics.tumor_evolution_explanation,
            risk_summary=metrics.risk_summary,
            visualization_intensity=metrics.visualization_intensity,
            visualization_aggressiveness_color=metrics.visualization_aggressiveness_color,
            timeline_keypoints=[
                TimelineKeypoint(
                    day=int(kp["day"]),
                    tumor_size=kp["tumor_size"],
                    aggressiveness=kp["aggressiveness"],
                    treatment_effect=kp["treatment_effect"],
                )
                for kp in metrics.timeline_keypoints
            ],
            clinical_summary=metrics.clinical_summary,
        ).model_dump(),
    }
