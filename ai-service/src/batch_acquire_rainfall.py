"""
Batch Historical Weather Acquisition for Northeast India Landslide Catalog.

Queries Open-Meteo Historical Weather API (ERA5-Land reanalysis) for verified
landslide events. Includes local JSON checkpointing, exponential backoff, rate limiting,
and defensible handling of date uncertainty.
"""

import json
import logging
import math
import os
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Any, Optional
import urllib.request
import urllib.error
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("batch_acquire_rainfall")

BASE_DIR = Path(__file__).resolve().parent.parent
PROCESSED_DIR = BASE_DIR / "data" / "processed"
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

INPUT_CSV = PROCESSED_DIR / "nasa_glc_northeast_india.csv"
OUTPUT_CSV = PROCESSED_DIR / "nasa_glc_northeast_india_with_rainfall.csv"
CACHE_FILE = PROCESSED_DIR / "open_meteo_rainfall_cache.json"

OPEN_METEO_URL = "https://archive-api.open-meteo.com/v1/archive"


def load_cache() -> Dict[str, Any]:
    if CACHE_FILE.exists():
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Failed to load cache, starting fresh: {e}")
    return {}


def save_cache(cache: Dict[str, Any]) -> None:
    temp_file = CACHE_FILE.with_suffix(".tmp")
    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump(cache, f, indent=2)
    temp_file.replace(CACHE_FILE)


def fetch_event_rainfall(
    lat: float,
    lon: float,
    event_dt: datetime,
    max_retries: int = 5,
    delay_between_calls: float = 0.25,
) -> Optional[Dict[str, Any]]:
    """
    Fetch antecedent rainfall for the 24h and 72h windows ending at the event date.
    Uses daily precipitation sum for robustness against 00:00:00 midnight date uncertainty.
    Also queries hourly if available, or daily precipitation sum from ERA5-Land.
    """
    # Start date: 3 days prior (D-2, D-1, D)
    start_dt = event_dt - timedelta(days=3)
    start_date_str = start_dt.strftime("%Y-%m-%d")
    end_date_str = event_dt.strftime("%Y-%m-%d")

    params = (
        f"?latitude={lat:.4f}&longitude={lon:.4f}"
        f"&start_date={start_date_str}&end_date={end_date_str}"
        f"&daily=precipitation_sum,rain_sum"
        f"&timezone=UTC"
    )
    url = OPEN_METEO_URL + params
    headers = {"User-Agent": "SlopeGuard/1.0 (Northeast India Landslide Research; contact@slopeguard.org)"}

    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=20) as response:
                payload = json.loads(response.read().decode("utf-8"))

            daily = payload.get("daily", {})
            times = daily.get("time", [])
            precip = daily.get("precipitation_sum", [])

            if not times or not precip:
                return None

            # precip list contains dates [D-3, D-2, D-1, D]
            # Replace any None values with 0.0
            clean_precip = [float(p) if p is not None else 0.0 for p in precip]

            # 24h rainfall is event day (last day)
            rainfall_24h = clean_precip[-1] if clean_precip else 0.0

            # 72h rainfall is sum of last 3 days (D-2, D-1, D)
            slice_72h = clean_precip[-3:] if len(clean_precip) >= 3 else clean_precip
            rainfall_72h = sum(slice_72h)

            if rainfall_72h < rainfall_24h:
                rainfall_72h = rainfall_24h

            return {
                "grid_latitude": payload.get("latitude"),
                "grid_longitude": payload.get("longitude"),
                "grid_elevation_m": payload.get("elevation"),
                "rainfall_24h_mm": round(rainfall_24h, 2),
                "rainfall_72h_mm": round(rainfall_72h, 2),
                "daily_series_dates": times,
                "daily_precipitation_series": clean_precip,
                "weather_product": "Open-Meteo ERA5-Land Reanalysis",
                "units": "mm (liquid water equivalent)",
                "date_uncertainty_handling": "Daily 24h/72h window inclusive of event day due to absence of intra-day failure hour in NASA GLC",
            }
        except urllib.error.HTTPError as he:
            if he.code == 429:
                wait_time = (2 ** attempt) * 2.0
                logger.warning(f"Rate limited (HTTP 429). Backing off for {wait_time:.1f}s...")
                time.sleep(wait_time)
            elif he.code in (500, 502, 503, 504):
                time.sleep(1.0 * (attempt + 1))
            else:
                logger.error(f"HTTP Error {he.code} for {lat}, {lon} on {end_date_str}: {he.reason}")
                return None
        except Exception as e:
            logger.warning(f"Attempt {attempt+1} failed for {lat}, {lon}: {e}")
            time.sleep(1.0 * (attempt + 1))

    return None


