package com.varsityconnect.support;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/* new cry for help, requester comes from the jwt */
public record CreateSupportRequest(
    @NotNull(message = "type is required") SupportType type,
    @NotBlank(message = "title is required") @Size(max = 150, message = "title is too long") String title,
    @NotBlank(message = "description is required") @Size(max = 2000, message = "description is too long")
        String description,
    @NotBlank(message = "location is required") @Size(max = 200, message = "location is too long")
        String location,
    @NotNull(message = "urgency is required") SupportUrgency urgency) {}
