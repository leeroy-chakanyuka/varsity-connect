-- V4: orders, frozen snapshots of checked-out baskets
CREATE TABLE orders (
  id CHAR(36) NOT NULL PRIMARY KEY,
  buyer_id CHAR(36) NOT NULL,
  delivery_method VARCHAR(30) NOT NULL,
  payment_method VARCHAR(30) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  total DECIMAL(12, 2) NOT NULL,
  status VARCHAR(30) NOT NULL,
  paid_at TIMESTAMP(6) NULL,
  completed_at TIMESTAMP(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_orders_buyer FOREIGN KEY (buyer_id) REFERENCES users (id)
);

CREATE INDEX idx_orders_buyer ON orders (buyer_id);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_created ON orders (created_at);

CREATE TABLE order_items (
  id CHAR(36) NOT NULL PRIMARY KEY,
  order_id CHAR(36) NOT NULL,
  listing_id CHAR(36) NULL,
  listing_snapshot_id CHAR(36) NULL,
  title_snapshot VARCHAR(150) NOT NULL,
  unit_price_snapshot DECIMAL(12, 2) NOT NULL,
  seller_id CHAR(36) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_listing FOREIGN KEY (listing_id) REFERENCES marketplace_listings (id),
  CONSTRAINT fk_order_items_seller FOREIGN KEY (seller_id) REFERENCES users (id)
);

CREATE INDEX idx_order_items_order ON order_items (order_id);
