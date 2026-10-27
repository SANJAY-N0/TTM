-- ============================================================================
-- TimeToMeal SaaS Platform — 04_constraints.sql
-- Unique constraints and additional CHECK constraints
-- ============================================================================

-- ─── UNIQUE CONSTRAINTS ──────────────────────────────────────────────────────

-- Each college has a unique code
ALTER TABLE colleges ADD CONSTRAINT uq_colleges_code UNIQUE (code);

-- User emails must be unique
ALTER TABLE users ADD CONSTRAINT uq_users_email UNIQUE (email);

-- One profile per user
ALTER TABLE user_profiles ADD CONSTRAINT uq_user_profiles_user UNIQUE (user_id);

-- Category names unique within a canteen
ALTER TABLE categories ADD CONSTRAINT uq_categories_name_canteen UNIQUE (canteen_id, name);

-- One settings row per canteen
ALTER TABLE canteen_settings ADD CONSTRAINT uq_canteen_settings_canteen UNIQUE (canteen_id);

-- System settings keys are unique
ALTER TABLE system_settings ADD CONSTRAINT uq_system_settings_key UNIQUE (key);

-- Daily sales: one entry per canteen per day
ALTER TABLE daily_sales ADD CONSTRAINT uq_daily_sales_canteen_date UNIQUE (canteen_id, sale_date);

-- Role-permission pairs are unique
ALTER TABLE role_permissions ADD CONSTRAINT uq_role_permissions UNIQUE (role_id, permission_id);

-- Notification preferences: one per user
ALTER TABLE notification_preferences ADD CONSTRAINT uq_notif_prefs_user UNIQUE (user_id);

-- Token number unique per canteen per day
ALTER TABLE tokens ADD CONSTRAINT uq_tokens_canteen_date_number UNIQUE (canteen_id, token_date, token_number);

-- One inventory entry per food item per canteen
ALTER TABLE inventory ADD CONSTRAINT uq_inventory_food_canteen UNIQUE (food_id, canteen_id);

-- Cashfree order ID is unique
ALTER TABLE cashfree_transactions ADD CONSTRAINT uq_cf_txn_order_id UNIQUE (cf_order_id);

-- Receipt numbers are unique
ALTER TABLE receipts ADD CONSTRAINT uq_receipts_number UNIQUE (receipt_number);

-- Permission action+resource is unique
ALTER TABLE permissions ADD CONSTRAINT uq_permissions_action_resource UNIQUE (action, resource);

-- ─── ADDITIONAL CHECK CONSTRAINTS ────────────────────────────────────────────

-- Walk-in order items must have valid quantities
ALTER TABLE walk_in_order_items ADD CONSTRAINT chk_walkin_qty CHECK (quantity > 0);
ALTER TABLE walk_in_order_items ADD CONSTRAINT chk_walkin_price CHECK (price_per_unit >= 0);

-- Receipts must reference either an order or a walk-in order
ALTER TABLE receipts ADD CONSTRAINT chk_receipt_order_ref 
  CHECK (order_id IS NOT NULL OR walk_in_order_id IS NOT NULL);

-- Inventory transactions quantity must be non-zero
ALTER TABLE inventory_transactions ADD CONSTRAINT chk_inv_txn_qty CHECK (quantity != 0);

-- Users must have valid role values
ALTER TABLE users ADD CONSTRAINT chk_users_role 
  CHECK (role IN ('STUDENT', 'CANTEEN_STAFF', 'CANTEEN_ADMIN', 'SUPER_ADMIN', 'CANTEEN'));

-- Orders must have valid status values
ALTER TABLE orders ADD CONSTRAINT chk_orders_status 
  CHECK (order_status IN ('PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED', 'REFUNDED'));
