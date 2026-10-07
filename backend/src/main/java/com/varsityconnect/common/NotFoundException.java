package com.varsityconnect.common;

import org.springframework.http.HttpStatus;

/* 404 with a stable code so the frontend never parses messages */
public class NotFoundException extends ApiException {

  public NotFoundException(String code, String message) {
    super(HttpStatus.NOT_FOUND, code, message);
  }

  public NotFoundException(String message) {
    this("RESOURCE_NOT_FOUND", message);
  }
}
