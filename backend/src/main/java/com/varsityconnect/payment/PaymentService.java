package com.varsityconnect.payment;

import com.varsityconnect.cart.CartRepository;
import com.varsityconnect.common.BadRequestException;
import com.varsityconnect.common.NotFoundException;
import com.varsityconnect.marketplace.ListingStatus;
import com.varsityconnect.marketplace.MarketplaceListing;
import com.varsityconnect.marketplace.MarketplaceListingRepository;
import com.varsityconnect.notification.OrderPaidEvent;
import com.varsityconnect.order.Order;
import com.varsityconnect.order.OrderRepository;
import com.varsityconnect.order.OrderResponse;
import com.varsityconnect.order.OrderStatus;
import com.varsityconnect.security.UserPrincipal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/* demo settlement, one transaction — money, stock and basket move together */
@Service
public class PaymentService {

  private final OrderRepository orders;
  private final PaymentRepository payments;
  private final CartRepository carts;
  private final MarketplaceListingRepository listings;
  private final PaymentProvider provider;
  private final ApplicationEventPublisher events;

  public PaymentService(
      OrderRepository orders,
      PaymentRepository payments,
      CartRepository carts,
      MarketplaceListingRepository listings,
      PaymentProvider provider,
      ApplicationEventPublisher events) {
    this.orders = orders;
    this.payments = payments;
    this.carts = carts;
    this.listings = listings;
    this.provider = provider;
    this.events = events;
  }

  @Transactional
  public PaymentResponse pay(UserPrincipal principal, UUID orderId, PayOrderRequest request) {
    Order order = orders.findById(orderId).orElseThrow(() -> new NotFoundException("order not found"));
    /* strangers get a 404, never a hint the order exists */
    if (!order.getBuyer().getId().equals(principal.id())) {
      throw new NotFoundException("order not found");
    }
    /* only fresh or previously-failed orders may settle — no double charges */
    if (order.getStatus() != OrderStatus.PENDING_PAYMENT
        && order.getStatus() != OrderStatus.PAYMENT_FAILED) {
      throw new BadRequestException("ORDER_INVALID", "order cannot be paid in its current state");
    }

    boolean approved = provider.charge(order, order.getTotal(), request.simulate());

    Payment payment =
        new Payment(
            order,
            order.getTotal(),
            approved ? PaymentStatus.SUCCEEDED : PaymentStatus.FAILED,
            provider.name());
    payments.save(payment);

    /* lock the rows, a retry races the open market for its own stock */
    List<MarketplaceListing> locked = new ArrayList<>();
    for (OrderItemRef row : itemsOf(order)) {
      locked.add(
          listings
              .findByIdForUpdate(row.listing().getId())
              .orElseThrow(() -> new NotFoundException("listing not found")));
    }
    boolean retry = order.getStatus() == OrderStatus.PAYMENT_FAILED;

    if (approved) {
      for (MarketplaceListing listing : locked) {
        if (retry) {
          /* failure released it, claim it back if nobody took it */
          if (listing.getStatus() != ListingStatus.ACTIVE) {
            throw new BadRequestException("ORDER_INVALID", "listing is no longer available");
          }
          listing.setStatus(ListingStatus.RESERVED);
        } else if (listing.getStatus() != ListingStatus.RESERVED) {
          throw new BadRequestException("ORDER_INVALID", "listing is no longer reserved for this order");
        }
        listing.setStatus(ListingStatus.SOLD);
      }
      order.setStatus(OrderStatus.PAID);
      order.setPaidAt(Instant.now());
      /* basket empties only now that money moved */
      carts.findByUserId(principal.id()).ifPresent(cart -> cart.getItems().clear());
      Order saved = orders.save(order);
      events.publishEvent(new OrderPaidEvent(saved.getId()));
      return PaymentResponse.from(payment, OrderResponse.from(saved));
    } else {
      /* stock goes back on the shelf, basket stays for a retry */
      for (MarketplaceListing listing : locked) {
        listing.setStatus(ListingStatus.ACTIVE);
      }
      order.setStatus(OrderStatus.PAYMENT_FAILED);
    }
    return PaymentResponse.from(payment, OrderResponse.from(orders.save(order)));
  }

  private record OrderItemRef(MarketplaceListing listing) {}

  private static java.util.List<OrderItemRef> itemsOf(Order order) {
    return order.getItems().stream().map(item -> new OrderItemRef(item.getListing())).toList();
  }
}
