CREATE OR REPLACE FUNCTION fn_generate_license_key(
  p_duration VARCHAR(10),
  p_nonce VARCHAR(10)
)
RETURNS VARCHAR(100)
LANGUAGE plpgsql
AS $$
DECLARE
  v_secret TEXT := 'foodie_master_secret_2026_x99_secure';
  v_app_code TEXT := 'FOODIE_POS';
  v_raw TEXT;
  v_sig TEXT;
BEGIN
  v_raw := v_app_code || ':' || p_duration || ':' || p_nonce;
  v_sig := UPPER(SUBSTRING(ENCODE(HMAC(v_raw::bytea, v_secret::bytea, 'sha256'), 'hex') FROM 1 FOR 12));
  RETURN 'LIC-' || v_app_code || '-' || p_duration || '-' || p_nonce || '-' || v_sig;
END;
$$;