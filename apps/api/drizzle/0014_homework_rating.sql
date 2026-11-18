CREATE TABLE "assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"center_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"teacher_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"attachments" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"due_at" timestamp with time zone,
	"max_score" integer DEFAULT 100 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "assignments_id_center_uq" UNIQUE("id","center_id"),
	CONSTRAINT "assignments_title_chk" CHECK (length(btrim("assignments"."title")) between 1 and 200),
	CONSTRAINT "assignments_max_score_chk" CHECK ("assignments"."max_score" between 1 and 1000)
);
--> statement-breakpoint
CREATE TABLE "rating_points" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"center_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"source" text NOT NULL,
	"source_id" uuid,
	"points" integer NOT NULL,
	"reason" text,
	"created_by" uuid,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rating_points_source_chk" CHECK ("rating_points"."source" in ('HOMEWORK','MANUAL')),
	CONSTRAINT "rating_points_points_chk" CHECK ("rating_points"."points" <> 0 and abs("rating_points"."points") <= 1000),
	CONSTRAINT "rating_points_manual_chk" CHECK ("rating_points"."source" <> 'MANUAL' or ("rating_points"."reason" is not null and length(btrim("rating_points"."reason")) > 0)),
	CONSTRAINT "rating_points_homework_chk" CHECK ("rating_points"."source" <> 'HOMEWORK' or "rating_points"."source_id" is not null)
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"center_id" uuid NOT NULL,
	"assignment_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"text" text,
	"files" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"score" integer,
	"feedback" text,
	"graded_by" uuid,
	"graded_at" timestamp with time zone,
	CONSTRAINT "submissions_id_center_uq" UNIQUE("id","center_id"),
	CONSTRAINT "submissions_score_chk" CHECK ("submissions"."score" is null or "submissions"."score" >= 0),
	CONSTRAINT "submissions_graded_chk" CHECK (("submissions"."score" is null) = ("submissions"."graded_at" is null))
);
--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_group_center_fk" FOREIGN KEY ("group_id","center_id") REFERENCES "public"."groups"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_teacher_center_fk" FOREIGN KEY ("teacher_id","center_id") REFERENCES "public"."users"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_points" ADD CONSTRAINT "rating_points_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_points" ADD CONSTRAINT "rating_points_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_points" ADD CONSTRAINT "rating_points_branch_center_fk" FOREIGN KEY ("branch_id","center_id") REFERENCES "public"."branches"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_points" ADD CONSTRAINT "rating_points_group_center_fk" FOREIGN KEY ("group_id","center_id") REFERENCES "public"."groups"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rating_points" ADD CONSTRAINT "rating_points_student_center_fk" FOREIGN KEY ("student_id","center_id") REFERENCES "public"."users"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_graded_by_users_id_fk" FOREIGN KEY ("graded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_assignment_center_fk" FOREIGN KEY ("assignment_id","center_id") REFERENCES "public"."assignments"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_student_center_fk" FOREIGN KEY ("student_id","center_id") REFERENCES "public"."users"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assignments_group_idx" ON "assignments" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "assignments_center_idx" ON "assignments" USING btree ("center_id");--> statement-breakpoint
CREATE INDEX "rating_points_student_idx" ON "rating_points" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "rating_points_group_at_idx" ON "rating_points" USING btree ("group_id","at");--> statement-breakpoint
CREATE INDEX "rating_points_center_at_idx" ON "rating_points" USING btree ("center_id","at");--> statement-breakpoint
CREATE INDEX "rating_points_source_idx" ON "rating_points" USING btree ("source_id");--> statement-breakpoint
CREATE UNIQUE INDEX "submissions_assignment_student_uq" ON "submissions" USING btree ("assignment_id","student_id");--> statement-breakpoint
CREATE INDEX "submissions_student_idx" ON "submissions" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "submissions_center_idx" ON "submissions" USING btree ("center_id");
--> statement-breakpoint
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE rating_points ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY assignments_tenant ON assignments FOR ALL USING (center_id = app_center_id()) WITH CHECK (center_id = app_center_id());
--> statement-breakpoint
CREATE POLICY submissions_tenant ON submissions FOR ALL USING (center_id = app_center_id()) WITH CHECK (center_id = app_center_id());
--> statement-breakpoint
CREATE POLICY rating_points_tenant ON rating_points FOR ALL USING (center_id = app_center_id()) WITH CHECK (center_id = app_center_id());
--> statement-breakpoint
-- Vazifa va topshiriqlar o'chirilmaydi (vazifa arxivlanadi); reyting voqealari append-only (faqat SELECT/INSERT).
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'erp_app') THEN
    GRANT SELECT, INSERT, UPDATE ON assignments, submissions TO erp_app;
    GRANT SELECT, INSERT ON rating_points TO erp_app;
    GRANT USAGE, SELECT ON SEQUENCE rating_points_id_seq TO erp_app;
  END IF;
END $$;
