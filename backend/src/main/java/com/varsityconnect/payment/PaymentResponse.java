package com.varsityconnect.payment;

import com.varsityconnect.order.OrderResponse;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/* attempt plus the order it left behind, one round trip for the ui */
public record PaymentResponse(
    UUID id,
    BigDecimal amount,
    PaymentStatus status,
    String provider,
    Instant createdAt,
    OrderResponse order) {

  public static PaymentResponse from(Payment payment, OrderResponse order) {
    return new PaymentResponse(
        payment.getId(),
        payment.getAmount(),
        payment.getStatus(),
        payment.getProvider(),
        payment.getCreatedAt(),
        order);
  }
}
