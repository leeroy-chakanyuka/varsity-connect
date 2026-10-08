package com.varsityconnect.cart;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/* persistence only, basket rules live in CartService.
 * no fetch graphs here on purpose: checkout locks listing rows right after
 * reading the basket, and already-managed rows would skip the lock. */
public interface CartRepository extends JpaRepository<Cart, UUID> {

  Optional<Cart> findByUserId(UUID userId);
}
