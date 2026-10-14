package com.slopeguard.repository;

import com.slopeguard.model.AlertStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA repository for {@link AlertStatusHistory} entities.
 */
@Repository
public interface AlertStatusHistoryRepository extends JpaRepository<AlertStatusHistory, Long> {

    List<AlertStatusHistory> findByAlertIdOrderByTransitionTimestampDesc(String alertId);
}
