package com.varsityconnect.order;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

/* persistence only, checkout rules live in OrderService */
public interface OrderRepository extends JpaRepository<Order, UUID> {

  Page<Order> findByBuyerIdOrderByCreatedAtDesc(UUID buyerId, Pageable pageable);

  /* receipt reads walk items, listings, and sellers — one round trip */
  @EntityGraph(attributePaths = {"items", "items.listing", "items.seller", "buyer"})
  Optional<Order> findById(UUID id);
}
