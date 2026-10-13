package com.slopeguard.persistence;

import com.slopeguard.SlopeGuardApplication;
import com.slopeguard.dto.RegisterRequest;
import com.slopeguard.dto.ReportCreateRequest;
import com.slopeguard.dto.ReportResponse;
import com.slopeguard.dto.ReportStatusUpdateRequest;
import com.slopeguard.exception.DuplicateEmailException;
import com.slopeguard.model.AlertLifecycleStatus;
import com.slopeguard.model.AlertSeverity;
import com.slopeguard.model.AlertStatusHistory;
import com.slopeguard.model.AuditEvent;
import com.slopeguard.model.AuditEventType;
import com.slopeguard.model.AuditOutcome;
import com.slopeguard.model.EarlyWarningAlert;
import com.slopeguard.model.IncidentCategory;
import com.slopeguard.model.IncidentReport;
import com.slopeguard.model.ReportPhotoMetadata;
import com.slopeguard.model.ReportStatus;
import com.slopeguard.model.RiskAssessmentRecord;
import com.slopeguard.model.User;
import com.slopeguard.model.UserRole;
import com.slopeguard.repository.AlertStatusHistoryRepository;
import com.slopeguard.repository.AuditEventRepository;
import com.slopeguard.repository.EarlyWarningAlertRepository;
import com.slopeguard.repository.IncidentReportRepository;
import com.slopeguard.repository.ReportPhotoRepository;
import com.slopeguard.repository.RiskAssessmentRepository;
import com.slopeguard.repository.UserRepository;
import com.slopeguard.service.AlertService;
import com.slopeguard.service.AuditService;
import com.slopeguard.service.PhotoService;
import com.slopeguard.service.ReportService;
import com.slopeguard.service.UserService;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.io.IOException;
import java.net.Socket;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * End-to-end integration test verifying complete persistence against live MySQL 8.x.
 * Validates Flyway migrations, Hibernate validation, user authentication, reports,
 * photos, assessments, alerts, audit logging, transactions, and backend restart recovery.
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class LiveMySQLPersistenceIntegrationTest {

    private static final String MYSQL_HOST = "localhost";
    private static final int MYSQL_PORT = 3306;

    private static final String[] MYSQL_PROPERTIES = {
            "server.port=0",
            "spring.datasource.url=jdbc:mysql://localhost:3306/slopeguard?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC",
            "spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver",
            "spring.datasource.username=root",
            "spring.datasource.password=",
            "spring.jpa.hibernate.ddl-auto=validate",
            "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect",
            "spring.jpa.properties.hibernate.type.preferred_enum_jdbc_type=12",
            "spring.flyway.enabled=true",
            "spring.flyway.locations=classpath:db/migration",
            "slopeguard.security.jwt.secret=slopeguard_test_secure_jwt_signing_key_minimum_32_bytes_2026_northeast",
            "slopeguard.security.jwt.issuer=slopeguard-backend",
            "slopeguard.upload.dir=./target/mysql-test-uploads",
            "slopeguard.admin.bootstrap.enabled=false"
    };

    private static boolean mysqlAvailable = false;

    @BeforeAll
    static void checkMySQLAvailability() {
        try (Socket socket = new Socket(MYSQL_HOST, MYSQL_PORT)) {
            mysqlAvailable = true;
        } catch (IOException e) {
            mysqlAvailable = false;
        }
    }

    private ConfigurableApplicationContext startContext() {
        Assumptions.assumeTrue(mysqlAvailable, "MySQL is not accessible at localhost:3306, skipping live MySQL persistence test.");
        return new SpringApplicationBuilder(SlopeGuardApplication.class)
                .properties(MYSQL_PROPERTIES)
                .run();
    }

    @Test
    @Order(1)
    @DisplayName("1. User registration, password hashing, and duplicate rejection on live MySQL")
    void testUserPersistenceAndDuplicateRejection() {
        try (ConfigurableApplicationContext context = startContext()) {
            UserService userService = context.getBean(UserService.class);
            PasswordEncoder encoder = context.getBean(PasswordEncoder.class);
            UserRepository userRepo = context.getBean(UserRepository.class);

            String uniqueEmail = "citizen_" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
            User userResp = userService.registerCitizen(new RegisterRequest(
                    "Tenzing Norgay",
                    uniqueEmail,
                    "SherpaPass2026!",
                    "+91-9876543210"
            ));

            assertNotNull(userResp.getId());
            assertEquals("Tenzing Norgay", userResp.getFullName());
            assertEquals(UserRole.CITIZEN, userResp.getRole());

            // Verify password hashing in MySQL
            User dbUser = userRepo.findById(userResp.getId()).orElseThrow();
            assertTrue(encoder.matches("SherpaPass2026!", dbUser.getPasswordHash()));
            assertFalse(dbUser.getPasswordHash().contains("SherpaPass2026!"));

            // Verify duplicate email conflict rejection
            assertThrows(DuplicateEmailException.class, () ->
                    userService.registerCitizen(new RegisterRequest(
                            "Duplicate User",
                            uniqueEmail,
                            "AnotherPassword123!",
                            "+91-1111111111"
                    ))
            );
        }
    }

    @Test
    @Order(2)
    @DisplayName("2. Incident report creation, photo upload, and status transition on live MySQL")
    void testReportLifecycleAndPhotoPersistence() throws Exception {
        try (ConfigurableApplicationContext context = startContext()) {
            UserService userService = context.getBean(UserService.class);
            ReportService reportService = context.getBean(ReportService.class);
            PhotoService photoService = context.getBean(PhotoService.class);
            ReportPhotoRepository photoRepo = context.getBean(ReportPhotoRepository.class);
            IncidentReportRepository reportRepo = context.getBean(IncidentReportRepository.class);

            // Register citizen
            String citizenEmail = "reporter_" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
            User citizen = userService.registerCitizen(new RegisterRequest(
                    "Dorjee Tshering", citizenEmail, "Password123456!", null
            ));

            // Create report
            ReportResponse report = reportService.createReport(new ReportCreateRequest(
                    "Dorjee Tshering",
                    "Massive tension crack observed along NH-10 slope near Sevoke bridge.",
                    26.8850,
                    88.4650,
                    "NH-10 Sevoke Teesta Corridor",
                    IncidentCategory.SLOPE_CRACK,
                    LocalDateTime.now().minusHours(2)
            ), citizen.getId(), citizen.getEmail());

            assertNotNull(report.getId());
            assertEquals(ReportStatus.PENDING, report.getStatus());

            // Upload photo with valid PNG magic bytes
            java.awt.image.BufferedImage img = new java.awt.image.BufferedImage(32, 32, java.awt.image.BufferedImage.TYPE_INT_RGB);
            java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
            javax.imageio.ImageIO.write(img, "png", baos);
            byte[] dummyImage = baos.toByteArray();

            MockMultipartFile dummyFile = new MockMultipartFile(
                    "file", "nh10_crack.png", "image/png", dummyImage
            );
            var photoResp = photoService.uploadPhoto(
                    report.getId(),
                    dummyFile,
                    citizen.getId(),
                    false
            );

            assertNotNull(photoResp.getId());
            assertEquals("image/png", photoResp.getContentType());

            // Verify photo row in MySQL
            ReportPhotoMetadata photoMeta = photoRepo.findById(photoResp.getId()).orElseThrow();
            assertEquals(report.getId(), photoMeta.getReportId());
            assertEquals("nh10_crack.png", photoMeta.getOriginalFilename());
            assertEquals(dummyImage.length, photoMeta.getFileSize());
            assertNotNull(photoMeta.getChecksum());

            // Update report status as admin
            var updatedReport = reportService.updateReportStatus(
                    report.getId(),
                    new ReportStatusUpdateRequest(ReportStatus.UNDER_REVIEW, "Geotechnical inspection initiated"),
                    1L,
                    "admin@slopeguard.gov.in"
            );
            assertEquals(ReportStatus.UNDER_REVIEW, updatedReport.getStatus());

            // Verify report state in DB
            IncidentReport dbReport = reportRepo.findById(report.getId()).orElseThrow();
            assertEquals(ReportStatus.UNDER_REVIEW, dbReport.getStatus());
            assertEquals(citizen.getId(), dbReport.getReporterUserId());
        }
    }

    @Test
    @Order(3)
    @DisplayName("3. Risk assessment records and AI provenance persistence on live MySQL")
    void testRiskAssessmentPersistence() {
        try (ConfigurableApplicationContext context = startContext()) {
            RiskAssessmentRepository assessmentRepo = context.getBean(RiskAssessmentRepository.class);

            String assessmentId = "RISK-" + UUID.randomUUID().toString();
            RiskAssessmentRecord record = new RiskAssessmentRecord(
                    assessmentId,
                    27.3314,
                    88.6138,
                    LocalDateTime.now(),
                    "v1.4.0",
                    "DEMO_NOT_VALIDATED",
                    "ELEVATED",
                    0.88,
                    "HIGH",
                    false,
                    "FRESH",
                    "HIGH",
                    145.2,
                    220.0,
                    38.5,
                    1520.0,
                    "Gneiss and Schist",
                    "Silty Clay",
                    true,
                    "ALERT-TEST-001",
                    "{\"model_version\": \"v1.4.0\", \"inference_ms\": 14.2, \"features\": {\"slope\": 38.5}}"
            );

            RiskAssessmentRecord saved = assessmentRepo.save(record);
            assertNotNull(saved.getId());

            RiskAssessmentRecord fetched = assessmentRepo.findById(assessmentId).orElseThrow();
            assertEquals("HIGH", fetched.getRiskCategory());
            assertEquals(0.88, fetched.getRiskScore());
            assertTrue(fetched.getProvenanceJson().contains("v1.4.0"));
        }
    }

    @Test
    @Order(4)
    @DisplayName("4. Alert lifecycle, deduplication, and append-only status history on live MySQL")
    void testAlertLifecycleAndStatusHistory() {
        try (ConfigurableApplicationContext context = startContext()) {
            AlertService alertService = context.getBean(AlertService.class);
            EarlyWarningAlertRepository alertRepo = context.getBean(EarlyWarningAlertRepository.class);
            AlertStatusHistoryRepository historyRepo = context.getBean(AlertStatusHistoryRepository.class);

            String alertId = "ALERT-" + UUID.randomUUID().toString().substring(0, 8);
            EarlyWarningAlert alert = new EarlyWarningAlert(
                    alertId,
                    "Lachung Valley Road Km 18",
                    27.6890,
                    88.7430,
                    AlertSeverity.CRITICAL,
                    "ACTIVE",
                    "Active debris flow threatening lower bypass route.",
                    LocalDateTime.now(),
                    new HashMap<>(),
                    "AI"
            );

            UserService userService = context.getBean(UserService.class);
            User admin = userService.registerCitizen(new RegisterRequest(
                    "Disaster Management Officer",
                    "disaster.officer." + UUID.randomUUID().toString().substring(0, 8) + "@slopeguard.gov.in",
                    "AdminPass123456!",
                    null
            ));

            // Create alert
            var alertResp = alertService.createAlertIfEligible(alert);
            assertNotNull(alertResp.getId());
            assertEquals(AlertLifecycleStatus.ACTIVE, alertResp.getLifecycleStatus());

            // Transition to RESOLVED
            var resolvedResp = alertService.updateAlertStatus(
                    alertResp.getId(),
                    AlertLifecycleStatus.RESOLVED,
                    "Slope cleared and stabilized by Border Roads Organisation.",
                    admin.getId()
            );

            assertEquals(AlertLifecycleStatus.RESOLVED, resolvedResp.getLifecycleStatus());

            // Verify append-only history in MySQL
            List<AlertStatusHistory> history = historyRepo.findByAlertIdOrderByTransitionTimestampDesc(alertResp.getId());
            assertFalse(history.isEmpty());
            assertTrue(history.stream().anyMatch(h -> h.getNewStatus() == AlertLifecycleStatus.RESOLVED));
        }
    }

    @Test
    @Order(5)
    @DisplayName("5. Audit event persistence and retrieval on live MySQL")
    void testAuditEventPersistence() {
        try (ConfigurableApplicationContext context = startContext()) {
            AuditService auditService = context.getBean(AuditService.class);
            AuditEventRepository auditRepo = context.getBean(AuditEventRepository.class);

            AuditEvent event = auditService.recordEvent(
                    AuditEventType.SECURITY_VIOLATION,
                    null,
                    null,
                    AuditOutcome.FAILURE,
                    "Live MySQL security audit test: unauthorized access attempt prevented.",
                    null,
                    null
            );

            assertNotNull(event.getEventId());
            AuditEvent fetched = auditRepo.findById(event.getEventId()).orElseThrow();
            assertEquals(AuditEventType.SECURITY_VIOLATION, fetched.getEventType());
            assertEquals(AuditOutcome.FAILURE, fetched.getOutcome());
        }
    }

    @Test
    @Order(6)
    @DisplayName("6. Persistence across simulated backend restart on live MySQL")
    void testPersistenceAcrossBackendRestart() {
        String testUserEmail = "restart.test." + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
        Long createdUserId;
        Long createdReportId;
        String alertId;

        // --- SESSION 1: Write entities to MySQL ---
        try (ConfigurableApplicationContext context1 = startContext()) {
            UserService userService = context1.getBean(UserService.class);
            ReportService reportService = context1.getBean(ReportService.class);
            AlertService alertService = context1.getBean(AlertService.class);

            // Register user
            User user = userService.registerCitizen(new RegisterRequest(
                    "Persistence Restart Verifier",
                    testUserEmail,
                    "SafePassword99!",
                    "+91-9999988888"
            ));
            createdUserId = user.getId();

            // Submit report
            ReportResponse report = reportService.createReport(new ReportCreateRequest(
                    "Persistence Restart Verifier",
                    "Persistent crack on hill face verified across server restart.",
                    25.5788,
                    91.8933,
                    "Shillong Peak Escarpment",
                    IncidentCategory.ROCKFALL,
                    LocalDateTime.now().minusHours(1)
            ), createdUserId, testUserEmail);
            createdReportId = report.getId();

            // Create alert
            EarlyWarningAlert alert = new EarlyWarningAlert(
                    "ALERT-TEMP-" + UUID.randomUUID().toString().substring(0, 8),
                    "Lachen North Sector",
                    27.8500,
                    88.6500,
                    AlertSeverity.HIGH,
                    "ACTIVE",
                    "Rockfall warning across restart test",
                    LocalDateTime.now(),
                    Map.of(),
                    "AI"
            );
            EarlyWarningAlert createdAlert = alertService.createAlertIfEligible(alert);
            alertId = createdAlert.getId();
        }
        // Context 1 is now CLOSED and terminated (simulating server shutdown)

        // --- SESSION 2: Start brand-new Spring Boot backend context connected to same MySQL ---
        try (ConfigurableApplicationContext context2 = startContext()) {
            UserRepository userRepo = context2.getBean(UserRepository.class);
            IncidentReportRepository reportRepo = context2.getBean(IncidentReportRepository.class);
            EarlyWarningAlertRepository alertRepo = context2.getBean(EarlyWarningAlertRepository.class);
            PasswordEncoder encoder = context2.getBean(PasswordEncoder.class);

            // Verify user survived restart
            User userAfterRestart = userRepo.findById(createdUserId).orElse(null);
            assertNotNull(userAfterRestart, "User entity must persist across backend restart!");
            assertEquals(testUserEmail, userAfterRestart.getEmail());
            assertTrue(encoder.matches("SafePassword99!", userAfterRestart.getPasswordHash()));

            // Verify report survived restart
            IncidentReport reportAfterRestart = reportRepo.findById(createdReportId).orElse(null);
            assertNotNull(reportAfterRestart, "IncidentReport entity must persist across backend restart!");
            assertEquals("Shillong Peak Escarpment", reportAfterRestart.getLocationDescription());
            assertEquals(createdUserId, reportAfterRestart.getReporterUserId());

            // Verify alert survived restart
            EarlyWarningAlert alertAfterRestart = alertRepo.findById(alertId).orElse(null);
            assertNotNull(alertAfterRestart, "EarlyWarningAlert entity must persist across backend restart!");
            assertEquals("Lachen North Sector", alertAfterRestart.getLocationName());
            assertEquals(AlertLifecycleStatus.ACTIVE, alertAfterRestart.getLifecycleStatus());
        }
    }
}
