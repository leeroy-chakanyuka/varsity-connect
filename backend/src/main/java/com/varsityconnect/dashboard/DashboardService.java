package com.varsityconnect.dashboard;

import com.varsityconnect.community.CommunityPostRepository;
import com.varsityconnect.community.PostResponse;
import com.varsityconnect.lostfound.LostFoundReport;
import com.varsityconnect.lostfound.LostFoundReportRepository;
import com.varsityconnect.lostfound.MatchResponse;
import com.varsityconnect.lostfound.MatchingService;
import com.varsityconnect.lostfound.ReportStatus;
import com.varsityconnect.marketplace.ListingResponse;
import com.varsityconnect.marketplace.ListingStatus;
import com.varsityconnect.marketplace.MarketplaceListingRepository;
import com.varsityconnect.notification.NotificationRepository;
import com.varsityconnect.security.UserPrincipal;
import com.varsityconnect.support.SupportRequestResponse;
import com.varsityconnect.support.SupportRequestRepository;
import com.varsityconnect.support.SupportStatus;
import com.varsityconnect.user.UserService;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/* read-only home aggregate, bounded queries only — no N+1 walks */
@Service
public class DashboardService {

  private final UserService users;
  private final NotificationRepository notifications;
  private final MarketplaceListingRepository listings;
  private final CommunityPostRepository posts;
  private final SupportRequestRepository supportRequests;
  private final LostFoundReportRepository reports;
  private final MatchingService matching;

  public DashboardService(
      UserService users,
      NotificationRepository notifications,
      MarketplaceListingRepository listings,
      CommunityPostRepository posts,
      SupportRequestRepository supportRequests,
      LostFoundReportRepository reports,
      MatchingService matching) {
    this.users = users;
    this.notifications = notifications;
    this.listings = listings;
    this.posts = posts;
    this.supportRequests = supportRequests;
    this.reports = reports;
    this.matching = matching;
  }

  @Transactional(readOnly = true)
  public DashboardResponse get(UserPrincipal principal) {
    List<ListingResponse> latestListings =
        listings.findTop4ByStatusOrderByCreatedAtDesc(ListingStatus.ACTIVE).stream()
            .map(ListingResponse::from)
            .toList();
    List<PostResponse> latestPosts =
        posts.findTop4ByDeletedFalseOrderByCreatedAtDesc().stream()
            .map(PostResponse::from)
            .toList();
    List<SupportRequestResponse> openSupport =
        supportRequests.findByStatusOrderByCreatedAtDesc(SupportStatus.OPEN, PageRequest.of(0, 4))
            .getContent().stream()
            .map(SupportRequestResponse::from)
            .toList();
    /* at most three of my reports checked, five pairs shown */
    List<MatchResponse> myMatches =
        reports.findTop3ByOwnerIdOrderByCreatedAtDesc(principal.id()).stream()
            .map(LostFoundReport::getId)
            .flatMap(id -> matching.matchesFor(id, principal).stream())
            .limit(5)
            .toList();
    return new DashboardResponse(
        users.me(principal),
        notifications.countByRecipientIdAndReadAtIsNull(principal.id()),
        latestListings,
        latestPosts,
        openSupport,
        myMatches,
        listings.countByStatus(ListingStatus.ACTIVE),
        reports.countByStatus(ReportStatus.OPEN),
        supportRequests.countByStatus(SupportStatus.OPEN));
  }
}
