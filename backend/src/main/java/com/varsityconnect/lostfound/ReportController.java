package com.varsityconnect.lostfound;

import com.varsityconnect.common.PageResponse;
import com.varsityconnect.marketplace.ListingCategory;
import com.varsityconnect.security.UserPrincipal;
import jakarta.validation.Valid;
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

/* thin report doors, filters run in the database */
@RestController
@RequestMapping("/api/v1/lost-found/reports")
public class ReportController {

  private final ReportService service;

  public ReportController(ReportService service) {
    this.service = service;
  }

  @GetMapping
  public PageResponse<ReportResponse> browse(
      @RequestParam(required = false) String search,
      @RequestParam(required = false) ReportType type,
      @RequestParam(required = false) ListingCategory category,
      @RequestParam(required = false) String location,
      @RequestParam(required = false) ReportStatus status,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    /* closed reports stay out unless explicitly asked for */
    var filter =
        new ReportSpecifications.Filter(search, type, category, location, status, null, false);
    Pageable pageable =
        PageRequest.of(Math.max(page, 0), PageResponse.capSize(size), Sort.by(Sort.Direction.DESC, "createdAt"));
    return service.browse(filter, pageable);
  }

  @PostMapping
  public ResponseEntity<ReportResponse> create(
      @AuthenticationPrincipal UserPrincipal principal,
      @Valid @RequestBody CreateReportRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.create(principal, request));
  }

  @GetMapping("/{id}")
  public ReportResponse detail(@PathVariable UUID id) {
    return service.detail(id);
  }

  @PatchMapping("/{id}")
  public ReportResponse update(
      @PathVariable UUID id,
      @AuthenticationPrincipal UserPrincipal principal,
      @Valid @RequestBody UpdateReportRequest request) {
    return service.update(id, principal, request);
  }

  /* close, not a hard delete — match history matters next stage */
  @DeleteMapping("/{id}")
  public ReportResponse close(
      @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
    return service.close(id, principal);
  }

  /* confirmed pairs leave the board, only from a matched report */
  @PostMapping("/{id}/resolve")
  public ReportResponse resolve(
      @PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
    return service.resolve(id, principal);
  }
}
