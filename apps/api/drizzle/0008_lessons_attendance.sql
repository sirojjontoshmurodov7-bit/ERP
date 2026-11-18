CREATE TABLE "attendance_records" (
	"lesson_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"center_id" uuid NOT NULL,
	"status" text NOT NULL,
	"note" text,
	"marked_by" uuid,
	"marked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendance_records_lesson_id_student_id_pk" PRIMARY KEY("lesson_id","student_id"),
	CONSTRAINT "attendance_status_chk" CHECK ("attendance_records"."status" in ('PRESENT','ABSENT','LATE','EXCUSED'))
);
--> statement-breakpoint
CREATE TABLE "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"center_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"lesson_date" date NOT NULL,
	"teacher_id" uuid,
	"topic" text,
	"status" text DEFAULT 'HELD' NOT NULL,
	"locked_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lessons_id_center_uq" UNIQUE("id","center_id"),
	CONSTRAINT "lessons_status_chk" CHECK ("lessons"."status" in ('HELD','CANCELLED'))
);
--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_marked_by_users_id_fk" FOREIGN KEY ("marked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_lesson_center_fk" FOREIGN KEY ("lesson_id","center_id") REFERENCES "public"."lessons"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_student_center_fk" FOREIGN KEY ("student_id","center_id") REFERENCES "public"."users"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_group_center_fk" FOREIGN KEY ("group_id","center_id") REFERENCES "public"."groups"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_teacher_center_fk" FOREIGN KEY ("teacher_id","center_id") REFERENCES "public"."users"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attendance_student_idx" ON "attendance_records" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "attendance_center_idx" ON "attendance_records" USING btree ("center_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lessons_group_date_uq" ON "lessons" USING btree ("group_id","lesson_date");--> statement-breakpoint
CREATE INDEX "lessons_center_idx" ON "lessons" USING btree ("center_id");--> statement-breakpoint
CREATE INDEX "lessons_teacher_idx" ON "lessons" USING btree ("teacher_id");--> statement-breakpoint
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY lessons_tenant ON lessons FOR ALL USING (center_id = app_center_id()) WITH CHECK (center_id = app_center_id());
--> statement-breakpoint
CREATE POLICY attendance_records_tenant ON attendance_records FOR ALL USING (center_id = app_center_id()) WITH CHECK (center_id = app_center_id());
--> statement-breakpoint
-- Dars va davomat yozuvlari o'chirilmaydi (tuzatish UPDATE + audit): DELETE huquqi yo'q.
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'erp_app') THEN
    GRANT SELECT, INSERT, UPDATE ON lessons, attendance_records TO erp_app;
  END IF;
END $$;
