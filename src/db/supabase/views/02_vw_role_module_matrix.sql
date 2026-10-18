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