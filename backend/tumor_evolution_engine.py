"""
Advanced Tumor Evolution Engine
Simulates realistic tumor growth/shrinkage based on treatment effectiveness
"""

import numpy as np
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, asdict
import json

from utils.treatment_intelligence_engine import treatment_intelligence_engine


@dataclass
class EvolutionFrame:
    """Represents a single frame of tumor evolution"""
    
    timestamp: float  # Days
    vertices: List[List[float]]  # 3D vertex positions
    densityMap: List[float]  # Density at each vertex
    opacityMap: List[float]  # Opacity/alpha at each vertex
    tissueRegions: List[float]  # Tissue type at each vertex
    aggressiveness: float  # Current aggressiveness (0-1)
    volume_change: float  # Percentage change from baseline
    status: str  # "shrinking", "growing", "stable"
    tumor_state: str
    deformation_strength: float
    growth_rate: float
    pulse_strength: float
    instability: float


@dataclass
class EvolutionResult:
    """Complete evolution simulation result"""
    
    frames: List[Dict]  # Serialized evolution frames
    timeline_days: List[float]  # Timeline in days
    status_progression: List[str]  # Status at each frame
    volume_progression: List[float]  # Volume change at each frame
    medicine_response_score: float  # 0-1, how well tumor responded
    final_aggressiveness: float  # Final aggressiveness score


