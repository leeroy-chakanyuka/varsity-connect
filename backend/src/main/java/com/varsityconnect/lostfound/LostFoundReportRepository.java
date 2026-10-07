package com.varsityconnect.lostfound;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

/* persistence only, browse shapes live in ReportSpecifications */
public interface LostFoundReportRepository
    extends JpaRepository<LostFoundReport, UUID>, JpaSpecificationExecutor<LostFoundReport> {}
