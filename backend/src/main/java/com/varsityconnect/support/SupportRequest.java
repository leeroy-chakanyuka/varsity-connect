package com.varsityconnect.support;

import com.varsityconnect.common.AuditableEntity;
import com.varsityconnect.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

/* one call for help, requester always comes from the jwt */
@Entity
@Table(name = "support_requests")
public class SupportRequest extends AuditableEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "requester_id", nullable = false)
  private User requester;

  @Enumerated(EnumType.STRING)
  @Column(name = "type", nullable = false, length = 20)
  private SupportType type;

  @Column(name = "title", nullable = false, length = 150)
  private String title;

  @Column(name = "description", nullable = false, length = 2000)
  private String description;

  @Column(name = "location", nullable = false, length = 200)
  private String location;

  @Enumerated(EnumType.STRING)
  @Column(name = "urgency", nullable = false, length = 10)
  private SupportUrgency urgency;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 20)
  private SupportStatus status = SupportStatus.OPEN;

  @Column(name = "resolved_at")
  private Instant resolvedAt;

  protected SupportRequest() {
    /* jpa only */
  }

  public SupportRequest(
      User requester,
      SupportType type,
      String title,
      String description,
      String location,
      SupportUrgency urgency) {
    this.requester = requester;
    this.type = type;
    this.title = title;
    this.description = description;
    this.location = location;
    this.urgency = urgency;
    this.status = SupportStatus.OPEN;
  }

  public User getRequester() {
    return requester;
  }

  public SupportType getType() {
    return type;
  }

  public void setType(SupportType type) {
    this.type = type;
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

  public String getLocation() {
    return location;
  }

  public void setLocation(String location) {
    this.location = location;
  }

  public SupportUrgency getUrgency() {
    return urgency;
  }

  public void setUrgency(SupportUrgency urgency) {
    this.urgency = urgency;
  }

  public SupportStatus getStatus() {
    return status;
  }

  public void setStatus(SupportStatus status) {
    this.status = status;
  }

  public Instant getResolvedAt() {
    return resolvedAt;
  }

  public void setResolvedAt(Instant resolvedAt) {
    this.resolvedAt = resolvedAt;
  }
}
