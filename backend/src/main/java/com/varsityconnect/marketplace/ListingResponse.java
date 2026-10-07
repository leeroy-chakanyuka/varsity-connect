package com.varsityconnect.marketplace;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/* listing card shape, seller is a summary — never the full user */
public record ListingResponse(
    UUID id,
    SellerSummary seller,
    String title,
    String description,
    BigDecimal price,
    ListingCategory category,
    ListingCondition condition,
    String location,
    ListingStatus status,
    List<String> imageUrls,
    Instant createdAt,
    Instant updatedAt) {

  public record SellerSummary(UUID id, String fullName) {}

  public static ListingResponse from(MarketplaceListing listing) {
    List<String> urls =
        listing.getImages().stream().map(ListingImage::getImageUrl).toList();
    return new ListingResponse(
        listing.getId(),
        new SellerSummary(listing.getSeller().getId(), listing.getSeller().getFullName()),
        listing.getTitle(),
        listing.getDescription(),
        listing.getPrice(),
        listing.getCategory(),
        listing.getCondition(),
        listing.getLocation(),
        listing.getStatus(),
        urls,
        listing.getCreatedAt(),
        listing.getUpdatedAt());
  }
}
