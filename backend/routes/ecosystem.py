"""
Unified Healthcare Ecosystem API Routes
Integrates the core AI synchronization system with multi-patient support.

All routes synchronize through the UnifiedAICoreMetrics system.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict, Any
from datetime import datetime
from backend.core.unified_ai_core import (
    core_orchestrator,
    UnifiedAICoreMetrics
)
from backend.core.patient_management import (
    patient_database,
    PatientProfile,
    PatientSession,
    PatientCancerType as PatCancerType
)
from pydantic import BaseModel

router = APIRouter(prefix="/api/ecosystem", tags=["AI Healthcare Ecosystem"])


# ============================================================================
# Request/Response Models
# ============================================================================

class CreatePatientRequest(BaseModel):
    """Create new patient profile."""
    name: str
    age: int
    gender: str
    cancer_type: str
    initial_tumor_volume: float
    initial_aggressiveness: float
    stage: str = "III"


class PatientMetricsResponse(BaseModel):
    """Return comprehensive patient metrics."""
    patient_id: str
    name: str
    cancer_type: str
    status: str
    treatment_score: float
    effectiveness: float
    aggressiveness: float
    current_medicine: Optional[str]
    risk_level: str
    stabilization_confidence: float
    last_updated: datetime


class ApplyTreatmentRequest(BaseModel):
    """Apply treatment to patient."""
    medicine: str
    dosage_mg: float
    duration_days: int
    notes: Optional[str] = None


class UpdateImagingRequest(BaseModel):
    """Record medical imaging."""
    imaging_type: str
    tumor_volume_mm3: float
    aggressiveness_level: float
    notes: Optional[str] = None


class CreateSessionRequest(BaseModel):
    """Create patient interaction session."""
    patient_id: str


class SessionStateRequest(BaseModel):
    """Update session state."""
    current_view: Optional[str] = None
    selected_medicine: Optional[str] = None
    simulation_in_progress: Optional[bool] = None


# ============================================================================
# Patient Management Endpoints
# ============================================================================

@router.post("/patients/create", response_model=Dict[str, Any])
async def create_patient(request: CreatePatientRequest):
    """
    Create a new patient profile in the ecosystem.
    
    This initializes:
    - Patient profile with medical history
    - Unified AI core metrics
    - Treatment history tracking
    """
    try:
        # Create patient in database
        cancer_type = PatCancerType(request.cancer_type)
        patient = patient_database.create_patient(
            name=request.name,
            age=request.age,
            gender=request.gender,
            cancer_type=cancer_type,
            initial_tumor_volume=request.initial_tumor_volume,
            initial_aggressiveness=request.initial_aggressiveness,
            stage=request.stage
        )
        
        # Initialize AI core metrics
        core_metrics = core_orchestrator.initialize_patient_metrics(
            patient_id=patient.patient_id,
            tumor_volume=request.initial_tumor_volume,
            initial_aggressiveness=request.initial_aggressiveness,
            cancer_type=request.cancer_type
        )
        
        return {
            "status": "success",
            "patient_id": patient.patient_id,
            "name": patient.name,
            "cancer_type": cancer_type.value,
            "initial_metrics": {
                "treatment_score": core_metrics.treatment_score,
                "aggressiveness": core_metrics.aggressiveness,
                "tumor_volume": request.initial_tumor_volume
            },
            "message": f"Patient {patient.name} created and AI metrics initialized"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/patients", response_model=List[PatientMetricsResponse])
async def list_all_patients():
    """
    List all patients in the ecosystem with current metrics.
    """
    patients = patient_database.list_all_patients()
    
    result = []
    for patient in patients:
        try:
            metrics = core_orchestrator.get_metrics(patient.patient_id)
            result.append(PatientMetricsResponse(
                patient_id=patient.patient_id,
                name=patient.name,
                cancer_type=patient.cancer_type.value,
                status=patient.status.value,
                treatment_score=metrics.treatment_score,
                effectiveness=metrics.effectiveness,
                aggressiveness=metrics.aggressiveness,
                current_medicine=patient.current_medicine,
                risk_level=patient.risk_level,
                stabilization_confidence=metrics.risk_analysis.stabilization_confidence,
                last_updated=metrics.last_updated
            ))
        except:
            pass
    
    return result


@router.get("/patients/{patient_id}")
async def get_patient_metrics(patient_id: str):
    """
    Get comprehensive metrics for a specific patient.
    
    Returns all synchronized AI intelligence:
    - Treatment score and effectiveness
    - Aggressiveness tracking
    - Risk analysis
    - Recovery timeline
    - Evolution intelligence
    - Treatment history
    """
    try:
        patient = patient_database.get_patient(patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        metrics = core_orchestrator.get_metrics(patient_id)
        history_summary = patient_database.get_treatment_history_summary(patient_id)
        
        return {
            "patient_id": patient.patient_id,
            "name": patient.name,
            "cancer_type": patient.cancer_type.value,
            "age": patient.age,
            "status": patient.status.value,
            "unified_metrics": {
                "treatment_score": metrics.treatment_score,
                "effectiveness": metrics.effectiveness,
                "aggressiveness": metrics.aggressiveness,
                "medicine_compatibility": metrics.medicine_compatibility,
                "recovery_timeline": metrics.recovery_timeline.dict()
            },
            "risk_analysis": metrics.risk_analysis.dict(),
            "evolution_intelligence": metrics.evolution_intelligence.dict(),
            "treatment_history": history_summary,
            "imaging_records": len(patient.medical_imaging),
            "medicines_tried": patient.medicines_tried,
            "last_updated": metrics.last_updated
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Treatment Management Endpoints
# ============================================================================

@router.post("/patients/{patient_id}/apply-treatment")
async def apply_treatment(patient_id: str, request: ApplyTreatmentRequest):
    """
    Apply treatment to patient and update all synchronized metrics.
    
    This updates:
    - Treatment effectiveness
    - Aggressiveness changes
    - Recovery timeline
    - Risk intelligence
    - Evolution tracking
    """
    try:
        patient = patient_database.get_patient(patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Simulate treatment effectiveness (integrates with medicine database)
        effectiveness = 0.75  # Would come from medicine simulator in production
        tumor_reduction = 15.0  # Would come from simulation
        compatibility = 0.85  # Would come from compatibility analysis
        
        # Update core metrics
        core_orchestrator.update_treatment_effectiveness(
            patient_id=patient_id,
            medicine_name=request.medicine,
            effectiveness=effectiveness,
            tumor_reduction=tumor_reduction,
            compatibility=compatibility
        )
        
        # Generate recovery timeline
        recovery_timeline = core_orchestrator.predict_recovery_trajectory(
            patient_id=patient_id,
            medicine_name=request.medicine,
            duration_months=6
        )
        
        # Record in patient database
        treatment_session = patient_database.add_treatment_session(
            patient_id=patient_id,
            medicine=request.medicine,
            dosage_mg=request.dosage_mg,
            duration_days=request.duration_days,
            tumor_reduction_percent=tumor_reduction,
            aggressiveness_change=-5.0,
            effectiveness_score=effectiveness,
            notes=request.notes
        )
        
        updated_metrics = core_orchestrator.get_metrics(patient_id)
        
        return {
            "status": "success",
            "treatment_applied": request.medicine,
            "updated_metrics": {
                "treatment_score": updated_metrics.treatment_score,
                "effectiveness": updated_metrics.effectiveness,
                "aggressiveness": updated_metrics.aggressiveness,
                "tumor_reduction_percent": tumor_reduction
            },
            "recovery_timeline": recovery_timeline.dict(),
            "message": f"Treatment applied and metrics updated"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/patients/{patient_id}/update-imaging")
async def update_imaging(patient_id: str, request: UpdateImagingRequest):
    """
    Record medical imaging and update patient metrics.
    
    Updates:
    - Current tumor volume
    - Current aggressiveness
    - Imaging history
    - Evolution tracking
    """
    try:
        patient = patient_database.get_patient(patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Record imaging
        imaging = patient_database.add_imaging(
            patient_id=patient_id,
            imaging_type=request.imaging_type,
            tumor_volume_mm3=request.tumor_volume_mm3,
            aggressiveness_level=request.aggressiveness_level,
            notes=request.notes
        )
        
        # Update core metrics
        patient_database.update_patient_metrics(
            patient_id=patient_id,
            tumor_volume=request.tumor_volume_mm3,
            aggressiveness=request.aggressiveness_level
        )
        
        # Update evolution intelligence
        metrics = core_orchestrator.get_metrics(patient_id)
        metrics.evolution_intelligence.current_volume = request.tumor_volume_mm3
        
        return {
            "status": "success",
            "imaging_type": request.imaging_type,
            "current_volume": request.tumor_volume_mm3,
            "current_aggressiveness": request.aggressiveness_level,
            "updated_metrics": {
                "treatment_score": metrics.treatment_score,
                "aggressiveness": metrics.aggressiveness
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================================
# Session Management Endpoints
# ============================================================================

@router.post("/sessions/create", response_model=Dict[str, Any])
async def create_session(request: CreateSessionRequest):
    """
    Create a new patient interaction session.
    
    Manages:
    - 3D viewer state
    - Current view context
    - Medicine selection
    - Simulation state
    """
    try:
        patient = patient_database.get_patient(request.patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        session = patient_database.create_patient_session(request.patient_id)
        
        return {
            "status": "success",
            "session_id": session.session_id,
            "patient_id": session.patient_id,
            "created_at": session.created_at,
            "expires_at": session.expires_at,
            "current_view": session.current_view
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    """Get active session state."""
    try:
        session = patient_database.get_patient_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found or expired")
        
        return {
            "session_id": session.session_id,
            "patient_id": session.patient_id,
            "current_view": session.current_view,
            "selected_medicine": session.selected_medicine,
            "simulation_in_progress": session.simulation_in_progress,
            "is_active": session.is_active,
            "last_accessed": session.last_accessed
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/sessions/{session_id}")
async def update_session_state(session_id: str, request: SessionStateRequest):
    """Update current session state."""
    try:
        patient_database.update_session_state(
            session_id=session_id,
            current_view=request.current_view,
            selected_medicine=request.selected_medicine,
            simulation_in_progress=request.simulation_in_progress
        )
        
        session = patient_database.get_patient_session(session_id)
        
        return {
            "status": "success",
            "session_id": session_id,
            "current_view": session.current_view,
            "selected_medicine": session.selected_medicine
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ============================================================================
# Analytics & History Endpoints
# ============================================================================

@router.get("/patients/{patient_id}/history")
async def get_patient_history(patient_id: str, limit: int = Query(50, ge=1, le=500)):
    """
    Get patient event history.
    
    Tracks all:
    - Treatment applications
    - Metric updates
    - Imaging records
    - Status changes
    """
    try:
        patient = patient_database.get_patient(patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        history = patient_database.get_patient_history(patient_id, limit=limit)
        
        return {
            "patient_id": patient_id,
            "total_events": len(history),
            "events": history
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/ecosystem/status")
async def get_ecosystem_status():
    """
    Get overall ecosystem status.
    
    Returns:
    - Number of active patients
    - Active sessions
    - System health
    """
    patients = patient_database.list_all_patients()
    active_patients = list(core_orchestrator.get_all_active_patients())
    
    return {
        "status": "operational",
        "total_patients": len(patients),
        "active_patients": len(active_patients),
        "total_sessions": len(patient_database.sessions),
        "active_sessions": sum(1 for s in patient_database.sessions.values() if s.is_active),
        "sync_log_entries": len(core_orchestrator.sync_log),
        "timestamp": datetime.utcnow()
    }


@router.get("/ecosystem/synchronization/{patient_id}")
async def get_synchronization_data(patient_id: str, target: str = Query("all", regex="^(visualization|prediction|reporting|all)$")):
    """
    Get synchronized data for specific component.
    
    Targets:
    - visualization: 3D viewer synchronization
    - prediction: Predictive engine data
    - reporting: Report generation data
    - all: Complete metrics
    """
    try:
        patient = patient_database.get_patient(patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        result = {}
        
        if target in ("visualization", "all"):
            result["visualization"] = core_orchestrator.sync_to_visualization(patient_id)
        
        if target in ("prediction", "all"):
            result["prediction"] = core_orchestrator.sync_to_prediction_engine(patient_id)
        
        if target in ("reporting", "all"):
            result["reporting"] = core_orchestrator.sync_to_reporting(patient_id)
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
