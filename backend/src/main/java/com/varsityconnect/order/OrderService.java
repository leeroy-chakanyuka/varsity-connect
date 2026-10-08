package com.varsityconnect.order;

import com.varsityconnect.cart.Cart;
import com.varsityconnect.cart.CartRepository;
import com.varsityconnect.common.BadRequestException;
import com.varsityconnect.common.ConflictException;
import com.varsityconnect.common.ForbiddenException;
import com.varsityconnect.common.NotFoundException;
import com.varsityconnect.common.PageResponse;
import com.varsityconnect.marketplace.ListingStatus;
import com.varsityconnect.marketplace.MarketplaceListing;
import com.varsityconnect.marketplace.MarketplaceListingRepository;
import com.varsityconnect.notification.OrderCreatedEvent;
import com.varsityconnect.security.UserPrincipal;
import com.varsityconnect.user.User;
import com.varsityconnect.user.UserRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/* checkout, one transaction — all rows reserve together or nothing does */
@Service
public class OrderService {

  private final OrderRepository orders;
  private final CartRepository carts;
  private final MarketplaceListingRepository listings;
  private final UserRepository users;
  private final ApplicationEventPublisher events;

  public OrderService(
      OrderRepository orders,
      CartRepository carts,
      MarketplaceListingRepository listings,
      UserRepository users,
      ApplicationEventPublisher events) {
    this.orders = orders;
    this.carts = carts;
    this.listings = listings;
    this.users = users;
    this.events = events;
  }

  @Transactional
  public OrderResponse checkout(UserPrincipal principal, CreateOrderRequest request) {
    User buyer =
        users.findById(principal.id()).orElseThrow(() -> new NotFoundException("user not found"));
    Cart cart =
        carts.findByUserId(principal.id()).orElseThrow(() -> new BadRequestException("CART_EMPTY", "cart is empty"));
    if (cart.getItems().isEmpty()) {
      throw new BadRequestException("CART_EMPTY", "cart is empty");
    }

    /* lock every row first, a racing checkout waits here then fails below */
    List<MarketplaceListing> locked = new ArrayList<>();
    for (var item : cart.getItems()) {
      UUID listingId = item.getListing().getId();
      MarketplaceListing listing =
          listings.findByIdForUpdate(listingId).orElseThrow(() -> new NotFoundException("listing not found"));
      if (listing.getSeller().getId().equals(principal.id())) {
        throw new ForbiddenException("FORBIDDEN", "you cannot buy your own listing");
      }
      if (listing.getStatus() != ListingStatus.ACTIVE) {
        throw new ConflictException("LISTING_NOT_AVAILABLE", "listing is no longer available");
      }
      locked.add(listing);
    }

    /* current prices win, whatever the cart saw before is ignored */
    Order order = new Order(buyer, request.deliveryMethod(), request.paymentMethod());
    BigDecimal subtotal = BigDecimal.ZERO;
    for (int i = 0; i < cart.getItems().size(); i++) {
      var item = cart.getItems().get(i);
      MarketplaceListing listing = locked.get(i);
      OrderItem row =
          new OrderItem(
              order,
              listing,
              listing.getTitle(),
              listing.getPrice(),
              listing.getSeller(),
              item.getQuantity());
      order.getItems().add(row);
      subtotal = subtotal.add(listing.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
      /* off the shelf the moment the order exists */
      listing.setStatus(ListingStatus.RESERVED);
    }
    order.setSubtotal(subtotal);
    order.setTotal(subtotal);

    /* basket stays until payment settles it — stage 10 clears on success */
    Order saved = orders.save(order);
    events.publishEvent(new OrderCreatedEvent(saved.getId()));
    return OrderResponse.from(saved);
  }

  @Transactional(readOnly = true)
  public PageResponse<OrderResponse> mine(UserPrincipal principal, Pageable pageable) {
    Page<Order> page = orders.findByBuyerIdOrderByCreatedAtDesc(principal.id(), pageable);
    return new PageResponse<>(
        page.getContent().stream().map(OrderResponse::from).toList(),
        page.getNumber(),
        page.getSize(),
        page.getTotalElements(),
        page.getTotalPages(),
        page.isFirst(),
        page.isLast());
  }

  @Transactional(readOnly = true)
  public OrderResponse detail(UserPrincipal principal, UUID id) {
    Order order = orders.findById(id).orElseThrow(() -> new NotFoundException("order not found"));
    /* buyers and the order's sellers may read, strangers get a 404 */
    boolean buyer = order.getBuyer().getId().equals(principal.id());
    boolean seller =
        order.getItems().stream().anyMatch(item -> item.getSeller().getId().equals(principal.id()));
    if (!buyer && !seller) {
      throw new NotFoundException("order not found");
    }
    return OrderResponse.from(order);
  }

  /* seller says the goods wait at the meeting point */
  @Transactional
  public OrderResponse markReady(UserPrincipal principal, UUID id) {
    Order order = orders.findById(id).orElseThrow(() -> new NotFoundException("order not found"));
    boolean seller =
        order.getItems().stream().anyMatch(item -> item.getSeller().getId().equals(principal.id()));
    if (!seller) {
      throw new ForbiddenException("FORBIDDEN", "only the seller may mark this order ready");
    }
    if (order.getStatus() != OrderStatus.PAID) {
      throw new BadRequestException("ORDER_INVALID", "only paid orders can be marked ready");
    }
    order.setStatus(OrderStatus.READY_FOR_COLLECTION);
    return OrderResponse.from(orders.save(order));
  }

  /* buyer closes the loop, reviews unlock from here */
  @Transactional
  public OrderResponse complete(UserPrincipal principal, UUID id) {
    Order order = mine(id, principal);
    if (order.getStatus() != OrderStatus.PAID
        && order.getStatus() != OrderStatus.READY_FOR_COLLECTION) {
      throw new BadRequestException("ORDER_INVALID", "only paid orders can be completed");
    }
    order.setStatus(OrderStatus.COMPLETED);
    order.setCompletedAt(Instant.now());
    return OrderResponse.from(orders.save(order));
  }

  /* buyer backs out before money moves, stock returns to the shelf */
  @Transactional
  public OrderResponse cancel(UserPrincipal principal, UUID id) {
    Order order = mine(id, principal);
    if (order.getStatus() != OrderStatus.PENDING_PAYMENT
        && order.getStatus() != OrderStatus.PAYMENT_FAILED) {
      throw new BadRequestException("ORDER_INVALID", "only unpaid orders can be cancelled");
    }
    for (var item : order.getItems()) {
      listings
          .findById(item.getListing().getId())
          .ifPresent(listing -> listing.setStatus(ListingStatus.ACTIVE));
    }
    order.setStatus(OrderStatus.CANCELLED);
    return OrderResponse.from(orders.save(order));
  }

  private Order mine(UUID id, UserPrincipal principal) {
    Order order = orders.findById(id).orElseThrow(() -> new NotFoundException("order not found"));
    if (!order.getBuyer().getId().equals(principal.id())) {
      throw new NotFoundException("order not found");
    }
    return order;
  }
}
