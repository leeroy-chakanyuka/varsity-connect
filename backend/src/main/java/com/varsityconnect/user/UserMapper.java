package com.varsityconnect.user;

import com.varsityconnect.auth.MeResponse;
import com.varsityconnect.review.RatingSummary;

/* entity -> dto, keeps password hash inside the server */
public final class UserMapper {

  private UserMapper() {}

  /* ratings ride along now that the reviews stage fills them in for real */
  public static MeResponse me(User user, RatingSummary ratings) {
    return new MeResponse(
        user.getId(),
        user.getFullName(),
        user.getEmail(),
        user.getStudentNumber(),
        user.getFaculty(),
        user.getPhoneNumber(),
        user.getBio(),
        user.getProfileImageUrl(),
        user.getRole(),
        user.isEnabled(),
        ratings.average(),
        ratings.count(),
        user.getCreatedAt());
  }

  public static UserProfileResponse profile(User user, RatingSummary ratings) {
    return new UserProfileResponse(
        user.getId(),
        user.getFullName(),
        user.getEmail(),
        user.getStudentNumber(),
        user.getFaculty(),
        user.getPhoneNumber(),
        user.getBio(),
        user.getProfileImageUrl(),
        user.getRole(),
        user.isEnabled(),
        ratings.average(),
        ratings.count(),
        user.getCreatedAt());
  }
}
