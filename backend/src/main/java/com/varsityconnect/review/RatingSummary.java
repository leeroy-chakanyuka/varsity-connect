package com.varsityconnect.review;

/* profile trust numbers, zeros until the first review lands */
public record RatingSummary(double average, long count) {

  public static RatingSummary empty() {
    return new RatingSummary(0.0, 0L);
  }
}
