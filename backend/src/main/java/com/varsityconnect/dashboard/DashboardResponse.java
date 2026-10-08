package com.varsityconnect.dashboard;

import com.varsityconnect.community.PostResponse;
import com.varsityconnect.lostfound.MatchResponse;
import com.varsityconnect.marketplace.ListingResponse;
import com.varsityconnect.support.SupportRequestResponse;
import com.varsityconnect.user.UserProfileResponse;
import java.util.List;

/* home aggregate, every collection capped — detail lives on its own page */
public record DashboardResponse(
    UserProfileResponse user,
    long unreadNotifications,
    List<ListingResponse> latestListings,
    List<PostResponse> latestPosts,
    List<SupportRequestResponse> openSupportRequests,
    List<MatchResponse> myMatches,
    long activeListingCount,
    long openLostReportCount,
    long openSupportRequestCount) {}
