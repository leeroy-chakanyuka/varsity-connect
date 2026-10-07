package com.varsityconnect.common;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.Map;

/* shared error body, every failure looks the same so the frontend only parses once */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiErrorResponse(
    Instant timestamp,
    int status,
    String code,
    String message,
    Map<String, String> fieldErrors,
    String path) {}
