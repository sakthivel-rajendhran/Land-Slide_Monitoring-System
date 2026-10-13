"""
Open-Meteo Historical Weather Ingestion Module for SlopeGuard.

Queries the Open-Meteo Historical Weather API (ERA5 reanalysis) to extract
defensible antecedent precipitation (24h and 72h cumulative rainfall) for verified
landslide occurrence timestamps.

Official API Endpoint: https://archive-api.open-meteo.com/v1/archive
Licence: Creative Commons Attribution 4.0 International (CC BY 4.0)
Terms: Free for non-commercial use with required attribution.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional
import httpx

logger = logging.getLogger(__name__)

OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"


class HistoricalWeatherClient:
    """Client for fetching historical ERA5 reanalysis precipitation from Open-Meteo."""

    def __init__(self, base_url: str = OPEN_METEO_ARCHIVE_URL, timeout_seconds: float = 10.0):
        self.base_url = base_url
        self.timeout_seconds = timeout_seconds

    def fetch_antecedent_rainfall(
        self,
        latitude: float,
        longitude: float,
        event_timestamp: str,
    ) -> Dict[str, Any]:
        """
        Fetch antecedent rainfall for 24 hours and 72 hours preceding the event timestamp.

        Parameters:
        - latitude: WGS84 Latitude [-90.0, 90.0]
        - longitude: WGS84 Longitude [-180.0, 180.0]
        - event_timestamp: ISO-8601 string (e.g., '2023-06-15T14:00:00Z')

        Returns:
        Dict containing rainfall_24h_mm, rainfall_72h_mm, grid coordinates, and metadata.
        """
        if not (-90.0 <= latitude <= 90.0) or not (-180.0 <= longitude <= 180.0):
            raise ValueError(f"Invalid coordinate bounds: lat={latitude}, lon={longitude}")

        event_dt = datetime.fromisoformat(event_timestamp.replace("Z", "+00:00"))
        
        # We need historical hourly data starting 3 days before the event date up to the event date
        start_date = (event_dt - timedelta(days=4)).strftime("%Y-%m-%d")
        end_date = event_dt.strftime("%Y-%m-%d")

        params = {
            "latitude": latitude,
            "longitude": longitude,
            "start_date": start_date,
            "end_date": end_date,
            "hourly": "precipitation,rain",
            "timezone": "UTC",
        }

        try:
            with httpx.Client(timeout=self.timeout_seconds) as client:
                response = client.get(self.base_url, params=params)
                response.raise_for_status()
                payload = response.json()
        except Exception as e:
            logger.error("Failed to fetch historical weather from %s: %s", self.base_url, e)
            raise RuntimeError(f"Historical weather retrieval failed: {e}") from e

        # Extract hourly time series
        hourly_data = payload.get("hourly", {})
        times = hourly_data.get("time", [])
        precip = hourly_data.get("precipitation", [])

        if not times or not precip:
            raise ValueError("No hourly precipitation data returned by Open-Meteo archive.")

        # Find the index corresponding to event_dt (or the closest preceding hour)
        target_iso = event_dt.strftime("%Y-%m-%dT%H:00")
        
        target_idx = None
        for i, t in enumerate(times):
            if t <= target_iso:
                target_idx = i
            else:
                break

        if target_idx is None:
            target_idx = len(times) - 1

        # Sum preceding 24 hours and 72 hours
        idx_24h_start = max(0, target_idx - 23)
        idx_72h_start = max(0, target_idx - 71)

        slice_24h = [p for p in precip[idx_24h_start : target_idx + 1] if p is not None]
        slice_72h = [p for p in precip[idx_72h_start : target_idx + 1] if p is not None]

        rainfall_24h = round(float(sum(slice_24h)), 2)
        rainfall_72h = round(float(sum(slice_72h)), 2)

        # Enforce physical inequality: 72h >= 24h
        if rainfall_72h < rainfall_24h:
            rainfall_72h = rainfall_24h

        return {
            "requested_latitude": latitude,
            "requested_longitude": longitude,
            "grid_latitude": payload.get("latitude"),
            "grid_longitude": payload.get("longitude"),
            "elevation_m": payload.get("elevation"),
            "event_timestamp": event_timestamp,
            "matched_timestamp_hour": times[target_idx],
            "rainfall_24h_mm": rainfall_24h,
            "rainfall_72h_mm": rainfall_72h,
            "provider": "Open-Meteo Historical Weather API (ERA5 Reanalysis)",
            "attribution": "Weather data by Open-Meteo.com (CC BY 4.0)",
            "licence_url": "https://creativecommons.org/licenses/by/4.0/",
            "limitation": (
                "Values represent atmospheric numerical model reanalysis (ERA5-Land grid cells) "
                "and do not guarantee physical on-site rain gauge measurements."
            ),
        }
