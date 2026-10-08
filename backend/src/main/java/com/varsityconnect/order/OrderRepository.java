package com.varsityconnect.order;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

/* persistence only, checkout rules live in OrderService.
 * no fetch graphs here on purpose: checkout and payment lock listing rows
 * after loading the order, and entities already managed in the transaction
 * would skip the pessimistic lock. correctness first, baskets stay small. */
public interface OrderRepository extends JpaRepository<Order, UUID> {

  Page<Order> findByBuyerIdOrderByCreatedAtDesc(UUID buyerId, Pageable pageable);

  Optional<Order> findById(UUID id);
}
