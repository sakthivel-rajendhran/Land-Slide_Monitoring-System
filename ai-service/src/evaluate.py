"""
Leakage-Aware Model Evaluation & Calibration Analysis Pipeline for SlopeGuard.

Evaluates Random Forest Landslide Classifier using strict chronological temporal holdout,
encapsulates preprocessing within pipeline to eliminate data leakage, benchmarks against
physical heuristic baselines, computes multi-dimensional performance metrics, and assesses
probability calibration eligibility without inventing metrics.
"""

import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
    brier_score_loss,
)
from sklearn.pipeline import Pipeline

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from src.config import (
    MODEL_VERSION,
    MODEL_STATUS_DEMO,
    RANDOM_SEED,
    DEFAULT_RF_PARAMS,
    MANDATORY_NUMERICAL_FEATURES,
    OPTIONAL_NUMERICAL_FEATURES,
    OPTIONAL_CATEGORICAL_FEATURES,
    TARGET_COLUMN,
    EVALUATION_REPORT_PATH,
    METADATA_ARTIFACT_PATH,
    MODEL_ARTIFACT_PATH,
    SYNTHETIC_DATA_PATH,
    DISCLAIMER_TEXT,
)
from src.data_validator import DatasetValidator
from src.pipeline import create_preprocessor, extract_feature_names

logger = logging.getLogger(__name__)


