"""Configuration constants and paths for SlopeGuard AI Service."""

import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# Default Artifact Files
MODEL_ARTIFACT_PATH = MODELS_DIR / "landslide_rf_model.joblib"
METADATA_ARTIFACT_PATH = MODELS_DIR / "model_metadata.json"
EVALUATION_REPORT_PATH = MODELS_DIR / "evaluation_report.json"
SYNTHETIC_DATA_PATH = DATA_DIR / "synthetic_fixtures.csv"

# Model Status & Governance
MODEL_VERSION = "0.1.0-prototype"
MODEL_STATUS_DEMO = "DEMO_NOT_VALIDATED"
MODEL_STATUS_VALIDATED = "VALIDATED_HISTORICAL"

# Phase 11 Governance & Scientific Validation Constants
OUTPUT_TYPE = "UNCALIBRATED_HAZARD_SCORE"
CALIBRATION_STATUS = "CALIBRATION_DEFERRED"
THRESHOLD_SET_VERSION = "1.0.0-candidate"
THRESHOLD_REVIEW_STATUS = "PENDING_EXPERT_REVIEW"
DATA_READINESS_STATUS = "DATASET_INSUFFICIENT_FOR_OPERATIONAL_VALIDATION"

THRESHOLDS_DIR = BASE_DIR / "thresholds"
CANDIDATE_THRESHOLDS_PATH = THRESHOLDS_DIR / "candidate_thresholds_v1.json"

# Default Random Seed
RANDOM_SEED = 42

# Geographic Coordinate Bounds (Global & Regional Checks)
LATITUDE_MIN = -90.0
LATITUDE_MAX = 90.0
LONGITUDE_MIN = -180.0
LONGITUDE_MAX = 180.0

# Mandatory Core Features Required for Training & Inference
MANDATORY_NUMERICAL_FEATURES = [
    "latitude",
    "longitude",
    "rainfall_24h_mm",
    "slope_deg",
]

# Optional Numerical Features (Supported with Imputation)
OPTIONAL_NUMERICAL_FEATURES = [
    "rainfall_72h_mm",
    "elevation_m",
    "vegetation_ndvi",
    "aspect_deg",
]

# Optional Categorical Features (Supported with One-Hot Encoding)
OPTIONAL_CATEGORICAL_FEATURES = [
    "lithology",
    "soil_type",
]

ALL_FEATURE_COLUMNS = (
    MANDATORY_NUMERICAL_FEATURES
    + OPTIONAL_NUMERICAL_FEATURES
    + OPTIONAL_CATEGORICAL_FEATURES
)

TARGET_COLUMN = "landslide_occurred"
METADATA_COLUMNS = ["record_id", "observation_timestamp", "is_synthetic", "data_source"]

# Default Hyperparameters for Random Forest Baseline
DEFAULT_RF_PARAMS = {
    "n_estimators": 100,
    "max_depth": 6,
    "min_samples_split": 4,
    "min_samples_leaf": 2,
    "random_state": RANDOM_SEED,
    "class_weight": "balanced",
}

# Provisional Risk Category Thresholds (Heuristic & Mathematical Only)
# CAUTION: These are NOT certified civil-protection thresholds.
PROVISIONAL_RISK_THRESHOLDS = {
    "LOW": 0.25,
    "MODERATE": 0.55,
    "HIGH": 0.75,
    "SEVERE": 1.00,
}

DISCLAIMER_TEXT = (
    "EXPERIMENTAL PROTOTYPE: This AI-generated risk score is an uncalibrated mathematical "
    "estimate based on a demonstration pipeline. It is not an official disaster warning, "
    "evacuation trigger, or geotechnical certification of slope stability."
)
