package com.varsityconnect.user;

import com.varsityconnect.auth.MeResponse;

/* entity -> dto, keeps password hash inside the server */
public final class UserMapper {

  private UserMapper() {}

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
        user.getCreatedAt());
  }
}
