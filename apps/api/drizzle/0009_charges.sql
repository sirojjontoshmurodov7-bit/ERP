CREATE TABLE "charges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"center_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"due_date" date NOT NULL,
	"base_amount" bigint NOT NULL,
	"discount_amount" bigint DEFAULT 0 NOT NULL,
	"amount" bigint NOT NULL,
	"status" text DEFAULT 'OPEN' NOT NULL,
	"kind" text NOT NULL,
	"note" text,
	"cancelled_at" timestamp with time zone,
	"cancel_reason" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "charges_id_center_uq" UNIQUE("id","center_id"),
	CONSTRAINT "charges_status_chk" CHECK ("charges"."status" in ('OPEN','PARTIAL','PAID','CANCELLED')),
	CONSTRAINT "charges_kind_chk" CHECK ("charges"."kind" in ('REGULAR','FIRST_PRORATED','MANUAL')),
	CONSTRAINT "charges_amounts_chk" CHECK ("charges"."base_amount" >= 0 and "charges"."discount_amount" >= 0 and "charges"."discount_amount" <= "charges"."base_amount" and "charges"."amount" = "charges"."base_amount" - "charges"."discount_amount"),
	CONSTRAINT "charges_period_chk" CHECK ("charges"."period_end" >= "charges"."period_start"),
	CONSTRAINT "charges_manual_note_chk" CHECK ("charges"."kind" <> 'MANUAL' or "charges"."note" is not null),
	CONSTRAINT "charges_cancel_chk" CHECK (("charges"."status" = 'CANCELLED') = ("charges"."cancelled_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "enrollment_freezes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"center_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"from_date" date NOT NULL,
	"to_date" date,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enrollment_freezes_dates_chk" CHECK ("enrollment_freezes"."to_date" is null or "enrollment_freezes"."to_date" >= "enrollment_freezes"."from_date")
);
--> statement-breakpoint
ALTER TABLE "charges" ADD CONSTRAINT "charges_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charges" ADD CONSTRAINT "charges_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charges" ADD CONSTRAINT "charges_enrollment_center_fk" FOREIGN KEY ("enrollment_id","center_id") REFERENCES "public"."enrollments"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charges" ADD CONSTRAINT "charges_student_center_fk" FOREIGN KEY ("student_id","center_id") REFERENCES "public"."users"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "charges" ADD CONSTRAINT "charges_group_center_fk" FOREIGN KEY ("group_id","center_id") REFERENCES "public"."groups"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_freezes" ADD CONSTRAINT "enrollment_freezes_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_freezes" ADD CONSTRAINT "enrollment_freezes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_freezes" ADD CONSTRAINT "enrollment_freezes_enrollment_center_fk" FOREIGN KEY ("enrollment_id","center_id") REFERENCES "public"."enrollments"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "charges_cycle_uq" ON "charges" USING btree ("enrollment_id","period_start") WHERE "charges"."kind" in ('REGULAR','FIRST_PRORATED');--> statement-breakpoint
CREATE INDEX "charges_enrollment_idx" ON "charges" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "charges_student_idx" ON "charges" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "charges_group_idx" ON "charges" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "charges_center_due_idx" ON "charges" USING btree ("center_id","due_date");--> statement-breakpoint
CREATE UNIQUE INDEX "enrollment_freezes_open_uq" ON "enrollment_freezes" USING btree ("enrollment_id") WHERE "enrollment_freezes"."to_date" is null;--> statement-breakpoint
CREATE INDEX "enrollment_freezes_enrollment_idx" ON "enrollment_freezes" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "enrollment_freezes_center_idx" ON "enrollment_freezes" USING btree ("center_id");--> statement-breakpoint
ALTER TABLE charges ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE enrollment_freezes ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY charges_tenant ON charges FOR ALL USING (center_id = app_center_id()) WITH CHECK (center_id = app_center_id());
--> statement-breakpoint
CREATE POLICY enrollment_freezes_tenant ON enrollment_freezes FOR ALL USING (center_id = app_center_id()) WITH CHECK (center_id = app_center_id());
--> statement-breakpoint
-- Hisob-kitob va muzlatish tarixi o'chirilmaydi: DELETE huquqi yo'q (bekor qilish CANCELLED bilan).
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'erp_app') THEN
    GRANT SELECT, INSERT, UPDATE ON charges, enrollment_freezes TO erp_app;
  END IF;
END $$;
--> statement-breakpoint
-- Oldin muzlatilgan yozilishlar uchun ochiq muzlatish davri (sana noma'lum: oxirgi o'zgarish kuni).
INSERT INTO enrollment_freezes (center_id, enrollment_id, from_date)
  SELECT center_id, id, updated_at::date FROM enrollments WHERE status = 'FROZEN';
