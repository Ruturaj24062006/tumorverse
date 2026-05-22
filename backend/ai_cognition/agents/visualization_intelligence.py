from typing import Dict, Any
from ..base_agent import BaseAgent


class VisualizationIntelligenceAgent(BaseAgent):
    """Agent that translates clinical metrics into direct rendering/shader parameters for the 3D digital twin."""

    name = "visualization_intelligence"
    description = "Synchronizes clinical metrics with Three.js biological shaders and cinematic rendering properties"

    def analyze(self, context: Dict[str, Any]) -> Dict[str, Any]:
        treatment_score = float(context.get("treatment_score", 50.0))
        effectiveness = float(context.get("effectiveness", 0.5))
        aggressiveness_str = context.get("aggressiveness", "moderate")
        instability = float(context.get("instability", 0.5))
        
        # Color mapping (GBM gets aggressive red-purple, Pituitary gets mild cyan)
        color_hex = "#00E5FF" # Cyan standard
        if aggressiveness_str == "high":
            color_hex = "#FF3B5C" # Aggressive neon red
        elif aggressiveness_str == "moderate":
            color_hex = "#8A2BE2" # Vibrant purple
        else:
            color_hex = "#00FF9C" # Green stable
            
        # Shader values
        glow_intensity = min(1.0, (treatment_score / 100.0) * 1.2)
        roughness = max(0.1, min(0.9, 0.8 - (effectiveness * 0.4)))
        metallic = max(0.0, min(1.0, (instability * 0.7)))
        
        # Deformation
        deformation_intensity = max(0.05, min(0.9, 0.15 + (instability * 0.45) - (effectiveness * 0.2)))
        deformation_frequency = max(0.1, min(3.0, 1.0 + (instability * 1.5)))
        
        # Pulsation
        pulsation_speed = max(0.2, min(2.5, 0.8 + (instability * 1.2)))
        pulsation_amplitude = max(0.05, min(0.8, 0.2 + (instability * 0.4)))
        
        # Tissue interior visibility
        hypoxia_visibility = max(0.0, min(1.0, 0.2 + (instability * 0.6)))
        necrosis_visibility = max(0.0, min(1.0, 0.8 - (effectiveness * 0.5)))
        
        summary = {
            "glow_color": color_hex,
            "glow_intensity": round(float(glow_intensity), 4),
            "roughness": round(float(roughness), 4),
            "metallic": round(float(metallic), 4),
            "deformation_intensity": round(float(deformation_intensity), 4),
            "deformation_frequency": round(float(deformation_frequency), 4),
            "pulsation_speed": round(float(pulsation_speed), 4),
            "pulsation_amplitude": round(float(pulsation_amplitude), 4),
            "tissue_density": round(float(0.8 - (effectiveness * 0.3)), 4),
            "hypoxia_visibility": round(float(hypoxia_visibility), 4),
            "necrosis_visibility": round(float(necrosis_visibility), 4),
            "mesh_opacity": round(float(0.85 - (effectiveness * 0.2)), 4),
            "shader_noise_level": round(float(0.1 + (instability * 0.5)), 4),
            "animation_intensity": round(float(0.3 + (instability * 0.7)), 4)
        }
        
        return {
            "summary": summary,
            "raw": {
                "spgr_inspired_lighting": True,
                "camera_cinematic_zoom": 1.2
            }
        }
