package com.varsityconnect.support;

import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

/* persistence only, transition rules live in SupportService */
public interface SupportRequestRepository extends JpaRepository<SupportRequest, UUID> {

  Page<SupportRequest> findByStatusOrderByCreatedAtDesc(SupportStatus status, Pageable pageable);
}
