package com.slopeguard.repository;

import com.slopeguard.model.MonitoredArea;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MonitoredAreaRepository extends JpaRepository<MonitoredArea, Long> {

    Optional<MonitoredArea> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    @Query("SELECT a FROM MonitoredArea a WHERE (:search IS NULL OR LOWER(a.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(a.district) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(a.stateRegion) LIKE LOWER(CONCAT('%', :search, '%'))) AND (:status IS NULL OR a.monitoringStatus = :status)")
    Page<MonitoredArea> searchAreas(@Param("search") String search, @Param("status") String status, Pageable pageable);

    long countByMonitoringStatus(String monitoringStatus);
}
