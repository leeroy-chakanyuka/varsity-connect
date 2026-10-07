package com.varsityconnect.security;

import com.varsityconnect.user.User;
import com.varsityconnect.user.UserRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/* loads by uuid (jwt subject), keeps spring happy with a UserDetails wrapper */
@Service
public class CustomUserDetailsService implements UserDetailsService {

  private final UserRepository users;

  public CustomUserDetailsService(UserRepository users) {
    this.users = users;
  }

  @Override
  public UserDetails loadUserByUsername(String id) throws UsernameNotFoundException {
    User user =
        users
            .findById(UUID.fromString(id))
            .orElseThrow(() -> new UsernameNotFoundException("user not found"));
    return new org.springframework.security.core.userdetails.User(
        user.getId().toString(),
        user.getPasswordHash(),
        user.isEnabled(),
        true,
        true,
        true,
        List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
  }

  /* helper for the filter when we already parsed the jwt ourselves */

  public UserPrincipal principal(User user) {
    return new UserPrincipal(user.getId(), user.getEmail(), user.getRole());
  }
}
