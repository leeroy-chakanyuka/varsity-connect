package com.varsityconnect.community;

import jakarta.validation.constraints.Size;

/* reply patch, null means untouched */
public record UpdateCommentRequest(@Size(max = 2000, message = "body is too long") String body) {}
