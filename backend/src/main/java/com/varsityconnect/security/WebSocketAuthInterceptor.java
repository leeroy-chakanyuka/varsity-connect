package com.varsityconnect.security;

import com.varsityconnect.user.User;
import com.varsityconnect.user.UserRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

/* same rules as the http filter, but loud — bad sockets hear an ERROR frame */
@Component
public class WebSocketAuthInterceptor implements ChannelInterceptor {

  private final JwtService jwt;
  private final UserRepository users;

  public WebSocketAuthInterceptor(JwtService jwt, UserRepository users) {
    this.jwt = jwt;
    this.users = users;
  }

  @Override
  public Message<?> preSend(Message<?> message, MessageChannel channel) {
    /* the broker's own frame when live (mutable, shared with the handshake),
     * a private copy for hand-built frames in tests */
    StompHeaderAccessor accessor =
        MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
    if (accessor == null || !accessor.isMutable()) {
      accessor = StompHeaderAccessor.wrap(message);
    }
    if (accessor.getCommand() != StompCommand.CONNECT) {
      return message;
    }
    String header = accessor.getFirstNativeHeader("Authorization");
    if (header == null || !header.startsWith("Bearer ")) {
      throw new BadCredentialsException("authentication required");
    }
    String token = header.substring(7);
    if (token.isBlank() || !jwt.valid(token)) {
      throw new BadCredentialsException("authentication required");
    }
    try {
      UUID id = jwt.principal(token).id();
      User user = users.findById(id).orElse(null);
      /* disabled accounts lose the socket too, same as http */
      if (user == null || !user.isEnabled()) {
        throw new BadCredentialsException("authentication required");
      }
      /* name is the user id, so /user/queue/notifications resolves per socket */
      UsernamePasswordAuthenticationToken auth =
          new UsernamePasswordAuthenticationToken(
              user.getId().toString(),
              null,
              List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
      accessor.setUser(auth);
      /* belt and braces: the session handshake reads the inbound frame,
       * later frames read whatever the channel carries — both get the user */
      return MessageBuilder.createMessage(message.getPayload(), accessor.getMessageHeaders());
    } catch (BadCredentialsException e) {
      throw e;
    } catch (Exception e) {
      throw new BadCredentialsException("authentication required");
    }
  }
}
