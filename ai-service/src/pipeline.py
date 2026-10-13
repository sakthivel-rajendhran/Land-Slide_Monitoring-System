"""Data preprocessing and feature transformation pipelines for SlopeGuard."""

from typing import List, Tuple
import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

from src.config import (
    MANDATORY_NUMERICAL_FEATURES,
    OPTIONAL_NUMERICAL_FEATURES,
    OPTIONAL_CATEGORICAL_FEATURES,
)


def create_preprocessor(
    numerical_cols: List[str] = None,
    categorical_cols: List[str] = None
) -> ColumnTransformer:
    """Build a scikit-learn ColumnTransformer for numerical and categorical features."""
    if numerical_cols is None:
        numerical_cols = MANDATORY_NUMERICAL_FEATURES + OPTIONAL_NUMERICAL_FEATURES
    if categorical_cols is None:
        categorical_cols = OPTIONAL_CATEGORICAL_FEATURES

    # Numerical Transformer: Median imputation to prevent outlier corruption + Standard scaling
    num_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    # Categorical Transformer: Constant imputation ('Unknown') + One-hot encoding
    cat_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="constant", fill_value="Unknown")),
            ("encoder", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", num_pipeline, numerical_cols),
            ("cat", cat_pipeline, categorical_cols),
        ],
        remainder="drop",
    )

    return preprocessor


def extract_feature_names(preprocessor: ColumnTransformer, numerical_cols: List[str], categorical_cols: List[str]) -> List[str]:
    """Extract fitted feature names from ColumnTransformer for interpretability."""
    feature_names = list(numerical_cols)
    if "cat" in preprocessor.named_transformers_:
        cat_transformer = preprocessor.named_transformers_["cat"]
        if hasattr(cat_transformer, "named_steps") and "encoder" in cat_transformer.named_steps:
            encoder = cat_transformer.named_steps["encoder"]
            if hasattr(encoder, "get_feature_names_out"):
                cat_names = encoder.get_feature_names_out(categorical_cols)
                feature_names.extend(list(cat_names))
    return feature_names
