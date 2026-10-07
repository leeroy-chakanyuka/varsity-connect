-- V7: deterministic lost/found match pairs
CREATE TABLE lost_found_matches (
  id CHAR(36) NOT NULL PRIMARY KEY,
  lost_report_id CHAR(36) NOT NULL,
  found_report_id CHAR(36) NOT NULL,
  score DOUBLE NOT NULL,
  lost_decision VARCHAR(10) NOT NULL,
  found_decision VARCHAR(10) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT uq_match_pair UNIQUE (lost_report_id, found_report_id),
  CONSTRAINT fk_match_lost FOREIGN KEY (lost_report_id) REFERENCES lost_found_reports (id),
  CONSTRAINT fk_match_found FOREIGN KEY (found_report_id) REFERENCES lost_found_reports (id)
);

CREATE INDEX idx_match_lost ON lost_found_matches (lost_report_id);
CREATE INDEX idx_match_found ON lost_found_matches (found_report_id);
