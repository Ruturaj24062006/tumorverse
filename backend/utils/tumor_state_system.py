"""Realistic medical tumor states system for TumorVerse.

Defines tumor states that affect:
- Lighting and visualization
- Shader properties
- Deformation intensity
- Pulsation characteristics
- Tissue density
- Aggressiveness indicators
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Dict, Optional, Tuple

import math


class TumorMedicalState(Enum):
    """Medical tumor states based on treatment response."""
    RESPONDING = "Responding"
    STABLE = "Stable"
    AGGRESSIVE = "Aggressive"
    RESISTANT = "Resistant"
    PROGRESSIVE = "Progressive"
    NECROTIC = "Necrotic"
    CONTROLLED = "Controlled"


@dataclass(frozen=True)
class TumorStateVisualProperties:
    """Visual properties for each tumor state."""
    # Lighting
    glow_intensity: float  # 0-1
    glow_color: Tuple[float, float, float]  # RGB normalized 0-1
    base_color: Tuple[float, float, float]  # RGB normalized 0-1
    
    # Shader properties
    roughness: float  # 0-1, higher = rougher
    metallic: float  # 0-1, higher = more metallic
    emission_intensity: float  # 0-2
    
    # Deformation
    deformation_intensity: float  # 0-1
    deformation_frequency: float  # Hz
    
    # Pulsation
    pulsation_speed: float  # 0-2, multiplier on base frequency
    pulsation_amplitude: float  # 0-1
    
    # Tissue
    tissue_density: float  # 0-1
    hypoxia_visibility: float  # 0-1, how visible hypoxic regions are
    necrosis_visibility: float  # 0-1, how visible necrotic regions are
    
    # Visual clarity
    mesh_opacity: float  # 0-1
    shader_noise_level: float  # 0-1
    
    # Animation
    animation_intensity: float  # 0-1, overall animation magnitude


@dataclass(frozen=True)
class TumorStateBehaviorProperties:
    """Behavioral properties for each tumor state."""
    growth_rate_multiplier: float  # 1.0 = normal, < 1 = slowing, > 1 = accelerating
    treatment_response_factor: float  # How responsive to medicine
    stability_factor: float  # 0-1, how stable tumor is (vs chaotic)
    aggressiveness_trend: str  # "decreasing", "stable", "increasing"
    morphology_change_speed: float  # How fast shape changes


class TumorStateSystem:
    """Define and manage realistic tumor medical states."""

    # State visual properties
    _STATE_VISUAL_PROPERTIES: Dict[TumorMedicalState, TumorStateVisualProperties] = {
        TumorMedicalState.RESPONDING: TumorStateVisualProperties(
            # Responding tumors appear calmer, lighter
            glow_intensity=0.3,
            glow_color=(0.2, 0.8, 0.4),  # Green-ish
            base_color=(0.6, 0.9, 0.7),
            roughness=0.6,
            metallic=0.1,
            emission_intensity=0.4,
            deformation_intensity=0.2,
            deformation_frequency=0.5,
            pulsation_speed=0.6,
            pulsation_amplitude=0.15,
            tissue_density=0.7,
            hypoxia_visibility=0.2,
            necrosis_visibility=0.3,
            mesh_opacity=0.85,
            shader_noise_level=0.2,
            animation_intensity=0.3,
        ),
        
        TumorMedicalState.STABLE: TumorStateVisualProperties(
            # Stable tumors are neutral
            glow_intensity=0.4,
            glow_color=(0.4, 0.7, 0.9),  # Blue-ish
            base_color=(0.5, 0.7, 0.9),
            roughness=0.5,
            metallic=0.2,
            emission_intensity=0.5,
            deformation_intensity=0.3,
            deformation_frequency=0.7,
            pulsation_speed=0.8,
            pulsation_amplitude=0.25,
            tissue_density=0.8,
            hypoxia_visibility=0.3,
            necrosis_visibility=0.2,
            mesh_opacity=0.9,
            shader_noise_level=0.3,
            animation_intensity=0.4,
        ),
        
        TumorMedicalState.AGGRESSIVE: TumorStateVisualProperties(
            # Aggressive tumors appear red, pulsating, unstable
            glow_intensity=0.7,
            glow_color=(1.0, 0.3, 0.3),  # Red
            base_color=(0.95, 0.4, 0.2),
            roughness=0.7,
            metallic=0.3,
            emission_intensity=1.0,
            deformation_intensity=0.6,
            deformation_frequency=1.2,
            pulsation_speed=1.5,
            pulsation_amplitude=0.4,
            tissue_density=0.9,
            hypoxia_visibility=0.6,
            necrosis_visibility=0.4,
            mesh_opacity=0.95,
            shader_noise_level=0.6,
            animation_intensity=0.7,
        ),
        
        TumorMedicalState.RESISTANT: TumorStateVisualProperties(
            # Resistant tumors appear dark, hard, impenetrable
            glow_intensity=0.5,
            glow_color=(0.7, 0.2, 0.8),  # Purple
            base_color=(0.3, 0.1, 0.4),
            roughness=0.8,
            metallic=0.5,
            emission_intensity=0.6,
            deformation_intensity=0.2,
            deformation_frequency=0.3,
            pulsation_speed=0.4,
            pulsation_amplitude=0.1,
            tissue_density=0.95,
            hypoxia_visibility=0.7,
            necrosis_visibility=0.6,
            mesh_opacity=0.8,
            shader_noise_level=0.4,
            animation_intensity=0.2,
        ),
        
        TumorMedicalState.PROGRESSIVE: TumorStateVisualProperties(
            # Progressive tumors are highly aggressive and unstable
            glow_intensity=0.9,
            glow_color=(1.0, 0.0, 0.0),  # Pure red
            base_color=(0.8, 0.1, 0.1),
            roughness=0.85,
            metallic=0.4,
            emission_intensity=1.2,
            deformation_intensity=0.8,
            deformation_frequency=1.5,
            pulsation_speed=2.0,
            pulsation_amplitude=0.5,
            tissue_density=1.0,
            hypoxia_visibility=0.9,
            necrosis_visibility=0.5,
            mesh_opacity=1.0,
            shader_noise_level=0.8,
            animation_intensity=0.9,
        ),
        
        TumorMedicalState.NECROTIC: TumorStateVisualProperties(
            # Necrotic tumors appear calcified, brittle, fragmenting
            glow_intensity=0.2,
            glow_color=(0.6, 0.6, 0.6),  # Gray
            base_color=(0.4, 0.4, 0.4),
            roughness=0.95,
            metallic=0.7,
            emission_intensity=0.2,
            deformation_intensity=0.4,
            deformation_frequency=0.4,
            pulsation_speed=0.2,
            pulsation_amplitude=0.05,
            tissue_density=1.0,
            hypoxia_visibility=0.2,
            necrosis_visibility=0.95,
            mesh_opacity=0.7,
            shader_noise_level=0.9,
            animation_intensity=0.1,
        ),
        
        TumorMedicalState.CONTROLLED: TumorStateVisualProperties(
            # Controlled tumors are calm, shrinking
            glow_intensity=0.25,
            glow_color=(0.1, 0.9, 0.3),  # Bright green
            base_color=(0.4, 0.95, 0.5),
            roughness=0.4,
            metallic=0.05,
            emission_intensity=0.3,
            deformation_intensity=0.1,
            deformation_frequency=0.3,
            pulsation_speed=0.5,
            pulsation_amplitude=0.1,
            tissue_density=0.6,
            hypoxia_visibility=0.1,
            necrosis_visibility=0.4,
            mesh_opacity=0.9,
            shader_noise_level=0.15,
            animation_intensity=0.2,
        ),
    }

    # State behavior properties
    _STATE_BEHAVIOR_PROPERTIES: Dict[TumorMedicalState, TumorStateBehaviorProperties] = {
        TumorMedicalState.RESPONDING: TumorStateBehaviorProperties(
            growth_rate_multiplier=0.4,
            treatment_response_factor=0.9,
            stability_factor=0.8,
            aggressiveness_trend="decreasing",
            morphology_change_speed=0.3,
        ),
        
        TumorMedicalState.STABLE: TumorStateBehaviorProperties(
            growth_rate_multiplier=0.8,
            treatment_response_factor=0.7,
            stability_factor=0.9,
            aggressiveness_trend="stable",
            morphology_change_speed=0.2,
        ),
        
        TumorMedicalState.AGGRESSIVE: TumorStateBehaviorProperties(
            growth_rate_multiplier=1.5,
            treatment_response_factor=0.3,
            stability_factor=0.4,
            aggressiveness_trend="increasing",
            morphology_change_speed=0.8,
        ),
        
        TumorMedicalState.RESISTANT: TumorStateBehaviorProperties(
            growth_rate_multiplier=1.0,
            treatment_response_factor=0.2,
            stability_factor=0.5,
            aggressiveness_trend="stable",
            morphology_change_speed=0.5,
        ),
        
        TumorMedicalState.PROGRESSIVE: TumorStateBehaviorProperties(
            growth_rate_multiplier=2.0,
            treatment_response_factor=0.1,
            stability_factor=0.2,
            aggressiveness_trend="increasing",
            morphology_change_speed=1.0,
        ),
        
        TumorMedicalState.NECROTIC: TumorStateBehaviorProperties(
            growth_rate_multiplier=0.1,
            treatment_response_factor=0.95,
            stability_factor=0.3,
            aggressiveness_trend="decreasing",
            morphology_change_speed=0.6,
        ),
        
        TumorMedicalState.CONTROLLED: TumorStateBehaviorProperties(
            growth_rate_multiplier=0.2,
            treatment_response_factor=0.95,
            stability_factor=0.95,
            aggressiveness_trend="decreasing",
            morphology_change_speed=0.15,
        ),
    }

    @staticmethod
    def determine_state(
        treatment_score: float,
        effectiveness: float,
        aggressiveness: str,
        response_trend: float,
        tumor_size: float,
        previous_size: Optional[float] = None,
    ) -> TumorMedicalState:
        """Determine medical state from clinical parameters."""
        
        # Calculate size trend
        if previous_size is not None:
            size_change = tumor_size - previous_size
            if size_change < -2:
                shrinking = True
            else:
                shrinking = False
        else:
            shrinking = False
        
        # Primary state determination logic
        # (Treatment score, effectiveness, aggressiveness, response_trend all contribute)
        
        # Responsive: High treatment score + good effectiveness + positive response
        if treatment_score >= 80 and effectiveness >= 0.75 and response_trend > 60:
            return TumorMedicalState.RESPONDING
        
        # Controlled: Excellent treatment score + shrinking
        if treatment_score >= 85 and shrinking:
            return TumorMedicalState.CONTROLLED
        
        # Stable: Moderate treatment score, not growing
        if treatment_score >= 55 and treatment_score < 75 and not shrinking and aggressiveness != "high":
            return TumorMedicalState.STABLE
        
        # Necrotic: Excellent treatment score + large tumor (indicates necrosis)
        if treatment_score >= 85 and tumor_size > 30 and effectiveness > 0.70:
            return TumorMedicalState.NECROTIC
        
        # Progressive: Very poor treatment score + high aggressiveness
        if treatment_score < 30 and aggressiveness == "high":
            return TumorMedicalState.PROGRESSIVE
        
        # Resistant: Low effectiveness + high aggressiveness
        if effectiveness < 0.35 and aggressiveness == "high":
            return TumorMedicalState.RESISTANT
        
        # Aggressive: High aggressiveness + poor treatment response
        if aggressiveness == "high" and treatment_score < 55:
            return TumorMedicalState.AGGRESSIVE
        
        # Default to stable if unclear
        return TumorMedicalState.STABLE

    @staticmethod
    def get_visual_properties(state: TumorMedicalState) -> TumorStateVisualProperties:
        """Get visual properties for a state."""
        return TumorStateSystem._STATE_VISUAL_PROPERTIES.get(
            state, TumorStateSystem._STATE_VISUAL_PROPERTIES[TumorMedicalState.STABLE]
        )

    @staticmethod
    def get_behavior_properties(state: TumorMedicalState) -> TumorStateBehaviorProperties:
        """Get behavior properties for a state."""
        return TumorStateSystem._STATE_BEHAVIOR_PROPERTIES.get(
            state, TumorStateSystem._STATE_BEHAVIOR_PROPERTIES[TumorMedicalState.STABLE]
        )

    @staticmethod
    def get_state_description(state: TumorMedicalState) -> str:
        """Get human-readable description of state."""
        descriptions = {
            TumorMedicalState.RESPONDING: "The tumor is responding well to treatment. Aggressiveness is decreasing.",
            TumorMedicalState.STABLE: "The tumor is stable under treatment. No significant change observed.",
            TumorMedicalState.AGGRESSIVE: "The tumor is displaying aggressive growth despite treatment.",
            TumorMedicalState.RESISTANT: "The tumor shows signs of treatment resistance. Response is minimal.",
            TumorMedicalState.PROGRESSIVE: "The tumor is progressing despite treatment. Immediate intervention needed.",
            TumorMedicalState.NECROTIC: "The tumor is undergoing necrosis. Calcification and fragmentation occurring.",
            TumorMedicalState.CONTROLLED: "The tumor is controlled and shrinking. Excellent treatment response.",
        }
        return descriptions.get(state, "Unknown tumor state.")

    @staticmethod
    def get_clinical_recommendation(state: TumorMedicalState) -> str:
        """Get clinical recommendation based on state."""
        recommendations = {
            TumorMedicalState.RESPONDING: "Continue current treatment regimen. Monitor for sustained response.",
            TumorMedicalState.STABLE: "Maintain current treatment. Consider imaging in 4-6 weeks.",
            TumorMedicalState.AGGRESSIVE: "Consider treatment modification. Evaluate for resistant mutations.",
            TumorMedicalState.RESISTANT: "Current therapy appears ineffective. Recommend treatment change.",
            TumorMedicalState.PROGRESSIVE: "URGENT: Significant tumor progression. Immediate intervention required.",
            TumorMedicalState.NECROTIC: "Tumor necrosis observed. May consider temporary treatment hold if clinically stable.",
            TumorMedicalState.CONTROLLED: "Excellent control achieved. Continue current regimen with standard monitoring.",
        }
        return recommendations.get(state, "Standard monitoring recommended.")


# Singleton instance
tumor_state_system = TumorStateSystem()
