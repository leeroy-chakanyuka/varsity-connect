package com.varsityconnect.marketplace;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

/* new listing body, no seller id — the jwt decides who sells */
public record CreateListingRequest(
    @NotBlank(message = "title is required") @Size(min = 3, max = 150, message = "title must be 3 to 150 characters")
        String title,
    @NotBlank(message = "description is required") @Size(max = 4000, message = "description is too long")
        String description,
    @NotNull(message = "price is required") @DecimalMin(value = "0.00", message = "price cannot be negative")
        BigDecimal price,
    @NotNull(message = "category is required") ListingCategory category,
    @NotNull(message = "condition is required") ListingCondition condition,
    @Size(max = 200, message = "location is too long") String location,
    @Size(max = 5, message = "at most 5 images allowed") List<@Size(max = 500, message = "image url is too long") String> imageUrls) {}
