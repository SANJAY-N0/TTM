-- ============================================================================
-- TimeToMeal SaaS Platform — 08_views.sql
-- Materialized and standard views for common query patterns
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════════
-- CANTEEN MENU VIEW
-- Food items with primary image and category name, ready for API consumption
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW v_canteen_menu AS
SELECT
  fi.id,
  fi.canteen_id,
  fi.category_id,
  fi.name,
  fi.description,
  fi.price,
  fi.discount_price,
  fi.food_type,
  fi.is_available,
  fi.is_daily,
  fi.prep_time_minutes,
  fi.stock_online,
  fi.stock_offline,
  fi.sort_order,
  fi.created_at,
  fi.updated_at,
  c.name AS category_name,
  c.meal_period,
  img.image_url,
  img.public_id AS image_public_id,
  img.secure_url AS image_secure_url,
  img.width AS image_width,
  img.height AS image_height,
  img.format AS image_format
FROM food_items fi
LEFT JOIN categories c ON c.id = fi.category_id
LEFT JOIN food_images img ON img.food_id = fi.id AND img.is_primary = true
WHERE fi.deleted_at IS NULL;


-- ═══════════════════════════════════════════════════════════════════════════════
-- ACTIVE FOOD ITEMS VIEW
-- Only available, non-deleted items for student-facing menu
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW v_active_food_items AS
SELECT
  fi.id,
  fi.canteen_id,
  fi.name,
  fi.description,
  fi.price,
  fi.discount_price,
  fi.food_type,
  fi.stock_online,
  fi.stock_offline,
  fi.prep_time_minutes,
  c.name AS category,
  img.image_url,
  img.secure_url AS image_secure_url,
  img.public_id AS cloudinary_public_id
FROM food_items fi
LEFT JOIN categories c ON c.id = fi.category_id
LEFT JOIN food_images img ON img.food_id = fi.id AND img.is_primary = true
WHERE fi.is_available = true
  AND fi.deleted_at IS NULL
  AND fi.stock_online > 0;


-- ═══════════════════════════════════════════════════════════════════════════════
-- ORDER DETAILS VIEW
-- Orders with student info, items, and payment data — for canteen dashboard
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW v_order_details AS
SELECT
  o.id,
  o.order_code,
  o.order_type,
  o.total_amount,
  o.paid_amount,
  o.payment_method,
  o.payment_status,
  o.order_status,
  o.special_instructions,
  o.cashfree_order_id,
  o.accepted_at,
  o.prepared_at,
  o.completed_at,
  o.cancelled_at,
  o.cancellation_reason,
  o.created_at,
  o.updated_at,
  -- Student info
  o.student_id,
  u.name AS student_name,
  u.email AS student_email,
  u.phone AS student_phone,
  -- Canteen info
  o.canteen_id,
  can.name AS canteen_name,
  -- Token info
  t.token_number,
  -- Items as JSON array
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object(
      'id', oi.id,
      'food_id', oi.food_id,
      'item_name', oi.item_name,
      'quantity', oi.quantity,
      'price_per_unit', oi.price_per_unit,
      'total_price', oi.total_price
    ))
    FROM order_items oi WHERE oi.order_id = o.id),
    '[]'::jsonb
  ) AS order_items
FROM orders o
LEFT JOIN users u ON u.id = o.student_id
LEFT JOIN canteens can ON can.id = o.canteen_id
LEFT JOIN tokens t ON t.order_id = o.id
WHERE o.deleted_at IS NULL;


-- ═══════════════════════════════════════════════════════════════════════════════
-- DAILY REVENUE VIEW
-- Revenue aggregation per canteen per day
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW v_daily_revenue AS
SELECT
  canteen_id,
  created_at::date AS sale_date,
  COUNT(*) AS total_orders,
  COALESCE(SUM(total_amount), 0) AS total_revenue,
  COALESCE(SUM(CASE WHEN payment_method = 'CASH' THEN total_amount ELSE 0 END), 0) AS cash_revenue,
  COALESCE(SUM(CASE WHEN payment_method != 'CASH' THEN total_amount ELSE 0 END), 0) AS online_revenue,
  COALESCE(AVG(total_amount), 0) AS avg_order_value,
  COUNT(*) FILTER (WHERE order_status = 'COMPLETED') AS completed_orders,
  COUNT(*) FILTER (WHERE order_status = 'CANCELLED') AS cancelled_orders
FROM orders
WHERE deleted_at IS NULL
GROUP BY canteen_id, created_at::date
ORDER BY sale_date DESC;


-- ═══════════════════════════════════════════════════════════════════════════════
-- STUDENT ORDER HISTORY VIEW
-- Student-facing view of their past orders
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW v_student_orders AS
SELECT
  o.id,
  o.order_code,
  o.total_amount,
  o.paid_amount,
  o.payment_method,
  o.payment_status,
  o.order_status,
  o.created_at,
  o.student_id,
  can.name AS canteen_name,
  t.token_number,
  COALESCE(
    (SELECT jsonb_agg(jsonb_build_object(
      'item_name', oi.item_name,
      'quantity', oi.quantity,
      'price', oi.price_per_unit
    ))
    FROM order_items oi WHERE oi.order_id = o.id),
    '[]'::jsonb
  ) AS items
FROM orders o
LEFT JOIN canteens can ON can.id = o.canteen_id
LEFT JOIN tokens t ON t.order_id = o.id
WHERE o.deleted_at IS NULL
ORDER BY o.created_at DESC;


-- ═══════════════════════════════════════════════════════════════════════════════
-- LOW STOCK ALERT VIEW
-- Items running low for canteen staff dashboard
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW v_low_stock_items AS
SELECT
  fi.id,
  fi.canteen_id,
  fi.name,
  fi.stock_online,
  fi.stock_offline,
  can.name AS canteen_name,
  c.name AS category_name
FROM food_items fi
LEFT JOIN canteens can ON can.id = fi.canteen_id
LEFT JOIN categories c ON c.id = fi.category_id
WHERE fi.deleted_at IS NULL
  AND fi.is_available = true
  AND (fi.stock_online <= 5 OR fi.stock_offline <= 5)
ORDER BY fi.stock_online ASC;
