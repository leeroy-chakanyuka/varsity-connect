package com.varsityconnect.review;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

/* one review always names its order, the path names the reviewee */
public record CreateReviewRequest(
    @NotNull(message = "order is required") UUID orderId,
    @NotNull(message = "rating is required") @Min(value = 1, message = "rating must be 1 to 5")
        @Max(value = 5, message = "rating must be 1 to 5") Integer rating,
    @NotBlank(message = "comment is required")
        @Size(max = 1000, message = "comment is too long") String comment) {}
