package com.varsityconnect.support;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/* persistence only, transition rules live in SupportService */
public interface SupportOfferRepository extends JpaRepository<SupportOffer, UUID> {

  List<SupportOffer> findByRequestIdOrderByCreatedAtAsc(UUID requestId);

  boolean existsByRequestIdAndResponderIdAndStatusIn(
      UUID requestId, UUID responderId, List<OfferStatus> statuses);
}
