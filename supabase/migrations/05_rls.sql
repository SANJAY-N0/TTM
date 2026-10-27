-- ============================================================================
-- TimeToMeal SaaS Platform — 05_rls.sql
-- Row Level Security policies for multi-tenant access control
-- ============================================================================

-- ─── ENABLE RLS ON ALL TABLES ────────────────────────────────────────────────

ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE canteens ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashfree_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE walk_in_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE walk_in_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE canteen_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SERVICE ROLE BYPASS POLICIES
-- These allow the backend (using service_role key) to bypass RLS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Helper function to check if current user is service_role
CREATE OR REPLACE FUNCTION is_service_role()
RETURNS boolean AS $$
BEGIN
  RETURN current_setting('request.jwt.claim.role', true) = 'service_role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current authenticated user ID
CREATE OR REPLACE FUNCTION auth_user_id()
RETURNS uuid AS $$
BEGIN
  RETURN (current_setting('request.jwt.claim.sub', true))::uuid;
EXCEPTION
  WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ═══════════════════════════════════════════════════════════════════════════════
-- PUBLIC READ POLICIES (for anon/authenticated users)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Colleges: publicly readable
CREATE POLICY colleges_select_all ON colleges FOR SELECT USING (true);

-- Canteens: publicly readable
CREATE POLICY canteens_select_all ON canteens FOR SELECT USING (true);

-- Categories: publicly readable
CREATE POLICY categories_select_all ON categories FOR SELECT USING (true);

-- Food items: publicly readable (menu browsing)
CREATE POLICY food_items_select_all ON food_items FOR SELECT USING (true);

-- Food images: publicly readable
CREATE POLICY food_images_select_all ON food_images FOR SELECT USING (true);

-- Roles: publicly readable
CREATE POLICY roles_select_all ON roles FOR SELECT USING (true);

-- Canteen settings: publicly readable (opening hours, etc.)
CREATE POLICY canteen_settings_select_all ON canteen_settings FOR SELECT USING (true);

-- System settings: publicly readable
CREATE POLICY system_settings_select_all ON system_settings FOR SELECT USING (true);

-- Payment methods: publicly readable
CREATE POLICY payment_methods_select_all ON payment_methods FOR SELECT USING (true);


-- ═══════════════════════════════════════════════════════════════════════════════
-- AUTHENTICATED USER POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Users can read their own profile
CREATE POLICY users_select_own ON users FOR SELECT
  USING (id = auth_user_id() OR is_service_role());

-- Users: service role can manage all
CREATE POLICY users_all_service ON users FOR ALL
  USING (is_service_role());

-- User profiles: users can read/update their own
CREATE POLICY user_profiles_select_own ON user_profiles FOR SELECT
  USING (user_id = auth_user_id() OR is_service_role());

CREATE POLICY user_profiles_update_own ON user_profiles FOR UPDATE
  USING (user_id = auth_user_id() OR is_service_role());

CREATE POLICY user_profiles_insert_own ON user_profiles FOR INSERT
  WITH CHECK (user_id = auth_user_id() OR is_service_role());

-- Carts: students manage their own
CREATE POLICY carts_select_own ON carts FOR SELECT
  USING (student_id = auth_user_id() OR is_service_role());

CREATE POLICY carts_manage_own ON carts FOR ALL
  USING (student_id = auth_user_id() OR is_service_role());

-- Cart items: via cart ownership
CREATE POLICY cart_items_all ON cart_items FOR ALL
  USING (is_service_role() OR cart_id IN (
    SELECT id FROM carts WHERE student_id = auth_user_id()
  ));

-- Orders: students see their own, canteen staff see their canteen's
CREATE POLICY orders_select ON orders FOR SELECT
  USING (
    student_id = auth_user_id()
    OR is_service_role()
    OR canteen_id IN (
      SELECT canteen_id FROM users WHERE id = auth_user_id() AND canteen_id IS NOT NULL
    )
  );

CREATE POLICY orders_insert ON orders FOR INSERT
  WITH CHECK (is_service_role() OR student_id = auth_user_id());

CREATE POLICY orders_update ON orders FOR UPDATE
  USING (is_service_role() OR canteen_id IN (
    SELECT canteen_id FROM users WHERE id = auth_user_id() AND canteen_id IS NOT NULL
  ));

-- Order items: follow order access
CREATE POLICY order_items_select ON order_items FOR SELECT
  USING (is_service_role() OR order_id IN (
    SELECT id FROM orders WHERE student_id = auth_user_id()
    UNION
    SELECT id FROM orders WHERE canteen_id IN (
      SELECT canteen_id FROM users WHERE id = auth_user_id() AND canteen_id IS NOT NULL
    )
  ));

CREATE POLICY order_items_manage ON order_items FOR ALL
  USING (is_service_role());

-- Tokens: readable by order owner and canteen staff
CREATE POLICY tokens_select ON tokens FOR SELECT
  USING (is_service_role() OR canteen_id IN (
    SELECT canteen_id FROM users WHERE id = auth_user_id() AND canteen_id IS NOT NULL
  ));

CREATE POLICY tokens_manage ON tokens FOR ALL
  USING (is_service_role());

