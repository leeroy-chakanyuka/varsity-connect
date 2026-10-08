package com.varsityconnect.cart;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

/* persistence only, basket rules live in CartService */
public interface CartRepository extends JpaRepository<Cart, UUID> {

  /* basket reads walk rows, listings, and sellers — one round trip */
  @EntityGraph(attributePaths = {"items", "items.listing", "items.listing.seller"})
  Optional<Cart> findByUserId(UUID userId);
}
