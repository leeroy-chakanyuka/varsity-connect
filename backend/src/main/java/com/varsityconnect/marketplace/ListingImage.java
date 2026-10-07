package com.varsityconnect.marketplace;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

/* one photo on a listing, order decides the gallery sequence */
@Entity
@Table(name = "listing_images")
public class ListingImage {

  @Id
  @UuidGenerator
  @JdbcTypeCode(SqlTypes.CHAR)
  @Column(name = "id", nullable = false, updatable = false, columnDefinition = "CHAR(36)")
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "listing_id", nullable = false)
  private MarketplaceListing listing;

  @Column(name = "image_url", nullable = false, length = 500)
  private String imageUrl;

  @Column(name = "display_order", nullable = false)
  private int displayOrder;

  protected ListingImage() {
    /* jpa only */
  }

  public ListingImage(MarketplaceListing listing, String imageUrl, int displayOrder) {
    this.listing = listing;
    this.imageUrl = imageUrl;
    this.displayOrder = displayOrder;
  }

  public UUID getId() {
    return id;
  }

  public String getImageUrl() {
    return imageUrl;
  }

  public int getDisplayOrder() {
    return displayOrder;
  }
}
