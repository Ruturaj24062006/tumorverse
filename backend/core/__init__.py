"""
Backend Core Module - Unified AI Ecosystem Foundation

This module contains the foundational systems for TumorVerse:
- Unified AI Core Metrics System
- Multi-Patient Database Architecture
- Patient Session Management
- Core Synchronization Engine
"""

from backend.core.unified_ai_core import (
    UnifiedAICoreMetrics,
    CoreAIOrchestrator,
    core_orchestrator,
    EvolutionIntelligence,
    RiskAnalysis,
    TreatmentIntelligence,
    RecoveryTimeline
)

from backend.core.patient_management import (
    PatientProfile,
    PatientDatabase,
    PatientSession,
    PatientStatus,
    PatientCancerType,
    TreatmentSession,
    MedicalImaging,
    patient_database
)

__all__ = [
    "UnifiedAICoreMetrics",
    "CoreAIOrchestrator",
    "core_orchestrator",
    "EvolutionIntelligence",
    "RiskAnalysis",
    "TreatmentIntelligence",
    "RecoveryTimeline",
    "PatientProfile",
    "PatientDatabase",
    "PatientSession",
    "PatientStatus",
    "PatientCancerType",
    "TreatmentSession",
    "MedicalImaging",
    "patient_database"
]
