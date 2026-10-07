package com.varsityconnect.payment;

import com.varsityconnect.security.UserPrincipal;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/* demo till, ownership comes from the jwt */
@RestController
@RequestMapping("/api/v1/orders")
public class PaymentController {

  private final PaymentService service;

  public PaymentController(PaymentService service) {
    this.service = service;
  }

  @PostMapping("/{orderId}/payments")
  public PaymentResponse pay(
      @AuthenticationPrincipal UserPrincipal principal,
      @PathVariable UUID orderId,
      @Valid @RequestBody PayOrderRequest request) {
    return service.pay(principal, orderId, request);
  }
}
