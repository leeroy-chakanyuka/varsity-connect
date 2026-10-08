package com.varsityconnect.user;

import com.varsityconnect.common.NotFoundException;
import com.varsityconnect.review.RatingSummary;
import com.varsityconnect.review.ReviewRepository;
import com.varsityconnect.security.UserPrincipal;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/* profile reads + edits, allowlist only — role, email, number, enabled never move here */
@Service
public class UserService {

  private final UserRepository users;
  private final ReviewRepository reviews;

  public UserService(UserRepository users, ReviewRepository reviews) {
    this.users = users;
    this.reviews = reviews;
  }

  @Transactional(readOnly = true)
  public UserProfileResponse me(UserPrincipal principal) {
    return UserMapper.profile(current(principal), ratings(principal.id()));
  }

  @Transactional(readOnly = true)
  public UserProfileResponse byId(UUID id) {
    return UserMapper.profile(
        users.findById(id).orElseThrow(() -> new NotFoundException("user not found")),
        ratings(id));
  }

  @Transactional
  public UserProfileResponse updateMe(UserPrincipal principal, UpdateProfileRequest request) {
    User user = current(principal);

    /* null means untouched, a value (even blank for optionals) replaces */
    if (request.fullName() != null && !request.fullName().isBlank()) {
      user.setFullName(request.fullName().trim());
    }
    if (request.faculty() != null) {
      user.setFaculty(blankToNull(request.faculty()));
    }
    if (request.phoneNumber() != null) {
      user.setPhoneNumber(blankToNull(request.phoneNumber()));
    }
    if (request.bio() != null) {
      user.setBio(blankToNull(request.bio()));
    }
    if (request.profileImageUrl() != null) {
      user.setProfileImageUrl(blankToNull(request.profileImageUrl()));
    }
    User saved = users.save(user);
    return UserMapper.profile(saved, ratings(saved.getId()));
  }

  private User current(UserPrincipal principal) {
    return users
        .findById(principal.id())
        .orElseThrow(() -> new NotFoundException("user not found"));
  }

  /* zeros until the first review, one indexed aggregate per read */
  private RatingSummary ratings(UUID id) {
    Double average = reviews.averageFor(id);
    return new RatingSummary(average == null ? 0.0 : average, reviews.countFor(id));
  }

  private static String blankToNull(String value) {
    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }
}
