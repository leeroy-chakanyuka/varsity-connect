package com.varsityconnect.order;

import com.varsityconnect.common.PageResponse;
import com.varsityconnect.security.UserPrincipal;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/* thin order doors, buyers only ever see their own rows */
@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

  private final OrderService service;

  public OrderController(OrderService service) {
    this.service = service;
  }

  @PostMapping
  public ResponseEntity<OrderResponse> checkout(
      @AuthenticationPrincipal UserPrincipal principal,
      @Valid @RequestBody CreateOrderRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.checkout(principal, request));
  }

  @GetMapping
  public PageResponse<OrderResponse> mine(
      @AuthenticationPrincipal UserPrincipal principal,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    Pageable pageable = PageRequest.of(Math.max(page, 0), PageResponse.capSize(size));
    return service.mine(principal, pageable);
  }

  @GetMapping("/{id}")
  public OrderResponse detail(
      @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID id) {
    return service.detail(principal, id);
  }
}
