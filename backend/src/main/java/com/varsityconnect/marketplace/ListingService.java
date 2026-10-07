package com.varsityconnect.marketplace;

import com.varsityconnect.common.BadRequestException;
import com.varsityconnect.common.ForbiddenException;
import com.varsityconnect.common.NotFoundException;
import com.varsityconnect.common.PageResponse;
import com.varsityconnect.security.UserPrincipal;
import com.varsityconnect.user.User;
import com.varsityconnect.user.UserRepository;
import com.varsityconnect.user.UserRole;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/* listing workflows, controllers only translate in and out */
@Service
public class ListingService {

  private final MarketplaceListingRepository listings;
  private final UserRepository users;

  public ListingService(MarketplaceListingRepository listings, UserRepository users) {
    this.listings = listings;
    this.users = users;
  }

  @Transactional
  public ListingResponse create(UserPrincipal principal, CreateListingRequest request) {
    User seller = sellerOf(principal);
    MarketplaceListing listing =
        new MarketplaceListing(
            seller,
            request.title().trim(),
            request.description().trim(),
            request.price(),
            request.category(),
            request.condition(),
            blankToNull(request.location()));
    listing.setImages(cleanUrls(request.imageUrls()));
    MarketplaceListing saved = listings.save(listing);
    return ListingResponse.from(saved);
  }

  @Transactional(readOnly = true)
  public PageResponse<ListingResponse> browse(ListingSpecifications.Filter filter, Pageable pageable) {
    Page<MarketplaceListing> page = listings.findAll(ListingSpecifications.withFilter(filter), pageable);
    return new PageResponse<>(
        page.getContent().stream().map(ListingResponse::from).toList(),
        page.getNumber(),
        page.getSize(),
        page.getTotalElements(),
        page.getTotalPages(),
        page.isFirst(),
        page.isLast());
  }

  @Transactional(readOnly = true)
  public ListingResponse detail(UUID id, UserPrincipal viewer) {
    MarketplaceListing listing = byId(id);
    /* sold and archived cards stay visible to the seller and admins only */
    if (listing.getStatus() != ListingStatus.ACTIVE
        && !listing.getSeller().getId().equals(viewer.id())
        && viewer.role() != UserRole.ADMIN) {
      throw new NotFoundException("listing not found");
    }
    return ListingResponse.from(listing);
  }

  @Transactional
  public ListingResponse update(UUID id, UserPrincipal principal, UpdateListingRequest request) {
    MarketplaceListing listing = byId(id);
    requireOwnerOrAdmin(listing, principal, "only the seller may edit this listing");
    if (listing.getStatus() != ListingStatus.ACTIVE) {
      throw new BadRequestException("INVALID_STATE_TRANSITION", "only active listings can be edited");
    }

    if (request.title() != null && !request.title().isBlank()) {
      listing.setTitle(request.title().trim());
    }
    if (request.description() != null && !request.description().isBlank()) {
      listing.setDescription(request.description().trim());
    }
    if (request.price() != null) {
      listing.setPrice(request.price());
    }
    if (request.category() != null) {
      listing.setCategory(request.category());
    }
    if (request.condition() != null) {
      listing.setCondition(request.condition());
    }
    if (request.location() != null) {
      listing.setLocation(blankToNull(request.location()));
    }
    if (request.imageUrls() != null) {
      listing.setImages(cleanUrls(request.imageUrls()));
    }
    return ListingResponse.from(listings.save(listing));
  }

  @Transactional
  public ListingResponse archive(UUID id, UserPrincipal principal) {
    MarketplaceListing listing = byId(id);
    requireOwnerOrAdmin(listing, principal, "only the seller may archive this listing");
    if (listing.getStatus() != ListingStatus.ACTIVE) {
      throw new BadRequestException("INVALID_STATE_TRANSITION", "only active listings can be archived");
    }
    listing.setStatus(ListingStatus.ARCHIVED);
    return ListingResponse.from(listings.save(listing));
  }

  private MarketplaceListing byId(UUID id) {
    return listings.findById(id).orElseThrow(() -> new NotFoundException("listing not found"));
  }

  private User sellerOf(UserPrincipal principal) {
    return users.findById(principal.id()).orElseThrow(() -> new NotFoundException("user not found"));
  }

  private void requireOwnerOrAdmin(MarketplaceListing listing, UserPrincipal principal, String message) {
    boolean owner = listing.getSeller().getId().equals(principal.id());
    if (!owner && principal.role() != UserRole.ADMIN) {
      throw new ForbiddenException("FORBIDDEN", message);
    }
  }

  /* at most five, blanks dropped, order kept */
  private static List<String> cleanUrls(List<String> urls) {
    if (urls == null) {
      return List.of();
    }
    List<String> cleaned = urls.stream().filter(u -> u != null && !u.isBlank()).map(String::trim).toList();
    if (cleaned.size() > 5) {
      throw new BadRequestException("VALIDATION_ERROR", "at most 5 images allowed");
    }
    return cleaned;
  }

  private static String blankToNull(String value) {
    if (value == null) {
      return null;
    }
    String trimmed = value.trim();
    return trimmed.isEmpty() ? null : trimmed;
  }
}
