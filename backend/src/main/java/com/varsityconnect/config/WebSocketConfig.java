package com.varsityconnect.config;

import com.varsityconnect.security.WebSocketAuthInterceptor;
import java.util.Arrays;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/* live lane for notifications, auth rides the CONNECT frame (see interceptor) */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

  private final WebSocketAuthInterceptor auth;
  private final AppProperties props;

  public WebSocketConfig(WebSocketAuthInterceptor auth, AppProperties props) {
    this.auth = auth;
    this.props = props;
  }

  @Override
  public void registerStompEndpoints(StompEndpointRegistry registry) {
    registry.addEndpoint("/ws").setAllowedOriginPatterns(allowedOrigins());
  }

  @Override
  public void configureMessageBroker(MessageBrokerRegistry registry) {
    registry.setUserDestinationPrefix("/user");
    registry.enableSimpleBroker("/queue");
  }

  @Override
  public void configureClientInboundChannel(ChannelRegistration registration) {
    registration.interceptors(auth);
  }

  /* same comma list as the cors filter, websocket handshake obeys it too */
  private String[] allowedOrigins() {
    return Arrays.stream(props.cors().allowedOrigins().split(","))
        .map(String::trim)
        .filter(s -> !s.isEmpty())
        .toArray(String[]::new);
  }
}
