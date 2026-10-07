package com.varsityconnect.lostfound;

import jakarta.validation.constraints.NotNull;

/* accept or walk away, one side at a time */
public record DecideMatchRequest(@NotNull(message = "decision is required") Decision decision) {

  public enum Decision {
    ACCEPT,
    REJECT
  }
}
