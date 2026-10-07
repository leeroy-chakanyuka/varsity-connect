package com.varsityconnect.support;

import jakarta.validation.constraints.Size;

/* patch body, null means untouched */
public record UpdateSupportRequest(
    SupportType type,
    @Size(max = 150, message = "title is too long") String title,
    @Size(max = 2000, message = "description is too long") String description,
    @Size(max = 200, message = "location is too long") String location,
    SupportUrgency urgency) {}
