"""Time-based tumor mask simulation and animation frame generation."""

from __future__ import annotations

import base64
import io
import math
from typing import Dict, List, Tuple

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
from skimage import measure
from scipy.ndimage import binary_dilation, binary_erosion, distance_transform_edt, gaussian_filter, generate_binary_structure


class TumorTimelineSimulator:
    """Simulate tumor progression masks and render animation frames."""

    @staticmethod
    def _decode_data_url(data_url: str, mode: str = "RGB") -> Image.Image:
        if not isinstance(data_url, str) or "," not in data_url:
            raise ValueError("Expected a valid data URL image string.")

        payload = data_url.split(",", 1)[1]
        raw = base64.b64decode(payload)
        image = Image.open(io.BytesIO(raw))
        return image.convert(mode)

    @staticmethod
    def _encode_data_url(image: Image.Image) -> str:
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
        return f"data:image/png;base64,{encoded}"

    @staticmethod
    def _mask_to_tensor(mask_image: Image.Image) -> torch.Tensor:
        mask_np = np.asarray(mask_image, dtype=np.float32) / 255.0
        mask = torch.from_numpy(mask_np)
        return (mask >= 0.5).float()

    @staticmethod
    def _compute_center(mask: torch.Tensor) -> Tuple[float, float]:
        coords = torch.nonzero(mask > 0.5, as_tuple=False)
        if coords.numel() == 0:
            height, width = mask.shape
            return (width - 1) / 2.0, (height - 1) / 2.0

        y = float(coords[:, 0].float().mean().item())
        x = float(coords[:, 1].float().mean().item())
        return x, y

    @staticmethod
    def _scale_around_center(mask: torch.Tensor, scale: float, center_x: float, center_y: float) -> torch.Tensor:
        height, width = mask.shape
        if height < 2 or width < 2:
            return mask.clone()

        scale = max(0.15, float(scale))
        target_height = max(1, int(round(height * scale)))
        target_width = max(1, int(round(width * scale)))

        source = mask.unsqueeze(0).unsqueeze(0)
        resized = F.interpolate(source, size=(target_height, target_width), mode="bilinear", align_corners=False)[0, 0]
        canvas = torch.zeros_like(mask)

        if target_height <= height and target_width <= width:
            top = max(0, (height - target_height) // 2)
            left = max(0, (width - target_width) // 2)
            canvas[top : top + target_height, left : left + target_width] = resized
            return canvas

        top = max(0, (target_height - height) // 2)
        left = max(0, (target_width - width) // 2)
        return resized[top : top + height, left : left + width]

    @staticmethod
    def _smooth_mask(mask: torch.Tensor) -> torch.Tensor:
        x = mask.unsqueeze(0).unsqueeze(0)
        x = F.avg_pool2d(x, kernel_size=5, stride=1, padding=2)
        x = F.avg_pool2d(x, kernel_size=3, stride=1, padding=1)
        return x[0, 0]

    @staticmethod
    def _resize_mask(mask: torch.Tensor, size: int) -> torch.Tensor:
        size = max(16, int(size))
        source = mask.unsqueeze(0).unsqueeze(0).float()
        resized = F.interpolate(source, size=(size, size), mode="bilinear", align_corners=False)
        return resized[0, 0].clamp(0.0, 1.0)

    @staticmethod
    def _gaussian_kernel3d(kernel_size: int = 5, sigma: float = 1.0) -> torch.Tensor:
        radius = kernel_size // 2
        coords = torch.arange(-radius, radius + 1, dtype=torch.float32)
        z, y, x = torch.meshgrid(coords, coords, coords, indexing="ij")
        kernel = torch.exp(-(x ** 2 + y ** 2 + z ** 2) / (2.0 * sigma ** 2))
        kernel = kernel / kernel.sum()
        return kernel.unsqueeze(0).unsqueeze(0)

    @classmethod
    def _smooth_volume(cls, volume: torch.Tensor, kernel_size: int = 5, sigma: float = 1.0) -> torch.Tensor:
        kernel = cls._gaussian_kernel3d(kernel_size=kernel_size, sigma=sigma).to(volume.device, volume.dtype)
        padding = kernel_size // 2
        return F.conv3d(volume, kernel, padding=padding)

    @staticmethod
    def _normalize_coord(index: int, size: int) -> float:
        if size <= 1:
            return 0.0
        return (index / (size - 1)) - 0.5

    @staticmethod
    def _risk_level(area_ratio: float) -> str:
        if area_ratio >= 0.18:
            return "high"
        if area_ratio >= 0.07:
            return "moderate"
        return "low"

    @staticmethod
    def _seed_from_mask(mask: torch.Tensor, effectiveness: float) -> int:
        mask = mask.detach().float().clamp(0.0, 1.0)
        area_score = int(round(float(mask.mean().item()) * 100000))
        shape_score = int(round(float(mask.std().item()) * 100000))
        eff_score = int(round(max(0.0, min(1.0, float(effectiveness))) * 1000))
        return (area_score * 31 + shape_score * 17 + eff_score * 13) % (2**32 - 1)

    def _irregularize_mask(self, mask: torch.Tensor, effectiveness: float) -> torch.Tensor:
        base = mask.detach().cpu().numpy().astype(np.float32)
        seed = self._seed_from_mask(mask, effectiveness)
        rng = np.random.default_rng(seed)

        # Add low-frequency noise to break spherical symmetry while keeping structure attached.
        noise = gaussian_filter(rng.normal(0.0, 1.0, size=base.shape).astype(np.float32), sigma=2.0)
        noise = noise / (np.max(np.abs(noise)) + 1e-6)
        irregular = np.clip(base + noise * (0.12 + 0.08 * (1.0 - float(effectiveness))), 0.0, 1.0)

        binary = irregular >= 0.48
        structure = generate_binary_structure(2, 1)
        if float(effectiveness) >= 0.55:
            binary = binary_erosion(binary, structure=structure, iterations=1 + int(rng.integers(0, 2)))
        else:
            binary = binary_dilation(binary, structure=structure, iterations=1 + int(rng.integers(0, 3)))

        # Re-introduce a soft edge so the mesh is organic instead of rigid.
        softened = gaussian_filter(binary.astype(np.float32), sigma=1.1)
        return torch.from_numpy(np.clip(softened, 0.0, 1.0)).to(mask.device, dtype=mask.dtype)

    @staticmethod
    def _overlay(base_image: Image.Image, mask: torch.Tensor) -> Image.Image:
        base = base_image.convert("RGBA")
        mask_img = Image.fromarray((mask.clamp(0, 1).cpu().numpy() * 255).astype("uint8"), mode="L")
        overlay = Image.new("RGBA", base.size, (255, 59, 92, 0))
        overlay.putalpha(mask_img.point(lambda value: 28 + int((value / 255.0) * 150) if value > 0 else 0))
        return Image.alpha_composite(base, overlay)

    @staticmethod
    def _status_from_delta(delta: float) -> str:
        if delta < -0.003:
            return "shrinking"
        if delta > 0.003:
            return "growing"
        return "stable"

    def _simulate_progression_with_metrics(
        self,
        mask: torch.Tensor,
        effectiveness: float,
        steps: int = 5,
    ) -> Tuple[List[torch.Tensor], float, float, str, float, float]:
        steps = max(2, int(steps))
        eff = max(0.0, min(1.0, float(effectiveness)))

        initial_mask = mask.clone().float().clamp(0.0, 1.0)
        center_x, center_y = self._compute_center(initial_mask)
        initial_area = max(1e-6, float(initial_mask.mean().item()))
        growth_rate = max(0.02, min(0.04, 0.022 + 0.004 * math.log1p(initial_area * 100.0)))
        drug_effect = eff * 0.08
        status = self._status_from_delta(growth_rate - drug_effect)

        frames: List[torch.Tensor] = []
        previous = initial_mask

        for index in range(steps):
            progress = index / (steps - 1)
            elapsed = 1.0 + progress * 4.0
            target_scale = math.exp((growth_rate - drug_effect) * elapsed)

            if status == "shrinking":
                target_scale = min(target_scale, 1.0)
            elif status == "growing":
                target_scale = max(target_scale, 1.0)

            transformed = self._scale_around_center(initial_mask, target_scale, center_x, center_y)
            smoothed = self._smooth_mask(transformed)

            if status == "shrinking":
                threshold = 0.64 - 0.08 * progress
            elif status == "growing":
                threshold = 0.42 + 0.02 * progress
            else:
                threshold = 0.50

            current = (smoothed >= threshold).float()
            blended = ((0.72 * current) + (0.28 * previous)) >= 0.5
            previous = blended.float()
            frames.append(previous.clone())

        final_area = float(previous.mean().item())
        return frames, growth_rate, drug_effect, status, initial_area, final_area

    def simulate_tumor_progression(self, mask: torch.Tensor, effectiveness: float, steps: int = 5) -> List[torch.Tensor]:
        frames, _, _, _, _, _ = self._simulate_progression_with_metrics(mask, effectiveness, steps)
        return frames

    def build_pseudo_volume(self, mask: torch.Tensor, effectiveness: float, depth: int = 24, size: int = 56) -> torch.Tensor:
        """Convert a 2D mask into a smoothed pseudo-3D tumor volume."""
        eff = max(0.0, min(1.0, float(effectiveness)))
        depth = max(12, int(depth))
        size = max(24, int(size))

        base = self._resize_mask(mask, size=size)
        base = self._irregularize_mask(base, eff)
        center_x, center_y = self._compute_center(base)
        depth_weights = torch.linspace(-1.0, 1.0, depth)
        slices: List[torch.Tensor] = []

        for position in depth_weights:
            z = float(position.item())
            bulge = math.exp(-(z ** 2) / 0.22)
            wobble = 0.04 * math.sin((z + 1.0) * math.pi * (1.5 + eff))
            depth_scale = 0.84 + 0.22 * bulge + 0.04 * (eff - 0.5) + wobble
            slice_mask = self._scale_around_center(base, depth_scale, center_x, center_y)
            slice_mask = self._smooth_mask(slice_mask)
            slice_weight = 0.48 + 0.52 * bulge
            slices.append((slice_mask * slice_weight).clamp(0.0, 1.0))

        volume = torch.stack(slices, dim=0).unsqueeze(0).unsqueeze(0)
        volume = self._smooth_volume(volume, kernel_size=5, sigma=1.1)
        return volume[0, 0].clamp(0.0, 1.0)

    @classmethod
    def _volume_to_mesh(cls, volume, threshold: float = 0.42, add_noise: bool = True) -> Dict[str, object]:
        """Generate a smooth mesh from a 3D scalar volume using marching cubes.

        Accepts a torch.Tensor (D,H,W) or a numpy array. Adds small noise and Gaussian smoothing
        to introduce irregularities that make tumors look more realistic.
        """
        # Convert to numpy float array
        if isinstance(volume, torch.Tensor):
            vol = volume.detach().cpu().numpy().astype(np.float32)
        else:
            vol = np.asarray(volume, dtype=np.float32)

        vol = np.clip(vol, 0.0, 1.0)

        # Add subtle stochastic irregularity and smooth
        if add_noise:
            rng = np.random.default_rng()
            noise = rng.normal(loc=0.0, scale=0.035, size=vol.shape).astype(np.float32)
            vol = vol + noise
            vol = gaussian_filter(vol, sigma=0.9)
            vol = np.clip(vol, 0.0, 1.0)

        depth, height, width = vol.shape

        try:
            verts, faces, normals, values = measure.marching_cubes(vol, level=float(threshold))
        except Exception:
            # Fallback: if marching cubes fails, return empty mesh
            return {"vertices": [], "faces": [], "vertex_count": 0, "face_count": 0}

        density_bundle = cls.generate_density_map(vol)
        density_volume = density_bundle["density"]
        opacity_volume = density_bundle["opacity"]
        tissue_volume = density_bundle["tissue_regions"]

        # marching_cubes returns vertices as (z, y, x) coordinates in voxel space
        vertices: List[List[float]] = []
        density_map: List[float] = []
        opacity_map: List[float] = []
        tissue_regions: List[int] = []
        for vz, vy, vx in verts:
            x = (float(vx) / max(1.0, (width - 1))) - 0.5
            y = (float(vy) / max(1.0, (height - 1))) - 0.5
            z = (float(vz) / max(1.0, (depth - 1))) - 0.5
            vertices.append([round(x, 6), round(y, 6), round(z, 6)])

            vertex_density = cls._sample_volume_trilinear(density_volume, float(vz), float(vy), float(vx))
            vertex_opacity = cls._sample_volume_trilinear(opacity_volume, float(vz), float(vy), float(vx))
            vertex_tissue = cls._sample_volume_trilinear(tissue_volume.astype(np.float32), float(vz), float(vy), float(vx))

            density_map.append(round(float(np.clip(vertex_density, 0.0, 1.0)), 6))
            opacity_map.append(round(float(np.clip(vertex_opacity, 0.0, 1.0)), 6))
            tissue_regions.append(int(np.clip(int(round(vertex_tissue)), 1, 4)))

        faces_list: List[List[int]] = []
        for a, b, c in faces:
            faces_list.append([int(a), int(b), int(c)])

        return {
            "vertices": vertices,
            "faces": faces_list,
            "densityMap": density_map,
            "opacityMap": opacity_map,
            "tissueRegions": tissue_regions,
            "regionLabels": {
                "1": "outer_shell",
                "2": "middle_tissue",
                "3": "soft_tissue",
                "4": "necrotic_core",
            },
            "vertex_count": len(vertices),
            "face_count": len(faces_list),
        }

    @staticmethod
    def _sample_volume_trilinear(volume: np.ndarray, z: float, y: float, x: float) -> float:
        depth, height, width = volume.shape

        z0 = int(np.clip(np.floor(z), 0, depth - 1))
        y0 = int(np.clip(np.floor(y), 0, height - 1))
        x0 = int(np.clip(np.floor(x), 0, width - 1))
        z1 = int(np.clip(z0 + 1, 0, depth - 1))
        y1 = int(np.clip(y0 + 1, 0, height - 1))
        x1 = int(np.clip(x0 + 1, 0, width - 1))

        dz = float(np.clip(z - z0, 0.0, 1.0))
        dy = float(np.clip(y - y0, 0.0, 1.0))
        dx = float(np.clip(x - x0, 0.0, 1.0))

        c000 = float(volume[z0, y0, x0])
        c100 = float(volume[z1, y0, x0])
        c010 = float(volume[z0, y1, x0])
        c110 = float(volume[z1, y1, x0])
        c001 = float(volume[z0, y0, x1])
        c101 = float(volume[z1, y0, x1])
        c011 = float(volume[z0, y1, x1])
        c111 = float(volume[z1, y1, x1])

        c00 = c000 * (1.0 - dz) + c100 * dz
        c10 = c010 * (1.0 - dz) + c110 * dz
        c01 = c001 * (1.0 - dz) + c101 * dz
        c11 = c011 * (1.0 - dz) + c111 * dz

        c0 = c00 * (1.0 - dy) + c10 * dy
        c1 = c01 * (1.0 - dy) + c11 * dy
        return c0 * (1.0 - dx) + c1 * dx

    @classmethod
    def generate_density_map(cls, volume) -> Dict[str, np.ndarray]:
        """Generate biologically irregular density/opacity/tissue-zone maps from a tumor volume."""
        vol = np.asarray(volume, dtype=np.float32)
        vol = np.clip(vol, 0.0, 1.0)

        occupancy = vol > 0.08
        if not np.any(occupancy):
            empty = np.zeros_like(vol, dtype=np.float32)
            return {
                "density": empty,
                "opacity": empty,
                "tissue_regions": empty.astype(np.int16),
            }

        coords = np.argwhere(occupancy)
        center = coords.mean(axis=0).astype(np.float32)
        seed = int((float(vol.mean()) * 1e6 + float(vol.std()) * 3.7e5 + coords.shape[0] * 97) % (2**32 - 1))
        rng = np.random.default_rng(seed)

        center_jitter = np.array(
            [
                rng.uniform(-0.09, 0.09) * vol.shape[0],
                rng.uniform(-0.11, 0.11) * vol.shape[1],
                rng.uniform(-0.11, 0.11) * vol.shape[2],
            ],
            dtype=np.float32,
        )
        necrosis_center = center + center_jitter

        z = np.linspace(-1.0, 1.0, vol.shape[0], dtype=np.float32)
        y = np.linspace(-1.0, 1.0, vol.shape[1], dtype=np.float32)
        x = np.linspace(-1.0, 1.0, vol.shape[2], dtype=np.float32)
        zz, yy, xx = np.meshgrid(z, y, x, indexing="ij")

        dist_inside = distance_transform_edt(occupancy).astype(np.float32)
        depth_norm = dist_inside / (float(dist_inside.max()) + 1e-6)
        shell_factor = (1.0 - depth_norm) * occupancy.astype(np.float32)

        # Local biological variations from multiple spatial scales.
        n1 = gaussian_filter(rng.normal(0.0, 1.0, size=vol.shape).astype(np.float32), sigma=1.1)
        n2 = gaussian_filter(rng.normal(0.0, 1.0, size=vol.shape).astype(np.float32), sigma=2.8)
        n3 = gaussian_filter(rng.normal(0.0, 1.0, size=vol.shape).astype(np.float32), sigma=4.6)
        bio_noise = 0.48 * n1 + 0.34 * n2 + 0.18 * n3
        bio_noise = (bio_noise - bio_noise.min()) / (float(bio_noise.max() - bio_noise.min()) + 1e-6)

        nec_z = ((np.arange(vol.shape[0], dtype=np.float32) - necrosis_center[0]) / max(1.0, vol.shape[0] * 0.35))[:, None, None]
        nec_y = ((np.arange(vol.shape[1], dtype=np.float32) - necrosis_center[1]) / max(1.0, vol.shape[1] * 0.33))[None, :, None]
        nec_x = ((np.arange(vol.shape[2], dtype=np.float32) - necrosis_center[2]) / max(1.0, vol.shape[2] * 0.33))[None, None, :]
        nec_radius = np.sqrt(nec_z**2 + nec_y**2 + nec_x**2)

        irregular_core = gaussian_filter(rng.normal(0.0, 1.0, size=vol.shape).astype(np.float32), sigma=2.2)
        irregular_core = (irregular_core - irregular_core.min()) / (float(irregular_core.max() - irregular_core.min()) + 1e-6)
        core_base = np.exp(-(nec_radius**2) / 0.38)
        necrosis = np.clip(core_base * 1.18 + (irregular_core - 0.5) * 0.8 - 0.52, 0.0, 1.0)
        necrosis = necrosis * occupancy.astype(np.float32)

        axis_a = np.array(rng.normal(0.0, 1.0, size=3), dtype=np.float32)
        axis_b = np.array(rng.normal(0.0, 1.0, size=3), dtype=np.float32)
        axis_a = axis_a / (np.linalg.norm(axis_a) + 1e-6)
        axis_b = axis_b / (np.linalg.norm(axis_b) + 1e-6)
        proj_a = xx * axis_a[2] + yy * axis_a[1] + zz * axis_a[0]
        proj_b = xx * axis_b[2] + yy * axis_b[1] + zz * axis_b[0]
        vessel_band = np.sin(proj_a * (8.0 + rng.uniform(0.0, 4.0)) + rng.uniform(0.0, np.pi))
        vessel_branch = np.sin(proj_b * (12.0 + rng.uniform(0.0, 5.0)) + rng.uniform(0.0, np.pi))
        vascular = np.maximum(vessel_band, vessel_branch)
        vascular = np.clip((vascular * 0.5 + 0.5) * (0.45 + 0.55 * bio_noise), 0.0, 1.0)
        vascular = np.clip((vascular - 0.56) / 0.44, 0.0, 1.0)
        vascular *= occupancy.astype(np.float32)

        density = (
            0.16
            + 0.49 * shell_factor
            + 0.15 * bio_noise
            + 0.19 * vascular
            + 0.14 * vol
            - 0.45 * necrosis
        ) * occupancy.astype(np.float32)
        density = np.clip(density, 0.0, 1.0).astype(np.float32)

        opacity = (0.20 + 0.68 * density - 0.33 * necrosis + 0.08 * shell_factor) * occupancy.astype(np.float32)
        opacity = np.clip(opacity, 0.06, 0.98)
        opacity = np.where(occupancy, opacity, 0.0).astype(np.float32)

        regions = np.zeros_like(density, dtype=np.int16)
        outer_shell = (occupancy) & (shell_factor > 0.62)
        middle_tissue = (occupancy) & (~outer_shell) & (depth_norm <= 0.66)
        soft_tissue = (occupancy) & (~outer_shell) & (~middle_tissue)
        necrotic_core = (occupancy) & (necrosis > 0.38)

        regions[outer_shell] = 1
        regions[middle_tissue] = 2
        regions[soft_tissue] = 3
        regions[necrotic_core] = 4

        # Ensure all occupied voxels have a valid layer assignment.
        regions[(occupancy) & (regions == 0)] = 2

        return {
            "density": density,
            "opacity": opacity,
            "tissue_regions": regions,
        }

    def generate_animation(
        self,
        mask_data_url: str,
        effectiveness: float,
        steps: int = 8,
        original_image_data_url: str | None = None,
    ) -> Dict[str, object]:
        return self.generate_simulation(mask_data_url, effectiveness, steps, original_image_data_url)

    def generate_simulation(
        self,
        mask_data_url: str,
        effectiveness: float,
        steps: int = 8,
        original_image_data_url: str | None = None,
    ) -> Dict[str, object]:
        mask_image = self._decode_data_url(mask_data_url, mode="L")
        base_image = self._decode_data_url(original_image_data_url, mode="RGB") if original_image_data_url else None
        if base_image is None:
            base_image = Image.merge("RGB", (mask_image, mask_image, mask_image))

        if base_image.size != mask_image.size:
            base_image = base_image.resize(mask_image.size, Image.Resampling.BILINEAR)

        initial_mask = self._mask_to_tensor(mask_image)
        masks, growth_rate, drug_effect, status, initial_area, final_area = self._simulate_progression_with_metrics(
            initial_mask,
            effectiveness=effectiveness,
            steps=steps,
        )
        volume = self.build_pseudo_volume(initial_mask, effectiveness=effectiveness, depth=max(16, steps * 3), size=56)
        mesh = self._volume_to_mesh(volume, threshold=0.38)

        frames: List[str] = []
        risk_levels: List[str] = []
        recovery_percentages: List[float] = []
        progression_percentages: List[float] = []
        tumor_area_percentages: List[float] = []

        for mask in masks:
            area_ratio = float(mask.float().mean().item())
            tumor_area_percentages.append(round(area_ratio * 100.0, 3))
            risk_levels.append(self._risk_level(area_ratio))

            recovery = max(0.0, min(100.0, (1.0 - (area_ratio / initial_area)) * 100.0))
            recovery_percentages.append(round(recovery, 3))

            progression = max(0.0, min(100.0, ((area_ratio / initial_area) - 1.0) * 100.0))
            progression_percentages.append(round(progression, 3))

            rendered = self._overlay(base_image, mask)
            frames.append(self._encode_data_url(rendered))

        if status == "shrinking":
            message = "Tumor shrinking over time"
        elif status == "growing":
            message = "Tumor growing over time"
        else:
            message = "Tumor stable over time"

        return {
            "effectiveness": round(float(effectiveness), 4),
            "status": status,
            "frames": frames,
            "message": message,
            "risk_levels": risk_levels,
            "recovery_percentages": recovery_percentages,
            "progression_percentages": progression_percentages,
            "tumor_area_percentages": tumor_area_percentages,
            "mesh": mesh,
            "initial_area_pct": round(initial_area * 100.0, 4),
            "final_area_pct": round(final_area * 100.0, 4),
            "growth_rate": round(float(growth_rate), 5),
            "drug_effect": round(float(drug_effect), 5),
            "frame_interval_ms": 500,
        }


tumor_timeline_simulator = TumorTimelineSimulator()


def simulate_tumor_progression(mask: torch.Tensor, effectiveness: float, steps: int = 5) -> List[torch.Tensor]:
    """Convenience function for external callers needing progression masks only."""
    return tumor_timeline_simulator.simulate_tumor_progression(mask=mask, effectiveness=effectiveness, steps=steps)


def generate_density_map(volume) -> Dict[str, np.ndarray]:
    """Public helper requested by integration callers to build internal tumor density volumes."""
    return tumor_timeline_simulator.generate_density_map(volume)