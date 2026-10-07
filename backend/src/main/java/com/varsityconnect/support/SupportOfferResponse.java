package com.varsityconnect.support;

import java.time.Instant;
import java.util.UUID;

/* offer card shape, responder is a summary */
public record SupportOfferResponse(
    UUID id,
    UUID requestId,
    ResponderSummary responder,
    String message,
    OfferStatus status,
    Instant createdAt) {

  public record ResponderSummary(UUID id, String fullName) {}

  public static SupportOfferResponse from(SupportOffer offer) {
    return new SupportOfferResponse(
        offer.getId(),
        offer.getRequest().getId(),
        new ResponderSummary(offer.getResponder().getId(), offer.getResponder().getFullName()),
        offer.getMessage(),
        offer.getStatus(),
        offer.getCreatedAt());
  }
}
