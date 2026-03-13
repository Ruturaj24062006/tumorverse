"""Utilities for tumor image prediction using a PyTorch CNN model."""

from __future__ import annotations

import os
import tempfile
from pathlib import Path
from typing import Any, Dict, List, Optional
import zipfile

import torch
import torch.nn.functional as F
from PIL import Image
from torchvision import models, transforms


DEFAULT_CLASS_NAMES = ["no_tumor", "glioma", "meningioma", "pituitary"]
NO_TUMOR_LABELS = {"no_tumor", "notumor", "normal", "healthy", "negative"}


class ImagePredictor:
    """Loads the CNN model once and serves image predictions."""

    def __init__(self, model_path: Optional[Path] = None) -> None:
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model_path = model_path or self._resolve_model_path()
        self.class_names: List[str] = list(DEFAULT_CLASS_NAMES)
        self.model: Optional[torch.nn.Module] = None
        self.model_load_error: Optional[str] = None

        try:
            self.model = self._load_model(self.model_path)
            self.model.eval()
        except Exception as exc:
            # Keep API startup alive and surface this when prediction is requested.
            self.model_load_error = str(exc)

        self.transform = transforms.Compose(
            [
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
            ]
        )

    @staticmethod
    def _resolve_model_path() -> Path:
        backend_dir = Path(__file__).resolve().parent.parent
        model_dir = backend_dir / "model"

        env_path = os.getenv("IMAGE_MODEL_PATH")
        candidates = []
        if env_path:
            candidates.append(Path(env_path))

        candidates.extend(
            [
                model_dir / "tumor_cnn_model.pth",
                model_dir / "tumor_cnn_model",
            ]
        )

        for path in candidates:
            if path.exists():
                return path

        return model_dir / "tumor_cnn_model.pth"

    def _extract_class_names(self, checkpoint: Dict[str, Any]) -> Optional[List[str]]:
        if "class_names" in checkpoint and isinstance(checkpoint["class_names"], (list, tuple)):
            return [str(x) for x in checkpoint["class_names"]]

        if "classes" in checkpoint and isinstance(checkpoint["classes"], (list, tuple)):
            return [str(x) for x in checkpoint["classes"]]

        if "idx_to_class" in checkpoint and isinstance(checkpoint["idx_to_class"], dict):
            idx_to_class = checkpoint["idx_to_class"]
            return [str(idx_to_class[i]) for i in sorted(idx_to_class.keys())]

        return None

    def _ensure_class_name_count(self, num_classes: int) -> None:
        if len(self.class_names) == num_classes:
            return

        fallback_names = list(DEFAULT_CLASS_NAMES)
        if len(fallback_names) < num_classes:
            fallback_names.extend(
                f"class_{index}" for index in range(len(fallback_names), num_classes)
            )

        self.class_names = fallback_names[:num_classes]

    def _looks_like_state_dict(self, checkpoint: Dict[str, Any]) -> bool:
        if not checkpoint:
            return False

        sample_keys = tuple(checkpoint.keys())
        return any(key.endswith(".weight") for key in sample_keys) and "conv1.weight" in checkpoint

    def _load_resnet50_state_dict(self, checkpoint: Dict[str, Any]) -> torch.nn.Module:
        state_dict = {
            str(key).removeprefix("module."): value for key, value in checkpoint.items()
        }

        fc_weight = state_dict.get("fc.weight")
        fc_bias = state_dict.get("fc.bias")
        if not isinstance(fc_weight, torch.Tensor) or not isinstance(fc_bias, torch.Tensor):
            raise ValueError("ResNet checkpoint is missing fc.weight/fc.bias tensors.")

        num_classes = int(fc_weight.shape[0])
        model = models.resnet50(weights=None)
        model.fc = torch.nn.Linear(model.fc.in_features, num_classes)
        model.load_state_dict(state_dict)
        self._ensure_class_name_count(num_classes)
        return model.to(self.device)

    def _repack_extracted_checkpoint(self, model_dir: Path) -> Path:
        archive_members = ["data.pkl", "version", "byteorder"]
        if not all((model_dir / member).exists() for member in archive_members):
            raise ValueError(
                f"Unsupported model directory format at '{model_dir}'. "
                "Expected extracted PyTorch archive contents."
            )

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pt") as temp_file:
            temp_path = Path(temp_file.name)

        with zipfile.ZipFile(temp_path, "w", compression=zipfile.ZIP_STORED) as archive:
            for file_path in model_dir.rglob("*"):
                if file_path.is_file():
                    archive_name = Path("archive") / file_path.relative_to(model_dir)
                    archive.write(file_path, archive_name.as_posix())

        return temp_path

    def _torch_load_checkpoint(self, load_target: Path) -> Any:
        try:
            return torch.load(str(load_target), map_location=self.device)
        except Exception as exc:
            message = str(exc)
            if "Weights only load failed" not in message:
                raise

            # This project loads a trusted local checkpoint bundled with the repo.
            return torch.load(str(load_target), map_location=self.device, weights_only=False)

    def _load_model(self, model_path: Path) -> torch.nn.Module:
        if not model_path.exists():
            raise FileNotFoundError(
                f"Image model not found at '{model_path}'. Place tumor_cnn_model.pth in backend/model/."
            )

        load_target = model_path
        temp_archive: Optional[Path] = None
        if model_path.is_dir():
            temp_archive = self._repack_extracted_checkpoint(model_path)
            load_target = temp_archive

        try:
            # Prefer TorchScript because it is architecture-independent.
            try:
                scripted = torch.jit.load(str(load_target), map_location=self.device)
                return scripted
            except Exception:
                pass

            loaded = self._torch_load_checkpoint(load_target)

            if isinstance(loaded, torch.nn.Module):
                return loaded.to(self.device)

            if isinstance(loaded, dict):
                class_names = self._extract_class_names(loaded)
                if class_names:
                    self.class_names = class_names

                # Common checkpoint format where a complete module is bundled.
                if "model" in loaded and isinstance(loaded["model"], torch.nn.Module):
                    return loaded["model"].to(self.device)

                if "state_dict" in loaded and isinstance(loaded["state_dict"], dict):
                    return self._load_resnet50_state_dict(loaded["state_dict"])

                if "model_state_dict" in loaded and isinstance(loaded["model_state_dict"], dict):
                    return self._load_resnet50_state_dict(loaded["model_state_dict"])

                if self._looks_like_state_dict(loaded):
                    return self._load_resnet50_state_dict(loaded)

                # State-dict-only checkpoints require model architecture code.
                if any(k in loaded for k in ("state_dict", "model_state_dict")):
                    raise ValueError(
                        "Checkpoint contains only state_dict and its architecture is not supported by the loader."
                    )
        finally:
            if temp_archive and temp_archive.exists():
                temp_archive.unlink(missing_ok=True)

        raise ValueError(
            "Unsupported image model format. Expected TorchScript, nn.Module, or checkpoint with 'model'."
        )

    def _postprocess(self, logits: torch.Tensor) -> Dict[str, Any]:
        if logits.ndim == 1:
            logits = logits.unsqueeze(0)

        if logits.shape[-1] == 1:
            tumor_prob = torch.sigmoid(logits)[0, 0].item()
            class_idx = 1 if tumor_prob >= 0.5 else 0
            confidence = tumor_prob if class_idx == 1 else (1.0 - tumor_prob)

            if len(self.class_names) >= 2:
                predicted_label = self.class_names[class_idx]
            else:
                predicted_label = "tumor" if class_idx == 1 else "no_tumor"
        else:
            probs = F.softmax(logits, dim=1)
            confidence_tensor, idx_tensor = torch.max(probs, dim=1)
            class_idx = int(idx_tensor.item())
            confidence = float(confidence_tensor.item())
            if class_idx < len(self.class_names):
                predicted_label = self.class_names[class_idx]
            else:
                predicted_label = f"class_{class_idx}"

        normalized_label = predicted_label.strip().lower().replace(" ", "_")
        tumor_detected = normalized_label not in NO_TUMOR_LABELS

        return {
            "tumor_detected": bool(tumor_detected),
            "tumor_type": normalized_label if tumor_detected else "no_tumor",
            "confidence": round(float(confidence), 4),
        }

    def predict_image(self, image_path: Path) -> Dict[str, Any]:
        if self.model is None:
            raise RuntimeError(
                "CNN image model is not available. "
                f"Load error: {self.model_load_error or 'unknown error'}"
            )

        image = Image.open(image_path).convert("RGB")
        tensor = self.transform(image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            output = self.model(tensor)
            if isinstance(output, (tuple, list)):
                output = output[0]

            if not isinstance(output, torch.Tensor):
                raise ValueError("Model output is not a tensor. Unsupported output format.")

        return self._postprocess(output)


predictor = ImagePredictor()
