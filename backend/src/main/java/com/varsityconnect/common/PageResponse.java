package com.varsityconnect.common;

import java.util.List;

/* one page shape for every list endpoint, keeps frontend paging dumb and happy */
public record PageResponse<T>(
    List<T> content,
    int page,
    int size,
    long totalElements,
    int totalPages,
    boolean first,
    boolean last) {

  /* cap page size centrally so nobody can ask for a million rows */
  public static final int MAX_SIZE = 100;

  public static int capSize(int size) {
    if (size < 1) {
      return 20;
    }
    return Math.min(size, MAX_SIZE);
  }
}
