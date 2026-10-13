"""Automated tests for historical weather acquisition and probability calibration assessment."""

import pytest
from unittest.mock import patch, MagicMock
from src.acquire_historical_weather import HistoricalWeatherClient
from src.train import train_model
from src.config import SYNTHETIC_DATA_PATH


def test_historical_weather_client_parsing():
    """Verify that HistoricalWeatherClient correctly slices and sums 24h and 72h precipitation."""
    client = HistoricalWeatherClient()

    # Mock response payload from Open-Meteo archive
    mock_payload = {
        "latitude": 25.55,
        "longitude": 91.95,
        "elevation": 1436.0,
        "hourly": {
            "time": [f"2023-06-15T{h:02d}:00" for h in range(24)],
            "precipitation": [1.5] * 24,  # 24 hours * 1.5mm = 36.0mm
        }
    }

    mock_resp = MagicMock()
    mock_resp.json.return_value = mock_payload
    mock_resp.raise_for_status = MagicMock()

    with patch("httpx.Client.get", return_value=mock_resp):
        res = client.fetch_antecedent_rainfall(
            latitude=25.5788,
            longitude=91.8933,
            event_timestamp="2023-06-15T23:00:00Z",
        )

        assert res["requested_latitude"] == 25.5788
        assert res["rainfall_24h_mm"] == 36.0
        assert res["rainfall_72h_mm"] >= res["rainfall_24h_mm"]
        assert "Open-Meteo" in res["provider"]
        assert "CC BY 4.0" in res["attribution"]


def test_calibration_deferred_on_synthetic_data():
    """Verify that calibration on synthetic data is safely deferred and flagged."""
    results = train_model(data_path=SYNTHETIC_DATA_PATH)
    eval_rep = results["evaluation"]

    assert "calibration" in eval_rep
    assert eval_rep["calibration"]["status"] == "CALIBRATION_DEFERRED"
    assert "Insufficient sample size or synthetic fixtures" in eval_rep["calibration"]["reason"]
    assert "brier_score_uncalibrated" in eval_rep["calibration"]
