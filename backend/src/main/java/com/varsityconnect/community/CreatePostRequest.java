package com.varsityconnect.community;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/* new thread body, author comes from the jwt */
public record CreatePostRequest(
    @NotBlank(message = "title is required") @Size(max = 150, message = "title is too long") String title,
    @NotBlank(message = "body is required") @Size(max = 5000, message = "body is too long") String body,
    @Size(max = 500, message = "image url is too long") String imageUrl) {}
