package com.slopeguard.controller;

import com.slopeguard.dto.ChangePasswordRequest;
import com.slopeguard.dto.UpdateProfileRequest;
import com.slopeguard.dto.UserProfileResponse;
import com.slopeguard.dto.UserRoleUpdateRequest;
import com.slopeguard.dto.UserStatusUpdateRequest;
import com.slopeguard.exception.InvalidCredentialsException;
import com.slopeguard.exception.ResourceNotFoundException;
import com.slopeguard.model.AuditEventType;
import com.slopeguard.model.AuditOutcome;
import com.slopeguard.model.User;
import com.slopeguard.repository.UserRepository;
import com.slopeguard.service.AuditService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Controller for authenticated user profile updates, password changes, and administrative user account management.
 * Owned by Module 1 (Ragul).
 */
@RestController
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public UserController(UserRepository userRepository, PasswordEncoder passwordEncoder, AuditService auditService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    /**
     * Updates full name of authenticated user.
     */
    @PutMapping("/api/users/me")
    public ResponseEntity<UserProfileResponse> updateProfile(@AuthenticationPrincipal Jwt jwt,
                                                             @Valid @RequestBody UpdateProfileRequest request) {
        Long userId = Long.valueOf(jwt.getSubject());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user account was not found."));

        user.setFullName(request.getFullName().trim());
        user.setUpdatedAt(LocalDateTime.now());
        User saved = userRepository.save(user);

        return ResponseEntity.ok(new UserProfileResponse(
                saved.getId(),
                saved.getFullName(),
                saved.getEmail(),
                saved.getRole(),
                saved.getPhoneNumber(),
                saved.getCreatedAt()
        ));
    }

    /**
     * Changes password of authenticated user, verifying current password.
     */
    @PutMapping("/api/users/me/password")
    public ResponseEntity<Map<String, Object>> changePassword(@AuthenticationPrincipal Jwt jwt,
                                                              @Valid @RequestBody ChangePasswordRequest request) {
        Long userId = Long.valueOf(jwt.getSubject());
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user account was not found."));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid current password provided.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "message", "Your password has been updated successfully.",
                "success", true
        ));
    }

    /**
     * Lists user accounts with pagination. Restricted to administrators.
     */
    @GetMapping("/api/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<UserProfileResponse>> listUsers(@RequestParam(defaultValue = "0") int page,
                                                               @RequestParam(defaultValue = "20") int size) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<UserProfileResponse> users = userRepository.findAll(pageRequest)
                .map(u -> new UserProfileResponse(
                        u.getId(),
                        u.getFullName(),
                        u.getEmail(),
                        u.getRole(),
                        u.getPhoneNumber(),
                        u.getCreatedAt()
                ));
        return ResponseEntity.ok(users);
    }

    /**
     * Updates role of specified user. Restricted to administrators.
     */
    @PutMapping("/api/admin/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserProfileResponse> updateUserRole(@PathVariable Long id,
                                                              @AuthenticationPrincipal Jwt jwt,
                                                              @Valid @RequestBody UserRoleUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User with ID " + id + " was not found."));

        user.setRole(request.getRole());
        user.setUpdatedAt(LocalDateTime.now());
        User saved = userRepository.save(user);

        Long actorId = jwt != null ? Long.valueOf(jwt.getSubject()) : null;
        auditService.recordEvent(
                AuditEventType.SECURITY_VIOLATION,
                actorId,
                null,
                AuditOutcome.SUCCESS,
                "Updated user ID " + id + " role to " + request.getRole(),
                null,
                null
        );

        return ResponseEntity.ok(new UserProfileResponse(
                saved.getId(),
                saved.getFullName(),
                saved.getEmail(),
                saved.getRole(),
                saved.getPhoneNumber(),
                saved.getCreatedAt()
        ));
    }

    /**
     * Activates or deactivates specified user account. Restricted to administrators.
     */
    @PutMapping("/api/admin/users/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserProfileResponse> updateUserStatus(@PathVariable Long id,
                                                                @AuthenticationPrincipal Jwt jwt,
                                                                @Valid @RequestBody UserStatusUpdateRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User with ID " + id + " was not found."));

        user.setEnabled(request.getEnabled());
        user.setUpdatedAt(LocalDateTime.now());
        User saved = userRepository.save(user);

        Long actorId = jwt != null ? Long.valueOf(jwt.getSubject()) : null;
        auditService.recordEvent(
                AuditEventType.SECURITY_VIOLATION,
                actorId,
                null,
                AuditOutcome.SUCCESS,
                "Updated user ID " + id + " enabled state to " + request.getEnabled(),
                null,
                null
        );

        return ResponseEntity.ok(new UserProfileResponse(
                saved.getId(),
                saved.getFullName(),
                saved.getEmail(),
                saved.getRole(),
                saved.getPhoneNumber(),
                saved.getCreatedAt()
        ));
    }
}
