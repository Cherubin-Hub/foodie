USE foodie_db;
DELIMITER $$

DROP FUNCTION IF EXISTS fn_hmac_sha256$$
CREATE FUNCTION fn_hmac_sha256(p_key VARCHAR(255), p_data VARCHAR(255))
RETURNS VARCHAR(64)
DETERMINISTIC
BEGIN
  DECLARE v_key VARBINARY(64);
  DECLARE v_ipad VARBINARY(64);
  DECLARE v_opad VARBINARY(64);
  DECLARE v_i INT DEFAULT 1;

  IF LENGTH(p_key) > 64 THEN
    SET v_key = UNHEX(SHA2(p_key, 256));
  ELSE
    SET v_key = CAST(p_key AS BINARY);
  END IF;

  SET v_key = RPAD(v_key, 64, 0x00);
  SET v_ipad = REPEAT(0x36, 64);
  SET v_opad = REPEAT(0x5c, 64);

  WHILE v_i <= 64 DO
    SET v_ipad = INSERT(v_ipad, v_i, 1, CHAR(ASCII(SUBSTRING(v_key, v_i, 1)) ^ 0x36));
    SET v_opad = INSERT(v_opad, v_i, 1, CHAR(ASCII(SUBSTRING(v_key, v_i, 1)) ^ 0x5c));
    SET v_i = v_i + 1;
  END WHILE;

  RETURN SHA2(CONCAT(v_opad, UNHEX(SHA2(CONCAT(v_ipad, p_data), 256))), 256);
END$$

DELIMITER ;