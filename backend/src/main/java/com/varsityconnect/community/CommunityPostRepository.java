package com.varsityconnect.community;

import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/* persistence only, feed shapes live in the service */
public interface CommunityPostRepository extends JpaRepository<CommunityPost, UUID> {

  Page<CommunityPost> findByDeletedFalse(Pageable pageable);

  List<CommunityPost> findTop4ByDeletedFalseOrderByCreatedAtDesc();

  @Query(
      "select p from CommunityPost p where p.deleted = false"
          + " and (lower(p.title) like lower(concat('%', :q, '%'))"
          + " or lower(p.body) like lower(concat('%', :q, '%')))")
  Page<CommunityPost> search(@Param("q") String q, Pageable pageable);
}
