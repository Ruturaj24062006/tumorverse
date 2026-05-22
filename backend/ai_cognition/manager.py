from typing import Dict, Any, List
import concurrent.futures
from datetime import datetime
from .base_agent import BaseAgent

# Import the 5-agent reasoning group
from .agents.tumor_analysis import TumorAnalysisAgent
from .agents.treatment_intelligence import TreatmentIntelligenceAgent
from .agents.recovery_prediction import RecoveryPredictionAgent
from .agents.clinical_explanation import ClinicalExplanationAgent
from .agents.visualization_intelligence import VisualizationIntelligenceAgent


class CognitionManager:
    """Superintelligent clinical cognition manager that orchestrates registered agents.

    Executes all agents concurrently to form a multi-agent consensus regarding
    tumor evolution, treatment compatibility, and volumetric staging.
    """

    def __init__(self):
        self._agents: List[BaseAgent] = []
        # Auto-register the 5 core agents for the TumorVerse Medical OS
        self.register(TumorAnalysisAgent())
        self.register(TreatmentIntelligenceAgent())
        self.register(RecoveryPredictionAgent())
        self.register(ClinicalExplanationAgent())
        self.register(VisualizationIntelligenceAgent())

    def register(self, agent: BaseAgent):
        # Prevent duplicate registration of the same agent class
        if not any(isinstance(a, agent.__class__) for a in self._agents):
            self._agents.append(agent)

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Runs all registered agents concurrently and computes consensus metrics."""
        outputs = {}
        summary = {}

        # Run agents concurrently using a ThreadPoolExecutor
        with concurrent.futures.ThreadPoolExecutor(max_workers=len(self._agents)) as executor:
            # Map agents to futures
            future_to_agent = {
                executor.submit(agent.analyze, context): agent
                for agent in self._agents
            }
            
            for future in concurrent.futures.as_completed(future_to_agent):
                agent = future_to_agent[future]
                agent_name = agent.__class__.__name__
                try:
                    out = future.result()
                except Exception as e:
                    out = {
                        "error": str(e),
                        "summary": {
                            "error": f"Failed in execution: {str(e)}"
                        }
                    }
                outputs[agent_name] = out
                if isinstance(out, dict) and "summary" in out:
                    summary[agent_name] = out.get("summary")

        # Build the Superintelligent Clinical Consensus Layer
        consensus = self._compute_consensus(context, summary)

        return {
            "outputs": outputs,
            "summary": summary,
            "consensus": consensus
        }

    def _compute_consensus(self, context: Dict[str, Any], summary: Dict[str, Any]) -> Dict[str, Any]:
        """Aggregates individual agent findings to generate a single clinical consensus report."""
        # 1. Extraction of agent summaries
        tumor_sum = summary.get("TumorAnalysisAgent", {})
        treatment_sum = summary.get("TreatmentIntelligenceAgent", {})
        recovery_sum = summary.get("RecoveryPredictionAgent", {})
        explain_sum = summary.get("ClinicalExplanationAgent", {})
        visual_sum = summary.get("VisualizationIntelligenceAgent", {})

        # 2. Reconcile primary metrics
        aggressiveness = tumor_sum.get("aggressiveness", context.get("aggressiveness", 0.5))
        treatment_score = treatment_sum.get("treatment_score", context.get("treatment_score", 50.0))
        effectiveness = treatment_sum.get("effectiveness_estimate", context.get("effectiveness", 0.5))
        relapse_risk = recovery_sum.get("relapse_probability", 0.5)
        resistance_risk = recovery_sum.get("resistance_estimation", 0.5)
        stabilization_months = recovery_sum.get("months_to_stabilization", 6.0)

        # Average confidence levels
        conf_explain_raw = explain_sum.get("confidence_level", 0.75)
        if isinstance(conf_explain_raw, str):
            mapping = {
                "Very High": 0.95,
                "High": 0.80,
                "Moderate": 0.60,
                "Low": 0.40,
                "Very Low": 0.20
            }
            conf_explain = mapping.get(conf_explain_raw, 0.75)
        else:
            conf_explain = conf_explain_raw

        conf_recovery = recovery_sum.get("stabilization_confidence", 0.75)
        overall_confidence = (conf_explain + conf_recovery + effectiveness) / 3.0

        # Determine clinical consensus agreement status
        agreement_status = "High Consensus (Favorable)"
        if relapse_risk > 0.65 or resistance_risk > 0.65:
            agreement_status = "High Consensus (High Risk / Resistant)"
        elif overall_confidence < 0.55:
            agreement_status = "Low Consensus (Uncertain / Adaptive Path Needed)"
        elif effectiveness < 0.45:
            agreement_status = "Moderate Consensus (Sub-optimal Treatment)"

        # 3. Compile timeline staging projections (from recovery agent)
        timeline_projections = recovery_sum.get("stage_timeline_projections", [])

        # 4. Assemble clinical narrative summary
        primary_recommendation = explain_sum.get("medicine_recommendation", "Consider standard clinical protocol.")
        clinical_narrative = explain_sum.get("clinical_summary", "Consensus pending multi-agent calculation.")

        return {
            "status": agreement_status,
            "confidence": round(float(overall_confidence), 4),
            "treatment_score": round(float(treatment_score), 2),
            "effectiveness": round(float(effectiveness), 4),
            "aggressiveness": round(float(aggressiveness), 4),
            "relapse_risk": round(float(relapse_risk), 4),
            "resistance_risk": round(float(resistance_risk), 4),
            "months_to_stabilization": round(float(stabilization_months), 2),
            "recommended_strategy": treatment_sum.get("recommended_strategy", "Monotherapy"),
            "alternative_options": treatment_sum.get("alternative_options", []),
            "rendering_parameters": visual_sum,
            "timeline_projections": timeline_projections,
            "primary_recommendation": primary_recommendation,
            "clinical_narrative": clinical_narrative,
            "patient_friendly_narrative": explain_sum.get("patient_friendly_summary", ""),
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

