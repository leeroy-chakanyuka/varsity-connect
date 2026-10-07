package com.varsityconnect.marketplace;

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
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/* one thing for sale, seller always comes from the jwt */
@Entity
@Table(name = "marketplace_listings")
public class MarketplaceListing extends AuditableEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "seller_id", nullable = false)
  private User seller;

  @Column(name = "title", nullable = false, length = 150)
  private String title;

  @Column(name = "description", nullable = false, length = 4000)
  private String description;

  @Column(name = "price", nullable = false, precision = 12, scale = 2)
  private BigDecimal price;

  @Enumerated(EnumType.STRING)
  @Column(name = "category", nullable = false, length = 30)
  private ListingCategory category;

  /* backticks ask hibernate to quote it, condition is reserved in mysql */
  @Enumerated(EnumType.STRING)
  @Column(name = "`condition`", nullable = false, length = 20)
  private ListingCondition condition;

  @Column(name = "location", length = 200)
  private String location;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 20)
  private ListingStatus status = ListingStatus.ACTIVE;

  @OneToMany(mappedBy = "listing", cascade = CascadeType.ALL, orphanRemoval = true)
  @OrderBy("displayOrder ASC")
  private List<ListingImage> images = new ArrayList<>();

  protected MarketplaceListing() {
    /* jpa only */
  }

  public MarketplaceListing(
      User seller,
      String title,
      String description,
      BigDecimal price,
      ListingCategory category,
      ListingCondition condition,
      String location) {
    this.seller = seller;
    this.title = title;
    this.description = description;
    this.price = price;
    this.category = category;
    this.condition = condition;
    this.location = location;
    this.status = ListingStatus.ACTIVE;
  }

  /* images are replaced as a set, order is the list order */
  public void setImages(List<String> urls) {
    images.clear();
    for (int i = 0; i < urls.size(); i++) {
      images.add(new ListingImage(this, urls.get(i), i));
    }
  }

  public User getSeller() {
    return seller;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public BigDecimal getPrice() {
    return price;
  }

  public void setPrice(BigDecimal price) {
    this.price = price;
  }

  public ListingCategory getCategory() {
    return category;
  }

  public void setCategory(ListingCategory category) {
    this.category = category;
  }

  public ListingCondition getCondition() {
    return condition;
  }

  public void setCondition(ListingCondition condition) {
    this.condition = condition;
  }

  public String getLocation() {
    return location;
  }

  public void setLocation(String location) {
    this.location = location;
  }

  public ListingStatus getStatus() {
    return status;
  }

  public void setStatus(ListingStatus status) {
    this.status = status;
  }

  public List<ListingImage> getImages() {
    return images;
  }
}
