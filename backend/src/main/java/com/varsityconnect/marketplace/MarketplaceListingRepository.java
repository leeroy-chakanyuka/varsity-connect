package com.varsityconnect.marketplace;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

/* persistence only, search shapes live in ListingSpecifications */
public interface MarketplaceListingRepository
    extends JpaRepository<MarketplaceListing, UUID>, JpaSpecificationExecutor<MarketplaceListing> {}
