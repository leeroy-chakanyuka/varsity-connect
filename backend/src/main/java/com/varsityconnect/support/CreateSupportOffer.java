package com.varsityconnect.support;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/* raised hand body, responder comes from the jwt */
public record CreateSupportOffer(
    @NotBlank(message = "message is required") @Size(max = 1000, message = "message is too long")
        String message) {}
