"""Reproducible training script for the SlopeGuard Random Forest Landslide Classifier."""

import argparse
import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Tuple

# Ensure package root is in sys.path
BASE_DIR_RESOLVED = Path(__file__).resolve().parent.parent
if str(BASE_DIR_RESOLVED) not in sys.path:
    sys.path.insert(0, str(BASE_DIR_RESOLVED))

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    accuracy_score,
    confusion_matrix,
    roc_auc_score,
    average_precision_score,
    classification_report,
)
from sklearn.pipeline import Pipeline

from src.config import (
    BASE_DIR,
    SYNTHETIC_DATA_PATH,
    MODEL_ARTIFACT_PATH,
    METADATA_ARTIFACT_PATH,
    EVALUATION_REPORT_PATH,
    RANDOM_SEED,
    MODEL_VERSION,
    MODEL_STATUS_DEMO,
    MODEL_STATUS_VALIDATED,
    DEFAULT_RF_PARAMS,
    MANDATORY_NUMERICAL_FEATURES,
    OPTIONAL_NUMERICAL_FEATURES,
    OPTIONAL_CATEGORICAL_FEATURES,
    TARGET_COLUMN,
    DISCLAIMER_TEXT,
)
from src.data_validator import DatasetValidator
from src.pipeline import create_preprocessor, extract_feature_names

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def split_data_preventing_leakage(
    df: pd.DataFrame,
    test_ratio: float = 0.25,
    split_strategy: str = "temporal"
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Split dataset into training and evaluation sets preventing data snooping and target leakage.
    - 'temporal': Strictly trains on earlier dates and evaluates on subsequent dates (no future data predicting past).
    - 'random': Fallback stratified split if timestamp column is absent.
    """
    if split_strategy == "temporal" and "observation_timestamp" in df.columns:
        logger.info("Performing chronological temporal split to eliminate look-ahead leakage.")
        df_sorted = df.sort_values(by="observation_timestamp").reset_index(drop=True)
        split_idx = int(len(df_sorted) * (1.0 - test_ratio))
        train_df = df_sorted.iloc[:split_idx].copy()
        test_df = df_sorted.iloc[split_idx:].copy()
    else:
        logger.info("Performing random split (stratified by target label).")
        from sklearn.model_selection import train_test_split
        train_df, test_df = train_test_split(
            df,
            test_size=test_ratio,
            random_state=RANDOM_SEED,
            stratify=df[TARGET_COLUMN] if df[TARGET_COLUMN].nunique() > 1 else None,
        )

    logger.info("Split completed: Train set = %d rows, Test set = %d rows", len(train_df), len(test_df))
    return train_df, test_df


def train_model(
    data_path: Path = SYNTHETIC_DATA_PATH,
    output_model_path: Path = MODEL_ARTIFACT_PATH,
    output_metadata_path: Path = METADATA_ARTIFACT_PATH,
    output_eval_path: Path = EVALUATION_REPORT_PATH,
    rf_params: Dict[str, Any] = None,
    allow_synthetic_mixture: bool = False,
) -> Dict[str, Any]:
    """Train Random Forest classifier, evaluate without leakage, and save artifacts."""
    logger.info("Starting SlopeGuard model training pipeline on: %s", data_path)

    # 1. Dataset Validation
    validator = DatasetValidator(allow_synthetic_mixture=allow_synthetic_mixture)
    clean_df, data_metadata = validator.validate_file(data_path)

    # Determine Model Governance Status
    is_synthetic = data_metadata.get("is_synthetic_dataset", True)
    model_status = MODEL_STATUS_DEMO if is_synthetic else MODEL_STATUS_VALIDATED

    if is_synthetic:
        logger.warning(
            "TRAINING ON SYNTHETIC FIXTURES: Artifact will be flagged as '%s'. "
            "DO NOT USE IN REAL-WORLD DISASTER WARNINGS.",
            model_status,
        )

    # 2. Train / Test Split (Temporal to prevent leakage)
    train_df, test_df = split_data_preventing_leakage(clean_df, test_ratio=0.25, split_strategy="temporal")

    # 3. Features & Targets
    numerical_cols = MANDATORY_NUMERICAL_FEATURES + OPTIONAL_NUMERICAL_FEATURES
    categorical_cols = OPTIONAL_CATEGORICAL_FEATURES

    X_train = train_df[numerical_cols + categorical_cols]
    y_train = train_df[TARGET_COLUMN]

    X_test = test_df[numerical_cols + categorical_cols]
    y_test = test_df[TARGET_COLUMN]

    # 4. Construct Scikit-Learn Pipeline
    params = DEFAULT_RF_PARAMS.copy()
    if rf_params:
        params.update(rf_params)

    preprocessor = create_preprocessor(numerical_cols, categorical_cols)
    classifier = RandomForestClassifier(**params)

    full_pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", classifier),
        ]
    )

    logger.info("Fitting Random Forest pipeline with parameters: %s", params)
    full_pipeline.fit(X_train, y_train)

    # 5. Evaluate on Held-Out Test Set (Uncalibrated Baseline)
    y_pred = full_pipeline.predict(X_test)
    y_proba = full_pipeline.predict_proba(X_test)[:, 1] if hasattr(full_pipeline, "predict_proba") else None

    # Calculate Multi-Dimensional Metrics (Never accuracy alone!)
    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    cm = confusion_matrix(y_test, y_pred).tolist()

    roc_auc = None
    pr_auc = None
    if y_proba is not None and len(np.unique(y_test)) > 1:
        try:
            roc_auc = float(roc_auc_score(y_test, y_proba))
            pr_auc = float(average_precision_score(y_test, y_proba))
        except Exception as e:
            logger.warning("ROC/PR-AUC calculation skipped: %s", e)

    # 5b. Probability Calibration Assessment
    calibration_report = {}
    from sklearn.metrics import brier_score_loss
    from sklearn.calibration import CalibratedClassifierCV

    if y_proba is not None and len(np.unique(y_test)) > 1:
        brier_uncalibrated = float(brier_score_loss(y_test, y_proba))
        calibration_report["brier_score_uncalibrated"] = round(brier_uncalibrated, 4)

        if not is_synthetic and len(train_df) >= 100:
            logger.info("Evaluating Platt scaling (sigmoid) probability calibration on real data...")
            try:
                calibrator = CalibratedClassifierCV(estimator=full_pipeline, cv=3, method="sigmoid")
                calibrator.fit(X_train, y_train)
                y_proba_cal = calibrator.predict_proba(X_test)[:, 1]
                brier_calibrated = float(brier_score_loss(y_test, y_proba_cal))
                calibration_report["brier_score_calibrated_platt"] = round(brier_calibrated, 4)
                calibration_report["calibration_method"] = "platt_scaling_sigmoid"
                calibration_report["brier_improvement"] = round(brier_uncalibrated - brier_calibrated, 4)
                calibration_report["status"] = "CALIBRATION_EVALUATED"
            except Exception as e:
                logger.warning("Calibration fitting failed: %s", e)
                calibration_report["status"] = "CALIBRATION_ERROR"
                calibration_report["note"] = str(e)
        else:
            calibration_report["status"] = "CALIBRATION_DEFERRED"
            calibration_report["reason"] = (
                "Insufficient sample size or synthetic fixtures used. "
                "Probability calibration (Platt/Isotonic) on synthetic data would yield deceptive "
                "confidence curves for real-world deployment. Deferred until verified field data is ingested."
            )
    else:
        calibration_report["status"] = "NOT_APPLICABLE"

    # 6. Extract Feature Importances
    fitted_preprocessor = full_pipeline.named_steps["preprocessor"]
    fitted_classifier = full_pipeline.named_steps["classifier"]
    transformed_feature_names = extract_feature_names(fitted_preprocessor, numerical_cols, categorical_cols)

    importances = fitted_classifier.feature_importances_
    feature_importance_dict = {}
    for name, imp in zip(transformed_feature_names, importances):
        feature_importance_dict[name] = round(float(imp), 4)

    # Sort descending by importance
    sorted_importances = sorted(feature_importance_dict.items(), key=lambda x: x[1], reverse=True)

    # 7. Compile Evaluation Report & Metadata
    timestamp_now = datetime.now(timezone.utc).isoformat()

    evaluation_report = {
        "model_version": MODEL_VERSION,
        "model_status": model_status,
        "evaluation_timestamp": timestamp_now,
        "test_split_size": len(test_df),
        "split_method": "temporal_holdout",
        "metrics": {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(roc_auc, 4) if roc_auc is not None else None,
            "pr_auc": round(pr_auc, 4) if pr_auc is not None else None,
            "confusion_matrix": cm,
            "class_distribution_test": {
                "class_0_count": int((y_test == 0).sum()),
                "class_1_count": int((y_test == 1).sum()),
            },
        },
        "calibration": calibration_report,
        "feature_importances": dict(sorted_importances),
        "feature_importance_limitation": (
            "Gini-based feature importances indicate internal tree split frequency only and "
            "do not imply geotechnical or physical causality."
        ),
        "disclaimer": DISCLAIMER_TEXT,
    }

    model_metadata = {
        "model_version": MODEL_VERSION,
        "model_status": model_status,
        "training_timestamp": timestamp_now,
        "algorithm": "RandomForestClassifier",
        "hyperparameters": params,
        "training_dataset": {
            "source_path": str(data_path),
            "total_records": data_metadata["valid_rows"],
            "is_synthetic": is_synthetic,
            "class_distribution": data_metadata["class_distribution"],
            "data_sources": data_metadata["unique_data_sources"],
        },
        "features": {
            "numerical": numerical_cols,
            "categorical": categorical_cols,
            "transformed_names": transformed_feature_names,
        },
        "disclaimer": DISCLAIMER_TEXT,
    }

    # 8. Save Artifacts
    output_model_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(full_pipeline, output_model_path)
    logger.info("Saved model artifact to: %s", output_model_path)

    with open(output_metadata_path, "w", encoding="utf-8") as f:
        json.dump(model_metadata, f, indent=2)
    logger.info("Saved model metadata to: %s", output_metadata_path)

    with open(output_eval_path, "w", encoding="utf-8") as f:
        json.dump(evaluation_report, f, indent=2)
    logger.info("Saved evaluation report to: %s", output_eval_path)

    return {
        "model_status": model_status,
        "evaluation": evaluation_report,
        "metadata": model_metadata,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train SlopeGuard Landslide Random Forest Classifier")
    parser.add_argument("--data", type=Path, default=SYNTHETIC_DATA_PATH, help="Path to input CSV dataset")
    parser.add_argument("--allow-synthetic", action="store_true", help="Allow synthetic training data")
    args = parser.parse_args()

    results = train_model(data_path=args.data, allow_synthetic_mixture=args.allow_synthetic)
    print("\nTraining completed successfully!")
    print(f"Model Status: {results['model_status']}")
    print(f"Metrics: {results['evaluation']['metrics']}")
