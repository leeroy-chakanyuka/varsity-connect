package com.varsityconnect.notification;

import com.varsityconnect.community.CommunityComment;
import com.varsityconnect.community.CommunityCommentRepository;
import com.varsityconnect.lostfound.LostFoundMatch;
import com.varsityconnect.lostfound.LostFoundMatchRepository;
import com.varsityconnect.order.Order;
import com.varsityconnect.order.OrderRepository;
import com.varsityconnect.review.Review;
import com.varsityconnect.review.ReviewRepository;
import com.varsityconnect.support.SupportOffer;
import com.varsityconnect.support.SupportOfferRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/* after-commit persistence only — failed transactions ping nobody,
 * and nothing here knows websockets exist (stage 18 reads these rows). */
@Component
public class NotificationListeners {

  private static final Logger log = LoggerFactory.getLogger(NotificationListeners.class);

  private final NotificationService notifications;
  private final OrderRepository orders;
  private final LostFoundMatchRepository matches;
  private final SupportOfferRepository offers;
  private final CommunityCommentRepository comments;
  private final ReviewRepository reviews;

  public NotificationListeners(
      NotificationService notifications,
      OrderRepository orders,
      LostFoundMatchRepository matches,
      SupportOfferRepository offers,
      CommunityCommentRepository comments,
      ReviewRepository reviews) {
    this.notifications = notifications;
    this.orders = orders;
    this.matches = matches;
    this.offers = offers;
    this.comments = comments;
    this.reviews = reviews;
  }

  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void onOrderPaid(OrderPaidEvent event) {
    orders.findById(event.orderId()).ifPresent(order -> notifyBuyer(order));
  }

  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void onOrderCreated(OrderCreatedEvent event) {
    orders.findById(event.orderId()).ifPresent(this::notifySellers);
  }

  /* every seller on the receipt hears it, the buyer already knows */
  private void notifySellers(Order order) {
    order.getItems().stream()
        .map(item -> item.getSeller().getId())
        .distinct()
        .forEach(
            sellerId ->
                notifications.notify(
                    sellerId,
                    NotificationType.ORDER_CREATED,
                    "new order for your listing",
                    order.getBuyer().getFullName() + " checked out, get it ready",
                    "order",
                    order.getId()));
  }  private void notifyBuyer(Order order) {
    notifications.notify(
        order.getBuyer().getId(),
        NotificationType.ORDER_PAID,
        "payment successful",
        "your order is paid, arrange collection with the seller",
        "order",
        order.getId());
  }

  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void onMatchCreated(LostFoundMatchCreatedEvent event) {
    matches.findById(event.matchId()).ifPresent(this::notifyPair);
  }

  private void notifyPair(LostFoundMatch match) {
    notifications.notify(
        match.getLostReport().getOwner().getId(),
        NotificationType.LOST_FOUND_MATCH,
        "possible match found",
        "someone reported something like your " + match.getLostReport().getItemName().toLowerCase(),
        "report",
        match.getLostReport().getId());
    notifications.notify(
        match.getFoundReport().getOwner().getId(),
        NotificationType.LOST_FOUND_MATCH,
        "possible match found",
        "someone is looking for something like your " + match.getFoundReport().getItemName().toLowerCase(),
        "report",
        match.getFoundReport().getId());
  }

  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void onOfferCreated(SupportOfferCreatedEvent event) {
    offers.findById(event.offerId()).ifPresent(offer -> {
      notifications.notify(
          offer.getRequest().getRequester().getId(),
          NotificationType.SUPPORT_OFFER_RECEIVED,
          "someone offered help",
          offer.getResponder().getFullName() + " offered: " + offer.getMessage(),
          "support-request",
          offer.getRequest().getId());
    });
  }

  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void onOfferAccepted(SupportOfferAcceptedEvent event) {
    offers.findById(event.offerId()).ifPresent(offer -> {
      notifications.notify(
          offer.getResponder().getId(),
          NotificationType.SUPPORT_OFFER_ACCEPTED,
          "your offer was accepted",
          "the requester accepted your help",
          "support-request",
          offer.getRequest().getId());
    });
  }

  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void onCommentCreated(CommunityCommentCreatedEvent event) {
    comments.findById(event.commentId()).ifPresent(this::notifyAuthor);
  }

  private void notifyAuthor(CommunityComment comment) {
    if (comment.getAuthor().getId().equals(comment.getPost().getAuthor().getId())) {
      /* talking to yourself pings nobody */
      return;
    }
    notifications.notify(
        comment.getPost().getAuthor().getId(),
        NotificationType.COMMUNITY_COMMENT_RECEIVED,
        "new reply on your thread",
        comment.getAuthor().getFullName() + " replied: " + comment.getBody(),
        "post",
        comment.getPost().getId());
    log.debug("notified post author {}", comment.getPost().getId());
  }

  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void onReviewCreated(ReviewCreatedEvent event) {
    reviews.findById(event.reviewId()).ifPresent(this::notifyReviewee);
  }

  private void notifyReviewee(Review review) {
    notifications.notify(
        review.getReviewee().getId(),
        NotificationType.REVIEW_RECEIVED,
        "someone reviewed you",
        review.getReviewer().getFullName() + " gave you " + review.getRating() + " stars",
        "profile",
        review.getReviewee().getId());
  }
}
