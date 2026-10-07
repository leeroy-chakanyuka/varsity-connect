package com.varsityconnect.payment;

import jakarta.validation.constraints.NotNull;

/* demo switch, the only input the mock needs */
public record PayOrderRequest(@NotNull(message = "simulate is required") SimulatePayment simulate) {}
