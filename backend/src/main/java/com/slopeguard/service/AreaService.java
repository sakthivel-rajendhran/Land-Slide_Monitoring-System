package com.slopeguard.service;

import com.slopeguard.dto.MonitoredAreaRequest;
import com.slopeguard.dto.MonitoredAreaResponse;
import org.springframework.data.domain.Page;

public interface AreaService {

    Page<MonitoredAreaResponse> listAreas(String search, String status, int page, int size);

    MonitoredAreaResponse createArea(MonitoredAreaRequest request);

    MonitoredAreaResponse getArea(Long id);

    MonitoredAreaResponse updateArea(Long id, MonitoredAreaRequest request);

    MonitoredAreaResponse updateAreaStatus(Long id, String status);

    long countActiveAreas();
}
