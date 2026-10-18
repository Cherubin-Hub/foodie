USE foodie_db;

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

CREATE OR REPLACE VIEW vw_role_module_matrix AS
SELECT
  rm.id,
  rm.role_code,
  r.role_name,
  rm.module_code,
  m.module_name,
  rm.can_view,
  rm.can_create,
  rm.can_edit,
  rm.can_delete
FROM tbl_role_modules rm
JOIN tbl_roles r ON rm.role_code = r.role_code
JOIN tbl_modules m ON rm.module_code = m.module_code
ORDER BY rm.role_code, rm.module_code;