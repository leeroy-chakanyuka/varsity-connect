-- V3: carts, one active basket per user
CREATE TABLE carts (
  id CHAR(36) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT uq_carts_user UNIQUE (user_id),
  CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE cart_items (
  id CHAR(36) NOT NULL PRIMARY KEY,
  cart_id CHAR(36) NOT NULL,
  listing_id CHAR(36) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT uq_cart_item UNIQUE (cart_id, listing_id),
  CONSTRAINT fk_items_cart FOREIGN KEY (cart_id) REFERENCES carts (id) ON DELETE CASCADE,
  CONSTRAINT fk_items_listing FOREIGN KEY (listing_id) REFERENCES marketplace_listings (id)
);

CREATE INDEX idx_items_cart ON cart_items (cart_id);
CREATE INDEX idx_items_listing ON cart_items (listing_id);
