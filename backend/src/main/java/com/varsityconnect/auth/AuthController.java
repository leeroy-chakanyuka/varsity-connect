package com.varsityconnect.auth;

import com.varsityconnect.security.UserPrincipal;
import com.varsityconnect.user.User;
import com.varsityconnect.user.UserMapper;
import com.varsityconnect.user.UserRepository;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/* thin auth doors, jwt identity wins over anything the client claims */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

  private final AuthService auth;
  private final UserRepository users;

  public AuthController(AuthService auth, UserRepository users) {
    this.auth = auth;
    this.users = users;
  }

  @PostMapping("/register")
  public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
    return ResponseEntity.status(HttpStatus.CREATED).body(auth.register(request));
  }

  @PostMapping("/login")
  public AuthResponse login(@Valid @RequestBody LoginRequest request) {
    return auth.login(request);
  }

  /* who am i, resolved from the jwt, never from a query param */

  @GetMapping("/me")
  public MeResponse me(@AuthenticationPrincipal UserPrincipal principal) {
    if (principal == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "authentication required");
    }
    UUID id = principal.id();
    User user =
        users
            .findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "authentication required"));
    return UserMapper.me(user);
  }
}
