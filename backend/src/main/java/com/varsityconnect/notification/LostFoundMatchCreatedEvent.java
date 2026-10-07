package com.varsityconnect.notification;

import java.util.UUID;

/* scorer found a candidate pair, both owners hear about it */
public record LostFoundMatchCreatedEvent(UUID matchId) {}
