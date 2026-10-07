package com.varsityconnect.marketplace;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

/* patch body, null means untouched — status never moves through here */
public record UpdateListingRequest(
    @Size(min = 3, max = 150, message = "title must be 3 to 150 characters") String title,
    @Size(max = 4000, message = "description is too long") String description,
    @DecimalMin(value = "0.00", message = "price cannot be negative") BigDecimal price,
    ListingCategory category,
    ListingCondition condition,
    @Size(max = 200, message = "location is too long") String location,
    @Size(max = 5, message = "at most 5 images allowed") List<@Size(max = 500, message = "image url is too long") String> imageUrls) {}
