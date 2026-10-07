package com.varsityconnect.lostfound;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

/* deterministic scorer, no ai anywhere near it.
 * weights: category 35, description 35, location 20, date 10. */
@Component
public class MatchingAlgorithm {

  private static final Set<String> STOP_WORDS =
      Set.of(
          "the", "a", "an", "and", "or", "of", "to", "in", "on", "at", "for", "with",
          "is", "are", "was", "were", "it", "its", "this", "that", "my", "near",
          "from", "by", "lost", "found", "very", "quite", "really");

  public double score(LostFoundReport lost, LostFoundReport found) {
    double category = lost.getCategory() == found.getCategory() ? 1.0 : 0.0;
    double description = jaccard(lost.getDescription(), found.getDescription());
    double location = jaccard(lost.getLocation(), found.getLocation());
    double date = dateScore(lost.getIncidentDate(), found.getIncidentDate());
    return 0.35 * category + 0.35 * description + 0.20 * location + 0.10 * date;
  }

  /* shared-word ratio, 0 when both sides are empty */
  static double jaccard(String left, String right) {
    Set<String> a = tokens(left);
    Set<String> b = tokens(right);
    if (a.isEmpty() && b.isEmpty()) {
      return 0.0;
    }
    Set<String> union = new HashSet<>(a);
    union.addAll(b);
    Set<String> intersection = new HashSet<>(a);
    intersection.retainAll(b);
    return (double) intersection.size() / union.size();
  }

  static Set<String> tokens(String text) {
    if (text == null) {
      return Set.of();
    }
    return Arrays.stream(text.toLowerCase().replaceAll("[^a-z0-9 ]", " ").split("\\s+"))
        .map(String::trim)
        .filter(word -> !word.isEmpty() && !STOP_WORDS.contains(word))
        .collect(Collectors.toSet());
  }

  static double dateScore(LocalDate lost, LocalDate found) {
    if (lost == null || found == null) {
      return 0.0;
    }
    long days = Math.abs(ChronoUnit.DAYS.between(lost, found));
    if (days == 0) {
      return 1.00;
    } else if (days <= 1) {
      return 0.90;
    } else if (days <= 3) {
      return 0.75;
    } else if (days <= 7) {
      return 0.50;
    } else if (days <= 14) {
      return 0.25;
    }
    return 0.0;
  }
}
