"""Time-based tumor mask simulation and animation frame generation."""

from __future__ import annotations

import base64
import io
from typing import Dict, List, Tuple

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image


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
            h, w = mask.shape
            return (w - 1) / 2.0, (h - 1) / 2.0

        y = float(coords[:, 0].float().mean().item())
        x = float(coords[:, 1].float().mean().item())
        return x, y

    @staticmethod
    def _scale_around_center(mask: torch.Tensor, scale: float, center_x: float, center_y: float) -> torch.Tensor:
        h, w = mask.shape
        if h < 2 or w < 2:
            return mask.clone()

        cx = (center_x / (w - 1)) * 2.0 - 1.0
        cy = (center_y / (h - 1)) * 2.0 - 1.0
        tx = (1.0 - scale) * cx
        ty = (1.0 - scale) * cy

        theta = torch.tensor(
            [[scale, 0.0, tx], [0.0, scale, ty]],
            dtype=torch.float32,
        ).unsqueeze(0)

        source = mask.unsqueeze(0).unsqueeze(0)
        grid = F.affine_grid(theta, source.size(), align_corners=False)
        warped = F.grid_sample(source, grid, mode="bilinear", padding_mode="zeros", align_corners=False)
        return warped[0, 0]

    @staticmethod
    def _smooth_mask(mask: torch.Tensor) -> torch.Tensor:
        x = mask.unsqueeze(0).unsqueeze(0)
        x = F.avg_pool2d(x, kernel_size=5, stride=1, padding=2)
        x = F.avg_pool2d(x, kernel_size=3, stride=1, padding=1)
        return x[0, 0]

    @staticmethod
    def _risk_level(area_ratio: float) -> str:
        if area_ratio >= 0.18:
            return "high"
        if area_ratio >= 0.07:
            return "moderate"
        return "low"

    @staticmethod
    def _overlay(base_image: Image.Image, mask: torch.Tensor) -> Image.Image:
        base = base_image.convert("RGBA")
        mask_img = Image.fromarray((mask.clamp(0, 1).cpu().numpy() * 255).astype("uint8"), mode="L")
        overlay = Image.new("RGBA", base.size, (255, 59, 92, 0))
        overlay.putalpha(mask_img.point(lambda value: 28 + int((value / 255.0) * 150) if value > 0 else 0))
        return Image.alpha_composite(base, overlay)

    def simulate_tumor_progression(self, mask: torch.Tensor, effectiveness: float, steps: int = 5) -> List[torch.Tensor]:
        steps = max(2, int(steps))
        eff = max(0.0, min(1.0, float(effectiveness)))

        grow_strength = max(0.0, min(1.0, (0.6 - eff) / 0.6))
        shrink_strength = max(0.0, min(1.0, (eff - 0.6) / 0.4))

        center_x, center_y = self._compute_center(mask)
        masks: List[torch.Tensor] = []
        prev = mask.clone().float()

        for index in range(steps):
            progress = index / (steps - 1)

            if eff > 0.6:
                scale = 1.0 - (0.30 * shrink_strength * progress)
            else:
                scale = 1.0 + (0.18 * grow_strength * progress)

            transformed = self._scale_around_center(prev, scale, center_x, center_y)
            smoothed = self._smooth_mask(transformed)
            threshold = 0.5 + (0.08 * shrink_strength * progress) - (0.06 * grow_strength * progress)
            current = (smoothed >= threshold).float()

            # Blend toward previous frame to avoid temporal jumps.
            temporal = ((0.72 * current) + (0.28 * prev)) >= 0.5
            prev = temporal.float()
            masks.append(prev.clone())

        return masks

    def generate_animation(
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
        masks = self.simulate_tumor_progression(initial_mask, effectiveness=effectiveness, steps=steps)

        initial_area = max(1e-6, float(initial_mask.float().mean().item()))
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

        message = "Tumor shrinking over time" if float(effectiveness) > 0.6 else "Tumor growing over time"
        return {
            "effectiveness": round(float(effectiveness), 4),
            "frames": frames,
            "message": message,
            "risk_levels": risk_levels,
            "recovery_percentages": recovery_percentages,
            "progression_percentages": progression_percentages,
            "tumor_area_percentages": tumor_area_percentages,
            "frame_interval_ms": 500,
        }


tumor_timeline_simulator = TumorTimelineSimulator()


def simulate_tumor_progression(mask: torch.Tensor, effectiveness: float, steps: int = 5) -> List[torch.Tensor]:
    """Convenience function for external callers needing progression masks only."""
    return tumor_timeline_simulator.simulate_tumor_progression(mask=mask, effectiveness=effectiveness, steps=steps)