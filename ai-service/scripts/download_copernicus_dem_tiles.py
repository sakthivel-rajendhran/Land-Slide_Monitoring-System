"""
Automated Downloader for Copernicus DEM GLO-30 GeoTIFF Tiles.

Acquires required 1° x 1° Copernicus DEM GLO-30 tiles from the AWS Open Data Registry
(https://copernicus-dem-30m.s3.eu-central-1.amazonaws.com) using chunked HTTP streaming,
retries with exponential backoff, and raster validation via tifffile.
"""

import logging
import os
import sys
import time
from pathlib import Path
from typing import Dict, Any, List, Tuple
import urllib.request
import urllib.error
import tifffile
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("download_copernicus_dem_tiles")

BASE_DIR = Path(__file__).resolve().parent.parent
DEM_DIR = BASE_DIR / "data" / "dem_tiles"
DEM_DIR.mkdir(parents=True, exist_ok=True)

TILE_INDEX_CSV = BASE_DIR / "data" / "processed" / "copernicus_dem_tile_index_requirements.csv"
AWS_S3_BASE_URL = "https://copernicus-dem-30m.s3.eu-central-1.amazonaws.com"


def download_tile(tile_name: str, max_retries: int = 3) -> Tuple[bool, str]:
    """
    Download a single Copernicus DEM GLO-30 tile if not already present on disk.
    Returns: (success: bool, message: str)
    """
    dest_path = DEM_DIR / tile_name
    tile_stem = tile_name[:-4] if tile_name.endswith(".tif") else tile_name
    url = f"{AWS_S3_BASE_URL}/{tile_stem}/{tile_name}"

    # If file exists and is valid, skip
    if dest_path.exists() and dest_path.stat().st_size > 10_000_000:
        try:
            arr = tifffile.imread(str(dest_path))
            if arr.shape == (3600, 3600):
                logger.info("Tile already exists and verified: %s (%d bytes)", tile_name, dest_path.stat().st_size)
                return True, "ALREADY_DOWNLOADED_AND_VERIFIED"
        except Exception as e:
            logger.warning("Existing file %s corrupted, re-downloading: %s", tile_name, e)

    temp_path = dest_path.with_suffix(".tmp")
    headers = {"User-Agent": "SlopeGuard/1.0 (Copernicus DEM Research)"}

    for attempt in range(max_retries):
        try:
            logger.info("Downloading %s (Attempt %d/%d)...", tile_name, attempt + 1, max_retries)
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=40) as resp, open(temp_path, "wb") as f:
                content_len = int(resp.headers.get("Content-Length", 0))
                downloaded = 0
                while True:
                    chunk = resp.read(1024 * 1024)
                    if not chunk:
                        break
                    f.write(chunk)
                    downloaded += len(chunk)

            # Validate with tifffile
            arr = tifffile.imread(str(temp_path))
            if arr.shape != (3600, 3600):
                raise ValueError(f"Unexpected raster shape {arr.shape}, expected (3600, 3600)")

            temp_path.replace(dest_path)
            logger.info("Successfully downloaded and verified %s (%d bytes)", tile_name, dest_path.stat().st_size)
            return True, "DOWNLOAD_SUCCESS"

        except urllib.error.HTTPError as he:
            logger.warning("HTTP Error %d for %s: %s", he.code, tile_name, he.reason)
            if he.code == 404:
                return False, f"HTTP_404_NOT_FOUND: {url}"
            time.sleep(2.0 * (attempt + 1))
        except Exception as e:
            logger.warning("Error downloading %s: %s", tile_name, e)
            time.sleep(2.0 * (attempt + 1))
        finally:
            if temp_path.exists():
                try:
                    temp_path.unlink()
                except Exception:
                    pass

    return False, f"DOWNLOAD_FAILED_AFTER_{max_retries}_ATTEMPTS"


def download_all_required_tiles(tile_index_csv: Path = TILE_INDEX_CSV) -> Dict[str, Any]:
    """Download all unique required tiles for the regional inventory."""
    if not tile_index_csv.exists():
        raise FileNotFoundError(f"Missing tile index CSV: {tile_index_csv}")

    df = pd.read_csv(tile_index_csv)
    unique_tiles = sorted(df["required_tile_filename"].unique())
    logger.info("Found %d unique required tiles for %d events.", len(unique_tiles), len(df))

    results = {}
    success_count = 0
    fail_count = 0

    for i, tile_name in enumerate(unique_tiles):
        logger.info("[%d/%d] Processing tile: %s", i + 1, len(unique_tiles), tile_name)
        success, msg = download_tile(tile_name)
        results[tile_name] = {"success": success, "status": msg}
        if success:
            success_count += 1
        else:
            fail_count += 1
        time.sleep(0.5)  # Respect rate limits

    logger.info("Tile download summary: %d downloaded, %d failed out of %d total", success_count, fail_count, len(unique_tiles))
    return {
        "total_unique_tiles": len(unique_tiles),
        "successful_tiles": success_count,
        "failed_tiles": fail_count,
        "tile_results": results,
    }


if __name__ == "__main__":
    download_all_required_tiles()
