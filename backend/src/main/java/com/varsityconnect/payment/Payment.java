package com.varsityconnect.payment;

import com.varsityconnect.common.AuditableEntity;
import com.varsityconnect.order.Order;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

/* one row per attempt — retries add rows, never rewrite history */
@Entity
@Table(name = "payments")
public class Payment extends AuditableEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "order_id", nullable = false)
  private Order order;

  @Column(name = "amount", nullable = false, precision = 12, scale = 2)
  private BigDecimal amount;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 20)
  private PaymentStatus status;

  @Column(name = "provider", nullable = false, length = 30)
  private String provider;

  protected Payment() {
    /* jpa only */
  }

  public Payment(Order order, BigDecimal amount, PaymentStatus status, String provider) {
    this.order = order;
    this.amount = amount;
    this.status = status;
    this.provider = provider;
  }

  public Order getOrder() {
    return order;
  }

  public BigDecimal getAmount() {
    return amount;
  }

  public PaymentStatus getStatus() {
    return status;
  }

  public String getProvider() {
    return provider;
  }
}
