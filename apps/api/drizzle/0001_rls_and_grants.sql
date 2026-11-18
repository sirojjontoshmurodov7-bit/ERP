-- Qo'lda yozilgan migratsiya: RLS, huquqlar, append-only triggerlar, auth yordamchi funksiyalar.
-- Qoida: ilova `erp_app` roli (superuser emas, jadval egasi emas) bilan ulanadi, shuning uchun RLS chetlab o'tilmaydi.
-- Har so'rov tranzaksiyasida servis `set_config('app.center_id', ..., true)` va (faqat super admin uchun,
-- tasdiqlangan token asosida) `set_config('app.is_super_admin', 'true', true)` ni o'rnatadi.
CREATE FUNCTION app_center_id() RETURNS uuid
  LANGUAGE sql STABLE
  AS $$ SELECT NULLIF(current_setting('app.center_id', true), '')::uuid $$;
--> statement-breakpoint
CREATE FUNCTION app_is_super_admin() RETURNS boolean
  LANGUAGE sql STABLE
  AS $$ SELECT COALESCE(current_setting('app.is_super_admin', true), '') = 'true' $$;
--> statement-breakpoint

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE centers ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE user_branches ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE center_role_permissions ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

-- plans / permissions: hamma o'qiydi, plans'ni faqat super admin yozadi, permissions'ni ilova yozmaydi (seed yozadi)
CREATE POLICY plans_read ON plans FOR SELECT USING (true);
--> statement-breakpoint
CREATE POLICY plans_super_write ON plans FOR ALL USING (app_is_super_admin()) WITH CHECK (app_is_super_admin());
--> statement-breakpoint
CREATE POLICY permissions_read ON permissions FOR SELECT USING (true);
--> statement-breakpoint

-- centers: markaz faqat o'zini ko'radi/tahrirlaydi; super admin hammasini boshqaradi
CREATE POLICY centers_tenant_select ON centers FOR SELECT USING (id = app_center_id());
--> statement-breakpoint
CREATE POLICY centers_tenant_update ON centers FOR UPDATE USING (id = app_center_id()) WITH CHECK (id = app_center_id());
--> statement-breakpoint
CREATE POLICY centers_super ON centers FOR ALL USING (app_is_super_admin()) WITH CHECK (app_is_super_admin());
--> statement-breakpoint

-- center_id bo'yicha izolyatsiyalangan jadvallar. Super admin tenant ichki ma'lumotini ko'rmaydi (ERD 3.1);
-- markaz yaratishda servis o'sha tranzaksiyada app.center_id ni yangi markazga o'rnatib, filial/rol shablonini yozadi.
CREATE POLICY branches_tenant ON branches FOR ALL USING (center_id = app_center_id()) WITH CHECK (center_id = app_center_id());
--> statement-breakpoint
CREATE POLICY user_branches_tenant ON user_branches FOR ALL USING (center_id = app_center_id()) WITH CHECK (center_id = app_center_id());
--> statement-breakpoint
CREATE POLICY crp_tenant ON center_role_permissions FOR ALL USING (center_id = app_center_id()) WITH CHECK (center_id = app_center_id());
--> statement-breakpoint
CREATE POLICY user_permissions_tenant ON user_permissions FOR ALL USING (center_id = app_center_id()) WITH CHECK (center_id = app_center_id());
--> statement-breakpoint

-- users: markaz ichida; super admin faqat SUPER_ADMIN va OWNER qatorlarini ko'radi/yozadi
CREATE POLICY users_tenant ON users FOR ALL USING (center_id = app_center_id()) WITH CHECK (center_id = app_center_id());
--> statement-breakpoint
CREATE POLICY users_super ON users FOR ALL
  USING (app_is_super_admin() AND role IN ('SUPER_ADMIN', 'OWNER'))
  WITH CHECK (app_is_super_admin() AND role IN ('SUPER_ADMIN', 'OWNER'));
--> statement-breakpoint

-- sessions: markaz sessiyalari markaz ichida; super admin sessiyalari (center_id NULL) faqat super admin kontekstida
CREATE POLICY sessions_tenant ON sessions FOR ALL USING (center_id = app_center_id()) WITH CHECK (center_id = app_center_id());
--> statement-breakpoint
CREATE POLICY sessions_super ON sessions FOR ALL
  USING (app_is_super_admin() AND center_id IS NULL)
  WITH CHECK (app_is_super_admin() AND center_id IS NULL);
--> statement-breakpoint

-- audit_logs: markaz o'z yozuvlarini o'qiydi va yozadi; super admin faqat platforma yozuvlarini o'qiydi, istalganini yozadi
CREATE POLICY audit_tenant_select ON audit_logs FOR SELECT USING (center_id = app_center_id());
--> statement-breakpoint
CREATE POLICY audit_tenant_insert ON audit_logs FOR INSERT WITH CHECK (center_id = app_center_id());
--> statement-breakpoint
CREATE POLICY audit_super_select ON audit_logs FOR SELECT
  USING (app_is_super_admin() AND (center_id IS NULL OR entity IN ('center', 'owner', 'plan', 'saas_invoice')));
--> statement-breakpoint
CREATE POLICY audit_super_insert ON audit_logs FOR INSERT WITH CHECK (app_is_super_admin());
--> statement-breakpoint

-- audit_logs append-only
CREATE FUNCTION audit_logs_immutable() RETURNS trigger
  LANGUAGE plpgsql
  AS $$ BEGIN RAISE EXCEPTION 'audit_logs is append-only (% not allowed)', TG_OP USING ERRCODE = 'restrict_violation'; END $$;
--> statement-breakpoint
CREATE TRIGGER audit_logs_no_update_delete BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION audit_logs_immutable();
--> statement-breakpoint
CREATE TRIGGER audit_logs_no_truncate BEFORE TRUNCATE ON audit_logs
  FOR EACH STATEMENT EXECUTE FUNCTION audit_logs_immutable();
--> statement-breakpoint

-- Kirishdan oldin tenant noma'lum, shuning uchun login/sessiya qidirish RLS'ni chetlab o'tuvchi
-- tor SECURITY DEFINER funksiyalar orqali (faqat shu ikki so'rov).
CREATE FUNCTION app_auth_find_user(p_login text) RETURNS SETOF users
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
  AS $$ SELECT * FROM users WHERE lower(login) = lower(p_login) LIMIT 1 $$;
--> statement-breakpoint
CREATE FUNCTION app_auth_find_session(p_refresh_hash text) RETURNS SETOF sessions
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
  AS $$ SELECT * FROM sessions WHERE refresh_hash = p_refresh_hash LIMIT 1 $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION app_auth_find_user(text) FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION app_auth_find_session(text) FROM PUBLIC;
--> statement-breakpoint

-- Huquqlar. Yumshoq o'chirish qoidasi: users, centers, branches, plans'dan DELETE berilmaydi;
-- audit_logs'ga faqat SELECT/INSERT. `erp_app` roli bo'lmasa (masalan boshqa hostingda) o'tkazib yuboriladi.
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'erp_app') THEN
    GRANT USAGE ON SCHEMA public TO erp_app;
    GRANT SELECT, INSERT, UPDATE ON plans, centers, branches, users TO erp_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON user_branches, center_role_permissions, user_permissions, sessions TO erp_app;
    GRANT SELECT ON permissions TO erp_app;
    GRANT SELECT, INSERT ON audit_logs TO erp_app;
    GRANT USAGE ON SEQUENCE audit_logs_id_seq TO erp_app;
    GRANT EXECUTE ON FUNCTION app_auth_find_user(text), app_auth_find_session(text) TO erp_app;
  END IF;
END $$;
