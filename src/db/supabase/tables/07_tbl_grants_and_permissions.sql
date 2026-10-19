-- ========================================================================
-- FOODIE POS: SUPABASE PERMISSIONS & ACCESS CONTROL (GRANTS)
-- Run this script in the Supabase SQL Editor to grant proper permissions
-- to the API roles ('service_role', 'anon', 'authenticated').
-- ========================================================================

-- 1. Grant Schema Usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Grant Table Privileges
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- 3. Grant Sequence Privileges (for SERIAL / AUTO_INCREMENT columns)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 4. Grant Routine/Function Privileges
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- 5. Set Future Default Privileges for newly created objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
