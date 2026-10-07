package com.varsityconnect.common;

import org.springframework.http.HttpStatus;

/* 401, used where spring's own entry point does not already cover us */
public class UnauthorizedException extends ApiException {

  public UnauthorizedException(String code, String message) {
    super(HttpStatus.UNAUTHORIZED, code, message);
  }

  public UnauthorizedException(String message) {
    this("UNAUTHORIZED", message);
  }
}
