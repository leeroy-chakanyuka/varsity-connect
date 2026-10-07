package com.varsityconnect.marketplace;

import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;

/* every browse filter hits the database, never in-memory lists */
public final class ListingSpecifications {

  private ListingSpecifications() {}

  public record Filter(
      String search,
      ListingCategory category,
      ListingCondition condition,
      BigDecimal minPrice,
      BigDecimal maxPrice,
      UUID sellerId,
      ListingStatus status) {}

  public static Specification<MarketplaceListing> withFilter(Filter filter) {
    return (root, query, cb) -> {
      /* single fetch pass so cards never N+1, skipped for the count query */
      if (query != null
          && query.getResultType() != Long.class
          && query.getResultType() != long.class) {
        root.fetch("seller", JoinType.LEFT);
        root.fetch("images", JoinType.LEFT);
        query.distinct(true);
      }

      List<Predicate> predicates = new ArrayList<>();

      if (filter.search() != null && !filter.search().isBlank()) {
        String like = "%" + escapeLike(filter.search().trim().toLowerCase()) + "%";
        predicates.add(
            cb.or(
                cb.like(cb.lower(root.get("title")), like, '\\'),
                cb.like(cb.lower(root.get("description")), like, '\\')));
      }
      if (filter.category() != null) {
        predicates.add(cb.equal(root.get("category"), filter.category()));
      }
      if (filter.condition() != null) {
        predicates.add(cb.equal(root.get("condition"), filter.condition()));
      }
      if (filter.minPrice() != null) {
        predicates.add(cb.greaterThanOrEqualTo(root.get("price"), filter.minPrice()));
      }
      if (filter.maxPrice() != null) {
        predicates.add(cb.lessThanOrEqualTo(root.get("price"), filter.maxPrice()));
      }
      if (filter.sellerId() != null) {
        predicates.add(cb.equal(root.get("seller").get("id"), filter.sellerId()));
      }
      if (filter.status() != null) {
        predicates.add(cb.equal(root.get("status"), filter.status()));
      }
      return cb.and(predicates.toArray(new Predicate[0]));
    };
  }

  private static String escapeLike(String value) {
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
  }
}
