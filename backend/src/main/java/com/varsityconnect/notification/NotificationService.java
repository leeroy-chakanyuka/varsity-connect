package com.varsityconnect.notification;

import com.varsityconnect.common.NotFoundException;
import com.varsityconnect.common.PageResponse;
import com.varsityconnect.security.UserPrincipal;
import com.varsityconnect.user.User;
import com.varsityconnect.user.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/* inbox storage, every mutation is recipient-scoped */
@Service
public class NotificationService {

  private final NotificationRepository notifications;
  private final UserRepository users;

  public NotificationService(NotificationRepository notifications, UserRepository users) {
    this.notifications = notifications;
    this.users = users;
  }

  /* fire-and-remember entry point for event listeners */
  @Transactional
  public void notify(
      UUID recipientId,
      NotificationType type,
      String title,
      String message,
      String entityType,
      UUID entityId) {
    User recipient =
        users.findById(recipientId).orElseThrow(() -> new NotFoundException("user not found"));
    notifications.save(new Notification(recipient, type, title, message, entityType, entityId));
  }

  @Transactional(readOnly = true)
  public PageResponse<NotificationResponse> list(UserPrincipal principal, Pageable pageable) {
    Page<Notification> page = notifications.findByRecipientIdOrderByCreatedAtDesc(principal.id(), pageable);
    return new PageResponse<>(
        page.getContent().stream().map(NotificationResponse::from).toList(),
        page.getNumber(),
        page.getSize(),
        page.getTotalElements(),
        page.getTotalPages(),
        page.isFirst(),
        page.isLast());
  }

  @Transactional(readOnly = true)
  public long unreadCount(UserPrincipal principal) {
    return notifications.countByRecipientIdAndReadAtIsNull(principal.id());
  }

  @Transactional
  public NotificationResponse markRead(UserPrincipal principal, UUID id) {
    Notification notification = own(principal, id);
    notification.setReadAt(Instant.now());
    return NotificationResponse.from(notifications.save(notification));
  }

  @Transactional
  public void markAllRead(UserPrincipal principal) {
    List<Notification> unread =
        notifications.findByRecipientIdOrderByCreatedAtDesc(principal.id(), Pageable.unpaged()).getContent()
            .stream()
            .filter(row -> row.getReadAt() == null)
            .toList();
    Instant now = Instant.now();
    unread.forEach(row -> row.setReadAt(now));
    notifications.saveAll(unread);
  }

  @Transactional
  public void delete(UserPrincipal principal, UUID id) {
    notifications.delete(own(principal, id));
  }

  /* strangers get a 404, never a hint the row exists */
  private Notification own(UserPrincipal principal, UUID id) {
    return notifications
        .findByIdAndRecipientId(id, principal.id())
        .orElseThrow(() -> new NotFoundException("notification not found"));
  }
}
