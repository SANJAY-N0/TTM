-- ============================================================================
-- TimeToMeal SaaS Platform — 02_tables.sql
-- Complete production-ready schema for multi-college, multi-canteen SaaS
-- ============================================================================

-- ─── ENUM TYPES ──────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('STUDENT', 'CANTEEN_STAFF', 'CANTEEN_ADMIN', 'SUPER_ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE food_type AS ENUM ('VEG', 'NON_VEG', 'EGG');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('CASH', 'UPI', 'CASHFREE', 'CARD', 'WALLET', 'SPLIT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE order_type AS ENUM ('ONLINE', 'WALK_IN', 'PRE_ORDER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE meal_period AS ENUM ('BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER', 'ALL_DAY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('ORDER', 'PAYMENT', 'PROMOTION', 'SYSTEM', 'ALERT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE inventory_action AS ENUM ('RESTOCK', 'SOLD', 'WASTAGE', 'ADJUSTMENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- CORE DOMAIN
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── COLLEGES ────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS colleges CASCADE;
CREATE TABLE colleges (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  code          text NOT NULL,
  address       text NOT NULL DEFAULT '',
  city          text NOT NULL DEFAULT '',
  state         text NOT NULL DEFAULT '',
  email         text,
  phone         text,
  contact_person text,
  status        text NOT NULL DEFAULT 'ACTIVE',
  deleted_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── CANTEENS ────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS canteens CASCADE;
CREATE TABLE canteens (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id    uuid NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  name          text NOT NULL,
  location      text NOT NULL DEFAULT '',
  contact_phone text,
  is_online     boolean NOT NULL DEFAULT true,
  status        text NOT NULL DEFAULT 'ACTIVE',
  deleted_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── ROLES ───────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS roles CASCADE;
CREATE TABLE roles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          user_role NOT NULL,
  description   text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── PERMISSIONS ─────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS permissions CASCADE;
CREATE TABLE permissions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action        text NOT NULL,
  resource      text NOT NULL,
  description   text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── ROLE_PERMISSIONS ────────────────────────────────────────────────────────
DROP TABLE IF EXISTS role_permissions CASCADE;
CREATE TABLE role_permissions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id       uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── USERS ───────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL,
  password_hash text NOT NULL,
  name          text NOT NULL,
  phone         text,
  roll_number   text,
  role          text NOT NULL DEFAULT 'STUDENT',
  status        text NOT NULL DEFAULT 'ACTIVE',
  college_id    uuid REFERENCES colleges(id) ON DELETE SET NULL,
  canteen_id    uuid REFERENCES canteens(id) ON DELETE SET NULL,
  deleted_at    timestamptz,
  last_login_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── USER_PROFILES ───────────────────────────────────────────────────────────
DROP TABLE IF EXISTS user_profiles CASCADE;
CREATE TABLE user_profiles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name     text,
  avatar_url    text,
  avatar_public_id text,
  hostel_name   text,
  room_number   text,
  batch_year    integer,
  department    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- FOOD MANAGEMENT DOMAIN
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── CATEGORIES ──────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS categories CASCADE;
CREATE TABLE categories (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canteen_id    uuid NOT NULL REFERENCES canteens(id) ON DELETE CASCADE,
  name          text NOT NULL,
  description   text,
  sort_order    integer NOT NULL DEFAULT 0,
  meal_period   meal_period DEFAULT 'ALL_DAY',
  is_active     boolean NOT NULL DEFAULT true,
  deleted_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── FOOD_ITEMS ──────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS food_items CASCADE;
CREATE TABLE food_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canteen_id      uuid NOT NULL REFERENCES canteens(id) ON DELETE CASCADE,
  category_id     uuid REFERENCES categories(id) ON DELETE SET NULL,
  name            text NOT NULL,
  description     text,
  price           numeric(10,2) NOT NULL,
  discount_price  numeric(10,2),
  food_type       food_type NOT NULL DEFAULT 'VEG',
  is_available    boolean NOT NULL DEFAULT true,
  is_daily        boolean NOT NULL DEFAULT true,
  prep_time_minutes integer DEFAULT 15,
  stock_online    integer NOT NULL DEFAULT 100,
  stock_offline   integer NOT NULL DEFAULT 100,
  sort_order      integer NOT NULL DEFAULT 0,
  deleted_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_food_price_positive CHECK (price > 0),
  CONSTRAINT chk_food_discount_valid CHECK (discount_price IS NULL OR discount_price >= 0),
  CONSTRAINT chk_food_stock_online CHECK (stock_online >= 0),
  CONSTRAINT chk_food_stock_offline CHECK (stock_offline >= 0)
);

-- ─── FOOD_IMAGES ─────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS food_images CASCADE;
CREATE TABLE food_images (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id       uuid NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
  image_url     text NOT NULL,
  public_id     text,
  secure_url    text,
  width         integer,
  height        integer,
  format        text,
  folder        text,
  bytes         integer,
  is_primary    boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── INVENTORY ───────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS inventory CASCADE;
CREATE TABLE inventory (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id         uuid NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
  canteen_id      uuid NOT NULL REFERENCES canteens(id) ON DELETE CASCADE,
  current_stock   integer NOT NULL DEFAULT 0,
  min_threshold   integer NOT NULL DEFAULT 5,
  max_capacity    integer NOT NULL DEFAULT 500,
  unit            text NOT NULL DEFAULT 'pieces',
  last_restocked  timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_inv_stock CHECK (current_stock >= 0),
  CONSTRAINT chk_inv_threshold CHECK (min_threshold >= 0)
);

-- ─── INVENTORY_TRANSACTIONS ──────────────────────────────────────────────────
DROP TABLE IF EXISTS inventory_transactions CASCADE;
CREATE TABLE inventory_transactions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id  uuid NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  action        inventory_action NOT NULL,
  quantity      integer NOT NULL,
  notes         text,
  performed_by  uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- ORDER DOMAIN
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── CARTS ───────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS carts CASCADE;
CREATE TABLE carts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  canteen_id    uuid REFERENCES canteens(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── CART_ITEMS ──────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS cart_items CASCADE;
CREATE TABLE cart_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id             uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  food_id             uuid NOT NULL REFERENCES food_items(id) ON DELETE CASCADE,
  quantity            integer NOT NULL DEFAULT 1,
  special_instructions text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_cart_qty CHECK (quantity > 0)
);

-- ─── ORDERS ──────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS orders CASCADE;
CREATE TABLE orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code      text NOT NULL,
  student_id      uuid REFERENCES users(id) ON DELETE SET NULL,
  canteen_id      uuid NOT NULL REFERENCES canteens(id) ON DELETE CASCADE,
  order_type      order_type NOT NULL DEFAULT 'ONLINE',
  total_amount    numeric(10,2) NOT NULL,
  paid_amount     numeric(10,2) NOT NULL DEFAULT 0,
  payment_method  text NOT NULL DEFAULT 'CASH',
  payment_status  text NOT NULL DEFAULT 'PENDING',
  order_status    text NOT NULL DEFAULT 'PENDING',
  special_instructions text,
  cashfree_order_id text,
  cashfree_payment_id text,
  accepted_at     timestamptz,
  prepared_at     timestamptz,
  completed_at    timestamptz,
  cancelled_at    timestamptz,
  cancellation_reason text,
  deleted_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_order_amount CHECK (total_amount >= 0),
  CONSTRAINT chk_order_paid CHECK (paid_amount >= 0)
);

-- ─── ORDER_ITEMS ─────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS order_items CASCADE;
CREATE TABLE order_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  food_id         uuid REFERENCES food_items(id) ON DELETE SET NULL,
  item_name       text NOT NULL,
  quantity        integer NOT NULL DEFAULT 1,
  price_per_unit  numeric(10,2) NOT NULL,
  total_price     numeric(10,2) NOT NULL,
  status          text NOT NULL DEFAULT 'PENDING',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_oi_qty CHECK (quantity > 0),
  CONSTRAINT chk_oi_price CHECK (price_per_unit >= 0)
);

-- ─── TOKENS ──────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS tokens CASCADE;
CREATE TABLE tokens (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  canteen_id    uuid NOT NULL REFERENCES canteens(id) ON DELETE CASCADE,
  token_number  integer NOT NULL,
  token_date    date NOT NULL DEFAULT CURRENT_DATE,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── ORDER_STATUS_HISTORY ────────────────────────────────────────────────────
DROP TABLE IF EXISTS order_status_history CASCADE;
CREATE TABLE order_status_history (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  old_status    text,
  new_status    text NOT NULL,
  changed_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- PAYMENT DOMAIN
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── PAYMENTS ────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS payments CASCADE;
CREATE TABLE payments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount              numeric(10,2) NOT NULL,
  payment_method      text NOT NULL DEFAULT 'CASH',
  payment_status      text NOT NULL DEFAULT 'PENDING',
  transaction_id      text,
  gateway_response    jsonb,
  paid_at             timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_pay_amount CHECK (amount >= 0)
);

-- ─── PAYMENT_METHODS ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS payment_methods CASCADE;
CREATE TABLE payment_methods (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canteen_id    uuid NOT NULL REFERENCES canteens(id) ON DELETE CASCADE,
  method_name   text NOT NULL,
  is_enabled    boolean NOT NULL DEFAULT true,
  config        jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── SPLIT_PAYMENTS ──────────────────────────────────────────────────────────
DROP TABLE IF EXISTS split_payments CASCADE;
CREATE TABLE split_payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_type    text NOT NULL,
  amount          numeric(10,2) NOT NULL,
  status          text NOT NULL DEFAULT 'PENDING',
  transaction_id  text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_split_amount CHECK (amount >= 0)
);

-- ─── CASHFREE_TRANSACTIONS ───────────────────────────────────────────────────
DROP TABLE IF EXISTS cashfree_transactions CASCADE;
CREATE TABLE cashfree_transactions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  cf_order_id         text NOT NULL,
  cf_payment_id       text,
  payment_session_id  text,
  payment_amount      numeric(10,2) NOT NULL,
  payment_status      text NOT NULL DEFAULT 'PENDING',
  payment_method      text,
  webhook_received    boolean NOT NULL DEFAULT false,
  webhook_payload     jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- COUNTER BILLING DOMAIN
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── WALK_IN_ORDERS ──────────────────────────────────────────────────────────
DROP TABLE IF EXISTS walk_in_orders CASCADE;
CREATE TABLE walk_in_orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canteen_id      uuid NOT NULL REFERENCES canteens(id) ON DELETE CASCADE,
  order_code      text NOT NULL,
  total_amount    numeric(10,2) NOT NULL,
  payment_method  text NOT NULL DEFAULT 'CASH',
  payment_status  text NOT NULL DEFAULT 'SUCCESS',
  served_by       uuid REFERENCES users(id) ON DELETE SET NULL,
  customer_name   text,
  customer_phone  text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_walkin_amount CHECK (total_amount >= 0)
);

-- ─── WALK_IN_ORDER_ITEMS ─────────────────────────────────────────────────────
DROP TABLE IF EXISTS walk_in_order_items CASCADE;
CREATE TABLE walk_in_order_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  walk_in_order_id uuid NOT NULL REFERENCES walk_in_orders(id) ON DELETE CASCADE,
  food_id         uuid REFERENCES food_items(id) ON DELETE SET NULL,
  item_name       text NOT NULL,
  quantity        integer NOT NULL DEFAULT 1,
  price_per_unit  numeric(10,2) NOT NULL,
  total_price     numeric(10,2) NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── RECEIPTS ────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS receipts CASCADE;
CREATE TABLE receipts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid REFERENCES orders(id) ON DELETE SET NULL,
  walk_in_order_id uuid REFERENCES walk_in_orders(id) ON DELETE SET NULL,
  receipt_number  text NOT NULL,
  total_amount    numeric(10,2) NOT NULL,
  generated_by    uuid REFERENCES users(id) ON DELETE SET NULL,
  pdf_url         text,
  created_at      timestamptz NOT NULL DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- NOTIFICATION DOMAIN
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
DROP TABLE IF EXISTS notifications CASCADE;
CREATE TABLE notifications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           text NOT NULL,
  message         text NOT NULL,
  type            notification_type NOT NULL DEFAULT 'SYSTEM',
  is_read         boolean NOT NULL DEFAULT false,
  metadata        jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── NOTIFICATION_PREFERENCES ────────────────────────────────────────────────
DROP TABLE IF EXISTS notification_preferences CASCADE;
CREATE TABLE notification_preferences (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_updates   boolean NOT NULL DEFAULT true,
  promotions      boolean NOT NULL DEFAULT true,
  system_alerts   boolean NOT NULL DEFAULT true,
  email_enabled   boolean NOT NULL DEFAULT false,
  push_enabled    boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- REPORTS DOMAIN
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── DAILY_SALES ─────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS daily_sales CASCADE;
CREATE TABLE daily_sales (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canteen_id      uuid NOT NULL REFERENCES canteens(id) ON DELETE CASCADE,
  sale_date       date NOT NULL,
  total_orders    integer NOT NULL DEFAULT 0,
  total_revenue   numeric(12,2) NOT NULL DEFAULT 0,
  cash_revenue    numeric(12,2) NOT NULL DEFAULT 0,
  online_revenue  numeric(12,2) NOT NULL DEFAULT 0,
  items_sold      integer NOT NULL DEFAULT 0,
  avg_order_value numeric(10,2) NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- SETTINGS DOMAIN
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── CANTEEN_SETTINGS ────────────────────────────────────────────────────────
DROP TABLE IF EXISTS canteen_settings CASCADE;
CREATE TABLE canteen_settings (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canteen_id          uuid NOT NULL REFERENCES canteens(id) ON DELETE CASCADE,
  opening_time        time DEFAULT '08:00:00',
  closing_time        time DEFAULT '20:00:00',
  is_accepting_orders boolean NOT NULL DEFAULT true,
  min_order_amount    numeric(10,2) DEFAULT 0,
  max_prep_time       integer DEFAULT 30,
  auto_accept_orders  boolean NOT NULL DEFAULT false,
  upi_id              text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- ─── SYSTEM_SETTINGS ─────────────────────────────────────────────────────────
DROP TABLE IF EXISTS system_settings CASCADE;
CREATE TABLE system_settings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key           text NOT NULL,
  value         text,
  category      text NOT NULL DEFAULT 'general',
  description   text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);


-- ═══════════════════════════════════════════════════════════════════════════════
-- AUDIT DOMAIN
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── AUDIT_LOGS ──────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS audit_logs CASCADE;
CREATE TABLE audit_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action        text NOT NULL,
  resource      text,
  resource_id   text,
  user_id       uuid REFERENCES users(id) ON DELETE SET NULL,
  ip_address    text,
  user_agent    text,
  old_values    jsonb,
  new_values    jsonb,
  details       text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
