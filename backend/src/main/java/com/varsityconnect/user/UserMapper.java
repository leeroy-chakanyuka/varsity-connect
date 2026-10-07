package com.varsityconnect.user;

import com.varsityconnect.auth.MeResponse;

/* entity -> dto, keeps password hash inside the server */
public final class UserMapper {

  private UserMapper() {}

  /* ratings stay zero until the reviews stage fills them in for real */
  public static MeResponse me(User user) {
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
        0.0,
        0L,
        user.getCreatedAt());
  }

  public static UserProfileResponse profile(User user) {
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
        0.0,
        0L,
        user.getCreatedAt());
  }
}