-- Order status history: readable
CREATE POLICY osh_select ON order_status_history FOR SELECT
  USING (is_service_role() OR order_id IN (
    SELECT id FROM orders WHERE student_id = auth_user_id()
  ));

CREATE POLICY osh_manage ON order_status_history FOR ALL
  USING (is_service_role());

-- Payments: follow order access
CREATE POLICY payments_select ON payments FOR SELECT
  USING (is_service_role() OR order_id IN (
    SELECT id FROM orders WHERE student_id = auth_user_id()
  ));

CREATE POLICY payments_manage ON payments FOR ALL
  USING (is_service_role());

-- Split payments: follow order access
CREATE POLICY split_payments_all ON split_payments FOR ALL
  USING (is_service_role());

-- Cashfree transactions: service role only
CREATE POLICY cf_txn_all ON cashfree_transactions FOR ALL
  USING (is_service_role());

-- Notifications: users see their own
CREATE POLICY notif_select_own ON notifications FOR SELECT
  USING (user_id = auth_user_id() OR is_service_role());

CREATE POLICY notif_manage ON notifications FOR ALL
  USING (is_service_role());

-- Notification preferences: users manage their own
CREATE POLICY notif_prefs_own ON notification_preferences FOR ALL
  USING (user_id = auth_user_id() OR is_service_role());


-- ═══════════════════════════════════════════════════════════════════════════════
-- CANTEEN STAFF / ADMIN POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Food items: canteen staff can manage their canteen's items
CREATE POLICY food_items_manage ON food_items FOR ALL
  USING (is_service_role() OR canteen_id IN (
    SELECT canteen_id FROM users WHERE id = auth_user_id() AND canteen_id IS NOT NULL
  ));

-- Food images: canteen staff can manage their food's images
CREATE POLICY food_images_manage ON food_images FOR ALL
  USING (is_service_role() OR food_id IN (
    SELECT fi.id FROM food_items fi WHERE fi.canteen_id IN (
      SELECT canteen_id FROM users WHERE id = auth_user_id() AND canteen_id IS NOT NULL
    )
  ));

-- Categories: canteen staff can manage their canteen's categories
CREATE POLICY categories_manage ON categories FOR ALL
  USING (is_service_role() OR canteen_id IN (
    SELECT canteen_id FROM users WHERE id = auth_user_id() AND canteen_id IS NOT NULL
  ));

-- Inventory: canteen staff can manage
CREATE POLICY inventory_all ON inventory FOR ALL
  USING (is_service_role() OR canteen_id IN (
    SELECT canteen_id FROM users WHERE id = auth_user_id() AND canteen_id IS NOT NULL
  ));

-- Inventory transactions: canteen staff can manage
CREATE POLICY inv_txn_all ON inventory_transactions FOR ALL
  USING (is_service_role());

-- Walk-in orders: canteen staff manage
CREATE POLICY walkin_orders_all ON walk_in_orders FOR ALL
  USING (is_service_role() OR canteen_id IN (
    SELECT canteen_id FROM users WHERE id = auth_user_id() AND canteen_id IS NOT NULL
  ));

CREATE POLICY walkin_items_all ON walk_in_order_items FOR ALL
  USING (is_service_role());

-- Receipts: canteen staff manage
CREATE POLICY receipts_all ON receipts FOR ALL
  USING (is_service_role());

-- Daily sales: canteen staff read their canteen's
CREATE POLICY daily_sales_select ON daily_sales FOR SELECT
  USING (is_service_role() OR canteen_id IN (
    SELECT canteen_id FROM users WHERE id = auth_user_id() AND canteen_id IS NOT NULL
  ));

CREATE POLICY daily_sales_manage ON daily_sales FOR ALL
  USING (is_service_role());

-- Canteen settings: canteen staff can update their own
CREATE POLICY canteen_settings_manage ON canteen_settings FOR ALL
  USING (is_service_role() OR canteen_id IN (
    SELECT canteen_id FROM users WHERE id = auth_user_id() AND canteen_id IS NOT NULL
  ));


-- ═══════════════════════════════════════════════════════════════════════════════
-- SUPER ADMIN POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Colleges: super admin can manage
CREATE POLICY colleges_manage ON colleges FOR ALL
  USING (is_service_role());

-- Canteens: super admin can manage
CREATE POLICY canteens_manage ON canteens FOR ALL
  USING (is_service_role());

-- Permissions: admin only
CREATE POLICY permissions_all ON permissions FOR ALL
  USING (is_service_role());

CREATE POLICY role_permissions_all ON role_permissions FOR ALL
  USING (is_service_role());

-- Payment methods: canteen admin can manage
CREATE POLICY payment_methods_manage ON payment_methods FOR ALL
  USING (is_service_role());

-- System settings: admin only
CREATE POLICY system_settings_manage ON system_settings FOR ALL
  USING (is_service_role());

-- Audit logs: admin read only
CREATE POLICY audit_logs_select ON audit_logs FOR SELECT
  USING (is_service_role());

CREATE POLICY audit_logs_insert ON audit_logs FOR INSERT
  WITH CHECK (is_service_role());
