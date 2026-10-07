package com.varsityconnect.config;

import com.varsityconnect.user.User;
import com.varsityconnect.user.UserRepository;
import com.varsityconnect.user.UserRole;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

/* first admin comes from env, never from a public endpoint */
@Configuration
public class AdminSeeder {

  private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);

  @Bean
  public ApplicationRunner seedAdmin(
      UserRepository users,
      PasswordEncoder passwords,
      @Value("${app.admin.email:}") String email,
      @Value("${app.admin.password:}") String password) {
    return args -> {
      if (email == null || email.isBlank() || password == null || password.isBlank()) {
        /* no seed configured, skip quietly */
        return;
      }
      String normalized = email.trim().toLowerCase();
      if (users.existsByEmail(normalized)) {
        return;
      }
      User admin =
          new User("admin", normalized, passwords.encode(password), null, null, UserRole.ADMIN);
      users.save(admin);
      /* never log the password, just that seeding happened */
      log.info("seeded admin account for {}", normalized);
    };
  }
}
