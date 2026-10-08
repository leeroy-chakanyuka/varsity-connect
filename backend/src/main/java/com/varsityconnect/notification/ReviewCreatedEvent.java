package com.varsityconnect.notification;

import java.util.UUID;

/* a seller earned a voice, told after the row commits */
public record ReviewCreatedEvent(UUID reviewId) {}
