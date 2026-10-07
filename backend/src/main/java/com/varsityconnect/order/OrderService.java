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
import com.varsityconnect.security.UserPrincipal;
import com.varsityconnect.user.User;
import com.varsityconnect.user.UserRepository;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
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

  public OrderService(
      OrderRepository orders,
      CartRepository carts,
      MarketplaceListingRepository listings,
      UserRepository users) {
    this.orders = orders;
    this.carts = carts;
    this.listings = listings;
    this.users = users;
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
    return OrderResponse.from(orders.save(order));
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
    /* strangers get a 404, never a hint the order exists */
    if (!order.getBuyer().getId().equals(principal.id())) {
      throw new NotFoundException("order not found");
    }
    return OrderResponse.from(order);
  }
}
