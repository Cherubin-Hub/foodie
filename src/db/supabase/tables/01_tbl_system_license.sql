CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS tbl_system_license (
  id SERIAL PRIMARY KEY,
  app_code VARCHAR(50) NOT NULL UNIQUE,
  app_secret VARCHAR(100) NOT NULL,
  request_nonce VARCHAR(10) NOT NULL,
  installation_request_code VARCHAR(100) NOT NULL,
  license_key VARCHAR(150),
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);