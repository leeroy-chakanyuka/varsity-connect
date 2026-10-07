package com.varsityconnect.community;

import java.time.Instant;
import java.util.UUID;

/* thread card shape, author is a summary */
public record PostResponse(
    UUID id,
    AuthorSummary author,
    String title,
    String body,
    String imageUrl,
    boolean pinned,
    long commentCount,
    Instant createdAt,
    Instant updatedAt) {

  public record AuthorSummary(UUID id, String fullName) {}

  public static PostResponse from(CommunityPost post) {
    return new PostResponse(
        post.getId(),
        new AuthorSummary(post.getAuthor().getId(), post.getAuthor().getFullName()),
        post.getTitle(),
        post.getBody(),
        post.getImageUrl(),
        post.isPinned(),
        post.getCommentCount(),
        post.getCreatedAt(),
        post.getUpdatedAt());
  }
}
