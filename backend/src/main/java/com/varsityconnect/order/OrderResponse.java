package com.varsityconnect.order;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/* order view, item rows carry the frozen snapshots */
public record OrderResponse(
    UUID id,
    UUID buyerId,
    String buyerName,
    DeliveryMethod deliveryMethod,
    PaymentMethod paymentMethod,
    BigDecimal subtotal,
    BigDecimal total,
    OrderStatus status,
    Instant paidAt,
    Instant completedAt,
    Instant createdAt,
    List<OrderItemResponse> items) {

  public record OrderItemResponse(
      UUID id,
      UUID listingId,
      String title,
      BigDecimal unitPrice,
      UUID sellerId,
      String sellerName,
      int quantity,
      BigDecimal lineTotal) {}

  public static OrderResponse from(Order order) {
    List<OrderItemResponse> items =
        order.getItems().stream()
            .map(
                item ->
                    new OrderItemResponse(
                        item.getId(),
                        item.getListingSnapshotId(),
                        item.getTitleSnapshot(),
                        item.getUnitPriceSnapshot(),
                        item.getSeller().getId(),
                        item.getSeller().getFullName(),
                        item.getQuantity(),
                        item.getUnitPriceSnapshot().multiply(BigDecimal.valueOf(item.getQuantity()))))
            .toList();
    return new OrderResponse(
        order.getId(),
        order.getBuyer().getId(),
        order.getBuyer().getFullName(),
        order.getDeliveryMethod(),
        order.getPaymentMethod(),
        order.getSubtotal(),
        order.getTotal(),
        order.getStatus(),
        order.getPaidAt(),
        order.getCompletedAt(),
        order.getCreatedAt(),
        items);
  }
}
