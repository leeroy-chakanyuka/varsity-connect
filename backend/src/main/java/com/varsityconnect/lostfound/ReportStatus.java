package com.varsityconnect.lostfound;

/* lifecycle: OPEN -> MATCH_PENDING -> MATCHED -> RESOLVED, or CLOSED anytime.
 * matching moves it forward in stage 12, closing stays here. */
public enum ReportStatus {
  OPEN,
  MATCH_PENDING,
  MATCHED,
  RESOLVED,
  CLOSED
}
