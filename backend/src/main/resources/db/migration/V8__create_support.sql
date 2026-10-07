-- V8: survival mode requests and offers
CREATE TABLE support_requests (
  id CHAR(36) NOT NULL PRIMARY KEY,
  requester_id CHAR(36) NOT NULL,
  type VARCHAR(20) NOT NULL,
  title VARCHAR(150) NOT NULL,
  description VARCHAR(2000) NOT NULL,
  location VARCHAR(200) NOT NULL,
  urgency VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL,
  resolved_at TIMESTAMP(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_support_requester FOREIGN KEY (requester_id) REFERENCES users (id)
);

CREATE INDEX idx_support_requester ON support_requests (requester_id);
CREATE INDEX idx_support_type ON support_requests (type);
CREATE INDEX idx_support_status ON support_requests (status);
CREATE INDEX idx_support_created ON support_requests (created_at);

CREATE TABLE support_offers (
  id CHAR(36) NOT NULL PRIMARY KEY,
  request_id CHAR(36) NOT NULL,
  responder_id CHAR(36) NOT NULL,
  message VARCHAR(1000) NOT NULL,
  status VARCHAR(10) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_offer_request FOREIGN KEY (request_id) REFERENCES support_requests (id) ON DELETE CASCADE,
  CONSTRAINT fk_offer_responder FOREIGN KEY (responder_id) REFERENCES users (id)
);

CREATE INDEX idx_offer_request ON support_offers (request_id);
CREATE INDEX idx_offer_responder ON support_offers (responder_id);
