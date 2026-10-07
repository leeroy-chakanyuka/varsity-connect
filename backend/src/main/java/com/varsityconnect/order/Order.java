package com.varsityconnect.order;

import com.varsityconnect.common.AuditableEntity;
import com.varsityconnect.user.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/* a checked-out basket, frozen prices — listings may change, this may not */
@Entity
@Table(name = "orders")
public class Order extends AuditableEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "buyer_id", nullable = false)
  private User buyer;

  @Enumerated(EnumType.STRING)
  @Column(name = "delivery_method", nullable = false, length = 30)
  private DeliveryMethod deliveryMethod;

  @Enumerated(EnumType.STRING)
  @Column(name = "payment_method", nullable = false, length = 30)
  private PaymentMethod paymentMethod;

  @Column(name = "subtotal", nullable = false, precision = 12, scale = 2)
  private BigDecimal subtotal;

  @Column(name = "total", nullable = false, precision = 12, scale = 2)
  private BigDecimal total;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 30)
  private OrderStatus status = OrderStatus.PENDING_PAYMENT;

  @Column(name = "paid_at")
  private Instant paidAt;

  @Column(name = "completed_at")
  private Instant completedAt;

  @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<OrderItem> items = new ArrayList<>();

  protected Order() {
    /* jpa only */
  }

  public Order(User buyer, DeliveryMethod deliveryMethod, PaymentMethod paymentMethod) {
    this.buyer = buyer;
    this.deliveryMethod = deliveryMethod;
    this.paymentMethod = paymentMethod;
    this.status = OrderStatus.PENDING_PAYMENT;
    this.subtotal = BigDecimal.ZERO;
    this.total = BigDecimal.ZERO;
  }

  public User getBuyer() {
    return buyer;
  }

  public DeliveryMethod getDeliveryMethod() {
    return deliveryMethod;
  }

  public PaymentMethod getPaymentMethod() {
    return paymentMethod;
  }

  public BigDecimal getSubtotal() {
    return subtotal;
  }

  public void setSubtotal(BigDecimal subtotal) {
    this.subtotal = subtotal;
  }

  public BigDecimal getTotal() {
    return total;
  }

  public void setTotal(BigDecimal total) {
    this.total = total;
  }

  public OrderStatus getStatus() {
    return status;
  }

  public void setStatus(OrderStatus status) {
    this.status = status;
  }

  public Instant getPaidAt() {
    return paidAt;
  }

  public void setPaidAt(Instant paidAt) {
    this.paidAt = paidAt;
  }

  public Instant getCompletedAt() {
    return completedAt;
  }

  public void setCompletedAt(Instant completedAt) {
    this.completedAt = completedAt;
  }

  public List<OrderItem> getItems() {
    return items;
  }
}
