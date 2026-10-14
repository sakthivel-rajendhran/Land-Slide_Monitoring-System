package com.slopeguard.dto;

import com.slopeguard.model.UserRole;
import jakarta.validation.constraints.NotNull;

public class UserRoleUpdateRequest {

    @NotNull(message = "Role is required")
    private UserRole role;

    public UserRoleUpdateRequest() {}

    public UserRoleUpdateRequest(UserRole role) {
        this.role = role;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }
}
