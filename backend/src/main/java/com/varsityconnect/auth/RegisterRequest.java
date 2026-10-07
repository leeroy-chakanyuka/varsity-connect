package com.varsityconnect.auth;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/* public registration, admin is rejected in the service (never trust the client) */
public record RegisterRequest(
    @NotBlank(message = "full name is required") @Size(max = 120, message = "full name is too long")
        String fullName,
    @NotBlank(message = "email is required") @Email(message = "email is invalid")
        @Size(max = 180, message = "email is too long")
        String email,
    @NotBlank(message = "password is required") @Size(min = 8, max = 100, message = "password must be at least 8 characters")
        String password,
    @NotBlank(message = "role is required") String role,
    @Size(max = 40, message = "student number is too long") String studentNumber,
    @Size(max = 120, message = "faculty is too long") String faculty,
    @AssertTrue(message = "terms must be accepted") boolean acceptedTerms) {}
