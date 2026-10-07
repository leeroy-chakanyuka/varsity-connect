package com.varsityconnect.common;

import org.springframework.http.HttpStatus;

/* 400 with a machine code the frontend can switch on */
public class BadRequestException extends ApiException {

  public BadRequestException(String code, String message) {
    super(HttpStatus.BAD_REQUEST, code, message);
  }

  public BadRequestException(String message) {
    this("INVALID_STATE_TRANSITION", message);
  }
}
