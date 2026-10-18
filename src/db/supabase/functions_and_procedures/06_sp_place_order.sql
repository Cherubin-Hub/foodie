CREATE OR REPLACE FUNCTION sp_place_order(
  p_user_id INT,
  p_guest_session_token VARCHAR(64),
  p_guest_temporary_name VARCHAR(100),
  p_order_type VARCHAR(20),
  p_promo_code VARCHAR(50),
  p_delivery_address TEXT,
  p_items JSON
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_tracking_token VARCHAR(20);
  v_order_id INT;
  v_item RECORD;
  v_subtotal NUMERIC(10, 2) := 0.00;
  v_discount NUMERIC(10, 2) := 0.00;
  v_delivery_fee NUMERIC(10, 2) := 0.00;
  v_total NUMERIC(10, 2) := 0.00;
  v_deal RECORD;
BEGIN
  v_tracking_token := 'TRK-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));

  FOR v_item IN SELECT * FROM json_to_recordset(p_items) AS (food_item_id INT, quantity INT, unit_price NUMERIC(10, 2))
  LOOP
    v_subtotal := v_subtotal + (v_item.unit_price * v_item.quantity);
  END LOOP;

  IF p_promo_code IS NOT NULL AND TRIM(p_promo_code) <> '' THEN
    SELECT * INTO v_deal FROM tbl_deals WHERE promo_code = UPPER(TRIM(p_promo_code)) AND is_active = TRUE;
    IF FOUND THEN
      v_discount := ROUND((v_subtotal * (v_deal.discount_percentage / 100.00)), 2);
    END IF;
  END IF;

  IF p_order_type = 'DELIVERY' THEN
    v_delivery_fee := 3.50;
    IF FOUND AND v_deal.free_delivery = TRUE THEN
      v_delivery_fee := 0.00;
    END IF;
  END IF;

  v_total := (v_subtotal - v_discount) + v_delivery_fee;

  INSERT INTO tbl_orders (
    tracking_token, user_id, guest_session_token, guest_temporary_name,
    order_type, status, subtotal, discount_amount, delivery_fee, total_amount,
    promo_code, delivery_address, created_at, updated_at
  )
  VALUES (
    v_tracking_token, p_user_id, p_guest_session_token, p_guest_temporary_name,
    COALESCE(p_order_type, 'DINE_IN'), 'PENDING', v_subtotal, v_discount, v_delivery_fee, v_total,
    p_promo_code, p_delivery_address, NOW(), NOW()
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM json_to_recordset(p_items) AS (food_item_id INT, item_name VARCHAR(150), quantity INT, unit_price NUMERIC(10, 2))
  LOOP
    INSERT INTO tbl_order_items (order_id, food_item_id, item_name, unit_price, quantity, total_price)
    VALUES (v_order_id, v_item.food_item_id, v_item.item_name, v_item.unit_price, v_item.quantity, (v_item.unit_price * v_item.quantity));
  END LOOP;

  RETURN json_build_object(
    'success', TRUE,
    'tracking_token', v_tracking_token,
    'order_id', v_order_id,
    'total_amount', v_total
  );
END;
$$;