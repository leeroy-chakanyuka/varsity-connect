package com.varsityconnect.cart;

import com.varsityconnect.common.AuditableEntity;
import com.varsityconnect.user.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;

/* one basket per user, rows vanish into an order at checkout */
@Entity
@Table(name = "carts")
public class Cart extends AuditableEntity {

  @OneToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false, unique = true)
  private User user;

  @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<CartItem> items = new ArrayList<>();

  protected Cart() {
    /* jpa only */
  }

  public Cart(User user) {
    this.user = user;
  }

  public User getUser() {
    return user;
  }

  public List<CartItem> getItems() {
    return items;
  }
}
