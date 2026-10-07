-- V2: marketplace listings + ordered images
CREATE TABLE marketplace_listings (
  id CHAR(36) NOT NULL PRIMARY KEY,
  seller_id CHAR(36) NOT NULL,
  title VARCHAR(150) NOT NULL,
  description VARCHAR(4000) NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  category VARCHAR(30) NOT NULL,
  `condition` VARCHAR(20) NOT NULL,
  location VARCHAR(200) NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_listings_seller FOREIGN KEY (seller_id) REFERENCES users (id)
);

CREATE INDEX idx_listings_seller ON marketplace_listings (seller_id);
CREATE INDEX idx_listings_category ON marketplace_listings (category);
CREATE INDEX idx_listings_status ON marketplace_listings (status);
CREATE INDEX idx_listings_created ON marketplace_listings (created_at);
CREATE INDEX idx_listings_price ON marketplace_listings (price);

CREATE TABLE listing_images (
  id CHAR(36) NOT NULL PRIMARY KEY,
  listing_id CHAR(36) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  display_order INT NOT NULL,
  CONSTRAINT fk_images_listing FOREIGN KEY (listing_id)
    REFERENCES marketplace_listings (id) ON DELETE CASCADE
);

CREATE INDEX idx_images_listing ON listing_images (listing_id);
