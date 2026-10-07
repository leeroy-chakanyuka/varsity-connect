package com.varsityconnect.lostfound;

import com.varsityconnect.marketplace.ListingCategory;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;

/* every browse filter hits the database, never in-memory lists */
public final class ReportSpecifications {

  private ReportSpecifications() {}

  public record Filter(
      String search,
      ReportType type,
      ListingCategory category,
      String location,
      ReportStatus status,
      UUID ownerId,
      boolean includeClosed) {}

  public static Specification<LostFoundReport> withFilter(Filter filter) {
    return (root, query, cb) -> {
      if (query != null
          && query.getResultType() != Long.class
          && query.getResultType() != long.class) {
        root.fetch("owner", JoinType.LEFT);
        query.distinct(true);
      }

      List<Predicate> predicates = new ArrayList<>();

      if (filter.search() != null && !filter.search().isBlank()) {
        String like = "%" + escapeLike(filter.search().trim().toLowerCase()) + "%";
        predicates.add(
            cb.or(
                cb.like(cb.lower(root.get("itemName")), like, '\\'),
                cb.like(cb.lower(root.get("description")), like, '\\')));
      }
      if (filter.type() != null) {
        predicates.add(cb.equal(root.get("type"), filter.type()));
      }
      if (filter.category() != null) {
        predicates.add(cb.equal(root.get("category"), filter.category()));
      }
      if (filter.location() != null && !filter.location().isBlank()) {
        predicates.add(
            cb.like(
                cb.lower(root.get("location")),
                "%" + escapeLike(filter.location().trim().toLowerCase()) + "%",
                '\\'));
      }
      if (filter.status() != null) {
        predicates.add(cb.equal(root.get("status"), filter.status()));
      } else if (!filter.includeClosed()) {
        predicates.add(cb.notEqual(root.get("status"), ReportStatus.CLOSED));
      }
      if (filter.ownerId() != null) {
        predicates.add(cb.equal(root.get("owner").get("id"), filter.ownerId()));
      }
      return cb.and(predicates.toArray(new Predicate[0]));
    };
  }

  private static String escapeLike(String value) {
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
  }
}
