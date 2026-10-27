-- ============================================================================
-- TimeToMeal SaaS Platform — 09_seed.sql
-- Production baseline configuration (Zero demo data)
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED: Roles
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO roles (name, description) VALUES
  ('STUDENT', 'Student user — can browse menu, place orders, make payments'),
  ('CANTEEN_STAFF', 'Canteen staff — can manage menu, process orders'),
  ('CANTEEN_ADMIN', 'Canteen admin — full canteen management including settings'),
  ('SUPER_ADMIN', 'Platform admin — full system access')
ON CONFLICT DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED: Super Admin User (password = 'password123')
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO users (id, email, password_hash, name, phone, role, status)
VALUES (
  'a0000001-0000-4000-a000-000000000001'::uuid,
  'admin@timetomeal.com',
  '$2b$10$Zk/OR4a23sjRWBgKuaT8R.Sv758hHqUxQ3STAyq7Zz0eTXeoKLH5u',
  'Super Admin',
  '9999999999',
  'SUPER_ADMIN',
  'ACTIVE'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO user_profiles (user_id, full_name, department)
VALUES
  ('a0000001-0000-4000-a000-000000000001'::uuid, 'Super Admin', 'Administration')
ON CONFLICT (user_id) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════════════════════
-- SEED: System Settings
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO system_settings (key, value, category, description) VALUES
  ('app_name', 'TimeToMeal', 'general', 'Application display name'),
  ('app_version', '3.6.04', 'general', 'Current application version'),
  ('max_upload_size_mb', '5', 'uploads', 'Maximum file upload size in megabytes'),
  ('allowed_image_formats', 'jpg,jpeg,png,webp', 'uploads', 'Comma-separated list of allowed image formats'),
  ('cloudinary_folder_prefix', 'TimeToMeal', 'uploads', 'Root folder prefix for Cloudinary uploads'),
  ('default_currency', 'INR', 'payments', 'Default currency code'),
  ('cashfree_environment', 'SANDBOX', 'payments', 'Cashfree payment gateway environment')
ON CONFLICT (key) DO NOTHING;

