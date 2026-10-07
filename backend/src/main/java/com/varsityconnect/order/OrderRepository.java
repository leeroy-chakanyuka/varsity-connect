package com.varsityconnect.order;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

/* persistence only, checkout rules live in OrderService */
public interface OrderRepository extends JpaRepository<Order, UUID> {

  Page<Order> findByBuyerIdOrderByCreatedAtDesc(UUID buyerId, Pageable pageable);
}
