package com.varsityconnect.lostfound;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/* persistence only, pairing rules live in MatchingService */
public interface LostFoundMatchRepository extends JpaRepository<LostFoundMatch, UUID> {

  Optional<LostFoundMatch> findByLostReportIdAndFoundReportId(UUID lostId, UUID foundId);

  /* every pair a report belongs to, for availability bookkeeping */
  @Query(
      "select m from LostFoundMatch m where m.lostReport.id = :id or m.foundReport.id = :id")
  List<LostFoundMatch> findByReportId(@Param("id") UUID id);

  /* matchable opposites: open or waiting, never the reporter's own */
  @Query(
      "select r from LostFoundReport r where r.type <> :type"
          + " and r.status in ('OPEN', 'MATCH_PENDING')"
          + " and r.owner.id <> :ownerId")
  List<LostFoundReport> findCandidates(
      @Param("type") ReportType type, @Param("ownerId") UUID ownerId);
}
