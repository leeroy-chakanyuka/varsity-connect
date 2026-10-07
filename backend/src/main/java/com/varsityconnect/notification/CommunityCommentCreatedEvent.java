package com.varsityconnect.notification;

import java.util.UUID;

/* a reply landed, the thread author hears about it */
public record CommunityCommentCreatedEvent(UUID commentId) {}
