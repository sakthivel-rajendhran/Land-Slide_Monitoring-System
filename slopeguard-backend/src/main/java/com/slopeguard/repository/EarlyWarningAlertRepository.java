package com.slopeguard.repository;

import com.slopeguard.model.AlertLifecycleStatus;
import com.slopeguard.model.AlertSeverity;
import com.slopeguard.model.EarlyWarningAlert;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Spring Data JPA repository for {@link EarlyWarningAlert} entities.
 */
@Repository
public interface EarlyWarningAlertRepository extends JpaRepository<EarlyWarningAlert, String> {

    List<EarlyWarningAlert> findByLifecycleStatus(AlertLifecycleStatus lifecycleStatus);

    @Query("SELECT a FROM EarlyWarningAlert a WHERE " +
           "(:severity IS NULL OR a.severity = :severity) AND " +
           "(:status IS NULL OR a.lifecycleStatus = :status)")
    Page<EarlyWarningAlert> findByFilters(
            @Param("severity") AlertSeverity severity,
            @Param("status") AlertLifecycleStatus status,
            Pageable pageable
    );

    @Query("SELECT a FROM EarlyWarningAlert a WHERE " +
           "a.lifecycleStatus = :status AND " +
           "a.severity = :severity AND " +
           "a.latitude BETWEEN :minLat AND :maxLat AND " +
           "a.longitude BETWEEN :minLon AND :maxLon AND " +
           "a.creationTimestamp >= :since")
    List<EarlyWarningAlert> findActiveInProximity(
            @Param("status") AlertLifecycleStatus status,
            @Param("severity") AlertSeverity severity,
            @Param("minLat") Double minLat,
            @Param("maxLat") Double maxLat,
            @Param("minLon") Double minLon,
            @Param("maxLon") Double maxLon,
            @Param("since") LocalDateTime since
    );
}
