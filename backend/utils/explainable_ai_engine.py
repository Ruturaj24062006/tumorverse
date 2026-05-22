"""Explainable AI reasoning engine for TumorVerse.

Provides natural language explanations for all AI medical decisions:
- Medicine recommendations
- Recovery predictions
- Aggressiveness changes
- Tumor evolution patterns
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

from config.medicine_database import (
    CANCER_RECOMMENDED,
    get_medicine_profile,
    is_medicine_recommended,
)


@dataclass(frozen=True)
class ExplanationInput:
    medicine: str
    cancer_type: str
    tumor_size: float
    aggressiveness: str  # "low", "moderate", "high"
    aggressiveness_value: float  # numeric value 0-100
    treatment_score: float
    effectiveness: float
    recovery_status: str
    segmentation_confidence: float
    response_trend: float
    previous_aggressiveness: Optional[float] = None
    medicine_category: Optional[str] = None


@dataclass(frozen=True)
class AIExplanation:
    medicine_recommendation: str
    recovery_prediction: str
    aggressiveness_analysis: str
    tumor_evolution_analysis: str
    risk_assessment: str
    key_factors: List[str]
    clinical_summary: str
    confidence_level: str


class ExplainableAIEngine:
    """Generate medically credible AI explanations for all system decisions."""

    _MEDICINE_CATEGORY_NAMES = {
        "dopamine_agonist": "dopamine agonist",
        "somatostatin_analog": "somatostatin analog",
        "alkylating_agent": "alkylating chemotherapy agent",
        "platinum_agent": "platinum-based chemotherapy",
        "taxane": "taxane-class chemotherapy",
        "checkpoint_inhibitor": "checkpoint inhibitor immunotherapy",
        "egfr_inhibitor": "EGFR-targeted therapy",
        "hormonal_agent": "hormonal therapy",
        "tyrosine_kinase_inhibitor": "tyrosine kinase inhibitor",
        "antimetabolite": "antimetabolite chemotherapy",
        "multikinase_inhibitor": "multikinase inhibitor",
        "mtor_inhibitor": "mTOR inhibitor",
        "androgen_receptor_inhibitor": "androgen receptor inhibitor",
        "androgen_synthesis_inhibitor": "androgen synthesis inhibitor",
        "braf_inhibitor": "BRAF inhibitor",
        "parp_inhibitor": "PARP inhibitor",
        "her2_targeted": "HER2-targeted therapy",
        "egfr_antibody": "EGFR-targeted antibody",
    }

    _EFFECTIVENESS_TIERS = {
        (0.85, 1.0): ("Excellent", "shows strong therapeutic potential"),
        (0.70, 0.84): ("Strong", "demonstrates good therapeutic activity"),
        (0.55, 0.69): ("Moderate", "provides some therapeutic benefit"),
        (0.40, 0.54): ("Limited", "provides minimal therapeutic activity"),
        (0.0, 0.39): ("Poor", "shows minimal or no therapeutic benefit"),
    }

    _RECOVERY_SPEED_EXPLANATIONS = {
        "very_fast": ("rapid", "The tumor is responding exceptionally well to treatment"),
        "fast": ("accelerated", "The tumor demonstrates strong treatment response"),
        "moderate": ("steady", "The tumor is responding at an expected rate"),
        "slow": ("gradual", "The tumor is responding slowly to treatment"),
        "very_slow": ("minimal", "The tumor shows minimal response to treatment"),
    }

    _AGGRESSIVENESS_CHANGE_PATTERNS = {
        "decreasing_rapidly": "Tumor aggressiveness is declining sharply, indicating effective treatment response.",
        "decreasing": "Tumor aggressiveness is declining as expected with treatment.",
        "stable": "Tumor aggressiveness remains stable, suggesting treatment equilibrium.",
        "increasing": "Tumor aggressiveness is increasing despite treatment.",
        "increasing_rapidly": "Tumor aggressiveness is escalating rapidly, suggesting treatment resistance.",
    }

    _TUMOR_EVOLUTION_PATTERNS = {
        "shrinking": "The tumor is progressively shrinking in volume and showing signs of necrosis.",
        "stabilized": "The tumor size has stabilized and is not progressing.",
        "minimal_growth": "The tumor is growing minimally and remains under control.",
        "moderate_growth": "The tumor is growing at a moderate rate despite treatment.",
        "aggressive_growth": "The tumor is growing aggressively and may be treatment-resistant.",
        "fragmenting": "The tumor is fragmenting into smaller nodules with reduced overall burden.",
        "calcifying": "The tumor is beginning to calcify, indicating necrotic response.",
    }

    @staticmethod
    def _get_medicine_category_name(medicine: str) -> str:
        """Get the human-readable category name for a medicine."""
        profile = get_medicine_profile(medicine)
        if profile and profile.get("category"):
            return ExplainableAIEngine._MEDICINE_CATEGORY_NAMES.get(
                profile["category"], profile["category"]
            )
        return medicine

    @staticmethod
    def _get_effectiveness_description(effectiveness: float) -> Tuple[str, str]:
        """Get tier and description for effectiveness score."""
        for (lower, upper), (tier, desc) in ExplainableAIEngine._EFFECTIVENESS_TIERS.items():
            if lower <= effectiveness <= upper:
                return tier, desc
        return "Unknown", "Unable to assess effectiveness"

    @staticmethod
    def _get_cancer_mechanism(cancer_type: str, medicine: str) -> str:
        """Get mechanism-of-action explanation for cancer-medicine pair."""
        mechanisms = {
            ("PITUITARY", "cabergoline"): "Cabergoline is a dopamine agonist that directly inhibits prolactin secretion in pituitary adenomas, effectively shrinking hormone-secreting tumors.",
            ("PITUITARY", "octreotide"): "Octreotide is a somatostatin analog that suppresses growth hormone and hormone secretion in pituitary adenomas.",
            ("GBM", "temozolomide"): "Temozolomide crosses the blood-brain barrier and alkylates tumor DNA, inducing apoptosis in glioblastoma cells.",
            ("GBM", "cabergoline"): "Cabergoline shows indirect benefit in GBM through dopaminergic pathway modulation.",
            ("LUAD", "docetaxel"): "Docetaxel stabilizes microtubules, preventing mitotic progression and inducing apoptosis in lung adenocarcinoma cells.",
            ("LUAD", "pembrolizumab"): "Pembrolizumab blocks PD-1 checkpoint, enabling CD8+ T cells to recognize and destroy LUAD tumor cells.",
            ("LUAD", "gefitinib"): "Gefitinib inhibits EGFR tyrosine kinase, targeting activating mutations in LUAD.",
            ("BRCA", "tamoxifen"): "Tamoxifen blocks estrogen receptors on breast cancer cells, preventing hormone-driven proliferation.",
            ("BRCA", "docetaxel"): "Docetaxel disrupts microtubule dynamics, triggering apoptosis in breast cancer cells.",
            ("COREAD", "cisplatin"): "Cisplatin creates DNA interstrand crosslinks in colorectal cancer cells, inducing cell death.",
            ("COREAD", "oxaliplatin"): "Oxaliplatin forms DNA adducts through unique mechanisms, effective in platinum-sensitive colorectal tumors.",
            ("KIRC", "nivolumab"): "Nivolumab blocks PD-1, unleashing immune-mediated destruction of kidney cancer cells.",
            ("MELANOMA", "ipilimumab"): "Ipilimumab blocks CTLA-4, amplifying T-cell response against melanoma-associated antigens.",
        }
        
        key = (cancer_type, medicine)
        if key in mechanisms:
            return mechanisms[key]
        
        return f"{medicine.capitalize()} demonstrates therapeutic activity against {cancer_type} through validated molecular mechanisms."

    @staticmethod
    def _get_compatibility_reasons(cancer_type: str, medicine: str, confidence: float) -> List[str]:
        """Get reasons for medicine compatibility with cancer type."""
        reasons = []
        
        if confidence >= 0.85:
            reasons.append(f"Exceptionally high compatibility score ({confidence:.1%}) with {cancer_type}")
            reasons.append("Established clinical efficacy in this cancer type")
            reasons.append("Strong molecular mechanism match to tumor biology")
        elif confidence >= 0.70:
            reasons.append(f"Strong compatibility ({confidence:.1%}) with {cancer_type}")
            reasons.append("Proven therapeutic activity in peer-reviewed studies")
            reasons.append("Good alignment with known tumor vulnerabilities")
        elif confidence >= 0.55:
            reasons.append(f"Moderate compatibility ({confidence:.1%}) with {cancer_type}")
            reasons.append("Some clinical precedent for this indication")
            reasons.append("Reasonable mechanism-of-action match")
        elif confidence >= 0.40:
            reasons.append(f"Limited compatibility ({confidence:.1%}) with {cancer_type}")
            reasons.append("Few documented successes in this cancer type")
            reasons.append("Mechanism alignment is weak")
        else:
            reasons.append(f"Poor compatibility ({confidence:.1%}) with {cancer_type}")
            reasons.append("Minimal clinical precedent for this indication")
            reasons.append("Weak or absent mechanism-of-action alignment")
        
        return reasons

    @staticmethod
    def _get_size_impact_explanation(tumor_size: float) -> str:
        """Explain impact of tumor size on treatment response."""
        if tumor_size < 10:
            return "The small tumor burden (< 1 cm) provides favorable conditions for effective medical therapy."
        elif tumor_size < 30:
            return "The moderate tumor size (1-3 cm) allows for reasonable treatment penetration and response."
        elif tumor_size < 60:
            return "The large tumor burden (3-6 cm) may reduce medicine penetration and slow response kinetics."
        else:
            return "The very large tumor (> 6 cm) presents significant treatment challenges due to poor drug penetration and hypoxic core regions."

    @staticmethod
    def _get_aggressiveness_impact(aggressiveness: str) -> str:
        """Explain impact of tumor aggressiveness on outcomes."""
        impacts = {
            "low": "Low tumor aggressiveness predicts favorable treatment response and longer disease-free survival.",
            "moderate": "Moderate aggressiveness suggests intermediate response rates and intermediate survival expectations.",
            "high": "High tumor aggressiveness indicates aggressive biology, faster progression, and greater treatment resistance.",
        }
        return impacts.get(aggressiveness, "Aggressiveness level affects treatment kinetics.")

    @staticmethod
    def _get_recovery_reason(recovery_status: str, effectiveness: float, treatment_score: float) -> str:
        """Explain the basis for recovery prediction."""
        if treatment_score >= 85:
            return "The excellent treatment score suggests rapid tumor regression and excellent prognosis."
        elif treatment_score >= 70:
            return "The strong treatment score indicates responsive disease with favorable recovery trajectory."
        elif treatment_score >= 55:
            return "The moderate treatment score suggests slow but steady tumor response."
        elif treatment_score >= 40:
            return "The limited treatment score indicates minimal tumor response despite therapy."
        else:
            return "The poor treatment score suggests disease progression despite medical intervention."

    @staticmethod
    def _get_resistance_indicators(
        effectiveness: float,
        treatment_score: float,
        response_trend: float,
    ) -> List[str]:
        """Identify potential treatment resistance indicators."""
        indicators = []
        
        if treatment_score < 40:
            indicators.append("Inadequate treatment response despite therapy")
        
        if effectiveness < 0.40:
            indicators.append("Poor medicine-tumor compatibility")
        
        if response_trend < 30:
            indicators.append("Minimal disease response to treatment")
        
        if treatment_score < 40 and effectiveness < 0.40:
            indicators.append("High likelihood of primary treatment resistance")
        
        return indicators if indicators else ["No significant resistance indicators"]

    @staticmethod
    def generate_medicine_recommendation_explanation(
        medicine: str,
        cancer_type: str,
        confidence: float,
        is_recommended: bool,
        effectiveness: float,
    ) -> str:
        """Generate explanation for medicine recommendation."""
        if not is_recommended:
            return f"{medicine} is not recommended for {cancer_type} (confidence: {confidence:.1%}). This medicine demonstrates poor compatibility with the tumor biology and lacks clinical precedent for this indication."
        
        category = ExplainableAIEngine._get_medicine_category_name(medicine)
        mechanism = ExplainableAIEngine._get_cancer_mechanism(cancer_type, medicine)
        tier, desc = ExplainableAIEngine._get_effectiveness_description(effectiveness)
        
        return (
            f"{medicine} is strongly recommended for {cancer_type} with {confidence:.1%} confidence. "
            f"This {category} {desc}. "
            f"Mechanism: {mechanism} "
            f"Predicted effectiveness: {tier} ({effectiveness:.1%})."
        )

    @staticmethod
    def generate_recovery_explanation(
        medicine: str,
        recovery_status: str,
        recovery_speed: str,
        treatment_score: float,
        tumor_size: float,
        aggressiveness: str,
    ) -> str:
        """Generate explanation for recovery prediction."""
        speed_adj, speed_desc = ExplainableAIEngine._RECOVERY_SPEED_EXPLANATIONS.get(
            recovery_speed, ("moderate", "Recovery is progressing at expected rate")
        )
        
        size_impact = ExplainableAIEngine._get_size_impact_explanation(tumor_size)
        agg_impact = ExplainableAIEngine._get_aggressiveness_impact(aggressiveness)
        recovery_reason = ExplainableAIEngine._get_recovery_reason(recovery_status, 0, treatment_score)
        
        return (
            f"Recovery Status: {recovery_status}. "
            f"Recovery trajectory: {speed_desc} ({speed_adj}). "
            f"Treatment score: {treatment_score:.1f}/100. "
            f"{size_impact} "
            f"{agg_impact} "
            f"Overall: {recovery_reason}"
        )

    @staticmethod
    def generate_aggressiveness_explanation(
        current_aggressiveness: float,
        previous_aggressiveness: Optional[float],
        change_pattern: str,
        effectiveness: float,
        treatment_score: float,
    ) -> str:
        """Generate explanation for aggressiveness changes."""
        pattern_desc = ExplainableAIEngine._AGGRESSIVENESS_CHANGE_PATTERNS.get(
            change_pattern, "Tumor aggressiveness is changing."
        )
        
        if previous_aggressiveness is not None:
            diff = current_aggressiveness - previous_aggressiveness
            if abs(diff) < 2:
                change_note = "aggressiveness remains relatively stable"
            elif diff < 0:
                change_note = f"aggressiveness has decreased by {abs(diff):.1f}%"
            else:
                change_note = f"aggressiveness has increased by {diff:.1f}%"
        else:
            change_note = "aggressiveness measurements are being established"
        
        if effectiveness > 0.70:
            response = "The tumor is responding well to treatment, which explains the favorable aggressiveness trend."
        elif effectiveness > 0.40:
            response = "The tumor shows partial response to treatment, with gradual aggressiveness reduction."
        else:
            response = "The tumor is resistant to treatment, and aggressiveness is concerning."
        
        return (
            f"{pattern_desc} Currently {change_note}. "
            f"{response} "
            f"Treatment score: {treatment_score:.1f}/100."
        )

    @staticmethod
    def generate_evolution_explanation(
        evolution_pattern: str,
        tumor_size: float,
        aggressiveness: str,
        treatment_score: float,
        effectiveness: float,
    ) -> str:
        """Generate explanation for tumor evolution pattern."""
        pattern_desc = ExplainableAIEngine._TUMOR_EVOLUTION_PATTERNS.get(
            evolution_pattern, "Tumor is evolving."
        )
        
        size_context = (
            f"Current tumor size: {tumor_size:.1f}mm. "
            if tumor_size > 0 else ""
        )
        
        if treatment_score >= 85:
            prognosis = "This excellent response suggests sustained tumor control and favorable long-term outcomes."
        elif treatment_score >= 70:
            prognosis = "This response pattern indicates the tumor remains manageable with current treatment."
        elif treatment_score >= 55:
            prognosis = "This slow response suggests the tumor requires careful monitoring."
        elif treatment_score >= 40:
            prognosis = "This limited response indicates potential need for treatment modification."
        else:
            prognosis = "This poor response suggests the tumor is progressing despite intervention."
        
        return (
            f"{pattern_desc} "
            f"{size_context}"
            f"Tumor aggressiveness: {aggressiveness}. "
            f"{prognosis}"
        )

    @staticmethod
    def generate_full_explanation(input_data: ExplanationInput) -> AIExplanation:
        """Generate comprehensive AI explanation for all medical decisions."""
        
        # Generate component explanations
        medicine_rec = ExplainableAIEngine.generate_medicine_recommendation_explanation(
            input_data.medicine,
            input_data.cancer_type,
            input_data.effectiveness,  # Using effectiveness as confidence proxy
            is_medicine_recommended(input_data.medicine, input_data.cancer_type),
            input_data.effectiveness,
        )
        
        recovery_speed_map = {
            0.85: "very_fast", 0.70: "fast", 0.55: "moderate", 0.40: "slow"
        }
        recovery_speed = "very_slow"
        for threshold, speed in sorted(recovery_speed_map.items(), reverse=True):
            if input_data.treatment_score >= threshold:
                recovery_speed = speed
                break
        
        recovery_pred = ExplainableAIEngine.generate_recovery_explanation(
            input_data.medicine,
            input_data.recovery_status,
            recovery_speed,
            input_data.treatment_score,
            input_data.tumor_size,
            input_data.aggressiveness,
        )
        
        # Determine aggressiveness change pattern
        if input_data.previous_aggressiveness is not None:
            diff = input_data.aggressiveness_value - input_data.previous_aggressiveness
            if diff < -10:
                pattern = "decreasing_rapidly"
            elif diff < -2:
                pattern = "decreasing"
            elif diff <= 2:
                pattern = "stable"
            elif diff < 10:
                pattern = "increasing"
            else:
                pattern = "increasing_rapidly"
        else:
            pattern = "stable"
        
        agg_analysis = ExplainableAIEngine.generate_aggressiveness_explanation(
            input_data.aggressiveness_value,
            input_data.previous_aggressiveness,
            pattern,
            input_data.effectiveness,
            input_data.treatment_score,
        )
        
        # Determine evolution pattern
        if input_data.treatment_score >= 85:
            if input_data.tumor_size < 10:
                evo_pattern = "fragmenting"
            else:
                evo_pattern = "shrinking"
        elif input_data.treatment_score >= 70:
            evo_pattern = "stabilized" if input_data.tumor_size < 30 else "minimal_growth"
        elif input_data.treatment_score >= 55:
            evo_pattern = "minimal_growth"
        elif input_data.treatment_score >= 40:
            evo_pattern = "moderate_growth"
        else:
            evo_pattern = "aggressive_growth"
        
        evo_analysis = ExplainableAIEngine.generate_evolution_explanation(
            evo_pattern,
            input_data.tumor_size,
            input_data.aggressiveness,
            input_data.treatment_score,
            input_data.effectiveness,
        )
        
        # Risk assessment
        resistance_indicators = ExplainableAIEngine._get_resistance_indicators(
            input_data.effectiveness,
            input_data.treatment_score,
            input_data.response_trend,
        )
        risk_text = (
            "Treatment resistance risk: " + ", ".join(resistance_indicators)
            if resistance_indicators != ["No significant resistance indicators"]
            else "No significant treatment resistance indicators detected."
        )
        
        # Key factors
        key_factors = [
            f"Medicine: {input_data.medicine}",
            f"Cancer type: {input_data.cancer_type}",
            f"Tumor size: {input_data.tumor_size:.1f}mm",
            f"Aggressiveness: {input_data.aggressiveness}",
            f"Treatment score: {input_data.treatment_score:.1f}/100",
            f"Effectiveness: {input_data.effectiveness:.1%}",
            f"Segmentation confidence: {input_data.segmentation_confidence:.1f}%",
        ]
        
        # Clinical summary
        clinical_summary = (
            f"Patient with {input_data.cancer_type} tumor (size: {input_data.tumor_size:.1f}mm, aggressiveness: {input_data.aggressiveness}) "
            f"being treated with {input_data.medicine}. "
            f"Treatment score: {input_data.treatment_score:.1f}/100 indicates {input_data.recovery_status.lower()}. "
            f"Current trajectory: {evo_pattern}."
        )
        
        # Determine confidence level
        if input_data.treatment_score >= 85:
            confidence_level = "Very High"
        elif input_data.treatment_score >= 70:
            confidence_level = "High"
        elif input_data.treatment_score >= 55:
            confidence_level = "Moderate"
        elif input_data.treatment_score >= 40:
            confidence_level = "Low"
        else:
            confidence_level = "Very Low"
        
        return AIExplanation(
            medicine_recommendation=medicine_rec,
            recovery_prediction=recovery_pred,
            aggressiveness_analysis=agg_analysis,
            tumor_evolution_analysis=evo_analysis,
            risk_assessment=risk_text,
            key_factors=key_factors,
            clinical_summary=clinical_summary,
            confidence_level=confidence_level,
        )


# Singleton instance
explainable_ai_engine = ExplainableAIEngine()
