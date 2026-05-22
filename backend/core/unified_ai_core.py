"""
Unified AI Core Synchronization System for TumorVerse
This is the central intelligence engine that synchronizes all AI metrics across the platform.

All systems (visualization, prediction, reporting, analysis) derive from this core.
No disconnected logic allowed - every feature reads/writes from this unified state.
"""

from typing import Dict, Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field
from dataclasses import dataclass, asdict
import json
import uuid


class EvolutionIntelligence(BaseModel):
    """Tumor evolution tracking and prediction intelligence."""
    current_volume: float = Field(..., description="Current tumor volume in mm³")
    volume_trend: float = Field(..., description="Volume change rate (%/month)")
    aggressiveness_trend: float = Field(..., description="Aggressiveness change rate (%/month)")
    growth_pattern: str = Field("linear", description="linear|exponential|sigmoid|stabilized")
    mutation_pressure: float = Field(..., description="Estimated mutation pressure (0-1)")
    treatment_response_pattern: str = Field("sensitive", description="sensitive|resistant|adaptive")
    previous_phases: List[Dict] = Field(default_factory=list, description="Historical evolution data")


class RiskAnalysis(BaseModel):
    """Clinical risk intelligence and predictive analysis."""
    recurrence_risk: float = Field(..., description="12-month recurrence probability (0-1)")
    relapse_risk: float = Field(..., description="Treatment failure risk (0-1)")
    progression_risk: float = Field(..., description="Untreated progression risk (0-1)")
    treatment_resistance_risk: float = Field(..., description="Drug resistance probability (0-1)")
    stabilization_confidence: float = Field(..., description="Achievement of stabilization (0-1)")
    critical_threshold: float = Field(..., description="Volume threshold for intervention (mm³)")
    risk_factors: List[str] = Field(default_factory=list, description="Identified risk factors")
    protective_factors: List[str] = Field(default_factory=list, description="Protective factors")


class MedicineSimulationResult(BaseModel):
    """Results from treatment simulation."""
    medicine_name: str
    dosage_mg: float
    duration_months: int
    tumor_reduction_percent: float = Field(..., description="Expected tumor reduction")
    aggressiveness_reduction: float = Field(..., description="Expected aggressiveness change")
    side_effect_score: float = Field(..., description="Expected side effects (0-1)")
    effectiveness_score: float = Field(..., description="Overall medicine effectiveness (0-1)")
    compatibility_score: float = Field(..., description="Medicine-tumor compatibility (0-1)")
    recovery_timeline_months: Optional[int] = None
    success_probability: float = Field(..., description="Probability of treatment success")


class RecoveryTimeline(BaseModel):
    """Treatment recovery trajectory."""
    total_months: Optional[int] = Field(None, description="Total expected recovery time")
    phases: List[Dict] = Field(default_factory=list, description="Recovery phases with milestones")
    stabilization_month: Optional[int] = None
    recovery_percent_target: float = 0.0
    confidence: float = 0.0


class TreatmentIntelligence(BaseModel):
    """Core treatment planning and recommendation system."""
    recommended_medicine: Optional[str] = None
    alternative_medicines: List[str] = Field(default_factory=list)
    primary_recommendation_score: float = 0.0
    treatment_strategy: str = Field("monotherapy", description="monotherapy|combination|sequential|adaptive")
    expected_effectiveness: float = 0.0
    estimated_duration_months: int = 0
    recovery_timeline: RecoveryTimeline = Field(default_factory=RecoveryTimeline)
    risk_level: str = Field("moderate", description="low|moderate|high|critical")
    last_updated: datetime = Field(default_factory=datetime.utcnow)


class UnifiedAICoreMetrics(BaseModel):
    """
    The Central Brain of TumorVerse.
    
    All systems synchronize around these core metrics:
    - treatment_score: Overall treatment effectiveness (0-100)
    - effectiveness: Current medicine effectiveness (0-1)
    - aggressiveness: Tumor aggressiveness level (0-100)
    - recovery_timeline: Projected recovery trajectory
    - medicine_compatibility: Medicine-tumor compatibility (0-1)
    - risk_analysis: Clinical risk intelligence
    - evolution_intelligence: Tumor evolution predictions
    """
    
    # Core Metrics
    treatment_score: float = Field(0.0, ge=0, le=100, description="Overall treatment effectiveness 0-100")
    effectiveness: float = Field(0.0, ge=0, le=1, description="Current medicine effectiveness 0-1")
    aggressiveness: float = Field(50.0, ge=0, le=100, description="Tumor aggressiveness 0-100")
    
    # Advanced Metrics
    recovery_timeline: RecoveryTimeline = Field(default_factory=RecoveryTimeline)
    medicine_compatibility: float = Field(0.0, ge=0, le=1, description="Medicine-tumor compatibility")
    risk_analysis: RiskAnalysis
    evolution_intelligence: EvolutionIntelligence
    
    # Treatment Planning
    treatment_intelligence: TreatmentIntelligence = Field(default_factory=TreatmentIntelligence)
    current_medicine: Optional[str] = None
    medicine_simulation_results: List[MedicineSimulationResult] = Field(default_factory=list)
    
    # Metadata
    patient_id: str = Field(..., description="Associated patient ID")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    version: str = Field("1.0", description="Metrics version for compatibility")
    
    class Config:
        json_schema_extra = {
            "example": {
                "treatment_score": 75.5,
                "effectiveness": 0.85,
                "aggressiveness": 35.0,
                "patient_id": "patient-123",
                "medicine_compatibility": 0.90,
                "current_medicine": "Dopamine Agonist"
            }
        }


