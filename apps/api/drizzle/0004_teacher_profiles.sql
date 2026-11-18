CREATE TABLE "teacher_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"center_id" uuid NOT NULL,
	"specialization" text,
	"note" text
);
--> statement-breakpoint
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_user_center_fk" FOREIGN KEY ("user_id","center_id") REFERENCES "public"."users"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "teacher_profiles_center_idx" ON "teacher_profiles" USING btree ("center_id");--> statement-breakpoint
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY teacher_profiles_tenant ON teacher_profiles FOR ALL USING (center_id = app_center_id()) WITH CHECK (center_id = app_center_id());
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'erp_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON teacher_profiles TO erp_app;
  END IF;
END $$;
