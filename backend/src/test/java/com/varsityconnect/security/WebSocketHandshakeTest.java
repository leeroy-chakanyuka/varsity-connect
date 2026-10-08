package com.varsityconnect.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.varsityconnect.user.User;
import com.varsityconnect.user.UserRepository;
import com.varsityconnect.user.UserRole;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.messaging.converter.MappingJackson2MessageConverter;
import org.springframework.messaging.simp.stomp.StompHeaders;
import org.springframework.messaging.simp.stomp.StompSession;
import org.springframework.messaging.simp.stomp.StompSessionHandlerAdapter;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.messaging.WebSocketStompClient;

/* full stack: real handshake, real broker, the session must know its user */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
class WebSocketHandshakeTest {

  @LocalServerPort int port;
  @Autowired JwtService jwt;
  @Autowired UserRepository users;

  private User user;

  @BeforeEach
  void seed() {
    users.deleteAll();
    user =
        users.save(new User("ws user", "ws@cput.ac.za", "hash", null, null, UserRole.STUDENT));
  }

  private CompletableFuture<String> connectWith(String header) {
    WebSocketStompClient client = new WebSocketStompClient(new StandardWebSocketClient());
    client.setMessageConverter(new MappingJackson2MessageConverter());
    StompHeaders headers = new StompHeaders();
    if (header != null) {
      headers.add("Authorization", header);
    }
    CompletableFuture<String> userName = new CompletableFuture<>();
    client.connectAsync(
        "ws://localhost:{port}/ws",
        new org.springframework.web.socket.WebSocketHttpHeaders(),
        headers,
        new StompSessionHandlerAdapter() {
          @Override
          public void afterConnected(StompSession session, StompHeaders connectedHeaders) {
            userName.complete(connectedHeaders.getFirst("user-name"));
          }

          @Override
          public void handleTransportError(StompSession session, Throwable exception) {
            userName.completeExceptionally(exception);
          }
        },
        port);
    return userName;
  }

  @Test
  void authenticatedSocketCarriesUserName() throws Exception {
    String userName = connectWith("Bearer " + jwt.generate(user)).get(15, TimeUnit.SECONDS);

    assertThat(userName).isEqualTo(user.getId().toString());
  }

  @Test
  void forgedSocketIsRefused() {
    CompletableFuture<String> attempt = connectWith("Bearer garbage");

    assertThatThrownBy(() -> attempt.get(15, TimeUnit.SECONDS))
        .isInstanceOf(java.util.concurrent.ExecutionException.class);
  }
}
