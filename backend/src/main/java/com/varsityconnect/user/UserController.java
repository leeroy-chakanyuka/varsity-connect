package com.varsityconnect.user;

import com.varsityconnect.security.UserPrincipal;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/* thin profile doors, identity always comes from the jwt */
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

  private final UserService service;

  public UserController(UserService service) {
    this.service = service;
  }

  @GetMapping("/me")
  public UserProfileResponse me(@AuthenticationPrincipal UserPrincipal principal) {
    return service.me(require(principal));
  }

  @PatchMapping("/me")
  public UserProfileResponse updateMe(
      @AuthenticationPrincipal UserPrincipal principal,
      @Valid @RequestBody UpdateProfileRequest request) {
    return service.updateMe(require(principal), request);
  }

  @GetMapping("/{id}")
  public UserProfileResponse byId(@PathVariable UUID id) {
    return service.byId(id);
  }

  /* security already blocks anonymous, this is just belt and braces */
  private static UserPrincipal require(UserPrincipal principal) {
    if (principal == null) {
      throw new org.springframework.web.server.ResponseStatusException(
          HttpStatus.UNAUTHORIZED, "authentication required");
    }
    return principal;
  }
}
