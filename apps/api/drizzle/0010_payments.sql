CREATE TABLE "payment_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"center_id" uuid NOT NULL,
	"payment_id" uuid NOT NULL,
	"charge_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_allocations_amount_chk" CHECK ("payment_allocations"."amount" <> 0)
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"center_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"method" text NOT NULL,
	"status" text DEFAULT 'CONFIRMED' NOT NULL,
	"reverses_payment_id" uuid,
	"received_by" uuid,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"receipt_no" bigint NOT NULL,
	"external_txn_id" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_id_center_uq" UNIQUE("id","center_id"),
	CONSTRAINT "payments_method_chk" CHECK ("payments"."method" in ('CASH','CARD','TRANSFER','CLICK','PAYME')),
	CONSTRAINT "payments_status_chk" CHECK ("payments"."status" in ('CONFIRMED','REVERSED')),
	CONSTRAINT "payments_amount_chk" CHECK (("payments"."reverses_payment_id" is null and "payments"."amount" > 0) or ("payments"."reverses_payment_id" is not null and "payments"."amount" < 0)),
	CONSTRAINT "payments_reversal_status_chk" CHECK ("payments"."reverses_payment_id" is null or "payments"."status" = 'CONFIRMED')
);
--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_payment_center_fk" FOREIGN KEY ("payment_id","center_id") REFERENCES "public"."payments"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_charge_center_fk" FOREIGN KEY ("charge_id","center_id") REFERENCES "public"."charges"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_received_by_users_id_fk" FOREIGN KEY ("received_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_branch_center_fk" FOREIGN KEY ("branch_id","center_id") REFERENCES "public"."branches"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_student_center_fk" FOREIGN KEY ("student_id","center_id") REFERENCES "public"."users"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_reverses_center_fk" FOREIGN KEY ("reverses_payment_id","center_id") REFERENCES "public"."payments"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_allocations_payment_idx" ON "payment_allocations" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "payment_allocations_charge_idx" ON "payment_allocations" USING btree ("charge_id");--> statement-breakpoint
CREATE INDEX "payment_allocations_center_idx" ON "payment_allocations" USING btree ("center_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_receipt_uq" ON "payments" USING btree ("center_id","receipt_no");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_reverses_uq" ON "payments" USING btree ("reverses_payment_id") WHERE "payments"."reverses_payment_id" is not null;--> statement-breakpoint
CREATE INDEX "payments_student_idx" ON "payments" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "payments_center_paid_idx" ON "payments" USING btree ("center_id","paid_at");--> statement-breakpoint
CREATE INDEX "payments_branch_idx" ON "payments" USING btree ("branch_id");--> statement-breakpoint
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY payments_tenant ON payments FOR ALL USING (center_id = app_center_id()) WITH CHECK (center_id = app_center_id());
--> statement-breakpoint
CREATE POLICY payment_allocations_tenant ON payment_allocations FOR ALL USING (center_id = app_center_id()) WITH CHECK (center_id = app_center_id());
--> statement-breakpoint
-- To'lov append-only: faqat CONFIRMED -> REVERSED o'tishi (boshqa hech bir ustun o'zgarmaydi); taqsimot faqat INSERT.
CREATE FUNCTION payments_guard() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'CONFIRMED' AND NEW.status = 'REVERSED' AND OLD.reverses_payment_id IS NULL
     AND ROW(NEW.id, NEW.center_id, NEW.branch_id, NEW.student_id, NEW.amount, NEW.method, NEW.reverses_payment_id, NEW.received_by, NEW.paid_at, NEW.receipt_no, NEW.external_txn_id, NEW.note, NEW.created_at)
         IS NOT DISTINCT FROM
         ROW(OLD.id, OLD.center_id, OLD.branch_id, OLD.student_id, OLD.amount, OLD.method, OLD.reverses_payment_id, OLD.received_by, OLD.paid_at, OLD.receipt_no, OLD.external_txn_id, OLD.note, OLD.created_at) THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'payments is append-only: only CONFIRMED -> REVERSED is allowed' USING ERRCODE = 'check_violation';
END $$;
--> statement-breakpoint
CREATE TRIGGER payments_guard BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION payments_guard();
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'erp_app') THEN
    GRANT SELECT, INSERT, UPDATE ON payments TO erp_app;
    GRANT SELECT, INSERT ON payment_allocations TO erp_app;
  END IF;
END $$;
