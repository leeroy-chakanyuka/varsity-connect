package com.varsityconnect.notification;

import java.util.UUID;

/* requester picked a hand, the responder hears about it */
public record SupportOfferAcceptedEvent(UUID offerId) {}
