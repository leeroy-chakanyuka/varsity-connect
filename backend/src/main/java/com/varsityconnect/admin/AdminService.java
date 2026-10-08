package com.varsityconnect.admin;

import com.varsityconnect.common.NotFoundException;
import com.varsityconnect.common.PageResponse;
import com.varsityconnect.community.CommunityPostRepository;
import com.varsityconnect.community.CommunityService;
import com.varsityconnect.community.PostResponse;
import com.varsityconnect.marketplace.ListingResponse;
import com.varsityconnect.marketplace.ListingService;
import com.varsityconnect.marketplace.MarketplaceListingRepository;
import com.varsityconnect.review.RatingSummary;
import com.varsityconnect.review.ReviewRepository;
import com.varsityconnect.security.UserPrincipal;
import com.varsityconnect.support.SupportRequestRepository;
import com.varsityconnect.support.SupportRequestResponse;
import com.varsityconnect.user.User;
import com.varsityconnect.user.UserMapper;
import com.varsityconnect.user.UserProfileResponse;
import com.varsityconnect.user.UserRepository;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/* moderation desk, every door rechecks ADMIN — the frontend gate is decoration */
@Service
@PreAuthorize("hasRole('ADMIN')")
public class AdminService {

  private final UserRepository users;
  private final ReviewRepository reviews;
  private final MarketplaceListingRepository listings;
  private final ListingService listingService;
  private final CommunityPostRepository posts;
  private final CommunityService communityService;
  private final SupportRequestRepository supportRequests;

  public AdminService(
      UserRepository users,
      ReviewRepository reviews,
      MarketplaceListingRepository listings,
      ListingService listingService,
      CommunityPostRepository posts,
      CommunityService communityService,
      SupportRequestRepository supportRequests) {
    this.users = users;
    this.reviews = reviews;
    this.listings = listings;
    this.listingService = listingService;
    this.posts = posts;
    this.communityService = communityService;
    this.supportRequests = supportRequests;
  }

  @Transactional(readOnly = true)
  public PageResponse<UserProfileResponse> users(Pageable pageable) {
    Page<User> page = users.findAll(pageable);
    return new PageResponse<>(
        page.getContent().stream().map(user -> UserMapper.profile(user, ratings(user.getId()))).toList(),
        page.getNumber(),
        page.getSize(),
        page.getTotalElements(),
        page.getTotalPages(),
        page.isFirst(),
        page.isLast());
  }

  @Transactional
  public UserProfileResponse setEnabled(UUID id, boolean enabled) {
    User user = users.findById(id).orElseThrow(() -> new NotFoundException("user not found"));
    user.setEnabled(enabled);
    User saved = users.save(user);
    return UserMapper.profile(saved, ratings(saved.getId()));
  }

  @Transactional(readOnly = true)
  public PageResponse<ListingResponse> listings(Pageable pageable) {
    Page<com.varsityconnect.marketplace.MarketplaceListing> page = listings.findAll(pageable);
    return new PageResponse<>(
        page.getContent().stream().map(ListingResponse::from).toList(),
        page.getNumber(),
        page.getSize(),
        page.getTotalElements(),
        page.getTotalPages(),
        page.isFirst(),
        page.isLast());
  }

  @Transactional
  public ListingResponse archiveListing(UUID id, UserPrincipal principal) {
    /* owner-or-admin inside, admins always pass */
    return listingService.archive(id, principal);
  }

  @Transactional(readOnly = true)
  public PageResponse<PostResponse> posts(Pageable pageable) {
    Page<com.varsityconnect.community.CommunityPost> page =
        posts.findByDeletedFalse(pageable);
    return new PageResponse<>(
        page.getContent().stream().map(PostResponse::from).toList(),
        page.getNumber(),
        page.getSize(),
        page.getTotalElements(),
        page.getTotalPages(),
        page.isFirst(),
        page.isLast());
  }

  @Transactional
  public void deletePost(UUID id, UserPrincipal principal) {
    communityService.deletePost(id, principal);
  }

  @Transactional(readOnly = true)
  public PageResponse<SupportRequestResponse> supportRequests(Pageable pageable) {
    Page<com.varsityconnect.support.SupportRequest> page = supportRequests.findAll(pageable);
    return new PageResponse<>(
        page.getContent().stream().map(SupportRequestResponse::from).toList(),
        page.getNumber(),
        page.getSize(),
        page.getTotalElements(),
        page.getTotalPages(),
        page.isFirst(),
        page.isLast());
  }

  private RatingSummary ratings(UUID id) {
    Double average = reviews.averageFor(id);
    return new RatingSummary(average == null ? 0.0 : average, reviews.countFor(id));
  }
}
