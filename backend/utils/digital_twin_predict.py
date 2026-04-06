"""Utilities for digital twin segmentation using a lightweight PyTorch model."""

from __future__ import annotations

import base64
import io
from pathlib import Path
from typing import Any, Dict, Optional

import torch
from PIL import Image
from torchvision import transforms


class TinyDigitalTwinUNet(torch.nn.Module):
    """Minimal segmentation network matching the saved state_dict layout."""

    def __init__(self) -> None:
        super().__init__()
        self.encoder = torch.nn.Sequential(
            torch.nn.Conv2d(3, 16, kernel_size=3, padding=1),
            torch.nn.ReLU(inplace=True),
            torch.nn.Conv2d(16, 32, kernel_size=3, padding=1),
            torch.nn.ReLU(inplace=True),
        )
        self.decoder = torch.nn.Sequential(
            torch.nn.Conv2d(32, 16, kernel_size=3, padding=1),
            torch.nn.ReLU(inplace=True),
            torch.nn.Conv2d(16, 1, kernel_size=1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        x = self.encoder(x)
        x = self.decoder(x)
        return x


class DigitalTwinPredictor:
    """Loads the digital twin model once and returns segmentation analysis."""

    SEGMENTATION_THRESHOLD = 0.6

    def __init__(self, model_path: Optional[Path] = None) -> None:
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model_path = model_path or self._resolve_model_path()
        self.model: Optional[torch.nn.Module] = None
        self.model_load_error: Optional[str] = None
        self.transform = transforms.Compose(
            [
                transforms.ToTensor(),
                transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5]),
            ]
        )

        try:
            self.model = self._load_model(self.model_path)
            self.model.eval()
        except Exception as exc:
            self.model_load_error = str(exc)

    @staticmethod
    def _resolve_model_path() -> Path:
        backend_dir = Path(__file__).resolve().parent.parent
        return backend_dir / "model" / "digital_twin_unet.pth"

    def _load_model(self, model_path: Path) -> torch.nn.Module:
        if not model_path.exists():
            raise FileNotFoundError(
                f"Digital twin model not found at '{model_path}'. Place digital_twin_unet.pth in backend/model/."
            )

        loaded = torch.load(str(model_path), map_location=self.device, weights_only=False)
        if not isinstance(loaded, dict):
            raise ValueError("Unsupported digital twin checkpoint format. Expected a state_dict.")

        model = TinyDigitalTwinUNet()
        model.load_state_dict(loaded)
        return model.to(self.device)

    @staticmethod
    def _classify_aggressiveness(area_ratio: float) -> str:
        if area_ratio >= 0.18:
            return "high"
        if area_ratio >= 0.07:
            return "moderate"
        return "low"

    @staticmethod
    def _encode_overlay(image: Image.Image, mask: torch.Tensor) -> str:
        base = image.convert("RGBA")
        mask_img = Image.fromarray((mask.cpu().numpy() * 255).astype("uint8"), mode="L")
        overlay = Image.new("RGBA", base.size, (255, 59, 92, 0))
        overlay.putalpha(mask_img.point(lambda value: 120 if value > 0 else 0))
        composed = Image.alpha_composite(base, overlay)

        buffer = io.BytesIO()
        composed.save(buffer, format="PNG")
        encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
        return f"data:image/png;base64,{encoded}"

    @staticmethod
    def _encode_source_image(image: Image.Image) -> str:
        buffer = io.BytesIO()
        image.convert("RGB").save(buffer, format="PNG")
        encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
        return f"data:image/png;base64,{encoded}"

    @staticmethod
    def _encode_mask(mask: torch.Tensor) -> str:
        mask_img = Image.fromarray((mask.cpu().numpy() * 255).astype("uint8"), mode="L")
        buffer = io.BytesIO()
        mask_img.save(buffer, format="PNG")
        encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
        return f"data:image/png;base64,{encoded}"

    @staticmethod
    def _build_bbox(mask: torch.Tensor) -> Optional[Dict[str, float]]:
        indices = torch.nonzero(mask > 0, as_tuple=False)
        if indices.numel() == 0:
            return None

        y_coords = indices[:, 0]
        x_coords = indices[:, 1]
        height, width = mask.shape
        return {
            "x_min": round(float(x_coords.min().item() / width), 4),
            "y_min": round(float(y_coords.min().item() / height), 4),
            "x_max": round(float(x_coords.max().item() / width), 4),
            "y_max": round(float(y_coords.max().item() / height), 4),
        }

    def predict_image(self, image_path: Path) -> Dict[str, Any]:
        if self.model is None:
            raise RuntimeError(
                "Digital twin model is not available. "
                f"Load error: {self.model_load_error or 'unknown error'}"
            )

        image = Image.open(image_path).convert("RGB")
        original_size = image.size
        tensor = self.transform(image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            logits = self.model(tensor)
            probabilities = torch.sigmoid(logits)[0, 0]

        binary_mask = (probabilities >= self.SEGMENTATION_THRESHOLD).to(torch.uint8)
        area_ratio = float(binary_mask.float().mean().item())
        positive_pixels = probabilities[binary_mask.bool()]
        segmentation_confidence = float(
            positive_pixels.mean().item() if positive_pixels.numel() else probabilities.max().item()
        )

        return {
            "available": True,
            "mask_area_ratio": round(area_ratio, 4),
            "mask_coverage_pct": round(area_ratio * 100, 2),
            "segmentation_confidence": round(segmentation_confidence, 4),
            "aggressiveness": self._classify_aggressiveness(area_ratio),
            "bounding_box": self._build_bbox(binary_mask),
            "image_width": int(original_size[0]),
            "image_height": int(original_size[1]),
            "source_image": self._encode_source_image(image),
            "mask_image": self._encode_mask(binary_mask),
            "overlay_image": self._encode_overlay(image, binary_mask),
        }


digital_twin_predictor = DigitalTwinPredictor()