def run_batch_acquisition(limit: Optional[int] = None) -> None:
    if not INPUT_CSV.exists():
        raise FileNotFoundError(f"Missing filtered input CSV: {INPUT_CSV}")

    df = pd.read_csv(INPUT_CSV)
    logger.info(f"Loaded {len(df)} records from {INPUT_CSV}")

    cache = load_cache()
    logger.info(f"Loaded {len(cache)} existing cached weather queries")

    records_to_process = df.to_dict(orient="records")
    if limit is not None:
        records_to_process = records_to_process[:limit]

    success_count = 0
    fail_count = 0

    for i, row in enumerate(records_to_process):
        event_id = str(row["event_id"])
        lat = float(row["latitude"])
        lon = float(row["longitude"])
        date_str = str(row["event_date"])
        event_dt = pd.to_datetime(date_str)

        cache_key = f"{event_id}_{lat:.4f}_{lon:.4f}_{event_dt.strftime('%Y-%m-%d')}"

        if cache_key in cache:
            success_count += 1
            continue

        result = fetch_event_rainfall(lat, lon, event_dt)
        if result is not None:
            cache[cache_key] = result
            success_count += 1
        else:
            fail_count += 1
            logger.error(f"Failed to retrieve rainfall for event {event_id} ({lat}, {lon}) on {date_str}")

        if (i + 1) % 20 == 0 or (i + 1) == len(records_to_process):
            save_cache(cache)
            logger.info(f"Progress: {i+1}/{len(records_to_process)} processed (Success: {success_count}, Fail: {fail_count})")

        time.sleep(0.15)  # Respect rate limits

    save_cache(cache)
    logger.info(f"Final cache saved with {len(cache)} entries.")

    # Now merge into augmented dataframe
    rainfall_24h_list = []
    rainfall_72h_list = []
    elevation_era5_list = []
    weather_provider_list = []

    for _, row in df.iterrows():
        event_id = str(row["event_id"])
        lat = float(row["latitude"])
        lon = float(row["longitude"])
        date_str = str(row["event_date"])
        event_dt = pd.to_datetime(date_str)
        cache_key = f"{event_id}_{lat:.4f}_{lon:.4f}_{event_dt.strftime('%Y-%m-%d')}"

        cached = cache.get(cache_key)
        if cached:
            rainfall_24h_list.append(cached.get("rainfall_24h_mm"))
            rainfall_72h_list.append(cached.get("rainfall_72h_mm"))
            elevation_era5_list.append(cached.get("grid_elevation_m"))
            weather_provider_list.append(cached.get("weather_product"))
        else:
            rainfall_24h_list.append(None)
            rainfall_72h_list.append(None)
            elevation_era5_list.append(None)
            weather_provider_list.append(None)

    df["rainfall_24h_mm"] = rainfall_24h_list
    df["rainfall_72h_mm"] = rainfall_72h_list
    df["era5_grid_elevation_m"] = elevation_era5_list
    df["rainfall_source"] = weather_provider_list

    df.to_csv(OUTPUT_CSV, index=False)
    logger.info(f"Exported augmented dataset with real rainfall to: {OUTPUT_CSV}")
    logger.info(f"Total rows: {len(df)}, Non-null rainfall_24h: {df['rainfall_24h_mm'].notna().sum()}, Non-null rainfall_72h: {df['rainfall_72h_mm'].notna().sum()}")


if __name__ == "__main__":
    run_batch_acquisition()
