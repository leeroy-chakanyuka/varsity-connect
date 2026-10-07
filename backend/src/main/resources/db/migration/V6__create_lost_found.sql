-- V6: lost and found reports
CREATE TABLE lost_found_reports (
  id CHAR(36) NOT NULL PRIMARY KEY,
  owner_id CHAR(36) NOT NULL,
  type VARCHAR(10) NOT NULL,
  item_name VARCHAR(150) NOT NULL,
  category VARCHAR(30) NOT NULL,
  description VARCHAR(2000) NOT NULL,
  location VARCHAR(200) NOT NULL,
  incident_date DATE NOT NULL,
  image_url VARCHAR(500) NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_reports_owner FOREIGN KEY (owner_id) REFERENCES users (id)
);

CREATE INDEX idx_reports_type ON lost_found_reports (type);
CREATE INDEX idx_reports_category ON lost_found_reports (category);
CREATE INDEX idx_reports_status ON lost_found_reports (status);
CREATE INDEX idx_reports_incident ON lost_found_reports (incident_date);
CREATE INDEX idx_reports_owner ON lost_found_reports (owner_id);
