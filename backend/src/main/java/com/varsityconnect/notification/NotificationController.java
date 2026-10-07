package com.varsityconnect.notification;

import com.varsityconnect.common.PageResponse;
import com.varsityconnect.security.UserPrincipal;
import java.util.Map;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/* thin inbox doors, every row is recipient-scoped */
@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {

  private final NotificationService service;

  public NotificationController(NotificationService service) {
    this.service = service;
  }

  @GetMapping
  public PageResponse<NotificationResponse> list(
      @AuthenticationPrincipal UserPrincipal principal,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    Pageable pageable = PageRequest.of(Math.max(page, 0), PageResponse.capSize(size));
    return service.list(principal, pageable);
  }

  @GetMapping("/unread-count")
  public Map<String, Long> unreadCount(@AuthenticationPrincipal UserPrincipal principal) {
    return Map.of("count", service.unreadCount(principal));
  }

  @PostMapping("/{id}/read")
  public NotificationResponse markRead(
      @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
    return service.markRead(principal, id);
  }

  @PostMapping("/read-all")
  public ResponseEntity<Void> markAllRead(@AuthenticationPrincipal UserPrincipal principal) {
    service.markAllRead(principal);
    return ResponseEntity.noContent().build();
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(
      @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
    service.delete(principal, id);
    return ResponseEntity.noContent().build();
  }
}
