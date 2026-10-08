package com.varsityconnect.marketplace;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/* persistence only, search shapes live in ListingSpecifications */
public interface MarketplaceListingRepository
    extends JpaRepository<MarketplaceListing, UUID>, JpaSpecificationExecutor<MarketplaceListing> {

  /* write lock for checkout races, second buyer waits then sees RESERVED */
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select l from MarketplaceListing l where l.id = :id")
  Optional<MarketplaceListing> findByIdForUpdate(@Param("id") UUID id);

  /* shelf cards walk sellers and photos — one round trip */
  @EntityGraph(attributePaths = {"seller", "images"})
  List<MarketplaceListing> findTop4ByStatusOrderByCreatedAtDesc(ListingStatus status);

  long countByStatus(ListingStatus status);
}
