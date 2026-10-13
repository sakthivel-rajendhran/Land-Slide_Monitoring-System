"""FastAPI REST Service for SlopeGuard Landslide Risk AI Inference."""

import json
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from src.config import (
    MODEL_VERSION,
    MODEL_STATUS_DEMO,
    METADATA_ARTIFACT_PATH,
    EVALUATION_REPORT_PATH,
    CANDIDATE_THRESHOLDS_PATH,
    DISCLAIMER_TEXT,
    OUTPUT_TYPE,
    CALIBRATION_STATUS,
    THRESHOLD_SET_VERSION,
    THRESHOLD_REVIEW_STATUS,
    DATA_READINESS_STATUS,
)
from src.schema import (
    HealthResponse,
    PredictionRequest,
    PredictionResponse,
    ModelStatusResponse,
)
from src.predictor import LandslidePredictor

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# Global Predictor Instance
predictor: LandslidePredictor = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event to load model artifact on startup."""
    global predictor
    logger.info("Initializing SlopeGuard Landslide AI Predictor...")
    predictor = LandslidePredictor()
    yield
    logger.info("Shutting down SlopeGuard Landslide AI Predictor...")


app = FastAPI(
    title="SlopeGuard AI Landslide Risk Service",
    description=(
        "Machine Learning inference service for prototype landslide hazard estimation. "
        "Operates under DEMO_NOT_VALIDATED status until verified field datasets are ingested."
    ),
    version=MODEL_VERSION,
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Sanitize validation errors to avoid leaking internal details."""
    errors = []
    for err in exc.errors():
        loc = " -> ".join([str(x) for x in err.get("loc", [])])
        msg = err.get("msg", "Invalid parameter")
        errors.append(f"{loc}: {msg}")

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "message": "Supplied input fields failed validation rules.",
            "details": errors,
            "sampleData": False,
        },
    )


@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check endpoint",
    tags=["System"],
)
async def health_check():
    """Return AI service operational status."""
    return HealthResponse(
        status="ok",
        service="slopeguard-ai-service",
        version=MODEL_VERSION,
    )


@app.get(
    "/model/status",
    response_model=ModelStatusResponse,
    summary="Model governance, training status, and evaluation metrics",
    tags=["Governance"],
)
async def model_status():
    """Expose current model artifact status and governance flags."""
    global predictor
    if predictor is None:
        predictor = LandslidePredictor()

    eval_summary = None
    if EVALUATION_REPORT_PATH.exists():
        try:
            with open(EVALUATION_REPORT_PATH, "r", encoding="utf-8") as f:
                eval_data = json.load(f)
                eval_summary = eval_data.get("metrics")
        except Exception as e:
            logger.warning("Could not read evaluation report: %s", e)

    dataset_type = (
        "SYNTHETIC_FIXTURES"
        if predictor.model_status == MODEL_STATUS_DEMO
        else "VERIFIED_HISTORICAL"
    )

    return ModelStatusResponse(
        service_status="ready" if predictor.is_loaded else "model_artifact_missing",
        model_version=MODEL_VERSION,
        model_status=predictor.model_status,
        output_type=OUTPUT_TYPE,
        calibration_status=CALIBRATION_STATUS,
        threshold_set_version=THRESHOLD_SET_VERSION,
        threshold_review_status=THRESHOLD_REVIEW_STATUS,
        data_readiness_status=DATA_READINESS_STATUS,
        artifact_loaded=predictor.is_loaded,
        training_dataset_type=dataset_type,
        evaluation_summary=eval_summary,
        disclaimer=DISCLAIMER_TEXT,
    )


@app.get(
    "/model/thresholds",
    summary="Candidate risk thresholds, governance status, and trade-off analysis",
    tags=["Governance"],
)
async def get_candidate_thresholds():
    """Retrieve versioned candidate risk threshold configuration."""
    if not CANDIDATE_THRESHOLDS_PATH.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate threshold configuration file not found.",
        )
    try:
        with open(CANDIDATE_THRESHOLDS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error("Failed to read candidate threshold configuration: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not load candidate threshold configuration: {e}",
        )


@app.post(
    "/predict",
    response_model=PredictionResponse,
    summary="Landslide hazard probability estimation",
    tags=["Inference"],
)
async def predict_landslide_risk(request: PredictionRequest):
    """Estimate landslide risk score and provisional category for given terrain/rainfall inputs."""
    global predictor
    if predictor is None:
        predictor = LandslidePredictor()

    return predictor.predict(request)
