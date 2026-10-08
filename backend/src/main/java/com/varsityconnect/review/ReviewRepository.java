package com.varsityconnect.review;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/* persistence only, eligibility lives in ReviewService */
public interface ReviewRepository extends JpaRepository<Review, UUID> {

  Optional<Review> findByOrderIdAndReviewerIdAndRevieweeId(UUID orderId, UUID reviewerId, UUID revieweeId);

  List<Review> findByRevieweeIdOrderByCreatedAtDesc(UUID revieweeId);

  @Query("select coalesce(avg(r.rating), 0) from Review r where r.reviewee.id = :id")
  Double averageFor(@Param("id") UUID revieweeId);

  @Query("select count(r) from Review r where r.reviewee.id = :id")
  long countFor(@Param("id") UUID revieweeId);
}
