package com.varsityconnect.lostfound;

import com.varsityconnect.marketplace.ListingCategory;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/* report card shape, owner is a summary — never the full user */
public record ReportResponse(
    UUID id,
    OwnerSummary owner,
    ReportType type,
    String itemName,
    ListingCategory category,
    String description,
    String location,
    LocalDate incidentDate,
    String imageUrl,
    ReportStatus status,
    Instant createdAt,
    Instant updatedAt) {

  public record OwnerSummary(UUID id, String fullName) {}

  public static ReportResponse from(LostFoundReport report) {
    return new ReportResponse(
        report.getId(),
        new OwnerSummary(report.getOwner().getId(), report.getOwner().getFullName()),
        report.getType(),
        report.getItemName(),
        report.getCategory(),
        report.getDescription(),
        report.getLocation(),
        report.getIncidentDate(),
        report.getImageUrl(),
        report.getStatus(),
        report.getCreatedAt(),
        report.getUpdatedAt());
  }
}
