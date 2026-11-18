-- RLS `centers` qatorini markaz rahbariga tahrirlashga ruxsat beradi (nom, sozlamalar), lekin tarif, holat,
-- sinov muddati va bloklash maydonlari platformaga tegishli. Servis xatosi yoki buzilgan rahbar akkaunti
-- o'z markazini "ACTIVE" qilib qo'ya olmasligi uchun bu maydonlarni faqat super admin kontekstida o'zgartirish mumkin.
-- Tenant konteksti yo'q (migratsiya, seed, texnik ish) bo'lsa tekshiruv o'tkazib yuboriladi.
CREATE FUNCTION centers_guard_platform_columns() RETURNS trigger
  LANGUAGE plpgsql
  AS $$
BEGIN
  IF app_center_id() IS NOT NULL AND NOT app_is_super_admin() AND (
       NEW.id IS DISTINCT FROM OLD.id
    OR NEW.slug IS DISTINCT FROM OLD.slug
    OR NEW.status IS DISTINCT FROM OLD.status
    OR NEW.plan_id IS DISTINCT FROM OLD.plan_id
    OR NEW.trial_ends_at IS DISTINCT FROM OLD.trial_ends_at
    OR NEW.blocked_at IS DISTINCT FROM OLD.blocked_at
    OR NEW.blocked_reason IS DISTINCT FROM OLD.blocked_reason
    OR NEW.created_by IS DISTINCT FROM OLD.created_by
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
  ) THEN
    RAISE EXCEPTION 'centers: platform columns can be changed by super admin only' USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER centers_guard_platform_columns BEFORE UPDATE ON centers
  FOR EACH ROW EXECUTE FUNCTION centers_guard_platform_columns();
