package com.varsityconnect.common;

import org.springframework.http.HttpStatus;

/* 403, thrown after we know who you are but you may not do that */
public class ForbiddenException extends ApiException {

  public ForbiddenException(String code, String message) {
    super(HttpStatus.FORBIDDEN, code, message);
  }

  public ForbiddenException(String message) {
    this("FORBIDDEN", message);
  }
}
