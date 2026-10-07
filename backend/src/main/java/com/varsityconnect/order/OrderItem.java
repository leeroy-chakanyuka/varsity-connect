package com.varsityconnect.order;

import com.varsityconnect.marketplace.MarketplaceListing;
import com.varsityconnect.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

/* one frozen row per listing, snapshots survive later edits and deletes */
@Entity
@Table(name = "order_items")
public class OrderItem {

  @Id
  @UuidGenerator
  @JdbcTypeCode(SqlTypes.CHAR)
  @Column(name = "id", nullable = false, updatable = false, columnDefinition = "CHAR(36)")
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "order_id", nullable = false)
  private Order order;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "listing_id")
  private MarketplaceListing listing;

  @JdbcTypeCode(SqlTypes.CHAR)
  @Column(name = "listing_snapshot_id", columnDefinition = "CHAR(36)")
  private UUID listingSnapshotId;

  @Column(name = "title_snapshot", nullable = false, length = 150)
  private String titleSnapshot;

  @Column(name = "unit_price_snapshot", nullable = false, precision = 12, scale = 2)
  private BigDecimal unitPriceSnapshot;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "seller_id", nullable = false)
  private User seller;

  @Column(name = "quantity", nullable = false)
  private int quantity;

  protected OrderItem() {
    /* jpa only */
  }

  public OrderItem(
      Order order,
      MarketplaceListing listing,
      String titleSnapshot,
      BigDecimal unitPriceSnapshot,
      User seller,
      int quantity) {
    this.order = order;
    this.listing = listing;
    this.listingSnapshotId = listing.getId();
    this.titleSnapshot = titleSnapshot;
    this.unitPriceSnapshot = unitPriceSnapshot;
    this.seller = seller;
    this.quantity = quantity;
  }

  public UUID getId() {
    return id;
  }

  public Order getOrder() {
    return order;
  }

  public MarketplaceListing getListing() {
    return listing;
  }

  public UUID getListingSnapshotId() {
    return listingSnapshotId;
  }

  public String getTitleSnapshot() {
    return titleSnapshot;
  }

  public BigDecimal getUnitPriceSnapshot() {
    return unitPriceSnapshot;
  }

  public User getSeller() {
    return seller;
  }

  public int getQuantity() {
    return quantity;
  }
}
