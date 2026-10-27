-- ============================================================================
-- TimeToMeal SaaS Platform — 07_functions.sql
-- Stored procedures and helper functions for complex business operations
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════════
-- DASHBOARD STATISTICS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Get comprehensive canteen dashboard stats
CREATE OR REPLACE FUNCTION get_canteen_dashboard_stats(p_canteen_id uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_orders_today', (
      SELECT COUNT(*) FROM orders
      WHERE canteen_id = p_canteen_id
        AND created_at::date = CURRENT_DATE
        AND deleted_at IS NULL
    ),
    'total_revenue_today', (
      SELECT COALESCE(SUM(total_amount), 0) FROM orders
      WHERE canteen_id = p_canteen_id
        AND created_at::date = CURRENT_DATE
        AND payment_status = 'SUCCESS'
        AND deleted_at IS NULL
    ),
    'pending_orders', (
      SELECT COUNT(*) FROM orders
      WHERE canteen_id = p_canteen_id
        AND order_status IN ('PENDING', 'ACCEPTED', 'PREPARING')
        AND deleted_at IS NULL
    ),
    'total_items', (
      SELECT COUNT(*) FROM food_items
      WHERE canteen_id = p_canteen_id
        AND deleted_at IS NULL
    ),
    'available_items', (
      SELECT COUNT(*) FROM food_items
      WHERE canteen_id = p_canteen_id
        AND is_available = true
        AND deleted_at IS NULL
    ),
    'popular_items', (
      SELECT COALESCE(jsonb_agg(item_row), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'food_id', oi.food_id,
          'name', oi.item_name,
          'total_ordered', SUM(oi.quantity)
        ) AS item_row
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE o.canteen_id = p_canteen_id
          AND o.created_at >= CURRENT_DATE - INTERVAL '7 days'
          AND o.deleted_at IS NULL
        GROUP BY oi.food_id, oi.item_name
        ORDER BY SUM(oi.quantity) DESC
        LIMIT 5
      ) popular
    )
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════════════════════════════
-- DAILY SALES REPORT
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_daily_sales_report(p_canteen_id uuid, p_date date DEFAULT CURRENT_DATE)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'date', p_date,
    'canteen_id', p_canteen_id,
    'total_orders', COUNT(*),
    'total_revenue', COALESCE(SUM(total_amount), 0),
    'cash_revenue', COALESCE(SUM(CASE WHEN payment_method = 'CASH' THEN total_amount ELSE 0 END), 0),
    'online_revenue', COALESCE(SUM(CASE WHEN payment_method != 'CASH' THEN total_amount ELSE 0 END), 0),
    'avg_order_value', COALESCE(AVG(total_amount), 0),
    'completed_orders', COUNT(*) FILTER (WHERE order_status = 'COMPLETED'),
    'cancelled_orders', COUNT(*) FILTER (WHERE order_status = 'CANCELLED'),
    'items_sold', (
      SELECT COALESCE(SUM(oi.quantity), 0)
      FROM order_items oi
      JOIN orders o2 ON o2.id = oi.order_id
      WHERE o2.canteen_id = p_canteen_id
        AND o2.created_at::date = p_date
        AND o2.deleted_at IS NULL
    )
  ) INTO result
  FROM orders
  WHERE canteen_id = p_canteen_id
    AND created_at::date = p_date
    AND deleted_at IS NULL;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════════════════════════════
