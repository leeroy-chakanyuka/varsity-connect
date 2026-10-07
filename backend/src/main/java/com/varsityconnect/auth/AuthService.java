package com.varsityconnect.auth;

import com.varsityconnect.common.BadRequestException;
import com.varsityconnect.common.ConflictException;
import com.varsityconnect.common.ForbiddenException;
import com.varsityconnect.common.UnauthorizedException;
import com.varsityconnect.security.JwtService;
import com.varsityconnect.user.User;
import com.varsityconnect.user.UserMapper;
import com.varsityconnect.user.UserRepository;
import com.varsityconnect.user.UserRole;
import java.util.Locale;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/* registration + login live here, controllers stay thin */
@Service
public class AuthService {

  private final UserRepository users;
  private final PasswordEncoder passwords;
  private final JwtService jwt;

  /* constructor injection so tests can wire this by hand if needed */
  public AuthService(UserRepository users, PasswordEncoder passwords, JwtService jwt) {
    this.users = users;
    this.passwords = passwords;
    this.jwt = jwt;
  }

  @Transactional
  public AuthResponse register(RegisterRequest request) {
    String email = request.email().trim().toLowerCase(Locale.ROOT);

    /* admin can only come from seed/config, never the public form */
    UserRole role;
    try {
      role = UserRole.valueOf(request.role().trim().toUpperCase(Locale.ROOT));
    } catch (IllegalArgumentException e) {
      throw new ForbiddenException("FORBIDDEN", "unknown role");
    }
    if (role == UserRole.ADMIN) {
      throw new ForbiddenException("FORBIDDEN", "admin accounts cannot be created publicly");
    }

    /* students must carry a student number, vendors need not */
    String studentNumber =
        request.studentNumber() == null || request.studentNumber().isBlank()
            ? null
            : request.studentNumber().trim();
    if (role == UserRole.STUDENT && studentNumber == null) {
      throw new BadRequestException("VALIDATION_ERROR", "student number is required for students");
    }

    if (users.existsByEmail(email)) {
      throw new ConflictException("EMAIL_ALREADY_EXISTS", "email is already registered");
    }
    if (studentNumber != null && users.existsByStudentNumber(studentNumber)) {
      throw new ConflictException(
          "STUDENT_NUMBER_ALREADY_EXISTS", "student number is already registered");
    }

    User user =
        new User(
            request.fullName().trim(),
            email,
            passwords.encode(request.password()),
            studentNumber,
            request.faculty(),
            role);
    User saved = users.save(user);
    return new AuthResponse(jwt.generate(saved), UserMapper.me(saved));
  }

  @Transactional(readOnly = true)
  public AuthResponse login(LoginRequest request) {
    String identifier = request.identifier().trim();
    User user;

    /* email login is case-insensitive, student numbers match exactly */
    if (identifier.contains("@")) {
      user =
          users
              .findByEmail(identifier.toLowerCase(Locale.ROOT))
              .orElseThrow(
                  () -> new UnauthorizedException("INVALID_CREDENTIALS", "invalid credentials"));
    } else {
      user =
          users
              .findByStudentNumber(identifier)
              .orElseThrow(
                  () -> new UnauthorizedException("INVALID_CREDENTIALS", "invalid credentials"));
    }

    if (!user.isEnabled()) {
      throw new ForbiddenException("FORBIDDEN", "account is disabled");
    }
    if (!passwords.matches(request.password(), user.getPasswordHash())) {
      throw new UnauthorizedException("INVALID_CREDENTIALS", "invalid credentials");
    }
    return new AuthResponse(jwt.generate(user), UserMapper.me(user));
  }
}
