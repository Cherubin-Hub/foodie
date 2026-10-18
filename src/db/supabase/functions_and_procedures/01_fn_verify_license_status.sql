CREATE OR REPLACE FUNCTION fn_verify_license_status()
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_lic RECORD;
  v_status TEXT;
  v_usable BOOLEAN := FALSE;
BEGIN
  SELECT * INTO v_lic FROM tbl_system_license LIMIT 1;
  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'status', 'NO_RECORD', 'is_usable', FALSE, 'message', 'License not initialized.');
  END IF;

  IF v_lic.is_active = FALSE THEN
    v_status := 'INACTIVE';
  ELSIF NOW() < v_lic.last_verified_at THEN
    v_status := 'CLOCK_TAMPERED';
  ELSIF NOW() > v_lic.expires_at THEN
    v_status := 'EXPIRED';
  ELSE
    v_status := 'VALID';
    v_usable := TRUE;
    UPDATE tbl_system_license SET last_verified_at = NOW() WHERE id = v_lic.id;
  END IF;

  RETURN json_build_object(
    'success', TRUE,
    'status', v_status,
    'is_usable', v_usable,
    'app_code', v_lic.app_code,
    'installation_request_code', v_lic.installation_request_code,
    'expires_at', v_lic.expires_at
  );
END;
$$;