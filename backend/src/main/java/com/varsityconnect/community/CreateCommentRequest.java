package com.varsityconnect.community;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/* reply body, author comes from the jwt */
public record CreateCommentRequest(
    @NotBlank(message = "body is required") @Size(max = 2000, message = "body is too long") String body) {}
