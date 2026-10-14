package com.slopeguard.service;

import com.slopeguard.dto.MonitoredAreaRequest;
import com.slopeguard.dto.MonitoredAreaResponse;
import com.slopeguard.exception.InvalidStatusTransitionException;
import com.slopeguard.exception.ResourceNotFoundException;
import com.slopeguard.model.MonitoredArea;
import com.slopeguard.repository.MonitoredAreaRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Primary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Primary
public class JpaAreaService implements AreaService {

    private final MonitoredAreaRepository areaRepository;

    public JpaAreaService(MonitoredAreaRepository areaRepository) {
        this.areaRepository = areaRepository;
    }

    @PostConstruct
    @Transactional
    public void init() {
        if (areaRepository.count() == 0) {
            areaRepository.save(new MonitoredArea("Shillong Ridge Corridor", "Meghalaya", "East Khasi Hills", 25.5788, 91.8933, "Primary escarpment ridge monitoring sector above Shillong city.", "ACTIVE"));
            areaRepository.save(new MonitoredArea("NH-10 Sevoke Teesta Corridor", "West Bengal", "Kalimpong", 26.8850, 88.4650, "Critical strategic transport lifeline exposed to heavy rainfall failures.", "ACTIVE"));
            areaRepository.save(new MonitoredArea("Gangtok East Hillside", "Sikkim", "East Sikkim", 27.3314, 88.6138, "Steep urbanized terrain sector with saturated weathered overburden.", "ACTIVE"));
            areaRepository.save(new MonitoredArea("Mangan Highway Link Km 18", "Sikkim", "North Sikkim", 27.5020, 88.5340, "High relief corridor subject to seasonal rockfalls and debris avalanches.", "ACTIVE"));
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MonitoredAreaResponse> listAreas(String search, String status, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "name"));
        return areaRepository.searchAreas(search, status, pageRequest).map(this::mapToResponse);
    }

    @Override
    @Transactional
    public MonitoredAreaResponse createArea(MonitoredAreaRequest request) {
        if (areaRepository.existsByNameIgnoreCase(request.getName())) {
            throw new InvalidStatusTransitionException("This area already exists.");
        }

        MonitoredArea area = new MonitoredArea(
                request.getName().trim(),
                request.getStateRegion().trim(),
                request.getDistrict().trim(),
                request.getLatitude(),
                request.getLongitude(),
                request.getDescription(),
                request.getMonitoringStatus() != null ? request.getMonitoringStatus() : "ACTIVE"
        );

        MonitoredArea saved = areaRepository.save(area);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public MonitoredAreaResponse getArea(Long id) {
        MonitoredArea area = areaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Monitored area with ID " + id + " was not found."));
        return mapToResponse(area);
    }

    @Override
    @Transactional
    public MonitoredAreaResponse updateArea(Long id, MonitoredAreaRequest request) {
        MonitoredArea area = areaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Monitored area with ID " + id + " was not found."));

        if (!area.getName().equalsIgnoreCase(request.getName()) && areaRepository.existsByNameIgnoreCase(request.getName())) {
            throw new InvalidStatusTransitionException("This area already exists.");
        }

        area.setName(request.getName().trim());
        area.setStateRegion(request.getStateRegion().trim());
        area.setDistrict(request.getDistrict().trim());
        area.setLatitude(request.getLatitude());
        area.setLongitude(request.getLongitude());
        area.setDescription(request.getDescription());
        if (request.getMonitoringStatus() != null) {
            area.setMonitoringStatus(request.getMonitoringStatus());
        }

        MonitoredArea updated = areaRepository.save(area);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public MonitoredAreaResponse updateAreaStatus(Long id, String status) {
        MonitoredArea area = areaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Monitored area with ID " + id + " was not found."));

        area.setMonitoringStatus(status.toUpperCase());
        MonitoredArea updated = areaRepository.save(area);
        return mapToResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public long countActiveAreas() {
        return areaRepository.countByMonitoringStatus("ACTIVE");
    }

    private MonitoredAreaResponse mapToResponse(MonitoredArea a) {
        return new MonitoredAreaResponse(
                a.getId(),
                a.getName(),
                a.getStateRegion(),
                a.getDistrict(),
                a.getLatitude(),
                a.getLongitude(),
                a.getDescription(),
                a.getMonitoringStatus(),
                a.getCreatedAt(),
                a.getUpdatedAt()
        );
    }
}
