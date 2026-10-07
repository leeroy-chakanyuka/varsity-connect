package com.varsityconnect.cart;

import com.varsityconnect.common.AuditableEntity;
import com.varsityconnect.marketplace.MarketplaceListing;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/* one row per listing, quantity stays 1 while listings are unique items */
@Entity
@Table(
    name = "cart_items",
    uniqueConstraints = @UniqueConstraint(name = "uq_cart_item", columnNames = {"cart_id", "listing_id"}))
public class CartItem extends AuditableEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "cart_id", nullable = false)
  private Cart cart;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "listing_id", nullable = false)
  private MarketplaceListing listing;

  @Column(name = "quantity", nullable = false)
  private int quantity = 1;

  protected CartItem() {
    /* jpa only */
  }

  public CartItem(Cart cart, MarketplaceListing listing, int quantity) {
    this.cart = cart;
    this.listing = listing;
    this.quantity = quantity;
  }

  public Cart getCart() {
    return cart;
  }

  public MarketplaceListing getListing() {
    return listing;
  }

  public int getQuantity() {
    return quantity;
  }

  public void setQuantity(int quantity) {
    this.quantity = quantity;
  }
}
