package com.varsityconnect.support;

import com.varsityconnect.common.BadRequestException;
import com.varsityconnect.common.ForbiddenException;
import com.varsityconnect.common.NotFoundException;
import com.varsityconnect.common.PageResponse;
import com.varsityconnect.notification.SupportOfferAcceptedEvent;
import com.varsityconnect.notification.SupportOfferCreatedEvent;
import com.varsityconnect.security.UserPrincipal;
import com.varsityconnect.user.User;
import com.varsityconnect.user.UserRepository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/* two-user help workflows, every move checks who may move it */
@Service
public class SupportService {

  private final SupportRequestRepository requests;
  private final SupportOfferRepository offers;
  private final UserRepository users;
  private final ApplicationEventPublisher events;

  public SupportService(
      SupportRequestRepository requests,
      SupportOfferRepository offers,
      UserRepository users,
      ApplicationEventPublisher events) {
    this.requests = requests;
    this.offers = offers;
    this.users = users;
    this.events = events;
  }

  @Transactional
  public SupportRequestResponse create(UserPrincipal principal, CreateSupportRequest body) {
    User requester =
        users.findById(principal.id()).orElseThrow(() -> new NotFoundException("user not found"));
    SupportRequest request =
        new SupportRequest(
            requester,
            body.type(),
            body.title().trim(),
            body.description().trim(),
            body.location().trim(),
            body.urgency());
    return SupportRequestResponse.from(requests.save(request));
  }

  @Transactional(readOnly = true)
  public PageResponse<SupportRequestResponse> browse(SupportStatus status, Pageable pageable) {
    Page<SupportRequest> page =
        status == null
            ? requests.findAll(pageable)
            : requests.findByStatusOrderByCreatedAtDesc(status, pageable);
    return new PageResponse<>(
        page.getContent().stream().map(SupportRequestResponse::from).toList(),
        page.getNumber(),
        page.getSize(),
        page.getTotalElements(),
        page.getTotalPages(),
        page.isFirst(),
        page.isLast());
  }

  @Transactional(readOnly = true)
  public SupportRequestResponse detail(UUID id) {
    return SupportRequestResponse.from(byId(id));
  }

  @Transactional
  public SupportRequestResponse update(UUID id, UserPrincipal principal, UpdateSupportRequest body) {
    SupportRequest request = byId(id);
    requireRequester(request, principal);
    if (request.getStatus() != SupportStatus.OPEN
        && request.getStatus() != SupportStatus.OFFER_RECEIVED) {
      throw new BadRequestException("INVALID_STATE_TRANSITION", "only open requests can be edited");
    }
    if (body.type() != null) {
      request.setType(body.type());
    }
    if (body.title() != null && !body.title().isBlank()) {
      request.setTitle(body.title().trim());
    }
    if (body.description() != null && !body.description().isBlank()) {
      request.setDescription(body.description().trim());
    }
    if (body.location() != null && !body.location().isBlank()) {
      request.setLocation(body.location().trim());
    }
    if (body.urgency() != null) {
      request.setUrgency(body.urgency());
    }
    return SupportRequestResponse.from(requests.save(request));
  }

  @Transactional
  public SupportRequestResponse cancel(UUID id, UserPrincipal principal) {
    SupportRequest request = byId(id);
    requireRequester(request, principal);
    if (request.getStatus() != SupportStatus.OPEN
        && request.getStatus() != SupportStatus.OFFER_RECEIVED) {
      throw new BadRequestException("INVALID_STATE_TRANSITION", "only open requests can be cancelled");
    }
    request.setStatus(SupportStatus.CANCELLED);
    return SupportRequestResponse.from(requests.save(request));
  }

