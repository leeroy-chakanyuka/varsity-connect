package com.varsityconnect.notification;

import java.util.UUID;

/* a hand went up, the requester hears about it */
public record SupportOfferCreatedEvent(UUID offerId) {}
