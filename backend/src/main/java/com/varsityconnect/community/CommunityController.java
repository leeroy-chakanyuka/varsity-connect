package com.varsityconnect.community;

import com.varsityconnect.common.PageResponse;
import com.varsityconnect.security.UserPrincipal;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/* thin community doors, no threads/likes/reactions in v1 */
@RestController
@RequestMapping("/api/v1/community")
public class CommunityController {

  private final CommunityService service;

  public CommunityController(CommunityService service) {
    this.service = service;
  }

  @GetMapping("/posts")
  public PageResponse<PostResponse> browse(
      @RequestParam(required = false) String search,
      @RequestParam(defaultValue = "latest") String sort,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    /* trending counts comments first, everything else is newest first */
    Sort sortBy =
        "trending".equalsIgnoreCase(sort)
            ? Sort.by(Sort.Order.desc("commentCount"), Sort.Order.desc("createdAt"))
            : Sort.by(Sort.Direction.DESC, "createdAt");
    Pageable pageable = PageRequest.of(Math.max(page, 0), PageResponse.capSize(size), sortBy);
    return service.browse(search, pageable);
  }

  @PostMapping("/posts")
  public ResponseEntity<PostResponse> create(
      @AuthenticationPrincipal UserPrincipal principal,
      @Valid @RequestBody CreatePostRequest body) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.createPost(principal, body));
  }

  @GetMapping("/posts/{id}")
  public PostResponse detail(@PathVariable UUID id) {
    return service.detail(id);
  }

  @PatchMapping("/posts/{id}")
  public PostResponse update(
      @PathVariable UUID id,
      @AuthenticationPrincipal UserPrincipal principal,
      @Valid @RequestBody UpdatePostRequest body) {
    return service.updatePost(id, principal, body);
  }

  @DeleteMapping("/posts/{id}")
  public ResponseEntity<Void> delete(
      @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
    service.deletePost(id, principal);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/posts/{id}/comments")
  public List<CommentResponse> comments(@PathVariable UUID id) {
    return service.commentsOf(id);
  }

  @PostMapping("/posts/{id}/comments")
  public ResponseEntity<CommentResponse> comment(
      @PathVariable UUID id,
      @AuthenticationPrincipal UserPrincipal principal,
      @Valid @RequestBody CreateCommentRequest body) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.comment(id, principal, body));
  }

  @PatchMapping("/comments/{id}")
  public CommentResponse updateComment(
      @PathVariable UUID id,
      @AuthenticationPrincipal UserPrincipal principal,
      @Valid @RequestBody UpdateCommentRequest body) {
    return service.updateComment(id, principal, body);
  }

  @DeleteMapping("/comments/{id}")
  public ResponseEntity<Void> deleteComment(
      @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
    service.deleteComment(id, principal);
    return ResponseEntity.noContent().build();
  }
}
