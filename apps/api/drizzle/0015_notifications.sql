CREATE TABLE "notification_log" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"center_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"channel" text DEFAULT 'TELEGRAM' NOT NULL,
	"type" text NOT NULL,
	"dedupe_key" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text NOT NULL,
	"error" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_log_channel_chk" CHECK ("notification_log"."channel" in ('TELEGRAM','SMS')),
	CONSTRAINT "notification_log_type_chk" CHECK ("notification_log"."type" in ('DEBT','LESSON','HOMEWORK','PAYROLL','MANUAL')),
	CONSTRAINT "notification_log_status_chk" CHECK ("notification_log"."status" in ('SENT','FAILED'))
);
--> statement-breakpoint
CREATE TABLE "telegram_link_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"center_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "telegram_link_codes_expiry_chk" CHECK ("telegram_link_codes"."expires_at" > "telegram_link_codes"."created_at")
);
--> statement-breakpoint
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_log" ADD CONSTRAINT "notification_log_user_center_fk" FOREIGN KEY ("user_id","center_id") REFERENCES "public"."users"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_link_codes" ADD CONSTRAINT "telegram_link_codes_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_link_codes" ADD CONSTRAINT "telegram_link_codes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_link_codes" ADD CONSTRAINT "telegram_link_codes_user_center_fk" FOREIGN KEY ("user_id","center_id") REFERENCES "public"."users"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notification_log_center_created_idx" ON "notification_log" USING btree ("center_id","created_at");--> statement-breakpoint
CREATE INDEX "notification_log_user_type_idx" ON "notification_log" USING btree ("user_id","type","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_log_dedupe_uq" ON "notification_log" USING btree ("user_id","dedupe_key") WHERE "notification_log"."status" = 'SENT' and "notification_log"."dedupe_key" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "telegram_link_codes_hash_uq" ON "telegram_link_codes" USING btree ("code_hash");--> statement-breakpoint
CREATE INDEX "telegram_link_codes_user_idx" ON "telegram_link_codes" USING btree ("user_id");
--> statement-breakpoint
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE telegram_link_codes ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY notification_log_tenant ON notification_log FOR ALL USING (center_id = app_center_id()) WITH CHECK (center_id = app_center_id());
--> statement-breakpoint
CREATE POLICY telegram_link_codes_tenant ON telegram_link_codes FOR ALL USING (center_id = app_center_id()) WITH CHECK (center_id = app_center_id());
--> statement-breakpoint
-- Webhook'da tenant noma'lum: kodni ishlatish va bog'lash RLS'ni chetlab o'tuvchi tor funksiyalar orqali (login funksiyalari kabi).
CREATE FUNCTION app_telegram_redeem(p_code_hash text, p_chat_id bigint)
  RETURNS TABLE (r_user_id uuid, r_center_id uuid, r_full_name text)
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
  AS $$
DECLARE
  v_user uuid;
BEGIN
  UPDATE telegram_link_codes c SET used_at = now()
    WHERE c.code_hash = p_code_hash AND c.used_at IS NULL AND c.expires_at > now()
    RETURNING c.user_id INTO v_user;
  IF v_user IS NULL THEN
    RETURN;
  END IF;
  UPDATE users u SET telegram_chat_id = p_chat_id, updated_at = now() WHERE u.id = v_user AND u.status = 'ACTIVE';
  RETURN QUERY SELECT u.id, u.center_id, u.full_name FROM users u WHERE u.id = v_user AND u.telegram_chat_id = p_chat_id;
END $$;
--> statement-breakpoint
CREATE FUNCTION app_telegram_unlink(p_chat_id bigint) RETURNS integer
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
  AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE users SET telegram_chat_id = NULL, updated_at = now() WHERE telegram_chat_id = p_chat_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION app_telegram_redeem(text, bigint) FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION app_telegram_unlink(bigint) FROM PUBLIC;
--> statement-breakpoint
-- Jurnal append-only (SELECT/INSERT); kodlar: UPDATE bor (ishlatilgan/muddati tugagan belgisi), DELETE yo'q.
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'erp_app') THEN
    GRANT SELECT, INSERT ON notification_log TO erp_app;
    GRANT USAGE, SELECT ON SEQUENCE notification_log_id_seq TO erp_app;
    GRANT SELECT, INSERT, UPDATE ON telegram_link_codes TO erp_app;
    GRANT EXECUTE ON FUNCTION app_telegram_redeem(text, bigint), app_telegram_unlink(bigint) TO erp_app;
  END IF;
END $$;
