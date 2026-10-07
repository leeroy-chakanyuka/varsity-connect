package com.varsityconnect.lostfound;

import com.varsityconnect.common.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/* one candidate pair, both owners must agree before anything confirms */
@Entity
@Table(
    name = "lost_found_matches",
    uniqueConstraints =
        @UniqueConstraint(name = "uq_match_pair", columnNames = {"lost_report_id", "found_report_id"}))
public class LostFoundMatch extends AuditableEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "lost_report_id", nullable = false)
  private LostFoundReport lostReport;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "found_report_id", nullable = false)
  private LostFoundReport foundReport;

  @Column(name = "score", nullable = false)
  private double score;

  @Enumerated(EnumType.STRING)
  @Column(name = "lost_decision", nullable = false, length = 10)
  private MatchDecision lostDecision = MatchDecision.PENDING;

  @Enumerated(EnumType.STRING)
  @Column(name = "found_decision", nullable = false, length = 10)
  private MatchDecision foundDecision = MatchDecision.PENDING;

  protected LostFoundMatch() {
    /* jpa only */
  }

  public LostFoundMatch(LostFoundReport lostReport, LostFoundReport foundReport, double score) {
    this.lostReport = lostReport;
    this.foundReport = foundReport;
    this.score = score;
  }

  public boolean confirmed() {
    return lostDecision == MatchDecision.ACCEPTED && foundDecision == MatchDecision.ACCEPTED;
  }

  public boolean dead() {
    return lostDecision == MatchDecision.REJECTED || foundDecision == MatchDecision.REJECTED;
  }

  public LostFoundReport getLostReport() {
    return lostReport;
  }

  public LostFoundReport getFoundReport() {
    return foundReport;
  }

  public double getScore() {
    return score;
  }

  public MatchDecision getLostDecision() {
    return lostDecision;
  }

  public void setLostDecision(MatchDecision lostDecision) {
    this.lostDecision = lostDecision;
  }

  public MatchDecision getFoundDecision() {
    return foundDecision;
  }

  public void setFoundDecision(MatchDecision foundDecision) {
    this.foundDecision = foundDecision;
  }
}
