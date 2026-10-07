package com.varsityconnect.notification;

import java.util.UUID;

/* demo money moved, buyer hears about it */
public record OrderPaidEvent(UUID orderId) {}
