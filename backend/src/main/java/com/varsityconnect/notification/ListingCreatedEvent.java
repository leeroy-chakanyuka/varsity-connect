package com.varsityconnect.notification;

import java.util.UUID;

/* a fresh listing hit the shelf — no subscribers in v1, kept for feeds later */
public record ListingCreatedEvent(UUID listingId, UUID sellerId) {}
