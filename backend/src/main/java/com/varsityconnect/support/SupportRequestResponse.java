package com.varsityconnect.support;

import java.time.Instant;
import java.util.UUID;

/* request card shape, requester is a summary */
public record SupportRequestResponse(
    UUID id,
    RequesterSummary requester,
    SupportType type,
    String title,
    String description,
    String location,
    SupportUrgency urgency,
    SupportStatus status,
    Instant resolvedAt,
    Instant createdAt,
    Instant updatedAt) {

  public record RequesterSummary(UUID id, String fullName) {}

  public static SupportRequestResponse from(SupportRequest request) {
    return new SupportRequestResponse(
        request.getId(),
        new RequesterSummary(request.getRequester().getId(), request.getRequester().getFullName()),
        request.getType(),
        request.getTitle(),
        request.getDescription(),
        request.getLocation(),
        request.getUrgency(),
        request.getStatus(),
        request.getResolvedAt(),
        request.getCreatedAt(),
        request.getUpdatedAt());
  }
}
