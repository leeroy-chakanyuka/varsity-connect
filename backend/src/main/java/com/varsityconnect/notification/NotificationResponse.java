package com.varsityconnect.notification;

import java.time.Instant;
import java.util.UUID;

/* inbox row shape, read state rides along */
public record NotificationResponse(
    UUID id,
    NotificationType type,
    String title,
    String message,
    String entityType,
    UUID entityId,
    Instant readAt,
    Instant createdAt) {

  public static NotificationResponse from(Notification notification) {
    return new NotificationResponse(
        notification.getId(),
        notification.getType(),
        notification.getTitle(),
        notification.getMessage(),
        notification.getEntityType(),
        notification.getEntityId(),
        notification.getReadAt(),
        notification.getCreatedAt());
  }
}
