package com.varsityconnect.lostfound;

import java.time.Instant;
import java.util.UUID;

/* one candidate pair view, decisions ride along for button state */
public record MatchResponse(
    UUID id,
    UUID reportId,
    UUID otherReportId,
    String otherItemName,
    String otherDescription,
    String otherLocation,
    double score,
    MatchDecision myDecision,
    MatchDecision otherDecision,
    Instant createdAt) {}
