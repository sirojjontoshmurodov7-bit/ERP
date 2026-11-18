CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"center_id" uuid NOT NULL,
	"name" text NOT NULL,
	"default_price" bigint,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "courses_id_center_uq" UNIQUE("id","center_id"),
	CONSTRAINT "courses_price_chk" CHECK ("courses"."default_price" is null or "courses"."default_price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "group_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"center_id" uuid NOT NULL,
	"weekday" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"room" text,
	CONSTRAINT "group_schedules_weekday_chk" CHECK ("group_schedules"."weekday" between 1 and 7),
	CONSTRAINT "group_schedules_time_chk" CHECK ("group_schedules"."end_time" > "group_schedules"."start_time")
);
--> statement-breakpoint
CREATE TABLE "group_teachers" (
	"group_id" uuid NOT NULL,
	"teacher_id" uuid NOT NULL,
	"center_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"from_date" date DEFAULT current_date NOT NULL,
	"to_date" date,
	CONSTRAINT "group_teachers_group_id_teacher_id_from_date_pk" PRIMARY KEY("group_id","teacher_id","from_date"),
	CONSTRAINT "group_teachers_kind_chk" CHECK ("group_teachers"."kind" in ('MAIN','ASSISTANT')),
	CONSTRAINT "group_teachers_dates_chk" CHECK ("group_teachers"."to_date" is null or "group_teachers"."to_date" >= "group_teachers"."from_date")
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"center_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"name" text NOT NULL,
	"price_monthly" bigint NOT NULL,
	"billing_mode" text NOT NULL,
	"billing_day" integer,
	"grace_days" integer DEFAULT 0 NOT NULL,
	"start_date" date,
	"end_date" date,
	"status" text DEFAULT 'PLANNED' NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "groups_id_center_uq" UNIQUE("id","center_id"),
	CONSTRAINT "groups_price_chk" CHECK ("groups"."price_monthly" >= 0),
	CONSTRAINT "groups_billing_mode_chk" CHECK ("groups"."billing_mode" in ('GROUP_CYCLE','STUDENT_CYCLE')),
	CONSTRAINT "groups_billing_day_chk" CHECK (("groups"."billing_mode" = 'GROUP_CYCLE' and "groups"."billing_day" is not null and "groups"."billing_day" between 1 and 28) or ("groups"."billing_mode" = 'STUDENT_CYCLE' and "groups"."billing_day" is null)),
	CONSTRAINT "groups_grace_chk" CHECK ("groups"."grace_days" between 0 and 60),
	CONSTRAINT "groups_status_chk" CHECK ("groups"."status" in ('PLANNED','ACTIVE','FINISHED')),
	CONSTRAINT "groups_dates_chk" CHECK ("groups"."end_date" is null or "groups"."start_date" is null or "groups"."end_date" >= "groups"."start_date")
);
--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_schedules" ADD CONSTRAINT "group_schedules_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_schedules" ADD CONSTRAINT "group_schedules_group_center_fk" FOREIGN KEY ("group_id","center_id") REFERENCES "public"."groups"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_teachers" ADD CONSTRAINT "group_teachers_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_teachers" ADD CONSTRAINT "group_teachers_group_center_fk" FOREIGN KEY ("group_id","center_id") REFERENCES "public"."groups"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_teachers" ADD CONSTRAINT "group_teachers_teacher_center_fk" FOREIGN KEY ("teacher_id","center_id") REFERENCES "public"."users"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_branch_center_fk" FOREIGN KEY ("branch_id","center_id") REFERENCES "public"."branches"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_course_center_fk" FOREIGN KEY ("course_id","center_id") REFERENCES "public"."courses"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "courses_center_name_uq" ON "courses" USING btree ("center_id",lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "group_schedules_slot_uq" ON "group_schedules" USING btree ("group_id","weekday","start_time");--> statement-breakpoint
CREATE INDEX "group_schedules_center_idx" ON "group_schedules" USING btree ("center_id");--> statement-breakpoint
CREATE UNIQUE INDEX "group_teachers_one_main_uq" ON "group_teachers" USING btree ("group_id") WHERE "group_teachers"."kind" = 'MAIN' and "group_teachers"."to_date" is null;--> statement-breakpoint
CREATE INDEX "group_teachers_teacher_idx" ON "group_teachers" USING btree ("teacher_id");--> statement-breakpoint
CREATE INDEX "group_teachers_center_idx" ON "group_teachers" USING btree ("center_id");--> statement-breakpoint
CREATE UNIQUE INDEX "groups_branch_name_uq" ON "groups" USING btree ("branch_id",lower("name"));--> statement-breakpoint
CREATE INDEX "groups_center_branch_idx" ON "groups" USING btree ("center_id","branch_id");--> statement-breakpoint
CREATE INDEX "groups_course_idx" ON "groups" USING btree ("course_id");--> statement-breakpoint
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE group_schedules ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE group_teachers ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY courses_tenant ON courses FOR ALL USING (center_id = app_center_id()) WITH CHECK (center_id = app_center_id());
--> statement-breakpoint
CREATE POLICY groups_tenant ON groups FOR ALL USING (center_id = app_center_id()) WITH CHECK (center_id = app_center_id());
--> statement-breakpoint
CREATE POLICY group_schedules_tenant ON group_schedules FOR ALL USING (center_id = app_center_id()) WITH CHECK (center_id = app_center_id());
--> statement-breakpoint
CREATE POLICY group_teachers_tenant ON group_teachers FOR ALL USING (center_id = app_center_id()) WITH CHECK (center_id = app_center_id());
--> statement-breakpoint
-- Yumshoq o'chirish: kurs va guruhdan DELETE yo'q (arxivlanadi); ustoz biriktirish tarixi saqlanadi (DELETE yo'q);
-- jadval qatorlarini almashtirish uchun group_schedules'dan DELETE bor.
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'erp_app') THEN
    GRANT SELECT, INSERT, UPDATE ON courses, groups, group_teachers TO erp_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON group_schedules TO erp_app;
  END IF;
END $$;
