"""
Comprehensive Copernicus DEM GLO-30 Terrain Extraction Module for SlopeGuard.

Processes all 368 verified Northeast India landslide events using authentic
Copernicus DEM GLO-30 GeoTIFF rasters (1 arc-second ~30m posting) acquired from AWS Open Data.
Calculates elevation, slope angle, aspect, and 3x3 relief range using Horn's 8-neighbor
gradient algorithm. Enforces zero fabrication: only authentic raster values are recorded.
"""

import logging
import math
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
import pandas as pd
import tifffile

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("extract_copernicus_dem_terrain")

BASE_DIR = Path(__file__).resolve().parent.parent
DATASET_DIR = BASE_DIR.parent / "dataset"
PROCESSED_DIR = DATASET_DIR / "processed"
DEM_DIR = DATASET_DIR / "dem_tiles"
DEM_DIR.mkdir(parents=True, exist_ok=True)

INPUT_CSV = PROCESSED_DIR / "historical_landslide_events_ner.csv"
OUTPUT_TERRAIN_CSV = PROCESSED_DIR / "terrain_features_ner.csv"
OUTPUT_TILE_INDEX_CSV = PROCESSED_DIR / "copernicus_dem_tile_index_requirements.csv"

# Pre-existing local Shillong ASCII tile for backward compatibility / audit
SHILLONG_DEM_ASC = DATASET_DIR / "dem_tiles" / "copernicus_dem_glo30_shillong.asc"


def get_required_tile_name(lat: float, lon: float) -> str:
    """Format standard Copernicus DEM GLO-30 GeoTIFF tile name."""
    lat_floor = int(math.floor(lat))
    lon_floor = int(math.floor(lon))
    ns = "N" if lat_floor >= 0 else "S"
    ew = "E" if lon_floor >= 0 else "W"
    return f"Copernicus_DSM_COG_10_{ns}{abs(lat_floor):02d}_00_{ew}{abs(lon_floor):03d}_00_DEM.tif"


class DemTileCache:
    """In-memory cache for loaded 3600x3600 float32 raster tiles."""

    def __init__(self, dem_folder: Path):
        self.dem_folder = dem_folder
        self.cache: Dict[str, np.ndarray] = {}

    def get_tile(self, tile_name: str) -> Optional[np.ndarray]:
        if tile_name in self.cache:
            return self.cache[tile_name]

        tile_path = self.dem_folder / tile_name
        if not tile_path.exists():
            return None

        try:
            arr = tifffile.imread(str(tile_path))
            if arr.shape == (3600, 3600):
                self.cache[tile_name] = arr
                return arr
            else:
                logger.error("Tile %s has unexpected shape %s", tile_name, arr.shape)
                return None
        except Exception as e:
            logger.error("Failed to read tile %s: %s", tile_name, e)
            return None


def extract_features_from_array(arr: np.ndarray, lat: float, lon: float) -> Tuple[float, float, float, float, float, float, float, float]:
    """
    Extract elevation, slope, aspect, min, max, range, dx, dy from 3600x3600 GeoTIFF array.
    """
    lat_floor = int(math.floor(lat))
    lon_floor = int(math.floor(lon))

    # Pixel indices: COG origin is top-left (lat_floor + 1.0, lon_floor)
    row = int(math.floor((lat_floor + 1.0 - lat) * 3600.0))
    col = int(math.floor((lon - lon_floor) * 3600.0))
    row = min(max(0, row), 3599)
    col = min(max(0, col), 3599)

    elev = float(arr[row, col])

    # 3x3 local kernel
    r0 = max(0, row - 1)
    r1 = min(3599, row + 1)
    c0 = max(0, col - 1)
    c1 = min(3599, col + 1)

    kernel = np.full((3, 3), elev, dtype=float)
    kernel[r0 - (row - 1) : r1 - (row - 1) + 1, c0 - (col - 1) : c1 - (col - 1) + 1] = arr[r0 : r1 + 1, c0 : c1 + 1]

    lat_rad = math.radians(lat)
    dy = (1.0 / 3600.0) * 110800.0
    dx = (1.0 / 3600.0) * 111320.0 * math.cos(lat_rad)

    # Horn's 8-neighbor gradient
    dz_dx = ((kernel[0, 2] + 2.0 * kernel[1, 2] + kernel[2, 2]) - (kernel[0, 0] + 2.0 * kernel[1, 0] + kernel[2, 0])) / (8.0 * dx)
    dz_dy = ((kernel[0, 0] + 2.0 * kernel[0, 1] + kernel[0, 2]) - (kernel[2, 0] + 2.0 * kernel[2, 1] + kernel[2, 2])) / (8.0 * dy)

    slope_rad = math.atan(math.sqrt(dz_dx**2 + dz_dy**2))
    slope_deg = round(math.degrees(slope_rad), 2)
    aspect_deg = round((math.degrees(math.atan2(-dz_dy, dz_dx)) + 360.0) % 360.0, 2)

    elev_min = round(float(np.min(kernel)), 1)
    elev_max = round(float(np.max(kernel)), 1)
    elev_range = round(elev_max - elev_min, 1)

    return round(elev, 1), slope_deg, aspect_deg, elev_min, elev_max, elev_range, round(dx, 2), round(dy, 2)


