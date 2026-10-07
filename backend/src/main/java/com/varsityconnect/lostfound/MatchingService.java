package com.varsityconnect.lostfound;

import com.varsityconnect.common.ConflictException;
import com.varsityconnect.common.ForbiddenException;
import com.varsityconnect.common.NotFoundException;
import com.varsityconnect.security.UserPrincipal;
import com.varsityconnect.user.UserRole;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/* pairing workflows, the algorithm only scores — people decide */
@Service
public class MatchingService {

  private final LostFoundMatchRepository matches;
  private final LostFoundReportRepository reports;
  private final MatchingAlgorithm algorithm;
  private final double threshold;

  public MatchingService(
      LostFoundMatchRepository matches,
      LostFoundReportRepository reports,
      MatchingAlgorithm algorithm,
      @Value("${app.matching.threshold:0.55}") double threshold) {
    this.matches = matches;
    this.reports = reports;
    this.algorithm = algorithm;
    this.threshold = threshold;
  }

  /* called after every report creation, pairs against open opposites */
  @Transactional
  public void matchNewReport(UUID reportId) {
    LostFoundReport report =
        reports.findById(reportId).orElseThrow(() -> new NotFoundException("report not found"));
    if (report.getStatus() != ReportStatus.OPEN) {
      return;
    }

    List<LostFoundReport> candidates =
        matches.findCandidates(report.getType(), report.getOwner().getId());
    List<LostFoundReport> pairedWith = new java.util.ArrayList<>();
    List<LostFoundMatch> fresh = new java.util.ArrayList<>();
    for (LostFoundReport candidate : candidates) {
      LostFoundReport lost = report.getType() == ReportType.LOST ? report : candidate;
      LostFoundReport found = report.getType() == ReportType.LOST ? candidate : report;
      double score = algorithm.score(lost, found);
      if (score < threshold) {
        continue;
      }
      if (matches.findByLostReportIdAndFoundReportId(lost.getId(), found.getId()).isPresent()) {
        continue;
      }
      fresh.add(matches.save(new LostFoundMatch(lost, found, score)));
      pairedWith.add(candidate);
    }
    if (!pairedWith.isEmpty()) {
      report.setStatus(ReportStatus.MATCH_PENDING);
      reports.save(report);
      /* opposites waiting on this one move along too */
      for (LostFoundReport candidate : pairedWith) {
        if (candidate.getStatus() == ReportStatus.OPEN) {
          candidate.setStatus(ReportStatus.MATCH_PENDING);
          reports.save(candidate);
        }
      }
    }
  }

  @Transactional(readOnly = true)
  public List<MatchResponse> matchesFor(UUID reportId, UserPrincipal principal) {
    LostFoundReport report =
        reports.findById(reportId).orElseThrow(() -> new NotFoundException("report not found"));
    boolean owner = report.getOwner().getId().equals(principal.id());
    if (!owner && principal.role() != UserRole.ADMIN) {
      throw new ForbiddenException("FORBIDDEN", "only the reporter may view these matches");
    }
    return matches.findByReportId(reportId).stream().map(match -> view(match, report)).toList();
  }

  @Transactional
  public MatchResponse decide(UUID matchId, UserPrincipal principal, DecideMatchRequest request) {
    LostFoundMatch match =
        matches.findById(matchId).orElseThrow(() -> new NotFoundException("match not found"));

    boolean lostSide = match.getLostReport().getOwner().getId().equals(principal.id());
    boolean foundSide = match.getFoundReport().getOwner().getId().equals(principal.id());
    if (!lostSide && !foundSide) {
      throw new ForbiddenException("FORBIDDEN", "only the involved owners may decide");
    }

    MatchDecision current = lostSide ? match.getLostDecision() : match.getFoundDecision();
    if (current != MatchDecision.PENDING) {
      throw new ConflictException("MATCH_ALREADY_DECIDED", "you already decided on this match");
    }

    MatchDecision next =
        request.decision() == DecideMatchRequest.Decision.ACCEPT
            ? MatchDecision.ACCEPTED
            : MatchDecision.REJECTED;
    if (lostSide) {
      match.setLostDecision(next);
    } else {
      match.setFoundDecision(next);
    }
    matches.save(match);

    if (match.confirmed()) {
      match.getLostReport().setStatus(ReportStatus.MATCHED);
      match.getFoundReport().setStatus(ReportStatus.MATCHED);
      reports.save(match.getLostReport());
      reports.save(match.getFoundReport());
    } else if (match.dead()) {
      /* rejection frees both sides unless other live pairs still need them */
      releaseIfLonely(match.getLostReport(), match.getId());
      releaseIfLonely(match.getFoundReport(), match.getId());
    }
    LostFoundReport viewing =
        lostSide ? match.getLostReport() : match.getFoundReport();
    return view(match, viewing);
  }

  /* back to open when no other undecided pair involves the report */
  private void releaseIfLonely(LostFoundReport report, UUID decidedMatchId) {
    if (report.getStatus() != ReportStatus.MATCH_PENDING) {
      return;
    }
    boolean live =
        matches.findByReportId(report.getId()).stream()
            .anyMatch(other -> !other.getId().equals(decidedMatchId) && !other.dead());
    if (!live) {
      report.setStatus(ReportStatus.OPEN);
      reports.save(report);
    }
  }

  private static MatchResponse view(LostFoundMatch match, LostFoundReport viewing) {
    boolean viewingLost = match.getLostReport().getId().equals(viewing.getId());
    LostFoundReport other = viewingLost ? match.getFoundReport() : match.getLostReport();
    return new MatchResponse(
        match.getId(),
        viewing.getId(),
        other.getId(),
        other.getItemName(),
        other.getDescription(),
        other.getLocation(),
        Math.round(match.getScore() * 10000.0) / 100.0,
        viewingLost ? match.getLostDecision() : match.getFoundDecision(),
        viewingLost ? match.getFoundDecision() : match.getLostDecision(),
        match.getCreatedAt());
  }
}