def temporal_train_test_split(
    df: pd.DataFrame,
    test_ratio: float = 0.30,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Split dataset strictly chronologically by observation_timestamp.
    All training records strictly precede test records.
    Prevents look-ahead leakage.
    """
    df_sorted = df.sort_values(by="observation_timestamp").reset_index(drop=True)
    split_index = int(len(df_sorted) * (1.0 - test_ratio))
    split_index = max(1, min(split_index, len(df_sorted) - 1))

    train_df = df_sorted.iloc[:split_index].copy().reset_index(drop=True)
    test_df = df_sorted.iloc[split_index:].copy().reset_index(drop=True)

    if len(train_df) == 0 or len(test_df) == 0:
        raise ValueError("Cannot perform temporal split: dataset must have at least 2 records.")

    train_max_date = str(train_df["observation_timestamp"].max())
    test_min_date = str(test_df["observation_timestamp"].min())
    logger.info("Temporal split: Train ends %s | Test starts %s", train_max_date, test_min_date)

    if train_max_date > test_min_date:
        raise ValueError("Temporal leakage violation: Training timestamp overlaps or exceeds test timestamp.")

    return train_df, test_df


def evaluate_heuristic_baseline(
    test_df: pd.DataFrame,
    slope_threshold: float = 30.0,
    rainfall_threshold: float = 40.0,
) -> Dict[str, Any]:
    """
    Evaluate domain-specific geotechnical heuristic baseline:
    Predicts landslide (1) if slope > 30 deg AND 24h rainfall > 40 mm.
    """
    y_true = test_df[TARGET_COLUMN].values
    y_pred_heuristic = (
        (test_df["slope_deg"] >= slope_threshold)
        & (test_df["rainfall_24h_mm"] >= rainfall_threshold)
    ).astype(int).values

    acc = float(accuracy_score(y_true, y_pred_heuristic))
    prec = float(precision_score(y_true, y_pred_heuristic, zero_division=0))
    rec = float(recall_score(y_true, y_pred_heuristic, zero_division=0))
    f1 = float(f1_score(y_true, y_pred_heuristic, zero_division=0))

    return {
        "baseline_name": "Physical Heuristic Rule (Slope >= 30° & Rainfall >= 40mm)",
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
    }


def evaluate_majority_class_baseline(
    train_df: pd.DataFrame,
    test_df: pd.DataFrame,
) -> Dict[str, Any]:
    """
    Evaluate naive majority class baseline predictor.
    """
    majority_class = int(train_df[TARGET_COLUMN].mode()[0])
    y_true = test_df[TARGET_COLUMN].values
    y_pred_majority = np.full(len(y_true), majority_class)

    acc = float(accuracy_score(y_true, y_pred_majority))
    prec = float(precision_score(y_true, y_pred_majority, zero_division=0))
    rec = float(recall_score(y_true, y_pred_majority, zero_division=0))
    f1 = float(f1_score(y_true, y_pred_majority, zero_division=0))

    return {
        "baseline_name": f"Majority Class Baseline (Always predicts {majority_class})",
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
    }


def run_evaluation_pipeline(
    data_path: Path,
    output_report_path: Path = EVALUATION_REPORT_PATH,
    test_ratio: float = 0.30,
) -> Dict[str, Any]:
    """
    Execute full leakage-aware evaluation pipeline and write audit-ready evaluation report.
    """
    logger.info("Executing SlopeGuard leakage-aware evaluation on: %s", data_path)

    # 1. Validate dataset
    validator = DatasetValidator(allow_synthetic_mixture=False)
    clean_df, data_metadata = validator.validate_file(data_path)

    is_synthetic = data_metadata.get("is_synthetic_dataset", True)
    total_records = len(clean_df)

    # 2. Split strictly temporally
    train_df, test_df = temporal_train_test_split(clean_df, test_ratio=test_ratio)

    numerical_cols = MANDATORY_NUMERICAL_FEATURES + OPTIONAL_NUMERICAL_FEATURES
    categorical_cols = OPTIONAL_CATEGORICAL_FEATURES

    X_train = train_df[numerical_cols + categorical_cols]
    y_train = train_df[TARGET_COLUMN]

    X_test = test_df[numerical_cols + categorical_cols]
    y_test = test_df[TARGET_COLUMN]

    # 3. Fit pipeline on training split only
    preprocessor = create_preprocessor(numerical_cols, categorical_cols)
    classifier = RandomForestClassifier(**DEFAULT_RF_PARAMS)

    full_pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", classifier),
        ]
    )
    full_pipeline.fit(X_train, y_train)

    # 4. Predict on untouched test partition
    y_pred = full_pipeline.predict(X_test)
    y_scores = full_pipeline.predict_proba(X_test)[:, 1] if hasattr(full_pipeline, "predict_proba") else None

    # 5. Compute performance metrics
    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred, zero_division=0))
    rec = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    cm = confusion_matrix(y_test, y_pred).tolist()

    # Confusion matrix elements: [[TN, FP], [FN, TP]]
    tn = cm[0][0] if len(cm) > 0 and len(cm[0]) > 0 else 0
    fp = cm[0][1] if len(cm) > 0 and len(cm[0]) > 1 else 0
    fn = cm[1][0] if len(cm) > 1 and len(cm[1]) > 0 else 0
    tp = cm[1][1] if len(cm) > 1 and len(cm[1]) > 1 else 0

    far = round(float(fp / (fp + tn)), 4) if (fp + tn) > 0 else 0.0
    mer = round(float(fn / (fn + tp)), 4) if (fn + tp) > 0 else 0.0

    roc_auc = None
    pr_auc = None
    if y_scores is not None and len(np.unique(y_test)) > 1:
        try:
            roc_auc = round(float(roc_auc_score(y_test, y_scores)), 4)
            pr_auc = round(float(average_precision_score(y_test, y_scores)), 4)
        except Exception as e:
            logger.warning("Could not calculate AUC metrics: %s", e)

    # 6. Evaluate Baselines
    baseline_heuristic = evaluate_heuristic_baseline(test_df)
    baseline_majority = evaluate_majority_class_baseline(train_df, test_df)

    # 7. Probability Calibration Assessment
    calibration_analysis = {}
    if y_scores is not None and len(np.unique(y_test)) > 1:
        brier_uncalibrated = round(float(brier_score_loss(y_test, y_scores)), 4)
        calibration_analysis["brier_score_uncalibrated"] = brier_uncalibrated
    else:
        brier_uncalibrated = None

    # Strict scientific calibration decision
    # Calibration requires >= 100 verified historical field events to avoid fitting deceptive curves
    if is_synthetic or total_records < 100:
        calibration_analysis.update({
            "calibration_status": "CALIBRATION_DEFERRED",
            "deployed_calibration_mapping": None,
            "scientific_rationale": (
                "Probability calibration (Platt Sigmoid / Isotonic Regression) is explicitly DEFERRED. "
                f"Current dataset contains {total_records} records (synthetic or small prototype sample). "
                "Fitting an empirical calibration curve on an under-sampled or synthetic distribution "
                "creates deceptive confidence curves and misleads decision-makers into treating "
                "arbitrary model scores as true Bayesian probabilities. The output remains an "
                "UNCALIBRATED_HAZARD_SCORE."
            ),
            "sample_size_requirement": ">= 100 verified multi-monsoon field observations",
            "current_sample_size": total_records,
        })
    else:
        calibration_analysis.update({
            "calibration_status": "CALIBRATION_EVALUATED",
            "scientific_rationale": "Sufficient real-world sample size available for calibration assessment.",
        })

    # 8. Feature Importances
    fitted_classifier = full_pipeline.named_steps["classifier"]
    fitted_preprocessor = full_pipeline.named_steps["preprocessor"]
    transformed_names = extract_feature_names(fitted_preprocessor, numerical_cols, categorical_cols)
    importances = {
        name: round(float(imp), 4)
        for name, imp in zip(transformed_names, fitted_classifier.feature_importances_)
    }
    sorted_importances = dict(sorted(importances.items(), key=lambda x: x[1], reverse=True))

    # 9. Compile Complete Report
    report = {
        "model_name": "SlopeGuard Landslide Classifier (RandomForest)",
        "model_version": MODEL_VERSION,
        "model_status": MODEL_STATUS_DEMO,
        "output_type": "UNCALIBRATED_HAZARD_SCORE",
        "evaluation_timestamp": datetime.now(timezone.utc).isoformat(),
        "dataset_metadata": {
            "source_path": str(data_path),
            "is_synthetic": is_synthetic,
            "total_records": total_records,
            "train_record_count": len(train_df),
            "test_record_count": len(test_df),
            "test_split_ratio": test_ratio,
            "split_strategy": "chronological_temporal_holdout",
            "train_date_range": [
                str(train_df["observation_timestamp"].min()),
                str(train_df["observation_timestamp"].max()),
            ],
            "test_date_range": [
                str(test_df["observation_timestamp"].min()),
                str(test_df["observation_timestamp"].max()),
            ],
            "test_class_distribution": {
                "class_0_stable": int((y_test == 0).sum()),
                "class_1_landslide": int((y_test == 1).sum()),
            },
        },
        "model_metrics": {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": roc_auc,
            "pr_auc": pr_auc,
            "false_alarm_rate": far,
            "missed_event_rate": mer,
            "confusion_matrix": {
                "true_negatives": tn,
                "false_positives": fp,
                "false_negatives": fn,
                "true_positives": tp,
            },
        },
        "baseline_comparisons": {
            "majority_class_baseline": baseline_majority,
            "domain_heuristic_baseline": baseline_heuristic,
        },
        "calibration_analysis": calibration_analysis,
        "candidate_threshold_evaluation": {
            "candidate_set_id": "TH-NE-INDIA-V1-CANDIDATE",
            "version": "1.0.0-candidate",
            "review_status": "PENDING_EXPERT_REVIEW",
            "threshold_cutoffs": {
                "LOW": [0.0, 0.30],
                "MODERATE": [0.30, 0.60],
                "HIGH": [0.60, 0.80],
                "SEVERE": [0.80, 1.0],
            },
            "expert_review_required": True,
        },
        "feature_importances": sorted_importances,
        "limitations_and_uncertainty": [
            "Metrics reflect demonstration/prototype data only; do not represent real-world deployment performance.",
            "Rainfall observations from ERA5 reanalysis have ~11km grid smoothing and do not replace physical gauge networks.",
            "Absence of field-verified landslide negative inventories in steep unmonitored slopes requires valley proxy sampling.",
            "Ensemble score (0.0 to 1.0) must NOT be communicated as a certified percentage chance of slope failure.",
        ],
        "disclaimer": DISCLAIMER_TEXT,
    }

    output_report_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    logger.info("Saved audit-ready evaluation report to: %s", output_report_path)
    return report


if __name__ == "__main__":
    from src.config import SYNTHETIC_DATA_PATH
    HIST_PATH = BASE_DIR / "data" / "verified_historical" / "historical_events_northeast_india.csv"
    target = HIST_PATH if HIST_PATH.exists() else SYNTHETIC_DATA_PATH
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    rep = run_evaluation_pipeline(target)
    print("Evaluation summary:")
    print(json.dumps(rep["model_metrics"], indent=2))
    print("Calibration status:", rep["calibration_analysis"]["calibration_status"])
