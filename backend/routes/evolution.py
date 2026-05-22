"""
API endpoint for tumor evolution simulation
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Optional
from pydantic import BaseModel
import numpy as np
from tumor_evolution_engine import simulate_tumor_change, simulate_tumor_evolution

router = APIRouter(prefix="/api/evolve", tags=["evolution"])


class EvolutionRequest(BaseModel):
    """Request for tumor evolution simulation"""
    volume_data: Dict  # Contains mesh with vertices and faces
    effectiveness: float  # 0-1, medicine effectiveness
    recovery_progress: float = 0.0  # 0-100, recovery percentage
    aggressiveness: str = "moderate"  # "low", "moderate", "high"
    medicine_type: str = "standard"  # "standard", "targeted", "immunotherapy"
    simulation_days: float = 90.0
    treatment_score: float | None = None
    cancer_type: str = "UNKNOWN"
    

class EvolutionResponse(BaseModel):
    """Response with evolution timeline"""
    frames: list
    timeline_days: list
    status_progression: list
    volume_progression: list
    medicine_response_score: float
    final_aggressiveness: float
    success: bool
    treatment_score: float | None = None
    tumor_state: str | None = None
    deformation_strength: float | None = None
    growth_rate: float | None = None
    aggressiveness: float | None = None
    timeline_frames: list | None = None
    mesh_sequence: list | None = None


@router.post("/simulate", response_model=EvolutionResponse)
async def simulate_evolution(request: EvolutionRequest) -> EvolutionResponse:
    """
    Simulate tumor evolution over time
    
    Returns a sequence of mesh frames representing tumor evolution
    based on medicine effectiveness and aggressiveness.
    """
    try:
        result = simulate_tumor_evolution(
            volume_data=request.volume_data,
            effectiveness=request.effectiveness,
            recovery_progress=request.recovery_progress,
            aggressiveness=request.aggressiveness,
            medicine_type=request.medicine_type,
            simulation_days=request.simulation_days,
            treatment_score=request.treatment_score,
            cancer_type=request.cancer_type,
        )
        
        return EvolutionResponse(
            frames=result.get('frames', []),
            timeline_days=result.get('timeline_days', []),
            status_progression=result.get('status_progression', []),
            volume_progression=result.get('volume_progression', []),
            medicine_response_score=result.get('medicine_response_score', 0.5),
            final_aggressiveness=result.get('final_aggressiveness', 0.5),
            success=result.get('success', False),
            treatment_score=result.get('treatment_score'),
            tumor_state=result.get('tumor_state'),
            deformation_strength=result.get('deformation_strength'),
            growth_rate=result.get('growth_rate'),
            aggressiveness=result.get('aggressiveness'),
            timeline_frames=result.get('timeline_frames'),
            mesh_sequence=result.get('mesh_sequence'),
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Evolution simulation failed: {str(e)}"
        )


@router.get("/status")
async def evolution_status() -> Dict:
    """
    Check evolution engine status
    """
    return {
        "status": "available",
        "supported_medicines": ["standard", "targeted", "immunotherapy"],
        "supported_aggressiveness": ["low", "moderate", "high"],
    }
