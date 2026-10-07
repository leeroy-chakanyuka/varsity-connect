package com.varsityconnect.common;

import org.springframework.http.HttpStatus;

/* 409 for duplicates like email or student number */
public class ConflictException extends ApiException {

  public ConflictException(String code, String message) {
    super(HttpStatus.CONFLICT, code, message);
  }
}