  @Transactional
  public SupportOfferResponse offer(UUID id, UserPrincipal principal, CreateSupportOffer body) {
    SupportRequest request = byId(id);
    if (request.getRequester().getId().equals(principal.id())) {
      throw new ForbiddenException("FORBIDDEN", "you cannot offer help on your own request");
    }
    if (request.getStatus() == SupportStatus.RESOLVED
        || request.getStatus() == SupportStatus.CANCELLED) {
      throw new BadRequestException("INVALID_STATE_TRANSITION", "request is no longer open for help");
    }
    if (offers.existsByRequestIdAndResponderIdAndStatusIn(
        id, principal.id(), List.of(OfferStatus.PENDING, OfferStatus.ACCEPTED))) {
      throw new BadRequestException("INVALID_STATE_TRANSITION", "you already offered on this request");
    }
    User responder =
        users.findById(principal.id()).orElseThrow(() -> new NotFoundException("user not found"));
    SupportOffer offer = offers.save(new SupportOffer(request, responder, body.message().trim()));
    if (request.getStatus() == SupportStatus.OPEN) {
      request.setStatus(SupportStatus.OFFER_RECEIVED);
      requests.save(request);
    }
    events.publishEvent(new SupportOfferCreatedEvent(offer.getId()));
    return SupportOfferResponse.from(offer);
  }

  @Transactional(readOnly = true)
  public List<SupportOfferResponse> offersOf(UUID id) {
    byId(id);
    return offers.findByRequestIdOrderByCreatedAtAsc(id).stream().map(SupportOfferResponse::from).toList();
  }

  @Transactional
  public SupportOfferResponse accept(UUID offerId, UserPrincipal principal) {
    SupportOffer offer = offerById(offerId);
    requireRequester(offer.getRequest(), principal);
    requirePending(offer);
    offer.setStatus(OfferStatus.ACCEPTED);
    offers.save(offer);
    SupportRequest request = offer.getRequest();
    request.setStatus(SupportStatus.IN_PROGRESS);
    requests.save(request);
    events.publishEvent(new SupportOfferAcceptedEvent(offer.getId()));
    return SupportOfferResponse.from(offer);
  }

  @Transactional
  public SupportOfferResponse decline(UUID offerId, UserPrincipal principal) {
    SupportOffer offer = offerById(offerId);
    requireRequester(offer.getRequest(), principal);
    requirePending(offer);
    offer.setStatus(OfferStatus.DECLINED);
    return SupportOfferResponse.from(offers.save(offer));
  }

  @Transactional
  public SupportOfferResponse withdraw(UUID offerId, UserPrincipal principal) {
    SupportOffer offer = offerById(offerId);
    if (!offer.getResponder().getId().equals(principal.id())) {
      throw new ForbiddenException("FORBIDDEN", "only the responder may withdraw this offer");
    }
    requirePending(offer);
    offer.setStatus(OfferStatus.WITHDRAWN);
    return SupportOfferResponse.from(offers.save(offer));
  }

  @Transactional
  public SupportRequestResponse resolve(UUID id, UserPrincipal principal) {
    SupportRequest request = byId(id);
    requireRequester(request, principal);
    if (request.getStatus() == SupportStatus.RESOLVED) {
      throw new BadRequestException("INVALID_STATE_TRANSITION", "request is already resolved");
    }
    if (request.getStatus() == SupportStatus.CANCELLED) {
      throw new BadRequestException("INVALID_STATE_TRANSITION", "cancelled requests cannot resolve");
    }
    request.setStatus(SupportStatus.RESOLVED);
    request.setResolvedAt(Instant.now());
    requests.save(request);
    /* the accepted hand gets its bow */
    offers.findByRequestIdOrderByCreatedAtAsc(id).stream()
        .filter(offer -> offer.getStatus() == OfferStatus.ACCEPTED)
        .forEach(
            offer -> {
              offer.setStatus(OfferStatus.COMPLETED);
              offers.save(offer);
            });
    return SupportRequestResponse.from(request);
  }

  private SupportRequest byId(UUID id) {
    return requests.findById(id).orElseThrow(() -> new NotFoundException("support request not found"));
  }

  private SupportOffer offerById(UUID id) {
    return offers.findById(id).orElseThrow(() -> new NotFoundException("support offer not found"));
  }

  /* requester only, not even admins — the flow belongs to the two users */
  private void requireRequester(SupportRequest request, UserPrincipal principal) {
    if (!request.getRequester().getId().equals(principal.id())) {
      throw new ForbiddenException("FORBIDDEN", "only the requester may do this");
    }
  }

  private static void requirePending(SupportOffer offer) {
    if (offer.getStatus() != OfferStatus.PENDING) {
      throw new BadRequestException("INVALID_STATE_TRANSITION", "offer is no longer pending");
    }
  }
}
