package com.slopeguard.dto;

import com.slopeguard.model.EarlyWarningAlert;
import java.util.List;

/**
 * Paginated response wrapper for early warning alerts.
 */
public class AlertPageResponse {

    private List<EarlyWarningAlert> content;
    private long totalElements;
    private int page;
    private int size;
    private int totalPages;

    public AlertPageResponse() {
    }

    public AlertPageResponse(List<EarlyWarningAlert> content, long totalElements, int page, int size, int totalPages) {
        this.content = content;
        this.totalElements = totalElements;
        this.page = page;
        this.size = size;
        this.totalPages = totalPages;
    }

    public List<EarlyWarningAlert> getContent() {
        return content;
    }

    public void setContent(List<EarlyWarningAlert> content) {
        this.content = content;
    }

    public long getTotalElements() {
        return totalElements;
    }

    public void setTotalElements(long totalElements) {
        this.totalElements = totalElements;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }
}
