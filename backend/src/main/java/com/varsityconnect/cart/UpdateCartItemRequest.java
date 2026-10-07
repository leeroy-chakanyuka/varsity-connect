package com.varsityconnect.cart;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/* quantity patch, the item and the basket come from the path and the jwt */
public record UpdateCartItemRequest(@NotNull(message = "quantity is required") @Min(value = 1, message = "quantity must be at least 1") Integer quantity) {}
