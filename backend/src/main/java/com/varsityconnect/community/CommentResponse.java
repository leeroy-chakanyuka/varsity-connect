package com.varsityconnect.community;

import java.time.Instant;
import java.util.UUID;

/* reply shape, author is a summary */
public record CommentResponse(
    UUID id, UUID postId, PostResponse.AuthorSummary author, String body, Instant createdAt) {

  public static CommentResponse from(CommunityComment comment) {
    return new CommentResponse(
        comment.getId(),
        comment.getPost().getId(),
        new PostResponse.AuthorSummary(
            comment.getAuthor().getId(), comment.getAuthor().getFullName()),
        comment.getBody(),
        comment.getCreatedAt());
  }
}
