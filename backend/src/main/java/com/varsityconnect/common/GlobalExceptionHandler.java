package com.varsityconnect.common;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/* single place where exceptions become json, never leak stack traces out */
@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  /* our own failures already carry status + code */

  @ExceptionHandler(ApiException.class)
  public ResponseEntity<ApiErrorResponse> handleApi(ApiException ex, HttpServletRequest request) {
    return body(ex.getStatus(), ex.getCode(), ex.getMessage(), null, request);
  }

  /* bean validation on @Valid dtos -> VALIDATION_ERROR with per-field map */

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiErrorResponse> handleBeanValidation(
      MethodArgumentNotValidException ex, HttpServletRequest request) {
    Map<String, String> fields = new HashMap<>();
    ex.getBindingResult()
        .getFieldErrors()
        .forEach(err -> fields.put(err.getField(), err.getDefaultMessage()));
    return body(
        HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "one or more fields are invalid", fields, request);
  }

  @ExceptionHandler(ConstraintViolationException.class)
  public ResponseEntity<ApiErrorResponse> handleConstraintViolation(
      ConstraintViolationException ex, HttpServletRequest request) {
    Map<String, String> fields = new HashMap<>();
    ex.getConstraintViolations()
        .forEach(v -> fields.put(v.getPropertyPath().toString(), v.getMessage()));
    return body(
        HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "one or more fields are invalid", fields, request);
  }

  /* malformed json or wrong enum values still read as validation, not a 500 */

  @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
  public ResponseEntity<ApiErrorResponse> handleBadPayload(Exception ex, HttpServletRequest request) {
    return body(
        HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "malformed request body", null, request);
  }

  /* spring security failures get our shape instead of the default html */

  @ExceptionHandler(AuthenticationException.class)
  public ResponseEntity<ApiErrorResponse> handleAuth(AuthenticationException ex, HttpServletRequest request) {
    return body(HttpStatus.UNAUTHORIZED, "UNAUTHORIZED", "authentication required", null, request);
  }

  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<ApiErrorResponse> handleDenied(AccessDeniedException ex, HttpServletRequest request) {
    return body(HttpStatus.FORBIDDEN, "FORBIDDEN", "you may not perform this action", null, request);
  }

  /* last resort, log the real cause but send a boring message out */

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiErrorResponse> handleUnknown(Exception ex, HttpServletRequest request) {
    log.error("unhandled error on {}: {}", request.getRequestURI(), ex.getMessage());
    return body(
        HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", "something went wrong", null, request);
  }

  private ResponseEntity<ApiErrorResponse> body(
      HttpStatus status, String code, String message, Map<String, String> fields, HttpServletRequest request) {
    ApiErrorResponse error =
        new ApiErrorResponse(
            Instant.now(), status.value(), code, message, fields, request.getRequestURI());
    return ResponseEntity.status(status).body(error);
  }
}
