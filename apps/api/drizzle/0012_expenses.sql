CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"center_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"category" text NOT NULL,
	"amount" bigint NOT NULL,
	"note" text,
	"spent_on" date NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"void_reason" text,
	"voided_by" uuid,
	"voided_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expenses_amount_chk" CHECK ("expenses"."amount" > 0),
	CONSTRAINT "expenses_status_chk" CHECK ("expenses"."status" in ('ACTIVE','VOIDED')),
	CONSTRAINT "expenses_category_chk" CHECK (length(btrim("expenses"."category")) between 1 and 60),
	CONSTRAINT "expenses_void_chk" CHECK (("expenses"."status" = 'VOIDED') = ("expenses"."voided_at" is not null and "expenses"."void_reason" is not null))
);
--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_voided_by_users_id_fk" FOREIGN KEY ("voided_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_branch_center_fk" FOREIGN KEY ("branch_id","center_id") REFERENCES "public"."branches"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "expenses_center_spent_idx" ON "expenses" USING btree ("center_id","spent_on");--> statement-breakpoint
CREATE INDEX "expenses_branch_idx" ON "expenses" USING btree ("branch_id");
--> statement-breakpoint
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY expenses_tenant ON expenses FOR ALL USING (center_id = app_center_id()) WITH CHECK (center_id = app_center_id());
--> statement-breakpoint
-- Xarajat append-only: UPDATE faqat ACTIVE -> VOIDED (void_* ustunlari bilan), boshqa ustunlar o'zgarmaydi.
CREATE FUNCTION expenses_guard() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'ACTIVE' AND NEW.status = 'VOIDED'
     AND ROW(NEW.id, NEW.center_id, NEW.branch_id, NEW.category, NEW.amount, NEW.note, NEW.spent_on, NEW.created_by, NEW.created_at)
         IS NOT DISTINCT FROM
         ROW(OLD.id, OLD.center_id, OLD.branch_id, OLD.category, OLD.amount, OLD.note, OLD.spent_on, OLD.created_by, OLD.created_at) THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'expenses is append-only: only ACTIVE -> VOIDED is allowed' USING ERRCODE = 'check_violation';
END $$;
--> statement-breakpoint
CREATE TRIGGER expenses_guard BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION expenses_guard();
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'erp_app') THEN
    GRANT SELECT, INSERT, UPDATE ON expenses TO erp_app;
  END IF;
END $$;
