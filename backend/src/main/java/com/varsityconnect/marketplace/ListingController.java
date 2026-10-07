package com.varsityconnect.marketplace;

import com.varsityconnect.common.PageResponse;
import com.varsityconnect.security.UserPrincipal;
import jakarta.validation.Valid;
import java.math.BigDecimal;
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

/* thin marketplace doors, filters run in the database */
@RestController
@RequestMapping("/api/v1/marketplace/listings")
public class ListingController {

  private final ListingService service;

  public ListingController(ListingService service) {
    this.service = service;
  }

  @GetMapping
  public PageResponse<ListingResponse> browse(
      @RequestParam(required = false) String search,
      @RequestParam(required = false) ListingCategory category,
      @RequestParam(required = false) ListingCondition condition,
      @RequestParam(required = false) BigDecimal minPrice,
      @RequestParam(required = false) BigDecimal maxPrice,
      @RequestParam(required = false) UUID sellerId,
      @RequestParam(required = false, defaultValue = "ACTIVE") ListingStatus status,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(defaultValue = "createdAt,desc") String sort) {
    /* public browsing only ever sees active stock unless asked otherwise */
    var filter =
        new ListingSpecifications.Filter(search, category, condition, minPrice, maxPrice, sellerId, status);
    return service.browse(filter, pageable(page, size, sort));
  }

  @PostMapping
  public ResponseEntity<ListingResponse> create(
      @AuthenticationPrincipal UserPrincipal principal,
      @Valid @RequestBody CreateListingRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.create(principal, request));
  }

  @GetMapping("/{id}")
  public ListingResponse detail(
      @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
    return service.detail(id, principal);
  }

  @PatchMapping("/{id}")
  public ListingResponse update(
      @PathVariable UUID id,
      @AuthenticationPrincipal UserPrincipal principal,
      @Valid @RequestBody UpdateListingRequest request) {
    return service.update(id, principal, request);
  }

  /* archive, not a hard delete — history matters for orders later */
  @DeleteMapping("/{id}")
  public ListingResponse archive(
      @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
    return service.archive(id, principal);
  }

  private static Pageable pageable(int page, int size, String sort) {
    int safePage = Math.max(page, 0);
    int safeSize = PageResponse.capSize(size);
    Sort sortBy = Sort.by(Sort.Direction.DESC, "createdAt");
    if (sort != null && !sort.isBlank()) {
      String[] parts = sort.split(",");
      String property = parts[0].trim();
      if (!property.isEmpty() && property.matches("[a-zA-Z]+")) {
        Sort.Direction direction =
            parts.length > 1 && parts[1].trim().equalsIgnoreCase("asc")
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        sortBy = Sort.by(direction, property);
      }
    }
    return PageRequest.of(safePage, safeSize, sortBy);
  }
}
