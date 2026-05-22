"""
Multi-Patient Architecture for TumorVerse
Supports persistent patient data, session management, and treatment history tracking.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
from enum import Enum
import uuid
import json


class PatientCancerType(str, Enum):
    """Supported cancer types in TumorVerse."""
    GBM = "glioblastoma"
    LUAD = "lung_adenocarcinoma"
    IDC = "invasive_ductal_carcinoma"
    BRCA = "breast_cancer"
    COLON = "colorectal_cancer"
    MELANOMA = "melanoma"
    OVARIAN = "ovarian_cancer"
    PROSTATE = "prostate_cancer"


class PatientStatus(str, Enum):
    """Current patient status in treatment."""
    ACTIVE = "active"
    STABILIZED = "stabilized"
    REMISSION = "remission"
    PROGRESSING = "progressing"
    CRITICAL = "critical"


class TreatmentSession(BaseModel):
    """Individual treatment session record."""
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: datetime = Field(default_factory=datetime.utcnow)
    medicine: str
    dosage_mg: float
    duration_days: int
    tumor_reduction_percent: float
    aggressiveness_change: float
    effectiveness_score: float
    side_effects: Optional[str] = None
    notes: Optional[str] = None


class MedicalImaging(BaseModel):
    """Medical imaging record."""
    imaging_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: datetime = Field(default_factory=datetime.utcnow)
    imaging_type: str = Field(..., description="MRI|CT|PET|3D_RECONSTRUCTION")
    tumor_volume_mm3: float
    aggressiveness_level: float
    segmentation_quality: float = Field(0.0, ge=0, le=1)
    image_path: Optional[str] = None
    notes: Optional[str] = None


class PatientProfile(BaseModel):
    """Comprehensive patient profile with treatment history."""
    
    # Patient Identification
    patient_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    age: int
    gender: str = Field(..., description="M|F|Other")
    
    # Cancer Information
    cancer_type: PatientCancerType
    initial_diagnosis_date: datetime
    initial_tumor_volume_mm3: float
    initial_aggressiveness: float
    stage: str = Field("III", description="I|II|III|IV")
    
    # Current Status
    status: PatientStatus = PatientStatus.ACTIVE
    current_aggressiveness: float
    current_tumor_volume_mm3: float
    last_imaging_date: Optional[datetime] = None
    
    # Treatment History
    treatment_sessions: List[TreatmentSession] = Field(default_factory=list)
    medical_imaging: List[MedicalImaging] = Field(default_factory=list)
    current_medicine: Optional[str] = None
    medicines_tried: List[str] = Field(default_factory=list)
    
    # Recovery Data
    stabilization_month: Optional[int] = None
    estimated_recovery_percent: float = 0.0
    last_recovery_update: Optional[datetime] = None
    
    # AI Metrics
    treatment_score: float = 0.0
    effectiveness_score: float = 0.0
    risk_level: str = "moderate"
    stabilization_confidence: float = 0.0
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    clinical_notes: List[str] = Field(default_factory=list)
    research_enabled: bool = False  # For research/publication


class PatientSession(BaseModel):
    """Active patient session for interaction."""
    
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    patient_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_accessed: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime = Field(default_factory=lambda: datetime.utcnow() + timedelta(hours=8))
    
    # Session State
    is_active: bool = True
    viewer_3d_state: Dict = Field(default_factory=dict)  # 3D viewer camera, controls state
    selected_medicine: Optional[str] = None
    simulation_in_progress: bool = False
    current_view: str = Field("dashboard", description="dashboard|3d_viewer|medicine_lab|research|presentation")
    
    # Session Analytics
    actions_performed: List[Dict] = Field(default_factory=list)
    session_duration_minutes: int = 0
    
    class Config:
        json_schema_extra = {
            "example": {
                "session_id": "sess-123",
                "patient_id": "pat-456",
                "current_view": "3d_viewer",
                "is_active": True
            }
        }


class PatientDatabase:
    """Persistent patient data storage and retrieval."""
    
    def __init__(self):
        # In-memory storage (can be replaced with actual DB)
        self.patients: Dict[str, PatientProfile] = {}
        self.sessions: Dict[str, PatientSession] = {}
        self.patient_history: Dict[str, List[Dict]] = {}
    
    def create_patient(
        self,
        name: str,
        age: int,
        gender: str,
        cancer_type: PatientCancerType,
        initial_tumor_volume: float,
        initial_aggressiveness: float,
        stage: str = "III"
    ) -> PatientProfile:
        """Create a new patient profile."""
        
        patient = PatientProfile(
            name=name,
            age=age,
            gender=gender,
            cancer_type=cancer_type,
            initial_diagnosis_date=datetime.utcnow(),
            initial_tumor_volume_mm3=initial_tumor_volume,
            initial_aggressiveness=initial_aggressiveness,
            current_aggressiveness=initial_aggressiveness,
            current_tumor_volume_mm3=initial_tumor_volume,
            stage=stage
        )
        
        self.patients[patient.patient_id] = patient
        self.patient_history[patient.patient_id] = [
            {
                "timestamp": datetime.utcnow().isoformat(),
                "event": "patient_created",
                "details": f"Patient {patient.name} created with {cancer_type.value}"
            }
        ]
        
        return patient
    
    def get_patient(self, patient_id: str) -> Optional[PatientProfile]:
        """Retrieve patient profile."""
        return self.patients.get(patient_id)
    
    def list_all_patients(self) -> List[PatientProfile]:
        """Get all patient profiles."""
        return list(self.patients.values())
    
    def update_patient_metrics(
        self,
        patient_id: str,
        tumor_volume: Optional[float] = None,
        aggressiveness: Optional[float] = None,
        treatment_score: Optional[float] = None,
        effectiveness: Optional[float] = None,
        risk_level: Optional[str] = None
    ):
        """Update patient metrics."""
        
        if patient_id not in self.patients:
            raise ValueError(f"Patient {patient_id} not found")
        
        patient = self.patients[patient_id]
        
        if tumor_volume is not None:
            patient.current_tumor_volume_mm3 = tumor_volume
        if aggressiveness is not None:
            patient.current_aggressiveness = aggressiveness
        if treatment_score is not None:
            patient.treatment_score = treatment_score
        if effectiveness is not None:
            patient.effectiveness_score = effectiveness
        if risk_level is not None:
            patient.risk_level = risk_level
        
        patient.last_updated = datetime.utcnow()
        self._log_patient_event(patient_id, "metrics_updated", 
            f"Aggressiveness: {aggressiveness}, Volume: {tumor_volume}")
    
    def add_treatment_session(
        self,
        patient_id: str,
        medicine: str,
        dosage_mg: float,
        duration_days: int,
        tumor_reduction_percent: float,
        aggressiveness_change: float,
        effectiveness_score: float,
        notes: Optional[str] = None
    ) -> TreatmentSession:
        """Record a treatment session."""
        
        if patient_id not in self.patients:
            raise ValueError(f"Patient {patient_id} not found")
        
        patient = self.patients[patient_id]
        session = TreatmentSession(
            medicine=medicine,
            dosage_mg=dosage_mg,
            duration_days=duration_days,
            tumor_reduction_percent=tumor_reduction_percent,
            aggressiveness_change=aggressiveness_change,
            effectiveness_score=effectiveness_score,
            notes=notes
        )
        
        patient.treatment_sessions.append(session)
        patient.current_medicine = medicine
        if medicine not in patient.medicines_tried:
            patient.medicines_tried.append(medicine)
        
        # Update patient metrics
        patient.current_tumor_volume_mm3 *= (1 - tumor_reduction_percent / 100)
        patient.current_aggressiveness += aggressiveness_change
        patient.current_aggressiveness = max(0, min(100, patient.current_aggressiveness))
        
        self._log_patient_event(patient_id, "treatment_session",
            f"{medicine}: {tumor_reduction_percent:.1f}% reduction")
        
        return session
    
    def add_imaging(
        self,
        patient_id: str,
        imaging_type: str,
        tumor_volume_mm3: float,
        aggressiveness_level: float,
        image_path: Optional[str] = None,
        notes: Optional[str] = None
    ) -> MedicalImaging:
        """Record medical imaging."""
        
        if patient_id not in self.patients:
            raise ValueError(f"Patient {patient_id} not found")
        
        patient = self.patients[patient_id]
        imaging = MedicalImaging(
            imaging_type=imaging_type,
            tumor_volume_mm3=tumor_volume_mm3,
            aggressiveness_level=aggressiveness_level,
            image_path=image_path,
            notes=notes
        )
        
        patient.medical_imaging.append(imaging)
        patient.last_imaging_date = imaging.date
        patient.current_tumor_volume_mm3 = tumor_volume_mm3
        patient.current_aggressiveness = aggressiveness_level
        
        self._log_patient_event(patient_id, "imaging",
            f"{imaging_type}: Vol={tumor_volume_mm3:.1f}mm³, Agg={aggressiveness_level:.1f}%")
        
        return imaging
    
    def create_patient_session(self, patient_id: str) -> PatientSession:
        """Create a new patient session."""
        
        if patient_id not in self.patients:
            raise ValueError(f"Patient {patient_id} not found")
        
        session = PatientSession(patient_id=patient_id)
        self.sessions[session.session_id] = session
        
        return session
    
    def get_patient_session(self, session_id: str) -> Optional[PatientSession]:
        """Retrieve active session."""
        session = self.sessions.get(session_id)
        if session and session.is_active and datetime.utcnow() < session.expires_at:
            session.last_accessed = datetime.utcnow()
            return session
        return None
    
    def update_session_state(
        self,
        session_id: str,
        current_view: Optional[str] = None,
        selected_medicine: Optional[str] = None,
        simulation_in_progress: Optional[bool] = None,
        viewer_state: Optional[Dict] = None
    ):
        """Update session state."""
        
        session = self.sessions.get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        if current_view:
            session.current_view = current_view
        if selected_medicine:
            session.selected_medicine = selected_medicine
        if simulation_in_progress is not None:
            session.simulation_in_progress = simulation_in_progress
        if viewer_state:
            session.viewer_3d_state.update(viewer_state)
        
        session.last_accessed = datetime.utcnow()
    
    def get_patient_history(self, patient_id: str, limit: int = 100) -> List[Dict]:
        """Get patient event history."""
        if patient_id not in self.patient_history:
            return []
        return self.patient_history[patient_id][-limit:]
    
    def get_treatment_history_summary(self, patient_id: str) -> Dict:
        """Generate treatment history summary."""
        
        if patient_id not in self.patients:
            raise ValueError(f"Patient {patient_id} not found")
        
        patient = self.patients[patient_id]
        
        total_reduction = sum(s.tumor_reduction_percent for s in patient.treatment_sessions)
        average_effectiveness = (
            sum(s.effectiveness_score for s in patient.treatment_sessions) / 
            len(patient.treatment_sessions) if patient.treatment_sessions else 0
        )
        
        return {
            "total_sessions": len(patient.treatment_sessions),
            "medicines_used": patient.medicines_tried,
            "total_tumor_reduction_percent": total_reduction,
            "average_medicine_effectiveness": average_effectiveness,
            "current_status": patient.status.value,
            "days_under_treatment": (datetime.utcnow() - patient.initial_diagnosis_date).days,
            "current_medicine": patient.current_medicine,
            "last_treatment": patient.treatment_sessions[-1].date if patient.treatment_sessions else None
        }
    
    def _log_patient_event(self, patient_id: str, event_type: str, detail: str):
        """Log event in patient history."""
        if patient_id not in self.patient_history:
            self.patient_history[patient_id] = []
        
        self.patient_history[patient_id].append({
            "timestamp": datetime.utcnow().isoformat(),
            "event": event_type,
            "details": detail
        })


# Global patient database instance
patient_database = PatientDatabase()
