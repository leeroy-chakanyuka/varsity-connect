package com.varsityconnect.payment;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/* persistence only, transition rules live in PaymentService */
public interface PaymentRepository extends JpaRepository<Payment, UUID> {}
