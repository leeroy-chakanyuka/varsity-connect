package com.varsityconnect.lostfound;

import com.varsityconnect.common.AuditableEntity;
import com.varsityconnect.marketplace.ListingCategory;
import com.varsityconnect.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;

/* one lost or found report, owner always comes from the jwt */
@Entity
@Table(name = "lost_found_reports")
public class LostFoundReport extends AuditableEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "owner_id", nullable = false)
  private User owner;

  @Enumerated(EnumType.STRING)
  @Column(name = "type", nullable = false, length = 10)
  private ReportType type;

  @Column(name = "item_name", nullable = false, length = 150)
  private String itemName;

  @Enumerated(EnumType.STRING)
  @Column(name = "category", nullable = false, length = 30)
  private ListingCategory category;

  @Column(name = "description", nullable = false, length = 2000)
  private String description;

  @Column(name = "location", nullable = false, length = 200)
  private String location;

  @Column(name = "incident_date", nullable = false)
  private LocalDate incidentDate;

  @Column(name = "image_url", length = 500)
  private String imageUrl;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 20)
  private ReportStatus status = ReportStatus.OPEN;

  protected LostFoundReport() {
    /* jpa only */
  }

  public LostFoundReport(
      User owner,
      ReportType type,
      String itemName,
      ListingCategory category,
      String description,
      String location,
      LocalDate incidentDate,
      String imageUrl) {
    this.owner = owner;
    this.type = type;
    this.itemName = itemName;
    this.category = category;
    this.description = description;
    this.location = location;
    this.incidentDate = incidentDate;
    this.imageUrl = imageUrl;
    this.status = ReportStatus.OPEN;
  }

  public User getOwner() {
    return owner;
  }

  public ReportType getType() {
    return type;
  }

  public String getItemName() {
    return itemName;
  }

  public void setItemName(String itemName) {
    this.itemName = itemName;
  }

  public ListingCategory getCategory() {
    return category;
  }

  public void setCategory(ListingCategory category) {
    this.category = category;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public String getLocation() {
    return location;
  }

  public void setLocation(String location) {
    this.location = location;
  }

  public LocalDate getIncidentDate() {
    return incidentDate;
  }

  public void setIncidentDate(LocalDate incidentDate) {
    this.incidentDate = incidentDate;
  }

  public String getImageUrl() {
    return imageUrl;
  }

  public void setImageUrl(String imageUrl) {
    this.imageUrl = imageUrl;
  }

  public ReportStatus getStatus() {
    return status;
  }

  public void setStatus(ReportStatus status) {
    this.status = status;
  }
}
