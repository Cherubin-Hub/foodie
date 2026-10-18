CREATE OR REPLACE FUNCTION sp_create_guest_session(p_temp_name VARCHAR(100))
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_token VARCHAR(64);
BEGIN
  v_token := LOWER(ENCODE(GEN_RANDOM_BYTES(32), 'hex'));

  INSERT INTO tbl_guest_sessions (session_token, guest_temporary_name, created_at, expires_at)
  VALUES (v_token, TRIM(p_temp_name), NOW(), NOW() + INTERVAL '24 hours');

  RETURN json_build_object(
    'success', TRUE,
    'session_token', v_token,
    'guest_temporary_name', TRIM(p_temp_name),
    'role', 'GUEST'
  );
END;
$$;