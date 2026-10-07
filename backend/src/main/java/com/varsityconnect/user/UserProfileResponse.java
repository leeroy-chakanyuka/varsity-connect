package com.varsityconnect.user;

import com.varsityconnect.user.UserRole;
import java.time.Instant;
import java.util.UUID;

/* full profile view, safe to show to any logged-in user — never carries a hash */
public record UserProfileResponse(
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
    double averageRating,
    long reviewCount,
    Instant createdAt) {}
