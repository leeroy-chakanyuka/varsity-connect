package com.varsityconnect.user;

import jakarta.validation.constraints.Size;

/* patch body, every field optional — anything not listed here can never change */
public record UpdateProfileRequest(
    @Size(max = 120, message = "full name is too long") String fullName,
    @Size(max = 120, message = "faculty is too long") String faculty,
    @Size(max = 40, message = "phone number is too long") String phoneNumber,
    @Size(max = 1000, message = "bio is too long") String bio,
    @Size(max = 500, message = "profile image url is too long") String profileImageUrl) {}
