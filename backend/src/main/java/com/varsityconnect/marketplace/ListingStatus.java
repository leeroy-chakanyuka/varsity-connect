package com.varsityconnect.marketplace;

/* lifecycle: ACTIVE -> RESERVED -> SOLD, or ACTIVE -> ARCHIVED.
 * reservation and sale transitions arrive with orders/checkout, archive lives here. */
public enum ListingStatus {
  ACTIVE,
  RESERVED,
  SOLD,
  ARCHIVED
}
