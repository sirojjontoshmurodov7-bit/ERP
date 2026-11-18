CREATE TABLE "import_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"center_id" uuid NOT NULL,
	"type" text NOT NULL,
	"file_name" text NOT NULL,
	"status" text NOT NULL,
	"total_rows" integer NOT NULL,
	"created_rows" integer DEFAULT 0 NOT NULL,
	"error_rows" integer DEFAULT 0 NOT NULL,
	"skip_invalid" boolean DEFAULT false NOT NULL,
	"report" jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "import_jobs_type_chk" CHECK ("import_jobs"."type" in ('STUDENTS','GROUPS','PAYMENTS')),
	CONSTRAINT "import_jobs_status_chk" CHECK ("import_jobs"."status" in ('DONE','REJECTED')),
	CONSTRAINT "import_jobs_counts_chk" CHECK ("import_jobs"."total_rows" >= 0 and "import_jobs"."created_rows" >= 0 and "import_jobs"."error_rows" >= 0 and "import_jobs"."created_rows" <= "import_jobs"."total_rows"),
	CONSTRAINT "import_jobs_rejected_chk" CHECK ("import_jobs"."status" <> 'REJECTED' or "import_jobs"."created_rows" = 0)
);
--> statement-breakpoint
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "import_jobs_center_created_idx" ON "import_jobs" USING btree ("center_id","created_at");
--> statement-breakpoint
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY import_jobs_tenant ON import_jobs FOR ALL USING (center_id = app_center_id()) WITH CHECK (center_id = app_center_id());
--> statement-breakpoint
-- Import tarixi o'zgarmaydi va o'chirilmaydi: faqat SELECT va INSERT.
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'erp_app') THEN
    GRANT SELECT, INSERT ON import_jobs TO erp_app;
  END IF;
END $$;
