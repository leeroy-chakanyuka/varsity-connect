package com.varsityconnect.review;

import com.varsityconnect.common.AuditableEntity;
import com.varsityconnect.order.Order;
import com.varsityconnect.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/* one buyer voice per order per seller, trust you can trace */
@Entity
@Table(name = "reviews")
public class Review extends AuditableEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "reviewer_id", nullable = false)
  private User reviewer;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "reviewee_id", nullable = false)
  private User reviewee;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "order_id", nullable = false)
  private Order order;

  @Column(name = "rating", nullable = false)
  private int rating;

  @Column(name = "comment", nullable = false, length = 1000)
  private String comment;

  protected Review() {
    /* jpa only */
  }

  public Review(User reviewer, User reviewee, Order order, int rating, String comment) {
    this.reviewer = reviewer;
    this.reviewee = reviewee;
    this.order = order;
    this.rating = rating;
    this.comment = comment;
  }

  public User getReviewer() {
    return reviewer;
  }

  public User getReviewee() {
    return reviewee;
  }

  public Order getOrder() {
    return order;
  }

  public int getRating() {
    return rating;
  }

  public String getComment() {
    return comment;
  }
}
