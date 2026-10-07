-- V10: persisted notifications
CREATE TABLE notifications (
  id CHAR(36) NOT NULL PRIMARY KEY,
  recipient_id CHAR(36) NOT NULL,
  type VARCHAR(40) NOT NULL,
  title VARCHAR(150) NOT NULL,
  message VARCHAR(500) NOT NULL,
  entity_type VARCHAR(30) NULL,
  entity_id CHAR(36) NULL,
  read_at TIMESTAMP(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_id) REFERENCES users (id)
);

CREATE INDEX idx_notifications_recipient_created ON notifications (recipient_id, created_at);
CREATE INDEX idx_notifications_recipient_read ON notifications (recipient_id, read_at);
