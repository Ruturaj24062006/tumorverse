"""
Configuration for the Cancer Prediction API backend.
Handles API settings and model configurations.
"""

from pathlib import Path
from typing import Optional, List

try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # API Configuration
    api_title: str = "Cancer Type Prediction API"
    api_version: str = "1.0.0"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = False

    # Model Configuration
    model_dir: Path = Path(__file__).parent / "model"
    classifier_path: Optional[Path] = None
    pca_model_path: Optional[Path] = None
    label_encoder_path: Optional[Path] = None

    # Feature Configuration
    expected_features: int = 20531
    pca_components: int = 500

    # CORS Configuration
    cors_origins: List[str] = ["*"]
    cors_credentials: bool = True
    cors_methods: List[str] = ["*"]
    cors_headers: List[str] = ["*"]

    class Config:
        env_file = ".env"
        case_sensitive = False
        arbitrary_types_allowed = True

    def __init__(self, **data):
        """Initialize settings."""
        super().__init__(**data)
        # Set default model paths if not provided
        if self.classifier_path is None:
            self.classifier_path = self.model_dir / "tumor_classifier.pkl"
        if self.pca_model_path is None:
            self.pca_model_path = self.model_dir / "pca_model.pkl"
        if self.label_encoder_path is None:
            self.label_encoder_path = self.model_dir / "label_encoder.pkl"


settings = Settings()