class TumorEvolutionEngine:
    """
    Generates realistic tumor evolution sequences based on:
    - Time progression
    - Medicine effectiveness
    - Tumor aggressiveness
    - Regional variation
    """
    
    def __init__(self, base_vertices: np.ndarray, base_faces: np.ndarray, 
                 patient_seed: int = 0):
        """
        Initialize evolution engine
        
        Args:
            base_vertices: Initial tumor mesh vertices (Nx3)
            base_faces: Mesh faces (Mx3)
            patient_seed: Random seed for reproducibility
        """
        self.base_vertices = np.array(base_vertices)
        self.base_faces = np.array(base_faces)
        self.patient_seed = patient_seed
        self.rng = np.random.RandomState(patient_seed)
        
        # Calculate vertex neighborhoods for smooth deformation
        self._compute_vertex_neighborhoods()
        
        # Calculate radial distances from center for region-based evolution
        self.radii = np.linalg.norm(self.base_vertices, axis=1)
        self.max_radius = np.max(self.radii)
        
    def _compute_vertex_neighborhoods(self):
        """Compute neighborhood info for each vertex for smooth deformation"""
        num_vertices = len(self.base_vertices)
        self.vertex_neighbors = [[] for _ in range(num_vertices)]
        self.vertex_distances = [[] for _ in range(num_vertices)]
        
        # Build neighbor list from faces
        for face in self.base_faces:
            v1, v2, v3 = face
            for v_a, v_b in [(v1, v2), (v2, v3), (v3, v1)]:
                if v_b not in self.vertex_neighbors[v_a]:
                    self.vertex_neighbors[v_a].append(v_b)
                if v_a not in self.vertex_neighbors[v_b]:
                    self.vertex_neighbors[v_b].append(v_a)
        
        # Calculate neighbor distances
        for v in range(num_vertices):
            for neighbor in self.vertex_neighbors[v]:
                dist = np.linalg.norm(
                    self.base_vertices[v] - self.base_vertices[neighbor]
                )
                self.vertex_distances[v].append(dist)
    
    def _perlin_noise_3d(self, x: float, y: float, z: float, 
                         scale: float = 1.0) -> float:
        """Simplified 3D Perlin-like noise"""
        # Use numpy's simple hash-based noise approximation
        coords = np.array([x * scale, y * scale, z * scale])
        
        # Simple hash function
        hash_val = (
            np.sin(np.dot(coords, [12.9898, 78.233, 45.164])) * 43758.5453
        )
        return hash_val - np.floor(hash_val)
    
    def _fbm_noise(self, position: np.ndarray, time: float, 
                   scale: float = 1.0, octaves: int = 4) -> float:
        """Fractional Brownian Motion noise for organic deformation"""
        value = 0.0
        amplitude = 1.0
        frequency = 1.0
        max_value = 0.0
        
        # Add time variation
        time_offset = time * 0.5
        
        for _ in range(octaves):
            sample = self._perlin_noise_3d(
                position[0] * frequency + time_offset,
                position[1] * frequency,
                position[2] * frequency,
                scale=scale
            )
            value += sample * amplitude
            max_value += amplitude
            amplitude *= 0.5
            frequency *= 2.0
        
        return value / max_value if max_value > 0 else 0.0

    @staticmethod
    def _normalize_effectiveness(value: float) -> float:
        numeric = float(value)
        if numeric > 1.0:
            numeric /= 100.0
        return max(0.0, min(1.0, numeric))

    def calculate_aggressiveness(
        self,
        treatment_score: float,
        effectiveness: float,
        recovery_progress: float = 0.0,
        tumor_size: float = 0.0,
        response_trend: float = 0.0,
    ) -> float:
        score_ratio = max(0.0, min(1.0, float(treatment_score) / 100.0))
        effectiveness_ratio = self._normalize_effectiveness(effectiveness)
        recovery_ratio = max(0.0, min(1.0, float(recovery_progress) / 100.0))
        size_ratio = min(1.0, math.log1p(max(0.0, float(tumor_size))) / math.log1p(140.0))
        response_ratio = max(0.0, min(1.0, float(response_trend)))
        aggressiveness = (
            0.72
            - 0.34 * score_ratio
            - 0.24 * effectiveness_ratio
            - 0.10 * recovery_ratio
            + 0.22 * (1.0 - response_ratio)
            + 0.18 * size_ratio
        )
        return float(np.clip(aggressiveness, 0.05, 1.0))

    def generate_tumor_state(
        self,
        treatment_score: float,
        effectiveness: float,
        recovery_progress: float,
        aggressiveness: float,
        tumor_size: float,
        day: float,
        total_days: float,
        medicine_type: str = "standard",
        cancer_type: str = "UNKNOWN",
    ) -> Dict[str, float | str]:
        score_ratio = max(0.0, min(1.0, float(treatment_score) / 100.0))
        effectiveness_ratio = self._normalize_effectiveness(effectiveness)
        recovery_ratio = max(0.0, min(1.0, float(recovery_progress) / 100.0))
        time_ratio = 0.0 if total_days <= 0 else max(0.0, min(1.0, float(day) / float(total_days)))
        size_ratio = min(1.0, math.log1p(max(0.0, float(tumor_size))) / math.log1p(140.0))

        effectiveness_payload = treatment_intelligence_engine.calculate_effectiveness(
            {
                "treatment_score": treatment_score,
                "medicine": medicine_type,
                "cancer_type": cancer_type,
                "aggressiveness": aggressiveness * 100.0,
                "tumor_size": tumor_size,
                "response_trend": recovery_ratio * 100.0,
            }
        )
        compatibility_score = float(effectiveness_payload.get("compatibility_score", 50.0))
        biological_modifier = float(effectiveness_payload.get("biological_modifier", 0.5))
        response_category = str(effectiveness_payload.get("response_category", "Partial Response"))

        aggressiveness_value = self.calculate_aggressiveness(
            treatment_score=treatment_score,
            effectiveness=effectiveness_ratio,
            recovery_progress=recovery_progress,
            tumor_size=tumor_size,
            response_trend=recovery_ratio,
        )

        instability = np.clip(0.78 - 0.52 * score_ratio - 0.28 * effectiveness_ratio + 0.26 * aggressiveness_value + 0.10 * size_ratio, 0.05, 0.98)
        pulse_strength = np.clip(0.04 + 0.18 * aggressiveness_value + 0.08 * instability - 0.10 * effectiveness_ratio, 0.02, 0.34)
        deformation_strength = np.clip(0.10 + 0.30 * instability + 0.18 * aggressiveness_value - 0.26 * effectiveness_ratio - 0.08 * recovery_ratio, 0.04, 0.55)
        growth_rate = np.clip(0.16 * aggressiveness_value + 0.22 * instability - 0.34 * effectiveness_ratio - 0.20 * recovery_ratio, -0.42, 0.38)

        if score_ratio >= 0.82 and effectiveness_ratio >= 0.68 and recovery_ratio >= 0.18:
            tumor_state = "Responding" if time_ratio < 0.35 else "Stabilizing"
        elif score_ratio >= 0.68 and effectiveness_ratio >= 0.55:
            tumor_state = "Partial Regression" if time_ratio < 0.55 else "Stabilizing"
        elif score_ratio >= 0.5 and effectiveness_ratio >= 0.4:
            tumor_state = "Resistant" if compatibility_score < 55.0 else "Partial Regression"
        elif score_ratio >= 0.3:
            tumor_state = "Aggressive" if aggressiveness_value > 0.6 else "Resistant"
        elif effectiveness_ratio < 0.2 and score_ratio < 0.25 and time_ratio > 0.55:
            tumor_state = "Necrotic"
        else:
            tumor_state = "Progressive"

        if growth_rate > 0.1 and aggressiveness_value > 0.65 and tumor_state not in {"Necrotic", "Stabilizing"}:
            tumor_state = "Aggressive"

        return {
            "tumor_state": tumor_state,
            "deformation_strength": round(float(deformation_strength), 4),
            "growth_rate": round(float(growth_rate), 4),
            "aggressiveness": round(float(aggressiveness_value), 4),
            "pulse_strength": round(float(pulse_strength), 4),
            "instability": round(float(instability), 4),
            "effectiveness": round(float(effectiveness_ratio), 4),
            "treatment_score": round(float(treatment_score), 2),
            "compatibility_score": round(float(compatibility_score), 2),
            "biological_modifier": round(float(biological_modifier), 4),
            "response_category": response_category,
        }

    def update_treatment_response(
        self,
        treatment_score: float,
        effectiveness: float,
        recovery_progress: float,
        aggressiveness: float,
        tumor_size: float,
        day: float,
        total_days: float,
        medicine_type: str,
        cancer_type: str = "UNKNOWN",
    ) -> Dict[str, float | str]:
        return self.generate_tumor_state(
            treatment_score=treatment_score,
            effectiveness=effectiveness,
            recovery_progress=recovery_progress,
            aggressiveness=aggressiveness,
            tumor_size=tumor_size,
            day=day,
            total_days=total_days,
            medicine_type=medicine_type,
            cancer_type=cancer_type,
        )
    
    def _compute_regional_effectiveness(self, vertex: np.ndarray, 
                                        radius: float,
                                        effectiveness: float) -> float:
        """
        Compute how much a vertex should be affected by treatment
        
        Outer regions shrink faster than core (realistic tumor response)
        """
        # Normalize radius (0 = center, 1 = surface)
        normalized_radius = radius / self.max_radius if self.max_radius > 0 else 0
        
        # Outer regions respond more to treatment
        # Inner necrotic core responds less
        region_factor = (
            0.2 +  # Inner core doesn't shrink much
            0.8 * np.power(normalized_radius, 0.6)  # Outer regions shrink more
        )
        
        return effectiveness * region_factor
    
    def _evolve_vertices(self, vertices: np.ndarray,
                        state: Dict[str, float | str],
                        time_days: float,
                        medicine_type: str = "standard") -> np.ndarray:
        """
        Evolve vertex positions based on treatment and aggressiveness
        
        Args:
            vertices: Current vertex positions
            effectiveness: Treatment effectiveness (0-1)
            aggressiveness: Tumor aggressiveness (0-1)
            time_days: Days of treatment
            medicine_type: Type of medicine ("standard", "targeted", "immunotherapy")
        
        Returns:
            Deformed vertex positions
        """
        evolved = vertices.copy()
        effectiveness = self._normalize_effectiveness(float(state.get("effectiveness", 0.0)))
        aggressiveness = float(state.get("aggressiveness", 0.5))
        deformation_strength = float(state.get("deformation_strength", 0.12))
        growth_rate = float(state.get("growth_rate", 0.0))
        pulse_strength = float(state.get("pulse_strength", 0.06))
        instability = float(state.get("instability", 0.5))
        tumor_state = str(state.get("tumor_state", "Progressive"))
        
        for i, vertex in enumerate(evolved):
            radius = self.radii[i]
            normalized_radius = radius / self.max_radius if self.max_radius > 0 else 0.0
            
            # Compute regional effectiveness (outer shrinks faster)
            regional_effect = self._compute_regional_effectiveness(
                vertex, radius, effectiveness
            )
            
            # Base deformation from Perlin noise (organic appearance)
            noise = self._fbm_noise(
                vertex, 
                time_days,
                scale=2.0,
                octaves=4
            )
            
            outer_bias = np.power(normalized_radius, 1.25)
            core_bias = 1.0 - 0.45 * normalized_radius

            if tumor_state in {"Responding", "Stabilizing"}:
                state_bias = 0.82 - 0.20 * effectiveness
            elif tumor_state == "Partial Regression":
                state_bias = 0.92 - 0.12 * effectiveness
            elif tumor_state == "Resistant":
                state_bias = 1.02 + 0.10 * (1.0 - effectiveness)
            elif tumor_state in {"Aggressive", "Progressive"}:
                state_bias = 1.10 + 0.22 * (1.0 - effectiveness)
            else:
                state_bias = 0.70

            if medicine_type == "targeted":
                medicine_bias = 1.12
            elif medicine_type == "immunotherapy":
                medicine_bias = 0.94
            else:
                medicine_bias = 1.0

            shrink_component = -deformation_strength * regional_effect * state_bias * medicine_bias * (1.0 + noise * 0.22)
            growth_component = growth_rate * (core_bias * 0.78 + outer_bias * 0.22) * (0.72 + 0.28 * noise)
            pulse_component = pulse_strength * np.sin(time_days * (0.18 + 0.05 * aggressiveness) + radius * 2.4)

            if effectiveness < 0.25 or tumor_state in {"Aggressive", "Progressive", "Resistant"}:
                growth_noise = self._fbm_noise(
                    vertex,
                    time_days * 1.5,
                    scale=1.5,
                    octaves=5,
                )
                growth_component += (0.10 + instability * 0.18) * (1.0 - effectiveness) * (0.45 + growth_noise)
            
            # Apply deformation in normal direction
            # Approximate normal from vertex position (assumes centered geometry)
            normal = vertex / (np.linalg.norm(vertex) + 1e-6)
            
            # Add some spatial variation to normal
            normal_noise = np.array([
                self._fbm_noise(vertex + np.array([1, 0, 0]), time_days, scale=1.5),
                self._fbm_noise(vertex + np.array([0, 1, 0]), time_days, scale=1.5),
                self._fbm_noise(vertex + np.array([0, 0, 1]), time_days, scale=1.5)
            ])
            normal = (normal + (normal_noise - 0.5) * (0.18 + 0.12 * instability))
            normal = normal / (np.linalg.norm(normal) + 1e-6)

            tangent_noise = np.array([
                normal[1] - normal[2],
                normal[2] - normal[0],
                normal[0] - normal[1],
            ])
            tangent_noise = tangent_noise / (np.linalg.norm(tangent_noise) + 1e-6)
            
            # Apply deformation
            displacement = normal * (shrink_component + growth_component + pulse_component)
            displacement += tangent_noise * instability * (0.02 + outer_bias * 0.05)
            evolved[i] = vertex + displacement
        
        return evolved
    
    def _compute_density_map(self, vertices: np.ndarray,
                            effectiveness: float,
                            aggressiveness: float) -> List[float]:
        """
        Compute density at each vertex based on treatment response
        """
        density = []
        
        for i, vertex in enumerate(vertices):
            radius = self.radii[i] / self.max_radius
            
            # Base density (higher at core)
            base_density = np.exp(-radius * 2.0)
            
            # Treatment reduces density
            treated_density = base_density * (1.0 - effectiveness * 0.6)
            
            # Aggressive tumors are denser
            aggressive_density = treated_density * (0.8 + aggressiveness * 0.4)
            
            density.append(float(np.clip(aggressive_density, 0.1, 1.0)))
        
        return density
    
    def _compute_opacity_map(self, vertices: np.ndarray,
                            effectiveness: float,
                            aggressiveness: float) -> List[float]:
        """
        Compute opacity at each vertex
        """
        opacity = []
        
        for i, vertex in enumerate(vertices):
            radius = self.radii[i] / self.max_radius
            
            # Surface is more opaque
            base_opacity = 0.6 + radius * 0.35
            
            # Treatment makes tissue less opaque (healthier)
            treated_opacity = base_opacity * (1.0 - effectiveness * 0.4)
            
            # Aggressive tumors are more opaque (darker)
            aggressive_opacity = treated_opacity * (1.0 + aggressiveness * 0.2)
            
            opacity.append(float(np.clip(aggressive_opacity, 0.15, 1.0)))
        
        return opacity
    
    def _compute_tissue_regions(self, vertices: np.ndarray,
                               effectiveness: float) -> List[float]:
        """
        Compute tissue region classification at each vertex
        
        0 = necrotic (dead), 1 = damaged, 2 = interface, 3 = outer
        """
        regions = []
        
        for i, vertex in enumerate(vertices):
            radius = self.radii[i] / self.max_radius
            
            if radius < 0.3:
                # Inner core: necrotic
                region = 0.0
            elif radius < 0.6:
                # Mid-region: damaged/transitioning
                region = 1.0 + (radius - 0.3) / 0.3  # Transition to 2.0
            elif radius < 0.85:
                # Interface region
                region = 2.0
            else:
                # Outer surface
                region = 3.0
            
            # Treatment reduces aggressive/necrotic regions
            if effectiveness > 0.5:
                region = max(1.5, region * (1.0 - effectiveness * 0.3))
            
            regions.append(float(region))
        
        return regions
    
    def _calculate_volume_change(self, original: np.ndarray,
                                evolved: np.ndarray) -> float:
        """Calculate percentage volume change"""
        # Simple approximation: average displacement as percentage of size
        displacement = np.linalg.norm(evolved - original, axis=1)
        avg_displacement = np.mean(displacement)
        tumor_size = np.mean(self.radii)
        
        if tumor_size == 0:
            return 0.0
        
        return (avg_displacement / tumor_size) * 100
    
    def simulate_evolution(self, 
                          days: float,
                          effectiveness: float = 0.5,
                          aggressiveness: float = 0.5,
                          base_aggressiveness: float = 0.5,
                          medicine_type: str = "standard",
                          num_frames: int = 30,
                          medicine_start_day: float = 0.0,
                          treatment_score: float | None = None,
                          recovery_progress: float = 0.0,
                          cancer_type: str = "UNKNOWN") -> EvolutionResult:
        """
        Simulate tumor evolution over time
        
        Args:
            days: Number of days to simulate
            effectiveness: Medicine effectiveness (0-1)
            aggressiveness: Current aggressiveness (0-1)
            base_aggressiveness: Initial aggressiveness (for comparison)
            medicine_type: Type of medicine
            num_frames: Number of frames to generate
            medicine_start_day: Day when medicine starts
        
        Returns:
            EvolutionResult with frame sequence
        """
        frames = []
        timeline_days = []
        status_progression = []
        volume_progression = []
        
        current_vertices = self.base_vertices.copy()
        score_value = float(treatment_score if treatment_score is not None else max(0.0, min(100.0, float(effectiveness) * 100.0)))
        score_ratio = self._normalize_effectiveness(effectiveness)
        dynamics = treatment_intelligence_engine.tumor_dynamics_from_score(score_value)
        effective_aggressiveness = np.clip(base_aggressiveness * (1.0 + dynamics["aggressiveness_shift"]), 0.1, 1.0)
        
        # Generate timeline
        day_steps = np.linspace(0, days, num_frames)
        
        for frame_idx, day in enumerate(day_steps):
            state = self.generate_tumor_state(
                treatment_score=score_value,
                effectiveness=score_ratio,
                recovery_progress=recovery_progress + (day / max(days, 1.0)) * 100.0,
                aggressiveness=float(effective_aggressiveness),
                tumor_size=float(np.mean(self.radii) if len(self.radii) else 0.0),
                day=float(day),
                total_days=float(days),
                medicine_type=medicine_type,
                cancer_type=cancer_type,
            )

            # Update aggressiveness based on treatment
            days_treated = max(0, day - medicine_start_day)
            
            if score_ratio > 0.5:
                current_agg = effective_aggressiveness * (
                    1.0 - score_ratio * days_treated / (days + 1)
                )
            else:
                current_agg = effective_aggressiveness * (
                    1.0 + (1.0 - score_ratio) * days_treated / (days + 5)
                )
            
            current_agg = np.clip(current_agg, 0.1, 1.0)
            state["aggressiveness"] = float(current_agg)
            
            medicine_active = day > medicine_start_day
            active_effectiveness = score_ratio if medicine_active else 0.0
            state["effectiveness"] = active_effectiveness
            state["growth_rate"] = float(state["growth_rate"]) * (0.35 + 0.65 * (current_agg / max(effective_aggressiveness, 0.1)))
            state["deformation_strength"] = float(state["deformation_strength"]) * (0.85 + 0.25 * (1.0 - active_effectiveness))
            state["pulse_strength"] = float(state["pulse_strength"]) * (0.88 + 0.32 * current_agg)
            state["instability"] = float(state["instability"]) * (0.82 + 0.18 * current_agg)
            
            # Evolve vertices
            current_vertices = self._evolve_vertices(
                current_vertices,
                state,
                day,
                medicine_type
            )
            
            # Compute properties
            density = self._compute_density_map(current_vertices, active_effectiveness, current_agg)
            opacity = self._compute_opacity_map(current_vertices, active_effectiveness, current_agg)
            regions = self._compute_tissue_regions(current_vertices, active_effectiveness)
            
            # Determine status
            if state["tumor_state"] in {"Responding", "Stabilizing"}:
                status = "shrinking"
            elif state["tumor_state"] in {"Progressive", "Aggressive", "Resistant"}:
                status = "growing"
            else:
                status = "stable"
            
            # Calculate volume change
            volume_change = self._calculate_volume_change(
                self.base_vertices, current_vertices
            )
            
            # Create frame
            frame = EvolutionFrame(
                timestamp=float(day),
                vertices=current_vertices.tolist(),
                densityMap=density,
                opacityMap=opacity,
                tissueRegions=regions,
                aggressiveness=float(current_agg),
                volume_change=float(volume_change),
                status=status,
                tumor_state=str(state["tumor_state"]),
                deformation_strength=float(state["deformation_strength"]),
                growth_rate=float(state["growth_rate"]),
                pulse_strength=float(state["pulse_strength"]),
                instability=float(state["instability"]),
            )
            
            frames.append(asdict(frame))
            timeline_days.append(float(day))
            status_progression.append(status)
            volume_progression.append(volume_change)
        
        # Calculate medicine response score
        final_volume_change = volume_progression[-1] if volume_progression else 0
        medicine_response_score = max(0.0, min(1.0, score_ratio * 0.85 + (1.0 - abs(final_volume_change) / 100.0) * 0.15))
        
        return EvolutionResult(
            frames=frames,
            timeline_days=timeline_days,
            status_progression=status_progression,
            volume_progression=volume_progression,
            medicine_response_score=float(medicine_response_score),
            final_aggressiveness=float(current_agg)
        )

    def simulate_tumor_evolution(
        self,
        days: float,
        treatment_score: float,
        effectiveness: float,
        recovery_progress: float,
        aggressiveness: float,
        base_aggressiveness: float,
        medicine_type: str = "standard",
        num_frames: int = 30,
        medicine_start_day: float = 0.0,
        cancer_type: str = "UNKNOWN",
    ) -> Dict:
        result = self.simulate_evolution(
            days=days,
            effectiveness=effectiveness,
            aggressiveness=aggressiveness,
            base_aggressiveness=base_aggressiveness,
            medicine_type=medicine_type,
            num_frames=num_frames,
            medicine_start_day=medicine_start_day,
            treatment_score=treatment_score,
            recovery_progress=recovery_progress,
            cancer_type=cancer_type,
        )
        mesh_sequence = [frame.get("vertices", []) for frame in result.frames]
        return {
            "frames": result.frames,
            "timeline_days": result.timeline_days,
            "status_progression": result.status_progression,
            "volume_progression": result.volume_progression,
            "medicine_response_score": result.medicine_response_score,
            "final_aggressiveness": result.final_aggressiveness,
            "treatment_score": round(float(treatment_score), 2),
            "tumor_state": result.frames[-1].get("tumor_state") if result.frames else "Progressive",
            "deformation_strength": result.frames[-1].get("deformation_strength") if result.frames else 0.0,
            "growth_rate": result.frames[-1].get("growth_rate") if result.frames else 0.0,
            "aggressiveness": result.frames[-1].get("aggressiveness") if result.frames else 0.0,
            "timeline_frames": result.frames,
            "mesh_sequence": mesh_sequence,
            "success": True,
        }


