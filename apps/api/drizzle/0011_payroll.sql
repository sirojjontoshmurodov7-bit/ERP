CREATE TABLE "payroll_adjustments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"center_id" uuid NOT NULL,
	"period_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"reason" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payroll_adjustments_amount_chk" CHECK ("payroll_adjustments"."amount" <> 0)
);
--> statement-breakpoint
CREATE TABLE "payroll_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"center_id" uuid NOT NULL,
	"period_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"rule_id" uuid NOT NULL,
	"group_id" uuid,
	"base_amount" bigint NOT NULL,
	"amount" bigint NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payroll_items_amount_chk" CHECK ("payroll_items"."amount" > 0 and "payroll_items"."base_amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "payroll_payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"center_id" uuid NOT NULL,
	"period_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"method" text NOT NULL,
	"status" text DEFAULT 'CONFIRMED' NOT NULL,
	"reverses_payout_id" uuid,
	"note" text,
	"paid_by" uuid,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payroll_payouts_id_center_uq" UNIQUE("id","center_id"),
	CONSTRAINT "payroll_payouts_method_chk" CHECK ("payroll_payouts"."method" in ('CASH','CARD','TRANSFER')),
	CONSTRAINT "payroll_payouts_status_chk" CHECK ("payroll_payouts"."status" in ('CONFIRMED','REVERSED')),
	CONSTRAINT "payroll_payouts_amount_chk" CHECK (("payroll_payouts"."reverses_payout_id" is null and "payroll_payouts"."amount" > 0) or ("payroll_payouts"."reverses_payout_id" is not null and "payroll_payouts"."amount" < 0)),
	CONSTRAINT "payroll_payouts_reversal_status_chk" CHECK ("payroll_payouts"."reverses_payout_id" is null or "payroll_payouts"."status" = 'CONFIRMED')
);
--> statement-breakpoint
CREATE TABLE "payroll_periods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"center_id" uuid NOT NULL,
	"month" date NOT NULL,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"calculated_at" timestamp with time zone,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payroll_periods_id_center_uq" UNIQUE("id","center_id"),
	CONSTRAINT "payroll_periods_status_chk" CHECK ("payroll_periods"."status" in ('DRAFT','APPROVED','PAID')),
	CONSTRAINT "payroll_periods_month_chk" CHECK (extract(day from "payroll_periods"."month") = 1),
	CONSTRAINT "payroll_periods_approved_chk" CHECK (("payroll_periods"."status" = 'DRAFT') = ("payroll_periods"."approved_at" is null))
);
--> statement-breakpoint
CREATE TABLE "payroll_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"center_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"group_id" uuid,
	"type" text NOT NULL,
	"amount" bigint,
	"percent" numeric(5, 2),
	"percent_base" text,
	"teacher_kind" text,
	"valid_from" date NOT NULL,
	"valid_to" date,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payroll_rules_id_center_uq" UNIQUE("id","center_id"),
	CONSTRAINT "payroll_rules_type_chk" CHECK ("payroll_rules"."type" in ('FIXED','PERCENT','PER_GROUP','PER_LESSON')),
	CONSTRAINT "payroll_rules_value_chk" CHECK (("payroll_rules"."type" = 'PERCENT' and "payroll_rules"."percent" is not null and "payroll_rules"."percent" > 0 and "payroll_rules"."percent" <= 100 and "payroll_rules"."percent_base" is not null and "payroll_rules"."percent_base" in ('PAID','CHARGED') and "payroll_rules"."amount" is null) or ("payroll_rules"."type" <> 'PERCENT' and "payroll_rules"."amount" is not null and "payroll_rules"."amount" > 0 and "payroll_rules"."percent" is null and "payroll_rules"."percent_base" is null)),
	CONSTRAINT "payroll_rules_kind_chk" CHECK ("payroll_rules"."teacher_kind" is null or "payroll_rules"."teacher_kind" in ('MAIN','ASSISTANT')),
	CONSTRAINT "payroll_rules_dates_chk" CHECK ("payroll_rules"."valid_to" is null or "payroll_rules"."valid_to" >= "payroll_rules"."valid_from")
);
--> statement-breakpoint
ALTER TABLE "payroll_adjustments" ADD CONSTRAINT "payroll_adjustments_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_adjustments" ADD CONSTRAINT "payroll_adjustments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_adjustments" ADD CONSTRAINT "payroll_adjustments_period_center_fk" FOREIGN KEY ("period_id","center_id") REFERENCES "public"."payroll_periods"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_adjustments" ADD CONSTRAINT "payroll_adjustments_employee_center_fk" FOREIGN KEY ("employee_id","center_id") REFERENCES "public"."users"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_period_center_fk" FOREIGN KEY ("period_id","center_id") REFERENCES "public"."payroll_periods"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_employee_center_fk" FOREIGN KEY ("employee_id","center_id") REFERENCES "public"."users"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_rule_center_fk" FOREIGN KEY ("rule_id","center_id") REFERENCES "public"."payroll_rules"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_items" ADD CONSTRAINT "payroll_items_group_center_fk" FOREIGN KEY ("group_id","center_id") REFERENCES "public"."groups"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_payouts" ADD CONSTRAINT "payroll_payouts_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_payouts" ADD CONSTRAINT "payroll_payouts_paid_by_users_id_fk" FOREIGN KEY ("paid_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_payouts" ADD CONSTRAINT "payroll_payouts_period_center_fk" FOREIGN KEY ("period_id","center_id") REFERENCES "public"."payroll_periods"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_payouts" ADD CONSTRAINT "payroll_payouts_employee_center_fk" FOREIGN KEY ("employee_id","center_id") REFERENCES "public"."users"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_payouts" ADD CONSTRAINT "payroll_payouts_reverses_center_fk" FOREIGN KEY ("reverses_payout_id","center_id") REFERENCES "public"."payroll_payouts"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_periods" ADD CONSTRAINT "payroll_periods_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_rules" ADD CONSTRAINT "payroll_rules_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_rules" ADD CONSTRAINT "payroll_rules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_rules" ADD CONSTRAINT "payroll_rules_employee_center_fk" FOREIGN KEY ("employee_id","center_id") REFERENCES "public"."users"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_rules" ADD CONSTRAINT "payroll_rules_group_center_fk" FOREIGN KEY ("group_id","center_id") REFERENCES "public"."groups"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payroll_adjustments_period_idx" ON "payroll_adjustments" USING btree ("period_id");--> statement-breakpoint
CREATE INDEX "payroll_adjustments_center_idx" ON "payroll_adjustments" USING btree ("center_id");--> statement-breakpoint
CREATE INDEX "payroll_items_period_idx" ON "payroll_items" USING btree ("period_id");--> statement-breakpoint
CREATE INDEX "payroll_items_employee_idx" ON "payroll_items" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "payroll_items_center_idx" ON "payroll_items" USING btree ("center_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payroll_payouts_reverses_uq" ON "payroll_payouts" USING btree ("reverses_payout_id") WHERE "payroll_payouts"."reverses_payout_id" is not null;--> statement-breakpoint
CREATE INDEX "payroll_payouts_period_idx" ON "payroll_payouts" USING btree ("period_id");--> statement-breakpoint
CREATE INDEX "payroll_payouts_employee_idx" ON "payroll_payouts" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "payroll_payouts_center_idx" ON "payroll_payouts" USING btree ("center_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payroll_periods_month_uq" ON "payroll_periods" USING btree ("center_id","month");--> statement-breakpoint
CREATE INDEX "payroll_rules_employee_idx" ON "payroll_rules" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "payroll_rules_center_idx" ON "payroll_rules" USING btree ("center_id");
--> statement-breakpoint
ALTER TABLE payroll_rules ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE payroll_items ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE payroll_adjustments ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE payroll_payouts ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY payroll_rules_tenant ON payroll_rules FOR ALL USING (center_id = app_center_id()) WITH CHECK (center_id = app_center_id());
--> statement-breakpoint
CREATE POLICY payroll_periods_tenant ON payroll_periods FOR ALL USING (center_id = app_center_id()) WITH CHECK (center_id = app_center_id());
--> statement-breakpoint
CREATE POLICY payroll_items_tenant ON payroll_items FOR ALL USING (center_id = app_center_id()) WITH CHECK (center_id = app_center_id());
--> statement-breakpoint
CREATE POLICY payroll_adjustments_tenant ON payroll_adjustments FOR ALL USING (center_id = app_center_id()) WITH CHECK (center_id = app_center_id());
--> statement-breakpoint
CREATE POLICY payroll_payouts_tenant ON payroll_payouts FOR ALL USING (center_id = app_center_id()) WITH CHECK (center_id = app_center_id());
--> statement-breakpoint
-- Davr qulfi: qatorlar va tuzatishlar faqat DRAFT davrda o'zgaradi. Davr ko'rinmasa (boshqa markaz) RLS/FK o'zi rad etadi.
CREATE FUNCTION payroll_draft_only() RETURNS trigger
  LANGUAGE plpgsql AS $$
DECLARE
  v_period uuid;
  v_status text;
BEGIN
  IF TG_OP = 'DELETE' THEN v_period := OLD.period_id; ELSE v_period := NEW.period_id; END IF;
  SELECT status INTO v_status FROM payroll_periods WHERE id = v_period;
  IF v_status IS NOT NULL AND v_status <> 'DRAFT' THEN
    RAISE EXCEPTION 'payroll period is locked (append-only after approval)' USING ERRCODE = 'check_violation';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER payroll_items_draft_only BEFORE INSERT OR UPDATE OR DELETE ON payroll_items
  FOR EACH ROW EXECUTE FUNCTION payroll_draft_only();
--> statement-breakpoint
CREATE TRIGGER payroll_adjustments_draft_only BEFORE INSERT OR UPDATE OR DELETE ON payroll_adjustments
  FOR EACH ROW EXECUTE FUNCTION payroll_draft_only();
--> statement-breakpoint
-- Davr holati: DRAFT -> APPROVED -> PAID (va PAID -> APPROVED to'lov qaytarilganda). DRAFT ga qaytish va oy o'zgarishi yo'q.
CREATE FUNCTION payroll_periods_guard() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.month <> OLD.month OR NEW.center_id <> OLD.center_id THEN
    RAISE EXCEPTION 'payroll period month is immutable (append-only)' USING ERRCODE = 'check_violation';
  END IF;
  IF NEW.status <> OLD.status AND NOT (
       (OLD.status = 'DRAFT' AND NEW.status = 'APPROVED')
    OR (OLD.status = 'APPROVED' AND NEW.status = 'PAID')
    OR (OLD.status = 'PAID' AND NEW.status = 'APPROVED')) THEN
    RAISE EXCEPTION 'invalid payroll period status transition (append-only)' USING ERRCODE = 'check_violation';
  END IF;
  IF OLD.status <> 'DRAFT' AND NEW.calculated_at IS DISTINCT FROM OLD.calculated_at THEN
    RAISE EXCEPTION 'payroll period is locked (append-only after approval)' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER payroll_periods_guard BEFORE UPDATE ON payroll_periods
  FOR EACH ROW EXECUTE FUNCTION payroll_periods_guard();
--> statement-breakpoint
-- Maosh to'lovi append-only: UPDATE faqat CONFIRMED -> REVERSED (boshqa ustunlar o'zgarmasa).
CREATE FUNCTION payroll_payouts_guard() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'CONFIRMED' AND NEW.status = 'REVERSED' AND OLD.reverses_payout_id IS NULL
     AND ROW(NEW.id, NEW.center_id, NEW.period_id, NEW.employee_id, NEW.amount, NEW.method, NEW.reverses_payout_id, NEW.note, NEW.paid_by, NEW.paid_at, NEW.created_at)
         IS NOT DISTINCT FROM
         ROW(OLD.id, OLD.center_id, OLD.period_id, OLD.employee_id, OLD.amount, OLD.method, OLD.reverses_payout_id, OLD.note, OLD.paid_by, OLD.paid_at, OLD.created_at) THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'payroll_payouts is append-only: only CONFIRMED -> REVERSED is allowed' USING ERRCODE = 'check_violation';
END $$;
--> statement-breakpoint
CREATE TRIGGER payroll_payouts_guard BEFORE UPDATE ON payroll_payouts
  FOR EACH ROW EXECUTE FUNCTION payroll_payouts_guard();
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'erp_app') THEN
    GRANT SELECT, INSERT, UPDATE ON payroll_rules, payroll_periods, payroll_payouts TO erp_app;
    GRANT SELECT, INSERT, DELETE ON payroll_items, payroll_adjustments TO erp_app;
  END IF;
END $$;
