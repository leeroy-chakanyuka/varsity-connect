package com.varsityconnect.community;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

/* persistence only, feed shapes live in the service */
public interface CommunityCommentRepository extends JpaRepository<CommunityComment, UUID> {

  @EntityGraph(attributePaths = {"author"})
  List<CommunityComment> findByPostIdAndDeletedFalseOrderByCreatedAtAsc(UUID postId);
}
