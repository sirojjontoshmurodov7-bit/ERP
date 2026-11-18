-- Ilova superuser bo'lmagan rol bilan ulanadi, shunda RLS siyosatlari chetlab o'tilmaydi.
-- Jadvallar huquqlari migratsiyalarda beriladi.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'erp_app') THEN
    CREATE ROLE erp_app LOGIN PASSWORD 'erp_app_password' NOSUPERUSER NOBYPASSRLS;
  END IF;
END $$;
GRANT CONNECT ON DATABASE erp TO erp_app;
