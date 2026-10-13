"""Pydantic schemas and data validation models for SlopeGuard AI Service."""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field, model_validator


class HealthResponse(BaseModel):
    """Health check response schema."""
    status: str = "ok"
    service: str = "slopeguard-ai-service"
    version: str
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


class FeatureImportanceItem(BaseModel):
    """Feature importance contribution item."""
    feature: str
    importance_weight: float
    interpretation_note: str


class PredictionRequest(BaseModel):
    """Payload for landslide hazard inference requests."""
    latitude: float = Field(
        ...,
        ge=-90.0,
        le=90.0,
        description="WGS84 Latitude coordinate (-90.0 to 90.0)"
    )
    longitude: float = Field(
        ...,
        ge=-180.0,
        le=180.0,
        description="WGS84 Longitude coordinate (-180.0 to 180.0)"
    )
    rainfall_24h_mm: float = Field(
        ...,
        ge=0.0,
        le=1500.0,
        description="Cumulative precipitation in preceding 24 hours (mm)"
    )
    slope_deg: float = Field(
        ...,
        ge=0.0,
        le=90.0,
        description="Topographic slope angle in degrees (0.0 to 90.0)"
    )
    rainfall_72h_mm: Optional[float] = Field(
        None,
        ge=0.0,
        le=3000.0,
        description="Cumulative precipitation in preceding 72 hours (mm)"
    )
    elevation_m: Optional[float] = Field(
        None,
        ge=-500.0,
        le=9000.0,
        description="Elevation above mean sea level in metres"
    )
    vegetation_ndvi: Optional[float] = Field(
        None,
        ge=-1.0,
        le=1.0,
        description="Normalized Difference Vegetation Index (-1.0 to 1.0)"
    )
    aspect_deg: Optional[float] = Field(
        None,
        ge=0.0,
        le=360.0,
        description="Slope compass aspect orientation (0.0 to 360.0)"
    )
    lithology: Optional[str] = Field(
        None,
        description="Dominant rock/substrate type"
    )
    soil_type: Optional[str] = Field(
        None,
        description="Predominant soil texture class"
    )

    @model_validator(mode="after")
    def validate_rainfall_consistency(self) -> "PredictionRequest":
        """Verify that 72-hour rainfall is not physically lower than 24-hour rainfall."""
        if self.rainfall_72h_mm is not None:
            if self.rainfall_72h_mm < self.rainfall_24h_mm:
                raise ValueError(
                    f"Physically inconsistent precipitation: rainfall_72h_mm ({self.rainfall_72h_mm} mm) "
                    f"cannot be less than rainfall_24h_mm ({self.rainfall_24h_mm} mm)."
                )
        return self


class PredictionResponse(BaseModel):
    """Structured response for landslide risk estimation."""
    model_config = {"protected_namespaces": ()}

    prediction_status: str
    model_version: str
    model_status: str
    output_type: str = "UNCALIBRATED_HAZARD_SCORE"
    calibration_status: str = "CALIBRATION_DEFERRED"
    threshold_review_status: str = "PENDING_EXPERT_REVIEW"
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    location: Dict[str, float]
    input_features_supplied: Dict[str, Any]
    risk_score: Optional[float] = None
    predicted_class: Optional[int] = None
    risk_category: str
    is_provisional_category: bool = True
    top_contributing_features: List[FeatureImportanceItem] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    disclaimer: str


class ModelStatusResponse(BaseModel):
    """Model governance and readiness response schema."""
    model_config = {"protected_namespaces": ()}

    service_status: str
    model_version: str
    model_status: str
    output_type: str = "UNCALIBRATED_HAZARD_SCORE"
    calibration_status: str = "CALIBRATION_DEFERRED"
    threshold_set_version: str = "1.0.0-candidate"
    threshold_review_status: str = "PENDING_EXPERT_REVIEW"
    data_readiness_status: str = "DATASET_INSUFFICIENT_FOR_OPERATIONAL_VALIDATION"
    artifact_loaded: bool
    training_dataset_type: str
    evaluation_summary: Optional[Dict[str, Any]] = None
    uncertainty_notice: Optional[str] = (
        "Model outputs are uncalibrated ensemble scores from an experimental pipeline. "
        "Not certified for life-safety warnings or civil-protection emergency actions."
    )
    disclaimer: str
    timestamp: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

