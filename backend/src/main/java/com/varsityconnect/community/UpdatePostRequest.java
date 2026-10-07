package com.varsityconnect.community;

import jakarta.validation.constraints.Size;

/* patch body, null means untouched */
public record UpdatePostRequest(
    @Size(max = 150, message = "title is too long") String title,
    @Size(max = 5000, message = "body is too long") String body,
    @Size(max = 500, message = "image url is too long") String imageUrl) {}
