CREATE OR REPLACE FUNCTION sp_activate_license(p_license_key VARCHAR(150))
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lic RECORD;
  v_parts TEXT[];
  v_app_code TEXT;
  v_duration TEXT;
  v_nonce TEXT;
  v_provided_sig TEXT;
  v_computed_sig TEXT;
  v_expected_raw TEXT;
  v_expires_at TIMESTAMPTZ;
  v_new_nonce VARCHAR(6);
BEGIN
  SELECT * INTO v_lic FROM tbl_system_license LIMIT 1;
  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'message', 'License record missing.');
  END IF;

  v_parts := string_to_array(TRIM(p_license_key), '-');
  IF array_length(v_parts, 1) <> 5 OR v_parts[1] <> 'LIC' THEN
    RETURN json_build_object('success', FALSE, 'message', 'Invalid license key format.');
  END IF;

  v_app_code := v_parts[2];
  v_duration := v_parts[3];
  v_nonce := v_parts[4];
  v_provided_sig := UPPER(v_parts[5]);

  IF v_app_code <> v_lic.app_code THEN
    RETURN json_build_object('success', FALSE, 'message', 'License key does not match this application code.');
  END IF;

  IF v_nonce <> v_lic.request_nonce THEN
    RETURN json_build_object('success', FALSE, 'message', 'Expired or invalid Request Nonce. Please re-copy your Request Code.');
  END IF;

  v_expected_raw := v_app_code || ':' || v_duration || ':' || v_nonce;
  v_computed_sig := UPPER(SUBSTRING(ENCODE(HMAC(v_expected_raw::bytea, v_lic.app_secret::bytea, 'sha256'), 'hex') FROM 1 FOR 12));

  IF v_provided_sig <> v_computed_sig THEN
    RETURN json_build_object('success', FALSE, 'message', 'Cryptographic signature mismatch. Invalid key.');
  END IF;

  IF v_duration = '7D' THEN
    v_expires_at := NOW() + INTERVAL '7 days';
  ELSIF v_duration = '14D' THEN
    v_expires_at := NOW() + INTERVAL '14 days';
  ELSIF v_duration = '30D' THEN
    v_expires_at := NOW() + INTERVAL '30 days';
  ELSIF v_duration = '90D' THEN
    v_expires_at := NOW() + INTERVAL '90 days';
  ELSIF v_duration = '264D' THEN
    v_expires_at := NOW() + INTERVAL '264 days';
  ELSIF v_duration = 'LIFE' THEN
    v_expires_at := '9999-12-31 23:59:59'::TIMESTAMPTZ;
  ELSE
    RETURN json_build_object('success', FALSE, 'message', 'Unsupported duration tier.');
  END IF;

  v_new_nonce := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));

  UPDATE tbl_system_license
  SET
    license_key = p_license_key,
    activated_at = NOW(),
    expires_at = v_expires_at,
    last_verified_at = NOW(),
    is_active = TRUE,
    request_nonce = v_new_nonce,
    installation_request_code = 'REQ-' || v_lic.app_code || '-' || v_new_nonce
  WHERE id = v_lic.id;

  RETURN json_build_object(
    'success', TRUE,
    'message', 'License activated successfully.',
    'expires_at', v_expires_at,
    'new_request_code', 'REQ-' || v_lic.app_code || '-' || v_new_nonce
  );
END;
$$;