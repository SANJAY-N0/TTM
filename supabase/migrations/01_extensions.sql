-- ============================================================================
-- TimeToMeal SaaS Platform — 01_extensions.sql
-- Required PostgreSQL extensions for UUID generation, crypto, and auto-timestamps
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";        -- gen_random_uuid(), crypt(), gen_salt()
CREATE EXTENSION IF NOT EXISTS "moddatetime";     -- Auto-update updated_at columns via trigger
