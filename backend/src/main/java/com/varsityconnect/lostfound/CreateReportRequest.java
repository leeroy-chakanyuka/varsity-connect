package com.varsityconnect.lostfound;

import com.varsityconnect.marketplace.ListingCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/* new report body, owner comes from the jwt */
public record CreateReportRequest(
    @NotNull(message = "type is required") ReportType type,
    @NotBlank(message = "item name is required") @Size(max = 150, message = "item name is too long")
        String itemName,
    @NotNull(message = "category is required") ListingCategory category,
    @NotBlank(message = "description is required") @Size(max = 2000, message = "description is too long")
        String description,
    @NotBlank(message = "location is required") @Size(max = 200, message = "location is too long")
        String location,
    @NotNull(message = "incident date is required") @PastOrPresent(message = "incident date cannot be in the future")
        LocalDate incidentDate,
    @Size(max = 500, message = "image url is too long") String imageUrl) {}
