package com.varsityconnect.lostfound;

import com.varsityconnect.marketplace.ListingCategory;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/* patch body, null means untouched — type and status never move through here */
public record UpdateReportRequest(
    @Size(max = 150, message = "item name is too long") String itemName,
    ListingCategory category,
    @Size(max = 2000, message = "description is too long") String description,
    @Size(max = 200, message = "location is too long") String location,
    @PastOrPresent(message = "incident date cannot be in the future") LocalDate incidentDate,
    @Size(max = 500, message = "image url is too long") String imageUrl) {}
