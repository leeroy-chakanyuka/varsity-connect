-- V1: users table, roles are backend-authoritative
CREATE TABLE users (
  id CHAR(36) NOT NULL PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  student_number VARCHAR(40) NULL,
  faculty VARCHAR(120) NULL,
  phone_number VARCHAR(40) NULL,
  bio VARCHAR(1000) NULL,
  profile_image_url VARCHAR(500) NULL,
  role VARCHAR(20) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT uq_users_email UNIQUE (email),
  CONSTRAINT uq_users_student_number UNIQUE (student_number)
);

CREATE INDEX idx_users_role ON users (role);
