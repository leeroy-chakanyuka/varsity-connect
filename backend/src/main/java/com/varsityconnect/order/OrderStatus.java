package com.varsityconnect.order;

/* where the order stands, money moves it forward in later stages */
public enum OrderStatus {
  PENDING_PAYMENT,
  PAID,
  READY_FOR_COLLECTION,
  COMPLETED,
  CANCELLED,
  PAYMENT_FAILED
}
