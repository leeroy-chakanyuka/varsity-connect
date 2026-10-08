package com.varsityconnect.review;

import java.time.Instant;
import java.util.UUID;

/* one voice on a seller, newest first wherever listed */
public record ReviewResponse(
    UUID id,
    UUID reviewerId,
    String reviewerName,
    UUID revieweeId,
    UUID orderId,
    int rating,
    String comment,
    Instant createdAt) {

  public static ReviewResponse from(Review review) {
    return new ReviewResponse(
        review.getId(),
        review.getReviewer().getId(),
        review.getReviewer().getFullName(),
        review.getReviewee().getId(),
        review.getOrder().getId(),
        review.getRating(),
        review.getComment(),
        review.getCreatedAt());
  }
}
