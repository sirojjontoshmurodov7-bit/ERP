CREATE TABLE "enrollment_discounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"center_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"type" text NOT NULL,
	"value" bigint,
	"reason" text,
	"from_date" date,
	"to_date" date,
	"granted_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enrollment_discounts_type_chk" CHECK ("enrollment_discounts"."type" in ('PERCENT','AMOUNT','FREE')),
	CONSTRAINT "enrollment_discounts_value_chk" CHECK (("enrollment_discounts"."type" = 'FREE' and "enrollment_discounts"."value" is null) or ("enrollment_discounts"."type" = 'PERCENT' and "enrollment_discounts"."value" is not null and "enrollment_discounts"."value" between 1 and 100) or ("enrollment_discounts"."type" = 'AMOUNT' and "enrollment_discounts"."value" is not null and "enrollment_discounts"."value" > 0)),
	CONSTRAINT "enrollment_discounts_dates_chk" CHECK ("enrollment_discounts"."to_date" is null or "enrollment_discounts"."from_date" is null or "enrollment_discounts"."to_date" >= "enrollment_discounts"."from_date")
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"center_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"joined_at" date DEFAULT current_date NOT NULL,
	"left_at" date,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"billing_anchor" date,
	"price_override" bigint,
	"left_reason" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enrollments_id_center_uq" UNIQUE("id","center_id"),
	CONSTRAINT "enrollments_status_chk" CHECK ("enrollments"."status" in ('ACTIVE','FROZEN','LEFT')),
	CONSTRAINT "enrollments_left_chk" CHECK (("enrollments"."status" = 'LEFT') = ("enrollments"."left_at" is not null)),
	CONSTRAINT "enrollments_dates_chk" CHECK ("enrollments"."left_at" is null or "enrollments"."left_at" >= "enrollments"."joined_at"),
	CONSTRAINT "enrollments_price_chk" CHECK ("enrollments"."price_override" is null or "enrollments"."price_override" >= 0)
);
--> statement-breakpoint
ALTER TABLE "enrollment_discounts" ADD CONSTRAINT "enrollment_discounts_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_discounts" ADD CONSTRAINT "enrollment_discounts_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollment_discounts" ADD CONSTRAINT "enrollment_discounts_enrollment_center_fk" FOREIGN KEY ("enrollment_id","center_id") REFERENCES "public"."enrollments"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_group_center_fk" FOREIGN KEY ("group_id","center_id") REFERENCES "public"."groups"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_center_fk" FOREIGN KEY ("student_id","center_id") REFERENCES "public"."users"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "enrollment_discounts_enrollment_idx" ON "enrollment_discounts" USING btree ("enrollment_id");--> statement-breakpoint
CREATE INDEX "enrollment_discounts_center_idx" ON "enrollment_discounts" USING btree ("center_id");--> statement-breakpoint
CREATE UNIQUE INDEX "enrollments_open_uq" ON "enrollments" USING btree ("group_id","student_id") WHERE "enrollments"."status" <> 'LEFT';--> statement-breakpoint
CREATE INDEX "enrollments_student_idx" ON "enrollments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "enrollments_group_idx" ON "enrollments" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "enrollments_center_idx" ON "enrollments" USING btree ("center_id");--> statement-breakpoint
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE enrollment_discounts ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY enrollments_tenant ON enrollments FOR ALL USING (center_id = app_center_id()) WITH CHECK (center_id = app_center_id());
--> statement-breakpoint
CREATE POLICY enrollment_discounts_tenant ON enrollment_discounts FOR ALL USING (center_id = app_center_id()) WITH CHECK (center_id = app_center_id());
--> statement-breakpoint
-- Tarix saqlanadi: yozilish va chegirmalardan DELETE huquqi yo'q.
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'erp_app') THEN
    GRANT SELECT, INSERT, UPDATE ON enrollments, enrollment_discounts TO erp_app;
  END IF;
END $$;
