package com.varsityconnect.review;

import com.varsityconnect.security.UserPrincipal;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/* thin review doors, the path always names the reviewee */
@RestController
@RequestMapping("/api/v1/users/{id}/reviews")
public class ReviewController {

  private final ReviewService service;

  public ReviewController(ReviewService service) {
    this.service = service;
  }

  @GetMapping
  public List<ReviewResponse> list(@PathVariable UUID id) {
    return service.forUser(id);
  }

  @PostMapping
  public ResponseEntity<ReviewResponse> review(
      @AuthenticationPrincipal UserPrincipal principal,
      @PathVariable UUID id,
      @Valid @RequestBody CreateReviewRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.review(principal, id, request));
  }
}
