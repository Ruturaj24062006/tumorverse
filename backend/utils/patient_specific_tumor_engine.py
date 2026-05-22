"""Patient-specific tumor behavior engine for TumorVerse.

Generates unique tumor evolution patterns based on:
- Segmentation geometry (size, shape, contours)
- Cancer type and biological characteristics
- Aggressiveness level
- Medicine compatibility
- Tumor size and tissue structure
- Response trend and treatment response

Each patient produces a unique tumor with:
- Unique shape evolution
- Unique growth kinetics
- Unique recovery patterns
- Unique aggressiveness behavior
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

import hashlib
import math
import numpy as np
from config.medicine_database import get_medicine_profile


@dataclass(frozen=True)
class TumorBehaviorInput:
    """Input data for tumor behavior generation."""
    cancer_type: str
    aggressiveness: str  # "low", "moderate", "high"
    tumor_size: float  # mm
    medicine: str
    medicine_effectiveness: float  # 0-1
    tumor_geometry_hash: str  # Hash of tumor segmentation
    segmentation_confidence: float  # 0-100
    response_trend: float  # 0-100
    previous_growth_rate: Optional[float] = None
    tissue_density: Optional[float] = None  # 0-1, how dense tissue is


@dataclass(frozen=True)
class TumorBehaviorProfile:
    """Unique tumor behavior characteristics."""
    base_growth_rate: float
    morphology_complexity: float  # 0-1, how complex shape is
    deformation_tendency: float  # 0-1, how easily deforms
    invasion_style: str  # "nodular", "diffuse", "rim_enhancing", "infiltrative"
    hypoxia_pattern: str  # "central", "scattered", "peripheral", "minimal"
    necrosis_propensity: float  # 0-1, likelihood of necrosis
    response_sensitivity: float  # 0-1, how responsive to treatment
    shape_evolution_factor: float  # affects how shape changes
    size_evolution_factor: float  # affects how size changes
    pulsation_frequency: float  # Hz, for visualization
    pulsation_amplitude: float  # 0-1, magnitude of pulsation
    fragmentation_tendency: float  # 0-1, likelihood to fragment
    calcification_propensity: float  # 0-1, likelihood to calcify
    treatment_resistance_phenotype: str  # "responsive", "intermediate", "resistant"


class PatientSpecificTumorBehaviorEngine:
    """Generate unique tumor behaviors based on patient and tumor characteristics."""

    # Cancer type base growth rates (mm/month)
    _CANCER_BASE_GROWTH_RATES = {
        "GBM": 2.5,
        "GLIOMA": 1.8,
        "LUAD": 1.2,
        "LUNG": 1.2,
        "BRCA": 0.8,
        "BREAST": 0.8,
        "COREAD": 0.9,
        "COLORECTAL": 0.9,
        "KIRC": 1.0,
        "KIDNEY": 1.0,
        "PITUITARY": 0.3,
        "SKIN": 0.4,
        "MELANOMA": 1.5,
    }

    # Cancer type invasion styles
    _CANCER_INVASION_STYLES = {
        "GBM": "infiltrative",
        "GLIOMA": "infiltrative",
        "LUAD": "diffuse",
        "LUNG": "diffuse",
        "BRCA": "nodular",
        "BREAST": "nodular",
        "COREAD": "nodular",
        "COLORECTAL": "nodular",
        "KIRC": "rim_enhancing",
        "KIDNEY": "rim_enhancing",
        "PITUITARY": "nodular",
        "SKIN": "nodular",
        "MELANOMA": "diffuse",
    }

    # Cancer type hypoxia patterns
    _CANCER_HYPOXIA_PATTERNS = {
        "GBM": "central",
        "GLIOMA": "central",
        "LUAD": "scattered",
        "LUNG": "scattered",
        "BRCA": "central",
        "BREAST": "central",
        "COREAD": "central",
        "COLORECTAL": "central",
        "KIRC": "rim_enhancing",
        "KIDNEY": "rim_enhancing",
        "PITUITARY": "minimal",
        "SKIN": "minimal",
        "MELANOMA": "scattered",
    }

    # Cancer type necrosis propensities
    _CANCER_NECROSIS_PROPENSITIES = {
        "GBM": 0.85,
        "GLIOMA": 0.75,
        "LUAD": 0.45,
        "LUNG": 0.45,
        "BRCA": 0.35,
        "BREAST": 0.35,
        "COREAD": 0.40,
        "COLORECTAL": 0.40,
        "KIRC": 0.55,
        "KIDNEY": 0.55,
        "PITUITARY": 0.10,
        "SKIN": 0.15,
        "MELANOMA": 0.40,
    }

    @staticmethod
    def _pseudo_random(seed: int, scale: float = 1.0) -> float:
        """Generate deterministic pseudo-random value from seed."""
        # Use hash for more randomness than simple modulo
        h = int(hashlib.md5(str(seed).encode()).hexdigest(), 16)
        return (float(h % 1000) / 1000.0) * scale

    @staticmethod
    def _hash_to_float(hash_str: str, seed: int = 0) -> float:
        """Convert hash string to deterministic float."""
        combined = f"{hash_str}_{seed}"
        h = int(hashlib.md5(combined.encode()).hexdigest(), 16)
        return float(h % 1000) / 1000.0

    @staticmethod
    def _get_aggressiveness_multiplier(aggressiveness: str) -> float:
        """Get growth rate multiplier based on aggressiveness."""
        multipliers = {
            "low": 0.5,
            "moderate": 1.0,
            "high": 1.8,
        }
        return multipliers.get(aggressiveness, 1.0)

    @staticmethod
    def _get_size_complexity_factor(tumor_size: float) -> float:
        """Larger tumors have more complex morphology."""
        if tumor_size < 10:
            return 0.3  # Small, simple
        elif tumor_size < 20:
            return 0.5
        elif tumor_size < 40:
            return 0.7
        else:
            return 0.85  # Large, complex

    @staticmethod
    def _get_segmentation_morphology_factor(geometry_hash: str) -> float:
        """Derive morphology complexity from segmentation hash."""
        # Use hash to create deterministic morphology
        factor = PatientSpecificTumorBehaviorEngine._hash_to_float(geometry_hash, seed=1)
        # Boost factor slightly for visual variety
        return 0.3 + (factor * 0.6)

    @staticmethod
    def _get_response_sensitivity(
        medicine_effectiveness: float,
        segmentation_confidence: float,
        cancer_type: str,
    ) -> float:
        """Determine how responsive tumor is to treatment."""
        # Base sensitivity on medicine effectiveness
        med_factor = medicine_effectiveness
        
        # Segmentation confidence affects certainty of response
        conf_factor = segmentation_confidence / 100.0
        
        # Some cancers are inherently more responsive
        cancer_responsiveness = {
            "PITUITARY": 0.95,
            "MELANOMA": 0.88,
            "KIRC": 0.82,
            "LUAD": 0.80,
            "BRCA": 0.78,
            "COREAD": 0.75,
            "GBM": 0.60,
        }
        cancer_factor = cancer_responsiveness.get(cancer_type, 0.70)
        
        # Combine factors
        return min(0.95, med_factor * conf_factor * cancer_factor)

    @staticmethod
    def _get_treatment_resistance_phenotype(
        medicine_effectiveness: float,
        response_sensitivity: float,
        aggressiveness: str,
    ) -> str:
        """Determine treatment resistance phenotype."""
        combined_score = medicine_effectiveness * response_sensitivity
        
        if aggressiveness == "high" and combined_score < 0.50:
            return "resistant"
        elif combined_score < 0.40:
            return "resistant"
        elif combined_score < 0.65:
            return "intermediate"
        else:
            return "responsive"

    @staticmethod
    def generate_tumor_behavior(input_data: TumorBehaviorInput) -> TumorBehaviorProfile:
        """Generate unique tumor behavior profile."""
        
        # Calculate deterministic random seeds from inputs
        geometry_seed = int(hashlib.md5(input_data.tumor_geometry_hash.encode()).hexdigest()[:8], 16)
        cancer_seed = hash(input_data.cancer_type) % 100000
        medicine_seed = hash(input_data.medicine) % 100000
        
        # Base growth rate from cancer type
        base_growth = PatientSpecificTumorBehaviorEngine._CANCER_BASE_GROWTH_RATES.get(
            input_data.cancer_type, 1.0
        )
        
        # Modify by aggressiveness
        agg_mult = PatientSpecificTumorBehaviorEngine._get_aggressiveness_multiplier(
            input_data.aggressiveness
        )
        adjusted_growth = base_growth * agg_mult
        
        # Modify by medicine effectiveness (treatment reduces growth)
        treatment_reduction = 1.0 - (input_data.medicine_effectiveness * 0.8)
        final_growth_rate = adjusted_growth * treatment_reduction
        
        # Morphology complexity
        size_complexity = PatientSpecificTumorBehaviorEngine._get_size_complexity_factor(
            input_data.tumor_size
        )
        seg_morphology = PatientSpecificTumorBehaviorEngine._get_segmentation_morphology_factor(
            input_data.tumor_geometry_hash
        )
        morphology_complexity = (size_complexity + seg_morphology) / 2.0
        
        # Deformation tendency varies with size and tumor type
        deformation_base = 0.5
        size_factor = min(1.0, input_data.tumor_size / 50.0)  # Bigger tumors deform more
        deformation_tendency = min(0.95, deformation_base + (size_factor * 0.3))
        
        # Shape evolution factor - drives morphological changes
        shape_evolution = PatientSpecificTumorBehaviorEngine._hash_to_float(
            input_data.tumor_geometry_hash, seed=2
        )
        shape_evolution_factor = 0.4 + (shape_evolution * 0.5)
        
        # Size evolution factor - drives volumetric changes
        size_evolution = PatientSpecificTumorBehaviorEngine._hash_to_float(
            input_data.tumor_geometry_hash, seed=3
        )
        size_evolution_factor = 0.3 + (size_evolution * 0.7)
        
        # Pulsation characteristics (for visualization)
        # Higher aggressiveness = higher frequency
        agg_freq_map = {"low": 0.5, "moderate": 0.8, "high": 1.2}
        pulsation_freq = agg_freq_map.get(input_data.aggressiveness, 0.8)
        
        # Add variation based on medicine
        freq_var = PatientSpecificTumorBehaviorEngine._pseudo_random(medicine_seed, 0.3)
        pulsation_frequency = max(0.3, pulsation_freq + freq_var - 0.15)
        
        # Pulsation amplitude reflects treatment response
        response_sensitivity = PatientSpecificTumorBehaviorEngine._get_response_sensitivity(
            input_data.medicine_effectiveness,
            input_data.segmentation_confidence,
            input_data.cancer_type,
        )
        pulsation_amplitude = 1.0 - (response_sensitivity * 0.6)  # Good response = less pulsation
        
        # Fragmentation tendency - higher with treatment, lower with aggressiveness
        fragmentation_base = input_data.medicine_effectiveness * 0.7
        if input_data.aggressiveness == "high":
            fragmentation_base *= 0.6
        fragmentation_tendency = max(0.1, min(0.9, fragmentation_base))
        
        # Calcification propensity - varies by cancer type
        calc_base = PatientSpecificTumorBehaviorEngine._CANCER_NECROSIS_PROPENSITIES.get(
            input_data.cancer_type, 0.3
        )
        # Treatment increases calcification
        calc_tendency = min(0.9, calc_base * (1.0 + input_data.medicine_effectiveness * 0.5))
        
        # Cancer type characteristics
        invasion_style = PatientSpecificTumorBehaviorEngine._CANCER_INVASION_STYLES.get(
            input_data.cancer_type, "nodular"
        )
        hypoxia_pattern = PatientSpecificTumorBehaviorEngine._CANCER_HYPOXIA_PATTERNS.get(
            input_data.cancer_type, "scattered"
        )
        necrosis_propensity = PatientSpecificTumorBehaviorEngine._CANCER_NECROSIS_PROPENSITIES.get(
            input_data.cancer_type, 0.4
        )
        
        # Treatment resistance phenotype
        resistance_phenotype = PatientSpecificTumorBehaviorEngine._get_treatment_resistance_phenotype(
            input_data.medicine_effectiveness,
            response_sensitivity,
            input_data.aggressiveness,
        )
        
        return TumorBehaviorProfile(
            base_growth_rate=final_growth_rate,
            morphology_complexity=morphology_complexity,
            deformation_tendency=deformation_tendency,
            invasion_style=invasion_style,
            hypoxia_pattern=hypoxia_pattern,
            necrosis_propensity=necrosis_propensity,
            response_sensitivity=response_sensitivity,
            shape_evolution_factor=shape_evolution_factor,
            size_evolution_factor=size_evolution_factor,
            pulsation_frequency=pulsation_frequency,
            pulsation_amplitude=pulsation_amplitude,
            fragmentation_tendency=fragmentation_tendency,
            calcification_propensity=calc_tendency,
            treatment_resistance_phenotype=resistance_phenotype,
        )

    @staticmethod
    def get_behavior_description(profile: TumorBehaviorProfile) -> str:
        """Get human-readable description of tumor behavior."""
        descriptions = []
        
        # Growth rate description
        if profile.base_growth_rate < 0.2:
            descriptions.append("Slow growth pattern")
        elif profile.base_growth_rate < 0.8:
            descriptions.append("Moderate growth pattern")
        elif profile.base_growth_rate < 1.5:
            descriptions.append("Rapid growth pattern")
        else:
            descriptions.append("Very aggressive growth pattern")
        
        # Morphology description
        if profile.morphology_complexity < 0.4:
            descriptions.append("Simple, regular morphology")
        elif profile.morphology_complexity < 0.7:
            descriptions.append("Moderately complex morphology")
        else:
            descriptions.append("Highly complex, irregular morphology")
        
        # Invasion style description
        invasion_desc = {
            "nodular": "nodular growth pattern",
            "diffuse": "diffuse infiltration",
            "rim_enhancing": "rim-enhancing appearance",
            "infiltrative": "infiltrative margins",
        }
        descriptions.append(invasion_desc.get(profile.invasion_style, "characteristic morphology"))
        
        # Response description
        if profile.response_sensitivity > 0.8:
            descriptions.append("Highly responsive to treatment")
        elif profile.response_sensitivity > 0.6:
            descriptions.append("Moderately responsive to treatment")
        elif profile.response_sensitivity > 0.4:
            descriptions.append("Limited treatment responsiveness")
        else:
            descriptions.append("Poor treatment responsiveness")
        
        # Resistance phenotype
        phenotype_desc = {
            "responsive": "responsive phenotype",
            "intermediate": "intermediate resistance phenotype",
            "resistant": "treatment-resistant phenotype",
        }
        descriptions.append(phenotype_desc.get(profile.treatment_resistance_phenotype, "characteristic phenotype"))
        
        return " with ".join(descriptions)


# Singleton instance
patient_specific_tumor_engine = PatientSpecificTumorBehaviorEngine()
