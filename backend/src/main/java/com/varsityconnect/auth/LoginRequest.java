package com.varsityconnect.auth;

import jakarta.validation.constraints.NotBlank;

/* identifier accepts email or student number, service figures out which */
public record LoginRequest(
    @NotBlank(message = "identifier is required") String identifier,
    @NotBlank(message = "password is required") String password) {}
