package com.varsityconnect.admin;

import com.varsityconnect.common.PageResponse;
import com.varsityconnect.community.PostResponse;
import com.varsityconnect.marketplace.ListingResponse;
import com.varsityconnect.security.UserPrincipal;
import com.varsityconnect.support.SupportRequestResponse;
import com.varsityconnect.user.UserProfileResponse;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/* backend-side role checks on every door, no frontend claim trusted */
@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

  private final AdminService service;

  public AdminController(AdminService service) {
    this.service = service;
  }

  @GetMapping("/users")
  public PageResponse<UserProfileResponse> users(
      @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
    return service.users(pageable(page, size));
  }

  @PostMapping("/users/{id}/disable")
  public UserProfileResponse disable(@PathVariable UUID id) {
    return service.setEnabled(id, false);
  }

  @PostMapping("/users/{id}/enable")
  public UserProfileResponse enable(@PathVariable UUID id) {
    return service.setEnabled(id, true);
  }

  @GetMapping("/listings")
  public PageResponse<ListingResponse> listings(
      @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
    return service.listings(pageable(page, size));
  }

  @DeleteMapping("/listings/{id}")
  public ResponseEntity<Void> archiveListing(
      @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
    service.archiveListing(id, principal);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/community/posts")
  public PageResponse<PostResponse> posts(
      @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
    return service.posts(pageable(page, size));
  }

  @DeleteMapping("/community/posts/{id}")
  public ResponseEntity<Void> deletePost(
      @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
    service.deletePost(id, principal);
    return ResponseEntity.noContent().build();
  }

  @GetMapping("/support/requests")
  public PageResponse<SupportRequestResponse> supportRequests(
      @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
    return service.supportRequests(pageable(page, size));
  }

  private static Pageable pageable(int page, int size) {
    return PageRequest.of(Math.max(page, 0), PageResponse.capSize(size), Sort.by(Sort.Direction.DESC, "createdAt"));
  }
}
