package com.slopeguard.service;

import com.slopeguard.dto.RiskSummaryResponse;
import com.slopeguard.exception.ResourceNotFoundException;
import com.slopeguard.model.RiskCategory;
import com.slopeguard.model.RiskRecord;
import com.slopeguard.util.GeoUtils;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Service implementation providing sample landslide risk records for development.
 * <p>
 * Scientific Integrity Guarantee:
 * All records returned by this service are explicitly flagged with sampleData=true and
 * clearly attributed as development fixtures. They represent typical geographic sectors
 * across the 8 northeastern states of India for UI integration and testing.
 */
@Service
public class SampleRiskService implements RiskService {

    private static final String DATA_SOURCE = "SlopeGuard Northeast Hill Tracts Demo Dataset (Static Development Sample)";

    private final Map<Long, RiskRecord> riskRecords = new ConcurrentHashMap<>();

    public SampleRiskService() {
        initializeSampleData();
    }

    private void initializeSampleData() {
        LocalDateTime baseTime = LocalDateTime.now().minusHours(2);

        addRecord(new RiskRecord(
                1L,
                "Kohima South Slope Corridor",
                "Nagaland",
                25.6751,
                94.1086,
                RiskCategory.VERY_HIGH,
                88.0,
                185.0,
                baseTime,
                DATA_SOURCE,
                true
        ));

        addRecord(new RiskRecord(
                2L,
                "Shillong Peak Ridge & Upper Shillong",
                "Meghalaya",
                25.5788,
                91.8933,
                RiskCategory.HIGH,
                78.5,
                142.0,
                baseTime.minusMinutes(15),
                DATA_SOURCE,
                true
        ));

        addRecord(new RiskRecord(
                3L,
                "Aizawl Chhinga Veng Escarpment",
                "Mizoram",
                23.7271,
                92.7176,
                RiskCategory.HIGH,
                74.2,
                120.5,
                baseTime.minusMinutes(30),
                DATA_SOURCE,
                true
        ));

        addRecord(new RiskRecord(
                4L,
                "Gangtok Deorali Bypass Slope",
                "Sikkim",
                27.3389,
                88.6065,
                RiskCategory.MODERATE,
                58.0,
                85.0,
                baseTime.minusMinutes(45),
                DATA_SOURCE,
                true
        ));

        addRecord(new RiskRecord(
                5L,
                "Itanagar Capital Complex Sector 4",
                "Arunachal Pradesh",
                27.0844,
                93.6053,
                RiskCategory.MODERATE,
                61.0,
                92.0,
                baseTime.minusMinutes(60),
                DATA_SOURCE,
                true
        ));

        addRecord(new RiskRecord(
                6L,
                "Guwahati Narakasur Hill Base",
                "Assam",
                26.1445,
                91.7362,
                RiskCategory.LOW,
                28.5,
                35.0,
                baseTime.minusMinutes(90),
                DATA_SOURCE,
                true
        ));
    }

    private void addRecord(RiskRecord record) {
        // Enforce data validation rules
        if (!GeoUtils.isValidCoordinate(record.getLatitude(), record.getLongitude())) {
            throw new IllegalArgumentException("Invalid coordinates for sample record: " + record.getLocationName());
        }
        if (record.getRiskScore() != null) {
            record.setRiskScore(GeoUtils.clampScore(record.getRiskScore()));
        }
        record.setSampleData(true);
        riskRecords.put(record.getId(), record);
    }

    @Override
    public List<RiskRecord> getAllRisks() {
        List<RiskRecord> list = new ArrayList<>(riskRecords.values());
        list.sort(Comparator.comparing(RiskRecord::getId));
        return Collections.unmodifiableList(list);
    }

    @Override
    public RiskRecord getRiskById(Long id) {
        RiskRecord record = riskRecords.get(id);
        if (record == null) {
            throw new ResourceNotFoundException("Risk record with ID " + id + " was not found.");
        }
        return record;
    }

    @Override
    public RiskSummaryResponse getRiskSummary() {
        List<RiskRecord> records = new ArrayList<>(riskRecords.values());
        Map<RiskCategory, Long> categoryCounts = new EnumMap<>(RiskCategory.class);

        for (RiskCategory category : RiskCategory.values()) {
            categoryCounts.put(category, 0L);
        }

        RiskRecord highestRisk = null;

        for (RiskRecord r : records) {
            categoryCounts.put(r.getRiskCategory(), categoryCounts.get(r.getRiskCategory()) + 1);
            if (highestRisk == null || (r.getRiskScore() != null && r.getRiskScore() > highestRisk.getRiskScore())) {
                highestRisk = r;
            }
        }

        String highestLocation = highestRisk != null ? highestRisk.getLocationName() : "N/A";
        Double highestScore = highestRisk != null ? highestRisk.getRiskScore() : 0.0;

        return new RiskSummaryResponse(
                records.size(),
                categoryCounts,
                highestLocation,
                highestScore,
                true,
                "Development sample summary for Northeast India hill tracts. Not verified real-time scientific telemetry."
        );
    }
}
