"""Inference and risk estimation engine for SlopeGuard."""

import json
import logging
from pathlib import Path
from typing import Dict, Any, Optional, List
import joblib
import pandas as pd
import numpy as np

from src.config import (
    MODEL_ARTIFACT_PATH,
    METADATA_ARTIFACT_PATH,
    MODEL_VERSION,
    MODEL_STATUS_DEMO,
    PROVISIONAL_RISK_THRESHOLDS,
    MANDATORY_NUMERICAL_FEATURES,
    OPTIONAL_NUMERICAL_FEATURES,
    OPTIONAL_CATEGORICAL_FEATURES,
    DISCLAIMER_TEXT,
    OUTPUT_TYPE,
    CALIBRATION_STATUS,
    THRESHOLD_REVIEW_STATUS,
)
from src.schema import (
    PredictionRequest,
    PredictionResponse,
    FeatureImportanceItem,
)

logger = logging.getLogger(__name__)


class LandslidePredictor:
    """Manages model loading, feature alignment, and inference."""

    def __init__(
        self,
        model_path: Path = MODEL_ARTIFACT_PATH,
        metadata_path: Path = METADATA_ARTIFACT_PATH,
    ):
        self.model_path = model_path
        self.metadata_path = metadata_path
        self.model = None
        self.metadata = {}
        self.model_status = MODEL_STATUS_DEMO
        self.is_loaded = False
        self._load_artifacts()

    def _load_artifacts(self) -> None:
        """Safely load model pipeline and governance metadata."""
        if not self.model_path.exists():
            logger.warning("Model artifact not found at: %s. Predictions will be unavailable.", self.model_path)
            self.is_loaded = False
            return

        try:
            self.model = joblib.load(self.model_path)
            if self.metadata_path.exists():
                with open(self.metadata_path, "r", encoding="utf-8") as f:
                    self.metadata = json.load(f)
                self.model_status = self.metadata.get("model_status", MODEL_STATUS_DEMO)
            else:
                self.model_status = MODEL_STATUS_DEMO

            self.is_loaded = True
            logger.info("Successfully loaded model artifact (%s) with status: %s", self.model_path.name, self.model_status)
        except Exception as e:
            logger.error("Failed to load model artifact: %s", e)
            self.is_loaded = False

    def predict(self, request: PredictionRequest) -> PredictionResponse:
        """Perform landslide hazard inference on validated request."""
        supplied_dict = request.model_dump()
        location_dict = {
            "latitude": request.latitude,
            "longitude": request.longitude,
        }

        # Check if model artifact is available
        if not self.is_loaded or self.model is None:
            return PredictionResponse(
                prediction_status="MODEL_UNAVAILABLE",
                model_version=MODEL_VERSION,
                model_status=self.model_status,
                location=location_dict,
                input_features_supplied=supplied_dict,
                risk_score=None,
                predicted_class=None,
                risk_category="UNAVAILABLE",
                is_provisional_category=True,
                top_contributing_features=[],
                warnings=[
                    "Model artifact is not loaded or has not been trained yet. No risk score could be generated."
                ],
                disclaimer=DISCLAIMER_TEXT,
            )

        # Assemble single-row DataFrame for pipeline
        df_row = pd.DataFrame([supplied_dict])

        # Ensure all expected columns exist even if null in request
        for col in OPTIONAL_NUMERICAL_FEATURES + OPTIONAL_CATEGORICAL_FEATURES:
            if col not in df_row.columns:
                df_row[col] = np.nan

        warnings: List[str] = []
        if self.model_status == MODEL_STATUS_DEMO:
            warnings.append(
                "CAUTION: Model was trained on synthetic demonstration fixtures only. "
                "Prediction is NOT validated against real-world geological survey records."
            )

        # Check domain distinction: static susceptibility vs dynamic rainfall trigger
        if request.rainfall_24h_mm == 0.0 and request.slope_deg > 35.0:
            warnings.append(
                "High slope angle indicates elevated static terrain susceptibility, but 24h rainfall "
                "is 0.0 mm. Antecedent moisture or seismic activity would be required to trigger failure."
            )

        try:
            # Predict probability of class 1 (landslide)
            if hasattr(self.model, "predict_proba"):
                probabilities = self.model.predict_proba(df_row)[0]
                risk_score = float(probabilities[1]) if len(probabilities) > 1 else float(probabilities[0])
            else:
                raw_pred = self.model.predict(df_row)[0]
                risk_score = float(raw_pred)

            predicted_class = int(self.model.predict(df_row)[0])
            risk_score = round(risk_score, 4)

            # Map to provisional category
            risk_category = self._categorize_score(risk_score)

            # Extract top contributing features from classifier importances
            top_features = self._extract_top_features()

            return PredictionResponse(
                prediction_status="SUCCESS" if self.model_status != MODEL_STATUS_DEMO else "DEMO_PREDICTION",
                model_version=MODEL_VERSION,
                model_status=self.model_status,
                output_type=OUTPUT_TYPE,
                calibration_status=CALIBRATION_STATUS,
                threshold_review_status=THRESHOLD_REVIEW_STATUS,
                location=location_dict,
                input_features_supplied=supplied_dict,
                risk_score=risk_score,
                predicted_class=predicted_class,
                risk_category=risk_category,
                is_provisional_category=True,
                top_contributing_features=top_features,
                warnings=warnings,
                disclaimer=DISCLAIMER_TEXT,
            )

        except Exception as e:
            logger.error("Inference execution failed: %s", e)
            return PredictionResponse(
                prediction_status="INFERENCE_FAILED",
                model_version=MODEL_VERSION,
                model_status=self.model_status,
                output_type=OUTPUT_TYPE,
                calibration_status=CALIBRATION_STATUS,
                threshold_review_status=THRESHOLD_REVIEW_STATUS,
                location=location_dict,
                input_features_supplied=supplied_dict,
                risk_score=None,
                predicted_class=None,
                risk_category="UNAVAILABLE",
                is_provisional_category=True,
                top_contributing_features=[],
                warnings=[
                    "An internal mathematical error occurred during inference. No prediction generated."
                ],
                disclaimer=DISCLAIMER_TEXT,
            )

    def _categorize_score(self, score: float) -> str:
        """Map score to provisional risk category."""
        if score < PROVISIONAL_RISK_THRESHOLDS["LOW"]:
            return "LOW"
        elif score < PROVISIONAL_RISK_THRESHOLDS["MODERATE"]:
            return "MODERATE"
        elif score < PROVISIONAL_RISK_THRESHOLDS["HIGH"]:
            return "HIGH"
        else:
            return "SEVERE"

    def _extract_top_features(self, top_n: int = 4) -> List[FeatureImportanceItem]:
        """Extract top feature importances from pipeline if available."""
        items: List[FeatureImportanceItem] = []
        try:
            if hasattr(self.model, "named_steps") and "classifier" in self.model.named_steps:
                classifier = self.model.named_steps["classifier"]
                preprocessor = self.model.named_steps["preprocessor"]
                numerical_cols = MANDATORY_NUMERICAL_FEATURES + OPTIONAL_NUMERICAL_FEATURES
                categorical_cols = OPTIONAL_CATEGORICAL_FEATURES
                names = [
                    col for col in numerical_cols
                ]
                importances = classifier.feature_importances_
                
                # Pair and sort
                paired = sorted(zip(names[:len(importances)], importances), key=lambda x: x[1], reverse=True)
                for name, imp in paired[:top_n]:
                    items.append(
                        FeatureImportanceItem(
                            feature=name,
                            importance_weight=round(float(imp), 4),
                            interpretation_note=(
                                f"Feature '{name}' contributed to tree partition splits. "
                                "Does not establish geotechnical causation."
                            )
                        )
                    )
        except Exception as e:
            logger.warning("Could not extract feature importances: %s", e)

        return items
