package com.varsityconnect.notification;

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
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/* one stored ping, websockets only ever deliver copies of these rows */
@Entity
@Table(name = "notifications")
public class Notification extends AuditableEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "recipient_id", nullable = false)
  private User recipient;

  @Enumerated(EnumType.STRING)
  @Column(name = "type", nullable = false, length = 40)
  private NotificationType type;

  @Column(name = "title", nullable = false, length = 150)
  private String title;

  @Column(name = "message", nullable = false, length = 500)
  private String message;

  @Column(name = "entity_type", length = 30)
  private String entityType;

  @JdbcTypeCode(SqlTypes.CHAR)
  @Column(name = "entity_id", columnDefinition = "CHAR(36)")
  private UUID entityId;

  @Column(name = "read_at")
  private Instant readAt;

  protected Notification() {
    /* jpa only */
  }

  public Notification(
      User recipient,
      NotificationType type,
      String title,
      String message,
      String entityType,
      UUID entityId) {
    this.recipient = recipient;
    this.type = type;
    this.title = title;
    this.message = message;
    this.entityType = entityType;
    this.entityId = entityId;
  }

  public User getRecipient() {
    return recipient;
  }

  public NotificationType getType() {
    return type;
  }

  public String getTitle() {
    return title;
  }

  public String getMessage() {
    return message;
  }

  public String getEntityType() {
    return entityType;
  }

  public UUID getEntityId() {
    return entityId;
  }

  public Instant getReadAt() {
    return readAt;
  }

  public void setReadAt(Instant readAt) {
    this.readAt = readAt;
  }
}