def simulate_tumor_change(volume_data: Dict,
                         effectiveness: float,
                         recovery_progress: float = 0.0,
                         aggressiveness: str = "moderate",
                         medicine_type: str = "standard",
                         simulation_days: float = 90.0,
                         treatment_score: float | None = None,
                         cancer_type: str = "UNKNOWN") -> Dict:
    """
    High-level API for tumor evolution simulation
    
    Args:
        volume_data: Dict with 'mesh' containing 'vertices' and 'faces'
        effectiveness: Medicine effectiveness (0-1)
        recovery_progress: Recovery progress percentage (0-100)
        aggressiveness: "low", "moderate", "high"
        medicine_type: "standard", "targeted", "immunotherapy"
        simulation_days: Number of days to simulate
    
    Returns:
        Dict with evolution frames and metadata
    """
    # Extract mesh data
    mesh = volume_data.get('mesh', {})
    vertices = mesh.get('vertices', [])
    faces = mesh.get('faces', [])
    
    if not vertices or not faces:
        return {
            'frames': [],
            'error': 'No mesh data provided'
        }
    
    # Convert aggressiveness string to value
    agg_map = {'low': 0.3, 'moderate': 0.6, 'high': 0.9}
    base_agg = agg_map.get(aggressiveness, 0.6)
    score_value = float(treatment_score if treatment_score is not None else max(0.0, min(100.0, float(effectiveness) * 100.0)))
    visual_profile = treatment_intelligence_engine.tumor_dynamics_from_score(score_value)
    
    # Create evolution engine
    engine = TumorEvolutionEngine(
        vertices,
        faces,
        patient_seed=hash(str(vertices)) % (2**31)
    )
    
    # Run simulation
    result = engine.simulate_evolution(
        days=simulation_days,
        effectiveness=effectiveness,
        aggressiveness=base_agg,
        base_aggressiveness=base_agg,
        medicine_type=medicine_type,
        num_frames=30,
        medicine_start_day=1.0,  # Medicine starts after day 1
        treatment_score=treatment_score,
        recovery_progress=recovery_progress,
        cancer_type=cancer_type,
    )
    
    return {
        'frames': result.frames,
        'timeline_days': result.timeline_days,
        'status_progression': result.status_progression,
        'volume_progression': result.volume_progression,
        'medicine_response_score': result.medicine_response_score,
        'final_aggressiveness': result.final_aggressiveness,
        'treatment_score': round(score_value, 2),
        'effectiveness': round(float(effectiveness), 4),
        'visual_profile': visual_profile,
        'tumor_state': result.frames[-1].get('tumor_state') if result.frames else 'Progressive',
        'deformation_strength': result.frames[-1].get('deformation_strength') if result.frames else 0.0,
        'growth_rate': result.frames[-1].get('growth_rate') if result.frames else 0.0,
        'aggressiveness': result.frames[-1].get('aggressiveness') if result.frames else 0.0,
        'timeline_frames': result.frames,
        'mesh_sequence': [frame.get('vertices', []) for frame in result.frames],
        'success': True
    }


def simulate_tumor_evolution(**kwargs) -> Dict:
    return simulate_tumor_change(**kwargs)
