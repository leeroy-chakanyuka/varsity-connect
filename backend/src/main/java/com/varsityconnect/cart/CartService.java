package com.varsityconnect.cart;

import com.varsityconnect.common.ConflictException;
import com.varsityconnect.common.ForbiddenException;
import com.varsityconnect.common.NotFoundException;
import com.varsityconnect.marketplace.ListingStatus;
import com.varsityconnect.marketplace.MarketplaceListing;
import com.varsityconnect.marketplace.MarketplaceListingRepository;
import com.varsityconnect.security.UserPrincipal;
import com.varsityconnect.user.User;
import com.varsityconnect.user.UserRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/* basket workflows, every total is recalculated here — never trusted from clients */
@Service
public class CartService {

  private final CartRepository carts;
  private final CartItemRepository items;
  private final MarketplaceListingRepository listings;
  private final UserRepository users;

  public CartService(
      CartRepository carts,
      CartItemRepository items,
      MarketplaceListingRepository listings,
      UserRepository users) {
    this.carts = carts;
    this.items = items;
    this.listings = listings;
    this.users = users;
  }

  @Transactional
  public CartResponse getCart(UserPrincipal principal) {
    return CartResponse.from(cartOf(principal));
  }

  @Transactional
  public CartResponse addItem(UserPrincipal principal, AddCartItemRequest request) {
    Cart cart = cartOf(principal);
    MarketplaceListing listing =
        listings.findById(request.listingId()).orElseThrow(() -> new NotFoundException("listing not found"));

    /* your own shelf is not for sale to you */
    if (listing.getSeller().getId().equals(principal.id())) {
      throw new ForbiddenException("FORBIDDEN", "you cannot add your own listing to your cart");
    }
    if (listing.getStatus() != ListingStatus.ACTIVE) {
      throw new ConflictException("LISTING_NOT_AVAILABLE", "listing is no longer available");
    }

    /* second tap is a no-op, the row already exists */
    CartItem existing = items.findByCartIdAndListingId(cart.getId(), listing.getId()).orElse(null);
    if (existing == null) {
      int quantity = request.quantity() == null ? 1 : request.quantity();
      CartItem item = new CartItem(cart, listing, quantity);
      cart.getItems().add(item);
      items.save(item);
    }
    return CartResponse.from(cart);
  }

  @Transactional
  public CartResponse updateQuantity(UserPrincipal principal, UUID itemId, UpdateCartItemRequest request) {
    Cart cart = cartOf(principal);
    CartItem item =
        items.findById(itemId).filter(row -> row.getCart().getId().equals(cart.getId()))
            .orElseThrow(() -> new NotFoundException("cart item not found"));
    item.setQuantity(request.quantity());
    items.save(item);
    return CartResponse.from(cart);
  }

  @Transactional
  public CartResponse removeItem(UserPrincipal principal, UUID itemId) {
    Cart cart = cartOf(principal);
    CartItem item =
        items.findById(itemId).filter(row -> row.getCart().getId().equals(cart.getId()))
            .orElseThrow(() -> new NotFoundException("cart item not found"));
    cart.getItems().remove(item);
    items.delete(item);
    return CartResponse.from(cart);
  }

  @Transactional
  public CartResponse clear(UserPrincipal principal) {
    Cart cart = cartOf(principal);
    cart.getItems().clear();
    carts.save(cart);
    return CartResponse.from(cart);
  }

  /* exactly one basket per user, born empty on first touch */
  private Cart cartOf(UserPrincipal principal) {
    return carts.findByUserId(principal.id())
        .orElseGet(
            () -> {
              User user =
                  users.findById(principal.id()).orElseThrow(() -> new NotFoundException("user not found"));
              return carts.save(new Cart(user));
            });
  }
}
