package com.varsityconnect.notification;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

/* persistence only, delivery lives in stage 18 */
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

  Page<Notification> findByRecipientIdOrderByCreatedAtDesc(UUID recipientId, Pageable pageable);

  long countByRecipientIdAndReadAtIsNull(UUID recipientId);

  Optional<Notification> findByIdAndRecipientId(UUID id, UUID recipientId);
}
