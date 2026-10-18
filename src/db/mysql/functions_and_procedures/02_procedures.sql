USE foodie_db;
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_verify_license_status$$
CREATE PROCEDURE sp_verify_license_status()
BEGIN
  DECLARE v_id INT;
  DECLARE v_active BOOLEAN;
  DECLARE v_expires DATETIME;
  DECLARE v_last_verified DATETIME;
  DECLARE v_status VARCHAR(50);
  DECLARE v_usable BOOLEAN DEFAULT FALSE;

  SELECT id, is_active, expires_at, last_verified_at
  INTO v_id, v_active, v_expires, v_last_verified
  FROM tbl_system_license LIMIT 1;

  IF v_id IS NULL THEN
    SELECT FALSE AS success, 'NO_RECORD' AS status, FALSE AS is_usable;
  ELSEIF v_active = FALSE THEN
    SET v_status = 'INACTIVE';
    SELECT TRUE AS success, v_status AS status, FALSE AS is_usable;
  ELSEIF NOW() < v_last_verified THEN
    SET v_status = 'CLOCK_TAMPERED';
    SELECT TRUE AS success, v_status AS status, FALSE AS is_usable;
  ELSEIF NOW() > v_expires THEN
    SET v_status = 'EXPIRED';
    SELECT TRUE AS success, v_status AS status, FALSE AS is_usable;
  ELSE
    SET v_status = 'VALID';
    SET v_usable = TRUE;
    UPDATE tbl_system_license SET last_verified_at = NOW() WHERE id = v_id;
    SELECT TRUE AS success, v_status AS status, v_usable AS is_usable;
  END IF;
END$$

DROP PROCEDURE IF EXISTS sp_activate_license$$
CREATE PROCEDURE sp_activate_license(IN p_license_key VARCHAR(150))
BEGIN
  DECLARE v_id INT;
  DECLARE v_app_code VARCHAR(50);
  DECLARE v_app_secret VARCHAR(100);
  DECLARE v_current_nonce VARCHAR(10);
  DECLARE v_in_app_code VARCHAR(50);
  DECLARE v_in_duration VARCHAR(10);
  DECLARE v_in_nonce VARCHAR(10);
  DECLARE v_in_sig VARCHAR(64);
  DECLARE v_computed_sig VARCHAR(64);
  DECLARE v_expires_at DATETIME;
  DECLARE v_new_nonce VARCHAR(6);

  SELECT id, app_code, app_secret, request_nonce
  INTO v_id, v_app_code, v_app_secret, v_current_nonce
  FROM tbl_system_license LIMIT 1;

  SET v_in_app_code = SUBSTRING_INDEX(SUBSTRING_INDEX(p_license_key, '-', 2), '-', -1);
  SET v_in_duration = SUBSTRING_INDEX(SUBSTRING_INDEX(p_license_key, '-', 3), '-', -1);
  SET v_in_nonce    = SUBSTRING_INDEX(SUBSTRING_INDEX(p_license_key, '-', 4), '-', -1);
  SET v_in_sig      = UPPER(SUBSTRING_INDEX(p_license_key, '-', -1));

  IF v_in_app_code <> v_app_code OR v_in_nonce <> v_current_nonce THEN
    SELECT FALSE AS success, 'Invalid application code or expired nonce' AS message;
  ELSE
    SET v_computed_sig = UPPER(SUBSTRING(fn_hmac_sha256(v_app_secret, CONCAT(v_in_app_code, ':', v_in_duration, ':', v_in_nonce)), 1, 12));

    IF v_in_sig <> v_computed_sig THEN
      SELECT FALSE AS success, 'Signature verification failed' AS message;
    ELSE
      IF v_in_duration = '7D' THEN SET v_expires_at = DATE_ADD(NOW(), INTERVAL 7 DAY);
      ELSEIF v_in_duration = '14D' THEN SET v_expires_at = DATE_ADD(NOW(), INTERVAL 14 DAY);
      ELSEIF v_in_duration = '30D' THEN SET v_expires_at = DATE_ADD(NOW(), INTERVAL 30 DAY);
      ELSEIF v_in_duration = '90D' THEN SET v_expires_at = DATE_ADD(NOW(), INTERVAL 90 DAY);
      ELSEIF v_in_duration = '264D' THEN SET v_expires_at = DATE_ADD(NOW(), INTERVAL 264 DAY);
      ELSEIF v_in_duration = 'LIFE' THEN SET v_expires_at = '9999-12-31 23:59:59';
      END IF;

      SET v_new_nonce = UPPER(SUBSTRING(MD5(CONCAT(RAND(), NOW())), 1, 6));

      UPDATE tbl_system_license
      SET
        license_key = p_license_key,
        activated_at = NOW(),
        expires_at = v_expires_at,
        last_verified_at = NOW(),
        is_active = TRUE,
        request_nonce = v_new_nonce,
        installation_request_code = CONCAT('REQ-', v_app_code, '-', v_new_nonce)
      WHERE id = v_id;

      SELECT TRUE AS success, 'License activated' AS message, v_expires_at AS expires_at, CONCAT('REQ-', v_app_code, '-', v_new_nonce) AS new_request_code;
    END IF;
  END IF;
END$$

DROP PROCEDURE IF EXISTS sp_create_guest_session$$
CREATE PROCEDURE sp_create_guest_session(IN p_temp_name VARCHAR(100))
BEGIN
  DECLARE v_token VARCHAR(64);
  SET v_token = LOWER(MD5(CONCAT(RAND(), NOW(), p_temp_name)));

  INSERT INTO tbl_guest_sessions (session_token, guest_temporary_name, created_at, expires_at)
  VALUES (v_token, TRIM(p_temp_name), NOW(), DATE_ADD(NOW(), INTERVAL 24 HOUR));

  SELECT TRUE AS success, v_token AS session_token, TRIM(p_temp_name) AS guest_temporary_name, 'GUEST' AS role;
END$$

DELIMITER ;