def process_all_terrain_features(
    input_csv: Path = INPUT_CSV,
    output_terrain_csv: Path = OUTPUT_TERRAIN_CSV,
    output_tile_index_csv: Path = OUTPUT_TILE_INDEX_CSV,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Extract terrain features for all events whose authentic DEM tiles are available."""
    if not input_csv.exists():
        raise FileNotFoundError(f"Missing input events CSV: {input_csv}")

    df = pd.read_csv(input_csv)
    logger.info("Loaded %d events for terrain extraction from %s", len(df), input_csv)

    tile_cache = DemTileCache(DEM_DIR)

    extracted_records = []
    tile_index_records = []

    success_count = 0
    missing_tile_count = 0

    for idx, row in df.iterrows():
        eid = str(row["event_id"])
        lat = float(row["latitude"])
        lon = float(row["longitude"])
        state = str(row.get("normalized_state", ""))
        loc_desc = str(row.get("location_description", ""))

        tile_name = get_required_tile_name(lat, lon)
        tile_arr = tile_cache.get_tile(tile_name)

        if tile_arr is not None:
            elev, slope, aspect, el_min, el_max, el_range, dx, dy = extract_features_from_array(tile_arr, lat, lon)
            rec = {
                "event_id": eid,
                "latitude": lat,
                "longitude": lon,
                "normalized_state": state,
                "location_description": loc_desc,
                "elevation_m": elev,
                "slope_deg": slope,
                "aspect_deg": aspect,
                "elev_min_3x3_m": el_min,
                "elev_max_3x3_m": el_max,
                "elev_range_3x3_m": el_range,
                "dx_meters": dx,
                "dy_meters": dy,
                "dem_product": "Copernicus DEM GLO-30 (1 arc-second ~30m posting)",
                "vertical_datum": "EGM2008 Geoid (Orthometric Height)",
                "horizontal_datum": "WGS84 (EPSG:4326)",
                "extraction_method": "Horn 8-neighbor gradient filter",
                "tile_source": tile_name,
                "terrain_status": "EXTRACTED_FROM_AUTHENTIC_RASTER",
                "failure_reason": None,
            }
            extracted_records.append(rec)
            success_count += 1
            tile_status = "DOWNLOADED_AND_VERIFIED"
            failure_reason = None
        else:
            rec = {
                "event_id": eid,
                "latitude": lat,
                "longitude": lon,
                "normalized_state": state,
                "location_description": loc_desc,
                "elevation_m": None,
                "slope_deg": None,
                "aspect_deg": None,
                "elev_min_3x3_m": None,
                "elev_max_3x3_m": None,
                "elev_range_3x3_m": None,
                "dx_meters": None,
                "dy_meters": None,
                "dem_product": "Copernicus DEM GLO-30 (1 arc-second ~30m posting)",
                "vertical_datum": "EGM2008 Geoid (Orthometric Height)",
                "horizontal_datum": "WGS84 (EPSG:4326)",
                "extraction_method": "Horn 8-neighbor gradient filter",
                "tile_source": tile_name,
                "terrain_status": "AWAITING_TILE_DOWNLOAD",
                "failure_reason": f"Raster tile {tile_name} not found in dem_tiles directory",
            }
            # Only append to extracted_records if raster was actually extracted
            missing_tile_count += 1
            tile_status = "AWAITING_DOWNLOAD"
            failure_reason = f"Tile {tile_name} absent on disk"

        tile_index_records.append({
            "event_id": eid,
            "latitude": lat,
            "longitude": lon,
            "normalized_state": state,
            "required_tile_filename": tile_name,
            "tile_coverage_status": tile_status,
            "download_source_url": f"https://copernicus-dem-30m.s3.eu-central-1.amazonaws.com/{tile_name[:-4]}/{tile_name}",
            "failure_reason": failure_reason,
        })

    # Save terrain_features_ner.csv
    terrain_df = pd.DataFrame(extracted_records)
    terrain_df.to_csv(output_terrain_csv, index=False)
    logger.info("Exported authentic terrain features: %d extracted out of %d total events", len(terrain_df), len(df))

    # Save tile requirements index
    tile_df = pd.DataFrame(tile_index_records)
    tile_df.to_csv(output_tile_index_csv, index=False)
    logger.info("Exported updated Copernicus DEM tile requirements index: %d rows", len(tile_df))

    return terrain_df, tile_df


if __name__ == "__main__":
    t_df, idx_df = process_all_terrain_features()
    print("Total authentic terrain records extracted:", len(t_df))
    print("Total tile coverage indexed:", len(idx_df))
