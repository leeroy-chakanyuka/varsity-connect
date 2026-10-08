-- V11: verified marketplace reviews, one voice per order per seller
CREATE TABLE reviews (
  id CHAR(36) NOT NULL PRIMARY KEY,
  reviewer_id CHAR(36) NOT NULL,
  reviewee_id CHAR(36) NOT NULL,
  order_id CHAR(36) NOT NULL,
  rating INT NOT NULL,
  comment VARCHAR(1000) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_reviews_reviewer FOREIGN KEY (reviewer_id) REFERENCES users (id),
  CONSTRAINT fk_reviews_reviewee FOREIGN KEY (reviewee_id) REFERENCES users (id),
  CONSTRAINT fk_reviews_order FOREIGN KEY (order_id) REFERENCES orders (id),
  CONSTRAINT uq_review_order_reviewer_reviewee UNIQUE (order_id, reviewer_id, reviewee_id)
);

CREATE INDEX idx_reviews_reviewee ON reviews (reviewee_id, created_at);
CREATE INDEX idx_reviews_reviewer ON reviews (reviewer_id);
