package com.varsityconnect.lostfound;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

import com.varsityconnect.marketplace.ListingCategory;
import com.varsityconnect.user.User;
import com.varsityconnect.user.UserRole;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

/* pure scorer checks, no spring needed */
class MatchingAlgorithmTest {

  private final MatchingAlgorithm algorithm = new MatchingAlgorithm();

  private LostFoundReport report(
      ReportType type, ListingCategory category, String description, String location, LocalDate date) {
    User owner = new User("match user", "m@cput.ac.za", "hash", null, null, UserRole.STUDENT);
    return new LostFoundReport(owner, type, "item", category, description, location, date, null);
  }

  @Test
  void identicalReportsScoreOne() {
    LostFoundReport lost =
        report(ReportType.LOST, ListingCategory.OTHER, "black leather wallet", "library steps", LocalDate.of(2026, 10, 1));
    LostFoundReport found =
        report(ReportType.FOUND, ListingCategory.OTHER, "black leather wallet", "library steps", LocalDate.of(2026, 10, 1));
    assertThat(algorithm.score(lost, found)).isCloseTo(1.0, within(0.0001));
  }

  @Test
  void categoryAffectsScore() {
    LostFoundReport lost =
        report(ReportType.LOST, ListingCategory.OTHER, "black leather wallet", "library steps", LocalDate.of(2026, 10, 1));
    LostFoundReport same =
        report(ReportType.FOUND, ListingCategory.OTHER, "black leather wallet", "library steps", LocalDate.of(2026, 10, 1));
    LostFoundReport different =
        report(ReportType.FOUND, ListingCategory.ELECTRONICS, "black leather wallet", "library steps", LocalDate.of(2026, 10, 1));
    assertThat(algorithm.score(lost, same)).isGreaterThan(algorithm.score(lost, different));
  }

  @Test
  void descriptionAffectsScore() {
    LostFoundReport lost =
        report(ReportType.LOST, ListingCategory.OTHER, "black leather wallet", "library steps", LocalDate.of(2026, 10, 1));
    LostFoundReport close =
        report(ReportType.FOUND, ListingCategory.OTHER, "black leather wallet", "library steps", LocalDate.of(2026, 10, 1));
    LostFoundReport far =
        report(ReportType.FOUND, ListingCategory.OTHER, "red mountain bicycle", "library steps", LocalDate.of(2026, 10, 1));
    assertThat(algorithm.score(lost, close)).isGreaterThan(algorithm.score(lost, far));
  }

  @Test
  void locationAffectsScore() {
    LostFoundReport lost =
        report(ReportType.LOST, ListingCategory.OTHER, "black leather wallet", "library steps", LocalDate.of(2026, 10, 1));
    LostFoundReport close =
        report(ReportType.FOUND, ListingCategory.OTHER, "black leather wallet", "library steps", LocalDate.of(2026, 10, 1));
    LostFoundReport far =
        report(ReportType.FOUND, ListingCategory.OTHER, "black leather wallet", "sports field", LocalDate.of(2026, 10, 1));
    assertThat(algorithm.score(lost, close)).isGreaterThan(algorithm.score(lost, far));
  }

  @Test
  void dateAffectsScore() {
    LostFoundReport lost =
        report(ReportType.LOST, ListingCategory.OTHER, "black leather wallet", "library steps", LocalDate.of(2026, 10, 1));
    LostFoundReport close =
        report(ReportType.FOUND, ListingCategory.OTHER, "black leather wallet", "library steps", LocalDate.of(2026, 10, 1));
    LostFoundReport far =
        report(ReportType.FOUND, ListingCategory.OTHER, "black leather wallet", "library steps", LocalDate.of(2026, 8, 1));
    assertThat(algorithm.score(lost, close)).isGreaterThan(algorithm.score(lost, far));
  }

  @Test
  void dateTable() {
    assertThat(MatchingAlgorithm.dateScore(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 1))).isEqualTo(1.00);
    assertThat(MatchingAlgorithm.dateScore(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 2))).isEqualTo(0.90);
    assertThat(MatchingAlgorithm.dateScore(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 4))).isEqualTo(0.75);
    assertThat(MatchingAlgorithm.dateScore(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 8))).isEqualTo(0.50);
    assertThat(MatchingAlgorithm.dateScore(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 15))).isEqualTo(0.25);
    assertThat(MatchingAlgorithm.dateScore(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 11, 1))).isEqualTo(0.0);
  }
}
