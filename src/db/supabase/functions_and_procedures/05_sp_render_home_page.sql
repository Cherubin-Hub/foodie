CREATE OR REPLACE FUNCTION sp_render_home_page(p_role VARCHAR(20) DEFAULT 'GUEST', p_guest_token VARCHAR(64) DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_branding JSON;
  v_modules JSON;
  v_categories JSON;
  v_deals JSON;
  v_items JSON;
  v_guest_name TEXT := NULL;
  v_lic_check JSON;
BEGIN
  v_lic_check := fn_verify_license_status();
  IF (v_lic_check->>'is_usable')::BOOLEAN = FALSE AND p_role <> 'ADMIN' THEN
    RETURN json_build_object('success', FALSE, 'license_locked', TRUE, 'license_status', v_lic_check->>'status');
  END IF;

  IF p_guest_token IS NOT NULL THEN
    SELECT guest_temporary_name INTO v_guest_name FROM tbl_guest_sessions WHERE session_token = p_guest_token;
  END IF;

  SELECT row_to_json(s) INTO v_branding FROM tbl_store_settings s LIMIT 1;

  SELECT json_agg(json_build_object(
    'module_code', module_code,
    'can_view', can_view,
    'can_create', can_create,
    'can_edit', can_edit,
    'can_delete', can_delete
  )) INTO v_modules
  FROM tbl_role_modules WHERE role_code = p_role;

  SELECT json_agg(c ORDER BY sort_order) INTO v_categories FROM tbl_categories c WHERE is_active = TRUE;
  SELECT json_agg(d) INTO v_deals FROM tbl_deals d WHERE is_active = TRUE;
  SELECT json_agg(f) INTO v_items FROM tbl_food_items f WHERE is_available = TRUE;

  RETURN json_build_object(
    'success', TRUE,
    'license_locked', FALSE,
    'branding', v_branding,
    'guest_temporary_name', v_guest_name,
    'permitted_modules', COALESCE(v_modules, '[]'::json),
    'categories', COALESCE(v_categories, '[]'::json),
    'deals', COALESCE(v_deals, '[]'::json),
    'food_items', COALESCE(v_items, '[]'::json)
  );
END;
$$;