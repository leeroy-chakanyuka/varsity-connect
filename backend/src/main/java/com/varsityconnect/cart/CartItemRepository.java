package com.varsityconnect.cart;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/* persistence only, basket rules live in CartService */
public interface CartItemRepository extends JpaRepository<CartItem, UUID> {

  Optional<CartItem> findByCartIdAndListingId(UUID cartId, UUID listingId);
}
