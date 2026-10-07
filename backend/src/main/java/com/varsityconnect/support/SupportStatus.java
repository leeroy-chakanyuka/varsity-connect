package com.varsityconnect.support;

/* lifecycle: OPEN -> OFFER_RECEIVED -> IN_PROGRESS -> RESOLVED,
 * plus CANCELLED out of OPEN/OFFER_RECEIVED. */
public enum SupportStatus {
  OPEN,
  OFFER_RECEIVED,
  IN_PROGRESS,
  RESOLVED,
  CANCELLED
}