class CoreAIOrchestrator:
    """
    Orchestrator that maintains unified AI metrics and synchronizes all systems.
    
    This is the single source of truth for all AI intelligence in TumorVerse.
    All visualization, prediction, reporting, and analysis components read from this.
    """
    
    def __init__(self):
        self.active_metrics: Dict[str, UnifiedAICoreMetrics] = {}
        self.sync_log: List[Dict] = []
    
    def initialize_patient_metrics(
        self,
        patient_id: str,
        tumor_volume: float,
        initial_aggressiveness: float,
        cancer_type: str
    ) -> UnifiedAICoreMetrics:
        """Initialize core metrics for a new patient."""
        
        metrics = UnifiedAICoreMetrics(
            patient_id=patient_id,
            aggressiveness=initial_aggressiveness,
            risk_analysis=RiskAnalysis(
                recurrence_risk=0.5,
                relapse_risk=0.4,
                progression_risk=0.6,
                treatment_resistance_risk=0.3,
                stabilization_confidence=0.0,
                critical_threshold=5000.0,
                risk_factors=[f"Cancer type: {cancer_type}", "Initial diagnosis"],
                protective_factors=[]
            ),
            evolution_intelligence=EvolutionIntelligence(
                current_volume=tumor_volume,
                volume_trend=5.0,
                aggressiveness_trend=0.0,
                growth_pattern="linear",
                mutation_pressure=0.5,
                treatment_response_pattern="sensitive"
            )
        )
        
        self.active_metrics[patient_id] = metrics
        self._log_sync(patient_id, "initialize", "Patient metrics initialized")
        
        return metrics
    
    def update_treatment_effectiveness(
        self,
        patient_id: str,
        medicine_name: str,
        effectiveness: float,
        tumor_reduction: float,
        compatibility: float
    ):
        """Update metrics after treatment application."""
        
        if patient_id not in self.active_metrics:
            raise ValueError(f"Patient {patient_id} not found in active metrics")
        
        metrics = self.active_metrics[patient_id]
        
        # Update core metrics
        metrics.effectiveness = effectiveness
        metrics.medicine_compatibility = compatibility
        metrics.current_medicine = medicine_name
        
        # Recalculate aggressiveness based on treatment response
        old_aggressiveness = metrics.aggressiveness
        metrics.aggressiveness = max(0, metrics.aggressiveness * (1 - tumor_reduction / 100))
        
        # Update treatment score
        metrics.treatment_score = (effectiveness * 100) + ((100 - metrics.aggressiveness) * 0.3)
        metrics.treatment_score = min(100, max(0, metrics.treatment_score))
        
        # Update evolution intelligence
        metrics.evolution_intelligence.aggressiveness_trend = metrics.aggressiveness - old_aggressiveness
        metrics.evolution_intelligence.volume_trend -= (tumor_reduction / 10)
        
        # Update timestamp
        metrics.last_updated = datetime.utcnow()
        
        self._log_sync(patient_id, "update_treatment", 
            f"Treated with {medicine_name}: effectiveness={effectiveness:.2f}, reduction={tumor_reduction:.1f}%")
    
    def predict_recovery_trajectory(
        self,
        patient_id: str,
        medicine_name: str,
        duration_months: int
    ) -> RecoveryTimeline:
        """Generate recovery trajectory prediction."""
        
        if patient_id not in self.active_metrics:
            raise ValueError(f"Patient {patient_id} not found")
        
        metrics = self.active_metrics[patient_id]
        
        # Build recovery phases
        phases = []
        monthly_recovery_rate = (metrics.effectiveness * 0.8) / max(1, duration_months)
        
        for month in range(1, duration_months + 1):
            recovery_percent = min(100, month * monthly_recovery_rate * 100)
            aggressiveness_change = metrics.aggressiveness * (1 - recovery_percent / 100)
            
            phases.append({
                "month": month,
                "recovery_percent": recovery_percent,
                "aggressiveness_remaining": aggressiveness_change,
                "milestone": self._get_recovery_milestone(month, recovery_percent)
            })
        
        timeline = RecoveryTimeline(
            total_months=duration_months,
            phases=phases,
            stabilization_month=int(duration_months * 0.7),
            recovery_percent_target=min(100, metrics.effectiveness * 100),
            confidence=metrics.medicine_compatibility
        )
        
        metrics.recovery_timeline = timeline
        self._log_sync(patient_id, "predict_recovery", f"Recovery trajectory generated for {medicine_name}")
        
        return timeline
    
    def update_risk_intelligence(self, patient_id: str, risk_factors: Dict[str, float]):
        """Update risk analysis based on latest patient data."""
        
        if patient_id not in self.active_metrics:
            raise ValueError(f"Patient {patient_id} not found")
        
        metrics = self.active_metrics[patient_id]
        
        # Update risk scores
        metrics.risk_analysis.recurrence_risk = risk_factors.get("recurrence", 0.5)
        metrics.risk_analysis.relapse_risk = risk_factors.get("relapse", 0.4)
        metrics.risk_analysis.progression_risk = risk_factors.get("progression", 0.6)
        metrics.risk_analysis.treatment_resistance_risk = risk_factors.get("resistance", 0.3)
        
        # Calculate stabilization confidence
        metrics.risk_analysis.stabilization_confidence = 1 - min(
            metrics.risk_analysis.recurrence_risk,
            metrics.risk_analysis.relapse_risk
        )
        
        metrics.last_updated = datetime.utcnow()
        self._log_sync(patient_id, "update_risk", "Risk intelligence updated")
    
    def get_metrics(self, patient_id: str) -> UnifiedAICoreMetrics:
        """Retrieve current metrics for a patient."""
        if patient_id not in self.active_metrics:
            raise ValueError(f"Patient {patient_id} not found")
        return self.active_metrics[patient_id]
    
    def get_all_active_patients(self) -> List[str]:
        """Get list of all patients with active metrics."""
        return list(self.active_metrics.keys())
    
    def sync_to_visualization(self, patient_id: str) -> Dict:
        """Export metrics for 3D visualization synchronization."""
        metrics = self.get_metrics(patient_id)
        return {
            "aggressiveness": metrics.aggressiveness,
            "treatment_score": metrics.treatment_score,
            "effectiveness": metrics.effectiveness,
            "tumor_volume": metrics.evolution_intelligence.current_volume,
            "recovery_timeline": metrics.recovery_timeline.dict(),
            "risk_level": metrics.treatment_intelligence.risk_level,
            "current_medicine": metrics.current_medicine
        }
    
    def sync_to_prediction_engine(self, patient_id: str) -> Dict:
        """Export metrics for predictive engines."""
        metrics = self.get_metrics(patient_id)
        return {
            "aggressiveness": metrics.aggressiveness,
            "current_volume": metrics.evolution_intelligence.current_volume,
            "volume_trend": metrics.evolution_intelligence.volume_trend,
            "growth_pattern": metrics.evolution_intelligence.growth_pattern,
            "mutation_pressure": metrics.evolution_intelligence.mutation_pressure,
            "treatment_response_pattern": metrics.evolution_intelligence.treatment_response_pattern,
            "medicine_compatibility": metrics.medicine_compatibility
        }
    
    def sync_to_reporting(self, patient_id: str) -> Dict:
        """Export metrics for report generation."""
        metrics = self.get_metrics(patient_id)
        return {
            "treatment_score": metrics.treatment_score,
            "effectiveness": metrics.effectiveness,
            "aggressiveness": metrics.aggressiveness,
            "current_medicine": metrics.current_medicine,
            "recovery_timeline": metrics.recovery_timeline.dict(),
            "risk_analysis": metrics.risk_analysis.dict(),
            "evolution_intelligence": metrics.evolution_intelligence.dict(),
            "treatment_intelligence": metrics.treatment_intelligence.dict()
        }
    
    def _get_recovery_milestone(self, month: int, recovery_percent: float) -> str:
        """Determine clinical milestone for recovery phase."""
        if recovery_percent < 25:
            return "Early treatment response"
        elif recovery_percent < 50:
            return "Partial stabilization"
        elif recovery_percent < 75:
            return "Significant improvement"
        else:
            return "Near-complete recovery"
    
    def _log_sync(self, patient_id: str, action: str, detail: str):
        """Log synchronization events for audit trail."""
        self.sync_log.append({
            "timestamp": datetime.utcnow().isoformat(),
            "patient_id": patient_id,
            "action": action,
            "detail": detail
        })


# Global orchestrator instance
core_orchestrator = CoreAIOrchestrator()
