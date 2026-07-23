-- Production database blueprint for Men's Health and Food Foundation.
-- The current static template uses localStorage through assets/js/store.js.
-- Use this schema when moving to Supabase, PostgreSQL, MySQL, or another backend.

CREATE TABLE users (
  id VARCHAR(64) PRIMARY KEY,
  role VARCHAR(24) NOT NULL CHECK (role IN ('admin', 'volunteer')),
  name VARCHAR(160) NOT NULL,
  email VARCHAR(190) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(40),
  skill VARCHAR(160),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE activities (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(220) NOT NULL,
  category VARCHAR(80) NOT NULL,
  activity_date DATE NOT NULL,
  location VARCHAR(180) NOT NULL,
  image_url TEXT,
  summary TEXT NOT NULL,
  body TEXT NOT NULL,
  created_by VARCHAR(64) REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE volunteer_applications (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id),
  name VARCHAR(160) NOT NULL,
  email VARCHAR(190) NOT NULL,
  role VARCHAR(120) NOT NULL,
  availability VARCHAR(180),
  message TEXT,
  status VARCHAR(40) NOT NULL DEFAULT 'Submitted',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE help_requests (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id),
  name VARCHAR(160) NOT NULL,
  phone VARCHAR(40) NOT NULL,
  community VARCHAR(180) NOT NULL,
  request_type VARCHAR(120) NOT NULL,
  message TEXT,
  status VARCHAR(40) NOT NULL DEFAULT 'New',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE password_resets (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id),
  email VARCHAR(190) NOT NULL,
  token_hash VARCHAR(255),
  expires_at TIMESTAMP,
  used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
