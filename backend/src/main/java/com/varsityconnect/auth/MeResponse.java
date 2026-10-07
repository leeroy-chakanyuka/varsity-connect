package com.varsityconnect.auth;

import com.varsityconnect.user.UserRole;
import java.time.Instant;
import java.util.UUID;

/* safe current-user view, password hash never leaves the server */
public record MeResponse(
    UUID id,
    String fullName,
    String email,
    String studentNumber,
    String faculty,
    String phoneNumber,
    String bio,
    String profileImageUrl,
    UserRole role,
    boolean enabled,
    Instant createdAt) {}
