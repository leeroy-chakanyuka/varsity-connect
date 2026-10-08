package com.varsityconnect.notification;

import java.util.UUID;

/* a basket became an order, sellers hear it after the row commits */
public record OrderCreatedEvent(UUID orderId) {}
