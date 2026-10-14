package com.slopeguard.model;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

/**
 * In-memory geospatial raster grid representing a digital elevation surface.
 * Supports standard ESRI ASCII Raster formats with geodetic coordinate mapping.
 */
public class DemRasterGrid {

    private final int ncols;
    private final int nrows;
    private final double xllcorner;
    private final double yllcorner;
    private final double cellsize;
    private final double nodataValue;
    private final String crs;
    private final float[][] data;

    public DemRasterGrid(int ncols, int nrows, double xllcorner, double yllcorner,
                         double cellsize, double nodataValue, String crs, float[][] data) {
        this.ncols = ncols;
        this.nrows = nrows;
        this.xllcorner = xllcorner;
        this.yllcorner = yllcorner;
        this.cellsize = cellsize;
        this.nodataValue = nodataValue;
        this.crs = crs != null ? crs : "EPSG:4326";
        this.data = data;
    }

    public boolean contains(double latitude, double longitude) {
        double ymax = yllcorner + (nrows * cellsize);
        double xmax = xllcorner + (ncols * cellsize);
        return latitude >= yllcorner && latitude <= ymax && longitude >= xllcorner && longitude <= xmax;
    }

    public int getRow(double latitude) {
        double ymax = yllcorner + (nrows * cellsize);
        int row = (int) Math.floor((ymax - latitude) / cellsize);
        if (row >= nrows) {
            row = nrows - 1;
        }
        if (row < 0) {
            row = 0;
        }
        return row;
    }

    public int getCol(double longitude) {
        int col = (int) Math.floor((longitude - xllcorner) / cellsize);
        if (col >= ncols) {
            col = ncols - 1;
        }
        if (col < 0) {
            col = 0;
        }
        return col;
    }

    public double getCellLatitude(int row) {
        double ymax = yllcorner + (nrows * cellsize);
        return ymax - ((row + 0.5) * cellsize);
    }

    public double getCellLongitude(int col) {
        return xllcorner + ((col + 0.5) * cellsize);
    }

    public Float getElevation(int row, int col) {
        if (row < 0 || row >= nrows || col < 0 || col >= ncols) {
            return null;
        }
        float val = data[row][col];
        if (Math.abs(val - nodataValue) < 0.001f) {
            return null;
        }
        return val;
    }

    public Float getElevationAt(double latitude, double longitude) {
        if (!contains(latitude, longitude)) {
            return null;
        }
        return getElevation(getRow(latitude), getCol(longitude));
    }

    public boolean isNoData(int row, int col) {
        if (row < 0 || row >= nrows || col < 0 || col >= ncols) {
            return true;
        }
        return Math.abs(data[row][col] - nodataValue) < 0.001f;
    }

    public int getNcols() {
        return ncols;
    }

    public int getNrows() {
        return nrows;
    }

    public double getXllcorner() {
        return xllcorner;
    }

    public double getYllcorner() {
        return yllcorner;
    }

    public double getCellsize() {
        return cellsize;
    }

    public double getNodataValue() {
        return nodataValue;
    }

    public String getCrs() {
        return crs;
    }

    public float[][] getData() {
        return data;
    }

    /**
     * Parses an ESRI ASCII Grid raster stream into an in-memory DemRasterGrid.
     */
    public static DemRasterGrid parseAsciiGrid(InputStream in, String crs) throws IOException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            int ncols = -1;
            int nrows = -1;
            double xllcorner = Double.NaN;
            double yllcorner = Double.NaN;
            double cellsize = Double.NaN;
            double nodataValue = -9999.0;

            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty()) {
                    continue;
                }
                String[] parts = line.split("\\s+");
                if (parts.length >= 2) {
                    String key = parts[0].toLowerCase();
                    if ("ncols".equals(key)) {
                        ncols = Integer.parseInt(parts[1]);
                        continue;
                    } else if ("nrows".equals(key)) {
                        nrows = Integer.parseInt(parts[1]);
                        continue;
                    } else if ("xllcorner".equals(key) || "xllcenter".equals(key)) {
                        xllcorner = Double.parseDouble(parts[1]);
                        continue;
                    } else if ("yllcorner".equals(key) || "yllcenter".equals(key)) {
                        yllcorner = Double.parseDouble(parts[1]);
                        continue;
                    } else if ("cellsize".equals(key)) {
                        cellsize = Double.parseDouble(parts[1]);
                        continue;
                    } else if ("nodata_value".equals(key)) {
                        nodataValue = Double.parseDouble(parts[1]);
                        continue;
                    }
                }
                // Non-header line reached: start of raster elevation data
                break;
            }

            if (ncols <= 0 || nrows <= 0 || Double.isNaN(xllcorner) || Double.isNaN(yllcorner) || Double.isNaN(cellsize)) {
                throw new IllegalArgumentException("Malformed ESRI ASCII grid header: missing required geometric parameters.");
            }

            float[][] data = new float[nrows][ncols];
            int currentRow = 0;
            int currentCol = 0;

            // Process line that broke header loop if it contained data values
            if (line != null && !line.isEmpty()) {
                String[] parts = line.split("\\s+");
                String firstKey = parts[0].toLowerCase();
                boolean isHeaderKey = firstKey.equals("ncols") || firstKey.equals("nrows") || firstKey.equals("xllcorner")
                        || firstKey.equals("yllcorner") || firstKey.equals("cellsize") || firstKey.equals("nodata_value");

                if (!isHeaderKey) {
                    for (String token : parts) {
                        if (!token.isEmpty()) {
                            data[currentRow][currentCol++] = Float.parseFloat(token);
                            if (currentCol == ncols) {
                                currentRow++;
                                currentCol = 0;
                            }
                        }
                    }
                }
            }

            while ((line = reader.readLine()) != null && currentRow < nrows) {
                line = line.trim();
                if (line.isEmpty()) {
                    continue;
                }
                String[] tokens = line.split("\\s+");
                for (String token : tokens) {
                    if (!token.isEmpty()) {
                        data[currentRow][currentCol++] = Float.parseFloat(token);
                        if (currentCol == ncols) {
                            currentRow++;
                            currentCol = 0;
                            if (currentRow == nrows) {
                                break;
                            }
                        }
                    }
                }
            }

            return new DemRasterGrid(ncols, nrows, xllcorner, yllcorner, cellsize, nodataValue, crs, data);
        }
    }
}
