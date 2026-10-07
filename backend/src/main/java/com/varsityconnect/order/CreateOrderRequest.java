package com.varsityconnect.order;

import jakarta.validation.constraints.NotNull;

/* checkout body, the basket itself comes from the jwt */
public record CreateOrderRequest(
    @NotNull(message = "delivery method is required") DeliveryMethod deliveryMethod,
    @NotNull(message = "payment method is required") PaymentMethod paymentMethod) {}
