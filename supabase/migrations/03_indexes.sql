-- ============================================================================
-- TimeToMeal SaaS Platform — 03_indexes.sql
-- Performance indexes for all high-traffic query patterns
-- ============================================================================

-- ─── COLLEGES ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_colleges_code ON colleges(code);
CREATE INDEX IF NOT EXISTS idx_colleges_status ON colleges(status) WHERE deleted_at IS NULL;

-- ─── CANTEENS ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_canteens_college ON canteens(college_id);
CREATE INDEX IF NOT EXISTS idx_canteens_status ON canteens(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_canteens_online ON canteens(is_online) WHERE deleted_at IS NULL;

-- ─── USERS ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_college ON users(college_id);
CREATE INDEX IF NOT EXISTS idx_users_canteen ON users(canteen_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(status) WHERE deleted_at IS NULL;

-- ─── USER_PROFILES ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON user_profiles(user_id);

-- ─── CATEGORIES ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_categories_canteen ON categories(canteen_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(canteen_id, is_active) WHERE deleted_at IS NULL;

-- ─── FOOD_ITEMS ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_food_items_canteen ON food_items(canteen_id);
CREATE INDEX IF NOT EXISTS idx_food_items_category ON food_items(category_id);
CREATE INDEX IF NOT EXISTS idx_food_items_available ON food_items(canteen_id, is_available) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_food_items_type ON food_items(food_type);
CREATE INDEX IF NOT EXISTS idx_food_items_name_search ON food_items USING gin(to_tsvector('english', name));

-- ─── FOOD_IMAGES ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_food_images_food ON food_images(food_id);
CREATE INDEX IF NOT EXISTS idx_food_images_primary ON food_images(food_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_food_images_public_id ON food_images(public_id);

-- ─── INVENTORY ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_inventory_food ON inventory(food_id);
CREATE INDEX IF NOT EXISTS idx_inventory_canteen ON inventory(canteen_id);
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON inventory(canteen_id) WHERE current_stock <= min_threshold;

-- ─── INVENTORY_TRANSACTIONS ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_inv_txn_inventory ON inventory_transactions(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inv_txn_date ON inventory_transactions(created_at);

-- ─── CARTS ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_carts_student ON carts(student_id);
CREATE INDEX IF NOT EXISTS idx_carts_canteen ON carts(canteen_id);

-- ─── CART_ITEMS ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_food ON cart_items(food_id);

-- ─── ORDERS ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_student ON orders(student_id);
CREATE INDEX IF NOT EXISTS idx_orders_canteen ON orders(canteen_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_code ON orders(order_code);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_cashfree ON orders(cashfree_order_id) WHERE cashfree_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_active ON orders(canteen_id, order_status) WHERE deleted_at IS NULL;

-- ─── ORDER_ITEMS ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_food ON order_items(food_id);

-- ─── TOKENS ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tokens_order ON tokens(order_id);
CREATE INDEX IF NOT EXISTS idx_tokens_canteen_date ON tokens(canteen_id, token_date);
CREATE INDEX IF NOT EXISTS idx_tokens_active ON tokens(canteen_id, token_date) WHERE is_active = true;

-- ─── ORDER_STATUS_HISTORY ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_osh_order ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_osh_date ON order_status_history(created_at);

-- ─── PAYMENTS ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_txn ON payments(transaction_id) WHERE transaction_id IS NOT NULL;

-- ─── SPLIT_PAYMENTS ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_split_payments_order ON split_payments(order_id);

-- ─── CASHFREE_TRANSACTIONS ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cf_txn_order ON cashfree_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_cf_txn_cf_order ON cashfree_transactions(cf_order_id);

-- ─── WALK_IN_ORDERS ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_walkin_canteen ON walk_in_orders(canteen_id);
CREATE INDEX IF NOT EXISTS idx_walkin_date ON walk_in_orders(created_at DESC);

-- ─── WALK_IN_ORDER_ITEMS ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_walkin_items_order ON walk_in_order_items(walk_in_order_id);

-- ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notif_type ON notifications(type);

-- ─── DAILY_SALES ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_daily_sales_canteen ON daily_sales(canteen_id);
CREATE INDEX IF NOT EXISTS idx_daily_sales_date ON daily_sales(canteen_id, sale_date);

-- ─── CANTEEN_SETTINGS ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_canteen_settings_canteen ON canteen_settings(canteen_id);

-- ─── SYSTEM_SETTINGS ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_cat ON system_settings(category);

-- ─── AUDIT_LOGS ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_date ON audit_logs(created_at DESC);
