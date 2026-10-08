package com.varsityconnect.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.varsityconnect.user.User;
import com.varsityconnect.user.UserRepository;
import com.varsityconnect.user.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.context.ActiveProfiles;

/* socket auth mirrors the http filter, except it shouts on failure */
@SpringBootTest
@ActiveProfiles("test")
class WebSocketAuthInterceptorTest {

  @Autowired WebSocketAuthInterceptor interceptor;
  @Autowired JwtService jwt;
  @Autowired UserRepository users;

  private User user;

  @BeforeEach
  void seed() {
    users.deleteAll();
    user = users.save(new User("socket user", "socket@cput.ac.za", "hash", null, null, UserRole.STUDENT));
  }

  private Message<?> connect(String header) {
    StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
    if (header != null) {
      accessor.setNativeHeader("Authorization", header);
    }
    return MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
  }

  @Test
  void validTokenEstablishesPrincipal() {
    Message<?> out = interceptor.preSend(connect("Bearer " + jwt.generate(user)), null);

    assertThat(StompHeaderAccessor.wrap(out).getUser()).isNotNull();
    assertThat(StompHeaderAccessor.wrap(out).getUser().getName()).isEqualTo(user.getId().toString());
  }

  @Test
  void missingHeaderIsRejected() {
    assertThatThrownBy(() -> interceptor.preSend(connect(null), null))
        .isInstanceOf(BadCredentialsException.class);
  }

  @Test
  void tamperedTokenIsRejected() {
    /* same shape, foreign secret — signature can never match */
    JwtService stranger =
        new JwtService("a-completely-different-secret-for-strangers-123", 86400000);
    assertThatThrownBy(
            () -> interceptor.preSend(connect("Bearer " + stranger.generate(user)), null))
        .isInstanceOf(BadCredentialsException.class);
  }

  @Test
  void disabledUserIsRejected() {
    user.setEnabled(false);
    users.save(user);

    assertThatThrownBy(() -> interceptor.preSend(connect("Bearer " + jwt.generate(user)), null))
        .isInstanceOf(BadCredentialsException.class);
  }

  @Test
  void nonConnectFramesPassThrough() {
    StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
    Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

    Message<?> out = interceptor.preSend(message, null);

    assertThat(StompHeaderAccessor.wrap(out).getUser()).isNull();
  }
}
