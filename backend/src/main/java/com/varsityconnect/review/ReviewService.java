package com.varsityconnect.review;

import com.varsityconnect.common.BadRequestException;
import com.varsityconnect.common.ConflictException;
import com.varsityconnect.common.ForbiddenException;
import com.varsityconnect.common.NotFoundException;
import com.varsityconnect.notification.ReviewCreatedEvent;
import com.varsityconnect.order.Order;
import com.varsityconnect.order.OrderRepository;
import com.varsityconnect.order.OrderStatus;
import com.varsityconnect.security.UserPrincipal;
import com.varsityconnect.user.User;
import com.varsityconnect.user.UserRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/* verified voices only — completed orders, real sellers, no self-praise */
@Service
public class ReviewService {

  private final ReviewRepository reviews;
  private final OrderRepository orders;
  private final UserRepository users;
  private final ApplicationEventPublisher events;

  public ReviewService(
      ReviewRepository reviews,
      OrderRepository orders,
      UserRepository users,
      ApplicationEventPublisher events) {
    this.reviews = reviews;
    this.orders = orders;
    this.users = users;
    this.events = events;
  }

  @Transactional
  public ReviewResponse review(UserPrincipal principal, UUID revieweeId, CreateReviewRequest request) {
    Order order =
        orders.findById(request.orderId()).orElseThrow(() -> new NotFoundException("order not found"));
    /* only the buyer holds the pen */
    if (!order.getBuyer().getId().equals(principal.id())) {
      throw new ForbiddenException("FORBIDDEN", "only the buyer may review this order");
    }
    /* trust comes from finished business, not promises */
    if (order.getStatus() != OrderStatus.COMPLETED) {
      throw new BadRequestException("ORDER_NOT_COMPLETED", "only completed orders can be reviewed");
    }
    User reviewee =
        users.findById(revieweeId).orElseThrow(() -> new NotFoundException("user not found"));
    if (reviewee.getId().equals(principal.id())) {
      throw new BadRequestException("SELF_REVIEW", "you cannot review yourself");
    }
    boolean soldIt =
        order.getItems().stream().anyMatch(item -> item.getSeller().getId().equals(revieweeId));
    if (!soldIt) {
      throw new ForbiddenException("FORBIDDEN", "you can only review this order's sellers");
    }
    if (reviews
        .findByOrderIdAndReviewerIdAndRevieweeId(order.getId(), principal.id(), revieweeId)
        .isPresent()) {
      throw new ConflictException("DUPLICATE_REVIEW", "you already reviewed this seller for this order");
    }
    User reviewer =
        users.findById(principal.id()).orElseThrow(() -> new NotFoundException("user not found"));
    Review saved =
        reviews.save(
            new Review(reviewer, reviewee, order, request.rating(), request.comment().trim()));
    events.publishEvent(new ReviewCreatedEvent(saved.getId()));
    return ReviewResponse.from(saved);
  }

  @Transactional(readOnly = true)
  public List<ReviewResponse> forUser(UUID revieweeId) {
    return reviews.findByRevieweeIdOrderByCreatedAtDesc(revieweeId).stream()
        .map(ReviewResponse::from)
        .toList();
  }

  /* zeros until the first review, profiles read through here */
  @Transactional(readOnly = true)
  public RatingSummary summary(UUID revieweeId) {
    Double average = reviews.averageFor(revieweeId);
    return new RatingSummary(average == null ? 0.0 : average, reviews.countFor(revieweeId));
  }
}
