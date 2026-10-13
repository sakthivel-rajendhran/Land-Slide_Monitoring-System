"""Dataset validation and integrity checking engine for SlopeGuard."""

import logging
import sys
from typing import Tuple, Dict, Any, List
from pathlib import Path

BASE_DIR_RESOLVED = Path(__file__).resolve().parent.parent
if str(BASE_DIR_RESOLVED) not in sys.path:
    sys.path.insert(0, str(BASE_DIR_RESOLVED))

import pandas as pd
import numpy as np

from src.config import (
    LATITUDE_MIN,
    LATITUDE_MAX,
    LONGITUDE_MIN,
    LONGITUDE_MAX,
    MANDATORY_NUMERICAL_FEATURES,
    TARGET_COLUMN,
)

logger = logging.getLogger(__name__)


class DatasetValidationError(Exception):
    """Raised when dataset fails fundamental integrity or schema rules."""
    pass


class DatasetValidator:
    """Validates CSV landslide hazard datasets against geotechnical and physical constraints."""

    REQUIRED_COLUMNS = [
        "record_id",
        "latitude",
        "longitude",
        "observation_timestamp",
        "rainfall_24h_mm",
        "slope_deg",
        "landslide_occurred",
        "is_synthetic",
        "data_source",
    ]

    def __init__(self, allow_synthetic_mixture: bool = False):
        self.allow_synthetic_mixture = allow_synthetic_mixture

    def validate_file(self, file_path: Path) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Read and validate a dataset from file path."""
        if not file_path.exists():
            raise DatasetValidationError(f"Dataset file not found at: {file_path}")

        try:
            df = pd.read_csv(file_path)
        except Exception as e:
            raise DatasetValidationError(f"Failed to parse CSV file: {e}")

        return self.validate_dataframe(df)

    def validate_dataframe(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """Validate an in-memory DataFrame, filtering corrupted records and producing validation metrics."""
        issues: List[str] = []
        initial_row_count = len(df)

        if initial_row_count == 0:
            raise DatasetValidationError("Dataset is completely empty.")

        # 1. Column Presence Check
        missing_cols = [col for col in self.REQUIRED_COLUMNS if col not in df.columns]
        if missing_cols:
            raise DatasetValidationError(
                f"Missing required columns in dataset: {missing_cols}"
            )

        # 2. Synthetic Commingling Check
        synthetic_values = df["is_synthetic"].astype(str).str.lower().unique()
        has_synthetic = any(val in ["true", "1", "t"] for val in synthetic_values)
        has_real = any(val in ["false", "0", "f"] for val in synthetic_values)

        if has_synthetic and has_real and not self.allow_synthetic_mixture:
            raise DatasetValidationError(
                "Integrity Violation: Dataset commingles synthetic test fixtures with real "
                "field records. Commingling is prohibited without explicit override."
            )

        # Normalize is_synthetic column to boolean
        df["is_synthetic"] = df["is_synthetic"].astype(str).str.lower().isin(["true", "1", "t"])

        # 3. Missing Mandatory Values Check
        mandatory_fields = ["record_id", "observation_timestamp", TARGET_COLUMN] + MANDATORY_NUMERICAL_FEATURES
        null_mask = df[mandatory_fields].isnull().any(axis=1)
        null_dropped_count = int(null_mask.sum())
        if null_dropped_count > 0:
            issues.append(f"Dropped {null_dropped_count} rows with missing mandatory values.")
            df = df[~null_mask].copy()

        if len(df) == 0:
            raise DatasetValidationError("All records dropped due to missing mandatory values.")

        # 4. Target Label Validation
        valid_labels = df[TARGET_COLUMN].isin([0, 1])
        invalid_label_count = int((~valid_labels).sum())
        if invalid_label_count > 0:
            issues.append(f"Dropped {invalid_label_count} rows with invalid target labels (must be 0 or 1).")
            df = df[valid_labels].copy()

        if len(df) == 0:
            raise DatasetValidationError("No valid target labels remaining in dataset.")

        # 5. Geographic Coordinate Bounds Validation
        valid_coords = (
            (df["latitude"] >= LATITUDE_MIN)
            & (df["latitude"] <= LATITUDE_MAX)
            & (df["longitude"] >= LONGITUDE_MIN)
            & (df["longitude"] <= LONGITUDE_MAX)
        )
        invalid_coord_count = int((~valid_coords).sum())
        if invalid_coord_count > 0:
            issues.append(f"Dropped {invalid_coord_count} rows with out-of-bounds geographic coordinates.")
            df = df[valid_coords].copy()

        # 6. Physical Feasibility Constraints
        # Rainfall >= 0.0, Slope in [0.0, 90.0]
        physically_valid = (
            (df["rainfall_24h_mm"] >= 0.0)
            & (df["slope_deg"] >= 0.0)
            & (df["slope_deg"] <= 90.0)
        )

        # rainfall_72h_mm consistency check (if provided, must be >= rainfall_24h_mm)
        if "rainfall_72h_mm" in df.columns:
            has_72h = df["rainfall_72h_mm"].notnull()
            consistent_72h = ~has_72h | (
                (df["rainfall_72h_mm"] >= 0.0) & (df["rainfall_72h_mm"] >= df["rainfall_24h_mm"])
            )
            physically_valid = physically_valid & consistent_72h

        # vegetation_ndvi range check (if provided, [-1.0, 1.0])
        if "vegetation_ndvi" in df.columns:
            has_ndvi = df["vegetation_ndvi"].notnull()
            valid_ndvi = ~has_ndvi | (
                (df["vegetation_ndvi"] >= -1.0) & (df["vegetation_ndvi"] <= 1.0)
            )
            physically_valid = physically_valid & valid_ndvi

        invalid_physics_count = int((~physically_valid).sum())
        if invalid_physics_count > 0:
            issues.append(f"Dropped {invalid_physics_count} rows violating physical geotechnical constraints.")
            df = df[physically_valid].copy()

        # 7. Deduplication Check (by location + observation timestamp)
        initial_before_dedup = len(df)
        df = df.drop_duplicates(subset=["latitude", "longitude", "observation_timestamp"], keep="first")
        dedup_count = initial_before_dedup - len(df)
        if dedup_count > 0:
            issues.append(f"Deduplicated {dedup_count} identical spatio-temporal observation records.")

        if len(df) == 0:
            raise DatasetValidationError("Dataset empty after validation filters.")

        # Class Distribution Analysis
        class_counts = df[TARGET_COLUMN].value_counts().to_dict()
        count_0 = int(class_counts.get(0, 0))
        count_1 = int(class_counts.get(1, 0))
        total_valid = len(df)
        imbalance_ratio = round(count_0 / max(count_1, 1), 3)

        metadata = {
            "initial_rows": initial_row_count,
            "valid_rows": total_valid,
            "dropped_rows": initial_row_count - total_valid,
            "is_synthetic_dataset": bool(df["is_synthetic"].iloc[0]),
            "class_distribution": {
                "non_landslide_count_0": count_0,
                "landslide_count_1": count_1,
                "imbalance_ratio_0_to_1": imbalance_ratio,
            },
            "validation_issues_encountered": issues,
            "unique_data_sources": df["data_source"].unique().tolist(),
        }

        return df, metadata


if __name__ == "__main__":
    from src.config import SYNTHETIC_DATA_PATH
    logging.basicConfig(level=logging.INFO)
    validator = DatasetValidator()
    print("Testing DatasetValidator on synthetic_fixtures.csv...")
    clean_df, meta = validator.validate_file(SYNTHETIC_DATA_PATH)
    print(f"Validation successful! Meta: {meta}")
