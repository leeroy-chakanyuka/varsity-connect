package com.varsityconnect.support;

import com.varsityconnect.common.AuditableEntity;
import com.varsityconnect.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/* one hand raised, responder always comes from the jwt */
@Entity
@Table(name = "support_offers")
public class SupportOffer extends AuditableEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "request_id", nullable = false)
  private SupportRequest request;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "responder_id", nullable = false)
  private User responder;

  @Column(name = "message", nullable = false, length = 1000)
  private String message;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false, length = 10)
  private OfferStatus status = OfferStatus.PENDING;

  protected SupportOffer() {
    /* jpa only */
  }

  public SupportOffer(SupportRequest request, User responder, String message) {
    this.request = request;
    this.responder = responder;
    this.message = message;
    this.status = OfferStatus.PENDING;
  }

  public SupportRequest getRequest() {
    return request;
  }

  public User getResponder() {
    return responder;
  }

  public String getMessage() {
    return message;
  }

  public OfferStatus getStatus() {
    return status;
  }

  public void setStatus(OfferStatus status) {
    this.status = status;
  }
}
