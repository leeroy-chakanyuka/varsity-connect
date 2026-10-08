package com.varsityconnect.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.varsityconnect.user.User;
import com.varsityconnect.user.UserRepository;
import com.varsityconnect.user.UserRole;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.messaging.simp.SimpMessagingTemplate;

/* persist-then-push, the row never depends on anyone listening */
class NotificationPushTest {

  private NotificationRepository notifications;
  private UserRepository users;
  private SimpMessagingTemplate messaging;
  private NotificationService service;

  private User alice;
  private User bob;

  @BeforeEach
  void wiring() {
    notifications = mock(NotificationRepository.class);
    users = mock(UserRepository.class);
    messaging = mock(SimpMessagingTemplate.class);
    service = new NotificationService(notifications, users, messaging);

    alice = new User("alice", "alice@cput.ac.za", "hash", null, null, UserRole.STUDENT);
    alice.setId(UUID.randomUUID());
    bob = new User("bob", "bob@cput.ac.za", "hash", null, null, UserRole.STUDENT);
    bob.setId(UUID.randomUUID());
    when(users.findById(alice.getId())).thenReturn(Optional.of(alice));
    when(users.findById(bob.getId())).thenReturn(Optional.of(bob));
    /* repo hands back what it would store */
    when(notifications.save(any(Notification.class)))
        .thenAnswer(invocation -> invocation.getArgument(0));
  }

  @Test
  void persistsAndPushesToTheRecipientOnly() {
    UUID entity = UUID.randomUUID();

    service.notify(alice.getId(), NotificationType.ORDER_PAID, "paid", "done", "order", entity);

    /* the inbox row lands whatever the socket does */
    ArgumentCaptor<Notification> saved = ArgumentCaptor.forClass(Notification.class);
    verify(notifications, times(1)).save(saved.capture());
    assertThat(saved.getValue().getRecipient().getId()).isEqualTo(alice.getId());

    /* the live ping goes to her private queue, nobody else's */
    verify(messaging, times(1))
        .convertAndSendToUser(
            eq(alice.getId().toString()),
            eq("/queue/notifications"),
            any(NotificationResponse.class));
    verify(messaging, never())
        .convertAndSendToUser(
            eq(bob.getId().toString()), eq("/queue/notifications"), any(NotificationResponse.class));
  }

  @Test
  void offlineUserKeepsTheRowWithoutError() {
    /* mock broker drops it silently, save still happened above board */
    service.notify(bob.getId(), NotificationType.SYSTEM, "hi", "welcome", null, null);

    verify(notifications, times(1)).save(any(Notification.class));
  }
}
