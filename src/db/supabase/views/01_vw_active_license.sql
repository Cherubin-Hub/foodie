CREATE OR REPLACE VIEW vw_active_license AS
SELECT
  id,
  app_code,
  request_nonce,
  installation_request_code,
  license_key,
  activated_at,
  expires_at,
  last_verified_at,
  is_active,
  CASE
    WHEN is_active = FALSE THEN 'INACTIVE'
    WHEN NOW() < last_verified_at THEN 'CLOCK_TAMPERED'
    WHEN NOW() > expires_at THEN 'EXPIRED'
    ELSE 'VALID'
  END AS license_status,
  CASE
    WHEN is_active = TRUE AND NOW() >= last_verified_at AND NOW() <= expires_at THEN TRUE
    ELSE FALSE
  END AS is_usable
FROM tbl_system_license
LIMIT 1;