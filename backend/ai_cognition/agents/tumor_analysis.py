from typing import Dict, Any
from ..base_agent import BaseAgent

try:
    from backend.tumor_evolution_engine import TumorEvolutionEngine
except Exception:
    TumorEvolutionEngine = None


class TumorAnalysisAgent(BaseAgent):
    """Agent that analyzes tumor geometry and derives aggressiveness and instability.

    This agent uses available tumor engines when present, and falls back to
    lightweight heuristics otherwise.
    """

    name = "tumor_analysis"
    description = "Analyzes tumor mesh and returns clinical features"

    def analyze(self, context: Dict[str, Any]) -> Dict[str, Any]:
        mesh = context.get("mesh") or {}
        vertices = mesh.get("vertices", [])
        faces = mesh.get("faces", [])

        # Basic geometry checks
        num_vertices = len(vertices)
        num_faces = len(faces)

        # Heuristic tumor size estimate (voxel-free): use vertex spread
        size_estimate = None
        aggressiveness = 0.5
        instability = 0.5

        if num_vertices and num_faces and TumorEvolutionEngine is not None:
            try:
                engine = TumorEvolutionEngine(vertices, faces)
                # Use engine heuristics to compute aggressiveness
                aggressiveness = engine.calculate_aggressiveness(
                    treatment_score=context.get("treatment_score", 50.0),
                    effectiveness=context.get("effectiveness", 0.5),
                    recovery_progress=context.get("recovery_progress", 0.0),
                    tumor_size=context.get("tumor_size", 0.0),
                    response_trend=context.get("response_trend", 0.0),
                )
                # Use instability estimate from engine.generate_tumor_state
                state = engine.generate_tumor_state(
                    treatment_score=context.get("treatment_score", 50.0),
                    effectiveness=context.get("effectiveness", 0.5),
                    recovery_progress=context.get("recovery_progress", 0.0),
                    aggressiveness=aggressiveness,
                    tumor_size=context.get("tumor_size", 0.0),
                    day=0.0,
                    total_days=90.0,
                )
                instability = float(state.get("instability", instability))
                size_estimate = float(state.get("growth_rate", 0.0))
            except Exception:
                # fallback heuristics
                aggressiveness = 0.6
                instability = 0.6
        else:
            # Fallback when mesh is missing: use metadata
            size_estimate = context.get("tumor_size")
            aggressiveness = float(context.get("base_aggressiveness", 0.5))
            instability = 0.5 + 0.4 * (1.0 - float(context.get("effectiveness", 0.5)))

        summary = {
            "num_vertices": num_vertices,
            "num_faces": num_faces,
            "size_estimate": size_estimate,
            "aggressiveness": float(aggressiveness),
            "instability": float(instability),
        }

        return {"summary": summary, "raw": {"mesh_present": bool(vertices)}}
