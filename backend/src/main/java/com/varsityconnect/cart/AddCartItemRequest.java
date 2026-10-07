package com.varsityconnect.cart;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

/* add body, quantity optional — unique listings default to one */
public record AddCartItemRequest(@NotNull(message = "listing id is required") UUID listingId,
                                @Min(value = 1, message = "quantity must be at least 1") Integer quantity) {}
