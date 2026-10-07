package com.varsityconnect.support;

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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/* thin survival doors, the jwt picks every side */
@RestController
@RequestMapping("/api/v1/support")
public class SupportController {

  private final SupportService service;

  public SupportController(SupportService service) {
    this.service = service;
  }

  @GetMapping("/requests")
  public PageResponse<SupportRequestResponse> browse(
      @RequestParam(required = false) SupportStatus status,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    Pageable pageable =
        PageRequest.of(
            Math.max(page, 0),
            PageResponse.capSize(size),
            Sort.by(Sort.Direction.DESC, "createdAt"));
    return service.browse(status, pageable);
  }

  @PostMapping("/requests")
  public ResponseEntity<SupportRequestResponse> create(
      @AuthenticationPrincipal UserPrincipal principal,
      @Valid @RequestBody CreateSupportRequest body) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.create(principal, body));
  }

  @GetMapping("/requests/{id}")
  public SupportRequestResponse detail(@PathVariable UUID id) {
    return service.detail(id);
  }

  @PatchMapping("/requests/{id}")
  public SupportRequestResponse update(
      @PathVariable UUID id,
      @AuthenticationPrincipal UserPrincipal principal,
      @Valid @RequestBody UpdateSupportRequest body) {
    return service.update(id, principal, body);
  }

  @PostMapping("/requests/{id}/cancel")
  public SupportRequestResponse cancel(
      @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
    return service.cancel(id, principal);
  }

  @PostMapping("/requests/{id}/resolve")
  public SupportRequestResponse resolve(
      @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
    return service.resolve(id, principal);
  }

  @PostMapping("/requests/{id}/offers")
  public ResponseEntity<SupportOfferResponse> offer(
      @PathVariable UUID id,
      @AuthenticationPrincipal UserPrincipal principal,
      @Valid @RequestBody CreateSupportOffer body) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.offer(id, principal, body));
  }

  @GetMapping("/requests/{id}/offers")
  public List<SupportOfferResponse> offers(@PathVariable UUID id) {
    return service.offersOf(id);
  }

  @PostMapping("/offers/{id}/accept")
  public SupportOfferResponse accept(
      @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
    return service.accept(id, principal);
  }

  @PostMapping("/offers/{id}/decline")
  public SupportOfferResponse decline(
      @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
    return service.decline(id, principal);
  }

  @PostMapping("/offers/{id}/withdraw")
  public SupportOfferResponse withdraw(
      @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
    return service.withdraw(id, principal);
  }
}
