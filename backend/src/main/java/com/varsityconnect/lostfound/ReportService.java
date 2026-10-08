package com.varsityconnect.lostfound;

import com.varsityconnect.common.BadRequestException;
import com.varsityconnect.common.ForbiddenException;
import com.varsityconnect.common.NotFoundException;
import com.varsityconnect.common.PageResponse;
import com.varsityconnect.security.UserPrincipal;
import com.varsityconnect.user.User;
import com.varsityconnect.user.UserRepository;
import com.varsityconnect.user.UserRole;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/* report workflows, controllers only translate in and out */
@Service
public class ReportService {

  private final LostFoundReportRepository reports;
  private final UserRepository users;
  private final MatchingService matching;

  public ReportService(
      LostFoundReportRepository reports, UserRepository users, MatchingService matching) {
    this.reports = reports;
    this.users = users;
    this.matching = matching;
  }

  @Transactional
  public ReportResponse create(UserPrincipal principal, CreateReportRequest request) {
    User owner =
        users.findById(principal.id()).orElseThrow(() -> new NotFoundException("user not found"));
    LostFoundReport report =
        new LostFoundReport(
            owner,
            request.type(),
            request.itemName().trim(),
            request.category(),
            request.description().trim(),
            request.location().trim(),
            request.incidentDate(),
            blankToNull(request.imageUrl()));
    ReportResponse created = ReportResponse.from(reports.save(report));
    /* pairing runs right away, same transaction */
    matching.matchNewReport(created.id());
    return created;
  }

  @Transactional(readOnly = true)
  public PageResponse<ReportResponse> browse(ReportSpecifications.Filter filter, Pageable pageable) {
    Page<LostFoundReport> page = reports.findAll(ReportSpecifications.withFilter(filter), pageable);
    return new PageResponse<>(
        page.getContent().stream().map(ReportResponse::from).toList(),
        page.getNumber(),
        page.getSize(),
        page.getTotalElements(),
        page.getTotalPages(),
        page.isFirst(),
        page.isLast());
  }

  @Transactional(readOnly = true)
  public ReportResponse detail(UUID id) {
    return ReportResponse.from(byId(id));
  }

  @Transactional
  public ReportResponse update(UUID id, UserPrincipal principal, UpdateReportRequest request) {
    LostFoundReport report = byId(id);
    requireOwnerOrAdmin(report, principal, "only the reporter may edit this report");
    if (report.getStatus() != ReportStatus.OPEN && report.getStatus() != ReportStatus.MATCH_PENDING) {
      throw new BadRequestException("INVALID_STATE_TRANSITION", "only open reports can be edited");
    }

    if (request.itemName() != null && !request.itemName().isBlank()) {
      report.setItemName(request.itemName().trim());
    }
    if (request.category() != null) {
      report.setCategory(request.category());
    }
    if (request.description() != null && !request.description().isBlank()) {
      report.setDescription(request.description().trim());
    }
    if (request.location() != null && !request.location().isBlank()) {
      report.setLocation(request.location().trim());
    }
    if (request.incidentDate() != null) {
      report.setIncidentDate(request.incidentDate());
    }
    if (request.imageUrl() != null) {
      report.setImageUrl(blankToNull(request.imageUrl()));
    }
    return ReportResponse.from(reports.save(report));
  }

  @Transactional
  public ReportResponse close(UUID id, UserPrincipal principal) {
    LostFoundReport report = byId(id);
    requireOwnerOrAdmin(report, principal, "only the reporter may close this report");
    if (report.getStatus() == ReportStatus.CLOSED) {
      throw new BadRequestException("INVALID_STATE_TRANSITION", "report is already closed");
    }
    report.setStatus(ReportStatus.CLOSED);
    return ReportResponse.from(reports.save(report));
  }

  /* matched pairs leave the board together, only from a confirmed match */
  @Transactional
  public ReportResponse resolve(UUID id, UserPrincipal principal) {
    LostFoundReport report = byId(id);
    requireOwnerOrAdmin(report, principal, "only the reporter may resolve this report");
    if (report.getStatus() != ReportStatus.MATCHED) {
      throw new BadRequestException("INVALID_STATE_TRANSITION", "only matched reports can resolve");
    }
    report.setStatus(ReportStatus.RESOLVED);
    return ReportResponse.from(reports.save(report));
  }

  private LostFoundReport byId(UUID id) {
    return reports.findById(id).orElseThrow(() -> new NotFoundException("report not found"));
  }

  private void requireOwnerOrAdmin(LostFoundReport report, UserPrincipal principal, String message) {
    boolean owner = report.getOwner().getId().equals(principal.id());
    if (!owner && principal.role() != UserRole.ADMIN) {
      throw new ForbiddenException("FORBIDDEN", message);
    }
  }

  private static String blankToNull(String value) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }
}
