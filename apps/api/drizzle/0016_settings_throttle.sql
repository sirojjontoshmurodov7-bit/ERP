CREATE TABLE "login_throttle" (
	"key" text PRIMARY KEY NOT NULL,
	"failures" integer DEFAULT 1 NOT NULL,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "login_throttle_failures_chk" CHECK ("login_throttle"."failures" > 0)
);
--> statement-breakpoint
CREATE INDEX "login_throttle_window_idx" ON "login_throttle" USING btree ("window_start");
--> statement-breakpoint
-- Ilova roli jadvalga bevosita tegmaydi (RLS yoqilgan, siyosat yo'q, huquq yo'q): faqat quyidagi tor funksiyalar orqali.
ALTER TABLE login_throttle ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE FUNCTION app_login_throttle_blocked(p_key text, p_max integer, p_window_seconds integer) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
  AS $$ SELECT EXISTS (SELECT 1 FROM login_throttle WHERE key = p_key AND failures >= p_max AND window_start > now() - make_interval(secs => p_window_seconds)) $$;
--> statement-breakpoint
CREATE FUNCTION app_login_throttle_fail(p_key text, p_window_seconds integer) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
  AS $$
BEGIN
  INSERT INTO login_throttle AS t (key, failures, window_start) VALUES (p_key, 1, now())
  ON CONFLICT (key) DO UPDATE SET
    failures = CASE WHEN t.window_start <= now() - make_interval(secs => p_window_seconds) THEN 1 ELSE t.failures + 1 END,
    window_start = CASE WHEN t.window_start <= now() - make_interval(secs => p_window_seconds) THEN now() ELSE t.window_start END;
  -- eski qatorlarni tozalash (har chaqiruvda ozgina)
  DELETE FROM login_throttle WHERE key IN (SELECT key FROM login_throttle WHERE window_start < now() - interval '1 day' LIMIT 50);
END $$;
--> statement-breakpoint
CREATE FUNCTION app_login_throttle_reset(p_key text) RETURNS void
  LANGUAGE sql SECURITY DEFINER SET search_path = public, pg_temp
  AS $$ DELETE FROM login_throttle WHERE key = p_key $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION app_login_throttle_blocked(text, integer, integer) FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION app_login_throttle_fail(text, integer) FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION app_login_throttle_reset(text) FROM PUBLIC;
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'erp_app') THEN
    GRANT EXECUTE ON FUNCTION app_login_throttle_blocked(text, integer, integer), app_login_throttle_fail(text, integer), app_login_throttle_reset(text) TO erp_app;
  END IF;
END $$;
