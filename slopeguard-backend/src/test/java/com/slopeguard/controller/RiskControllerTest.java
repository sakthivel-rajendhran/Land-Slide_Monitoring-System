package com.slopeguard.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class RiskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /api/risks returns list of sample risk locations")
    void getAllRisks_shouldReturnSampleRecords() throws Exception {
        mockMvc.perform(get("/api/risks")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$", hasSize(greaterThan(0))))
                .andExpect(jsonPath("$[0].sampleData", is(true)))
                .andExpect(jsonPath("$[0].dataSource", notNullValue()));
    }

    @Test
    @DisplayName("GET /api/risks/{id} with existing ID returns risk record")
    void getRiskById_whenExists_shouldReturnRecord() throws Exception {
        mockMvc.perform(get("/api/risks/1")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)))
                .andExpect(jsonPath("$.locationName", notNullValue()))
                .andExpect(jsonPath("$.state", notNullValue()))
                .andExpect(jsonPath("$.riskCategory", notNullValue()))
                .andExpect(jsonPath("$.sampleData", is(true)));
    }

    @Test
    @DisplayName("GET /api/risks/{id} with unknown ID returns 404 Not Found")
    void getRiskById_whenUnknown_shouldReturn404() throws Exception {
        mockMvc.perform(get("/api/risks/9999")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.error", is("Not Found")))
                .andExpect(jsonPath("$.message", is("Risk record with ID 9999 was not found.")))
                .andExpect(jsonPath("$.path", is("/api/risks/9999")));
    }

    @Test
    @DisplayName("GET /api/risks/summary returns aggregate statistics")
    void getRiskSummary_shouldReturnSummary() throws Exception {
        mockMvc.perform(get("/api/risks/summary")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalMonitoredLocations", greaterThan(0)))
                .andExpect(jsonPath("$.categoryCounts", notNullValue()))
                .andExpect(jsonPath("$.sampleData", is(true)))
                .andExpect(jsonPath("$.highestRiskLocation", notNullValue()));
    }
}