-- ATOMIC ORDER PLACEMENT
-- Creates order + order_items + payment record in a single transaction
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION place_order(
  p_student_id uuid,
  p_canteen_id uuid,
  p_items jsonb,
  p_payment_method text DEFAULT 'CASH',
  p_order_type text DEFAULT 'ONLINE',
  p_special_instructions text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_order_id uuid;
  v_order_code text;
  v_total numeric := 0;
  v_item jsonb;
  v_token_number integer;
BEGIN
  -- Generate order code
  v_order_code := 'TTM-' || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');

  -- Calculate total
  SELECT COALESCE(SUM((item->>'quantity')::int * (item->>'price_per_unit')::numeric), 0)
  INTO v_total
  FROM jsonb_array_elements(p_items) AS item;

  -- Create order
  INSERT INTO orders (student_id, canteen_id, order_code, order_type, total_amount, payment_method, special_instructions)
  VALUES (p_student_id, p_canteen_id, v_order_code, p_order_type::order_type, v_total, p_payment_method, p_special_instructions)
  RETURNING id INTO v_order_id;

  -- Create order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (order_id, food_id, item_name, quantity, price_per_unit, total_price)
    VALUES (
      v_order_id,
      (v_item->>'food_id')::uuid,
      v_item->>'item_name',
      (v_item->>'quantity')::int,
      (v_item->>'price_per_unit')::numeric,
      (v_item->>'quantity')::int * (v_item->>'price_per_unit')::numeric
    );
  END LOOP;

  -- Generate token number (incremental per canteen per day)
  SELECT COALESCE(MAX(token_number), 0) + 1 INTO v_token_number
  FROM tokens
  WHERE canteen_id = p_canteen_id AND token_date = CURRENT_DATE;

  INSERT INTO tokens (order_id, canteen_id, token_number)
  VALUES (v_order_id, p_canteen_id, v_token_number);

  -- Create initial payment record
  IF p_payment_method = 'CASH' THEN
    INSERT INTO payments (order_id, amount, payment_method, payment_status, paid_at)
    VALUES (v_order_id, v_total, 'CASH', 'SUCCESS', now());

    UPDATE orders SET payment_status = 'SUCCESS', paid_amount = v_total WHERE id = v_order_id;
  ELSE
    INSERT INTO payments (order_id, amount, payment_method, payment_status)
    VALUES (v_order_id, v_total, p_payment_method, 'PENDING');
  END IF;

  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_code', v_order_code,
    'token_number', v_token_number,
    'total_amount', v_total,
    'payment_method', p_payment_method
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════════════════════════════
-- ORDER STATUS TRANSITION
-- Validates and updates order status with history tracking
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_order_status(
  p_order_id uuid,
  p_new_status text,
  p_changed_by uuid DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_current_status text;
  v_valid_transitions jsonb;
BEGIN
  -- Get current status
  SELECT order_status INTO v_current_status FROM orders WHERE id = p_order_id;

  IF v_current_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  -- Define valid transitions
  v_valid_transitions := '{
    "PENDING": ["ACCEPTED", "CANCELLED"],
    "ACCEPTED": ["PREPARING", "CANCELLED"],
    "PREPARING": ["READY", "CANCELLED"],
    "READY": ["COMPLETED", "CANCELLED"],
    "COMPLETED": [],
    "CANCELLED": [],
    "REFUNDED": []
  }'::jsonb;

  -- Validate transition
  IF NOT (v_valid_transitions->v_current_status) ? p_new_status THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Invalid transition from %s to %s', v_current_status, p_new_status)
    );
  END IF;

  -- Perform update (triggers will handle history + timestamps)
  UPDATE orders SET order_status = p_new_status WHERE id = p_order_id;

  -- Record who changed it if provided
  IF p_changed_by IS NOT NULL THEN
    UPDATE order_status_history
    SET changed_by = p_changed_by, notes = p_notes
    WHERE ctid = (
      SELECT ctid FROM order_status_history
      WHERE order_id = p_order_id AND new_status = p_new_status
      ORDER BY created_at DESC LIMIT 1
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'old_status', v_current_status,
    'new_status', p_new_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════════════════════════════
-- UPSERT DAILY SALES
-- Call this function to refresh daily_sales aggregate for a canteen
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION refresh_daily_sales(p_canteen_id uuid, p_date date DEFAULT CURRENT_DATE)
RETURNS void AS $$
DECLARE
  v_stats jsonb;
BEGIN
  v_stats := get_daily_sales_report(p_canteen_id, p_date);

  INSERT INTO daily_sales (canteen_id, sale_date, total_orders, total_revenue, cash_revenue, online_revenue, items_sold, avg_order_value)
  VALUES (
    p_canteen_id,
    p_date,
    (v_stats->>'total_orders')::int,
    (v_stats->>'total_revenue')::numeric,
    (v_stats->>'cash_revenue')::numeric,
    (v_stats->>'online_revenue')::numeric,
    (v_stats->>'items_sold')::int,
    (v_stats->>'avg_order_value')::numeric
  )
  ON CONFLICT (canteen_id, sale_date) DO UPDATE SET
    total_orders = EXCLUDED.total_orders,
    total_revenue = EXCLUDED.total_revenue,
    cash_revenue = EXCLUDED.cash_revenue,
    online_revenue = EXCLUDED.online_revenue,
    items_sold = EXCLUDED.items_sold,
    avg_order_value = EXCLUDED.avg_order_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
