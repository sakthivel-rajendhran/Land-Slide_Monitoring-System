package com.slopeguard.repository;

import com.slopeguard.model.RiskAssessmentRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for {@link RiskAssessmentRecord} entities.
 */
@Repository
public interface RiskAssessmentRepository extends JpaRepository<RiskAssessmentRecord, String> {

    List<RiskAssessmentRecord> findTop50ByOrderByAssessmentTimestampDesc();

    @Query("SELECT r FROM RiskAssessmentRecord r WHERE " +
           "r.latitude BETWEEN :minLat AND :maxLat AND " +
           "r.longitude BETWEEN :minLon AND :maxLon " +
           "ORDER BY r.assessmentTimestamp DESC")
    List<RiskAssessmentRecord> findInBoundingBox(
            @Param("minLat") Double minLat,
            @Param("maxLat") Double maxLat,
            @Param("minLon") Double minLon,
            @Param("maxLon") Double maxLon
    );

    @Query("SELECT r FROM RiskAssessmentRecord r WHERE " +
           "(:riskCategory IS NULL OR r.riskCategory = :riskCategory) AND " +
           "(:status IS NULL OR r.riskStatus = :status)")
    Page<RiskAssessmentRecord> findByFilters(
            @Param("riskCategory") String riskCategory,
            @Param("status") String status,
            Pageable pageable
    );

    Optional<RiskAssessmentRecord> findFirstByLatitudeAndLongitudeAndAssessmentTimestampAfter(
            Double latitude, Double longitude, LocalDateTime timestamp);
}
