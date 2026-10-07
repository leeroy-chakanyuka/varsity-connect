package com.varsityconnect.cart;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/* persistence only, basket rules live in CartService */
public interface CartRepository extends JpaRepository<Cart, UUID> {

  Optional<Cart> findByUserId(UUID userId);
}
