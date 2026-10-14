# Verified Historical Landslide Datasets

**Status:** Awaiting domain acquisition from Geological Survey of India (GSI) / National Remote Sensing Centre (NRSC) / India Meteorological Department (IMD).

## Guidelines for Adding Real Data
1. Any file placed in this directory must contain **verified field observations** only.
2. In each row, set `is_synthetic = false` and attribute the exact provenance in `data_source` (e.g., `GSI_BHUKOSH_SHILLONG_2020_2023`).
3. Include metadata files specifying:
   - Collection agency and survey protocol
   - Spatial bounding box
   - Temporal observation window
   - Target label definition (`1` = field-verified landslide; `0` = surveyed stable reference site)
4. Never place synthetic fixtures in this folder.
