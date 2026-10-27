-- ============================================================================
-- TimeToMeal SaaS Platform — 06_triggers.sql
-- Auto-update timestamps, order status history, and inventory management
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════════
-- UPDATED_AT AUTO-UPDATE TRIGGERS (via moddatetime extension)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE TRIGGER trg_colleges_updated
  BEFORE UPDATE ON colleges
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE OR REPLACE TRIGGER trg_canteens_updated
  BEFORE UPDATE ON canteens
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE OR REPLACE TRIGGER trg_users_updated
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE OR REPLACE TRIGGER trg_user_profiles_updated
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE OR REPLACE TRIGGER trg_categories_updated
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE OR REPLACE TRIGGER trg_food_items_updated
  BEFORE UPDATE ON food_items
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE OR REPLACE TRIGGER trg_food_images_updated
  BEFORE UPDATE ON food_images
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE OR REPLACE TRIGGER trg_inventory_updated
  BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE OR REPLACE TRIGGER trg_carts_updated
  BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE OR REPLACE TRIGGER trg_cart_items_updated
  BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE OR REPLACE TRIGGER trg_orders_updated
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE OR REPLACE TRIGGER trg_order_items_updated
  BEFORE UPDATE ON order_items
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE OR REPLACE TRIGGER trg_payments_updated
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE OR REPLACE TRIGGER trg_split_payments_updated
  BEFORE UPDATE ON split_payments
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE OR REPLACE TRIGGER trg_cashfree_txn_updated
  BEFORE UPDATE ON cashfree_transactions
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE OR REPLACE TRIGGER trg_walk_in_orders_updated
  BEFORE UPDATE ON walk_in_orders
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE OR REPLACE TRIGGER trg_canteen_settings_updated
  BEFORE UPDATE ON canteen_settings
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE OR REPLACE TRIGGER trg_system_settings_updated
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE OR REPLACE TRIGGER trg_daily_sales_updated
  BEFORE UPDATE ON daily_sales
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE OR REPLACE TRIGGER trg_notif_prefs_updated
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE OR REPLACE TRIGGER trg_payment_methods_updated
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);


-- ═══════════════════════════════════════════════════════════════════════════════
-- ORDER STATUS HISTORY TRIGGER
-- Automatically records every status change in order_status_history
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION fn_track_order_status_change()
RETURNS trigger AS $$
BEGIN
  IF OLD.order_status IS DISTINCT FROM NEW.order_status THEN
    INSERT INTO order_status_history (order_id, old_status, new_status)
    VALUES (NEW.id, OLD.order_status, NEW.order_status);

    -- Auto-set timestamp columns based on new status
    IF NEW.order_status = 'ACCEPTED' AND NEW.accepted_at IS NULL THEN
      NEW.accepted_at := now();
    END IF;
    IF NEW.order_status = 'READY' AND NEW.prepared_at IS NULL THEN
      NEW.prepared_at := now();
    END IF;
    IF NEW.order_status IN ('COMPLETED', 'DELIVERED') AND NEW.completed_at IS NULL THEN
      NEW.completed_at := now();
    END IF;
    IF NEW.order_status = 'CANCELLED' AND NEW.cancelled_at IS NULL THEN
      NEW.cancelled_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_order_status_change
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION fn_track_order_status_change();


-- ═══════════════════════════════════════════════════════════════════════════════
-- INVENTORY AUTO-DECREMENT ON ORDER ITEM CREATION
-- Decreases stock when a new order_item is inserted
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION fn_decrement_stock_on_order()
RETURNS trigger AS $$
BEGIN
  -- Decrement online stock on the food_items table
  UPDATE food_items
  SET stock_online = GREATEST(0, stock_online - NEW.quantity)
  WHERE id = NEW.food_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_decrement_stock
  AFTER INSERT ON order_items
  FOR EACH ROW
  WHEN (NEW.food_id IS NOT NULL)
  EXECUTE FUNCTION fn_decrement_stock_on_order();


-- ═══════════════════════════════════════════════════════════════════════════════
-- AUDIT LOG TRIGGER (generic)
-- Can be attached to tables that need audit tracking
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (action, resource, resource_id, old_values)
    VALUES (TG_OP, TG_TABLE_NAME, OLD.id::text, to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (action, resource, resource_id, old_values, new_values)
    VALUES (TG_OP, TG_TABLE_NAME, NEW.id::text, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (action, resource, resource_id, new_values)
    VALUES (TG_OP, TG_TABLE_NAME, NEW.id::text, to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Attach audit trigger to critical tables
CREATE OR REPLACE TRIGGER trg_audit_orders
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE OR REPLACE TRIGGER trg_audit_payments
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE OR REPLACE TRIGGER trg_audit_users
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
