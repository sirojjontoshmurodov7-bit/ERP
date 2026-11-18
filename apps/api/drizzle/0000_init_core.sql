CREATE TABLE "audit_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"center_id" uuid,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" uuid,
	"before" jsonb,
	"after" jsonb,
	"ip" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "branches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"center_id" uuid NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"phone" text,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "center_role_permissions" (
	"center_id" uuid NOT NULL,
	"role" text NOT NULL,
	"permission_code" text NOT NULL,
	"allowed" boolean NOT NULL,
	CONSTRAINT "center_role_permissions_center_id_role_permission_code_pk" PRIMARY KEY("center_id","role","permission_code"),
	CONSTRAINT "crp_role_chk" CHECK ("center_role_permissions"."role" in ('OWNER','ADMIN','CASHIER','TEACHER','STUDENT'))
);
--> statement-breakpoint
CREATE TABLE "centers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"status" text DEFAULT 'TRIAL' NOT NULL,
	"plan_id" uuid,
	"trial_ends_at" timestamp with time zone,
	"blocked_at" timestamp with time zone,
	"blocked_reason" text,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "centers_slug_unique" UNIQUE("slug"),
	CONSTRAINT "centers_status_chk" CHECK ("centers"."status" in ('TRIAL','ACTIVE','BLOCKED'))
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"code" text PRIMARY KEY NOT NULL,
	"module" text NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"price_monthly" bigint DEFAULT 0 NOT NULL,
	"max_students" integer,
	"max_branches" integer,
	"features" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plans_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"center_id" uuid,
	"refresh_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"ip" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_refresh_hash_unique" UNIQUE("refresh_hash")
);
--> statement-breakpoint
CREATE TABLE "user_branches" (
	"user_id" uuid NOT NULL,
	"branch_id" uuid NOT NULL,
	"center_id" uuid NOT NULL,
	CONSTRAINT "user_branches_user_id_branch_id_pk" PRIMARY KEY("user_id","branch_id")
);
--> statement-breakpoint
CREATE TABLE "user_permissions" (
	"user_id" uuid NOT NULL,
	"center_id" uuid NOT NULL,
	"permission_code" text NOT NULL,
	"allowed" boolean NOT NULL,
	CONSTRAINT "user_permissions_user_id_permission_code_pk" PRIMARY KEY("user_id","permission_code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"center_id" uuid,
	"role" text NOT NULL,
	"login" text NOT NULL,
	"password_hash" text NOT NULL,
	"must_change_password" boolean DEFAULT true NOT NULL,
	"full_name" text NOT NULL,
	"phone" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"telegram_chat_id" bigint,
	"totp_secret" text,
	"created_by" uuid,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_role_chk" CHECK ("users"."role" in ('SUPER_ADMIN','OWNER','ADMIN','CASHIER','TEACHER','STUDENT')),
	CONSTRAINT "users_status_chk" CHECK ("users"."status" in ('ACTIVE','SUSPENDED','ARCHIVED')),
	CONSTRAINT "users_center_role_scope_chk" CHECK (("users"."role" = 'SUPER_ADMIN') = ("users"."center_id" is null))
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "branches" ADD CONSTRAINT "branches_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "center_role_permissions" ADD CONSTRAINT "center_role_permissions_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "center_role_permissions" ADD CONSTRAINT "center_role_permissions_permission_code_permissions_code_fk" FOREIGN KEY ("permission_code") REFERENCES "public"."permissions"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "centers" ADD CONSTRAINT "centers_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "centers" ADD CONSTRAINT "centers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_branches" ADD CONSTRAINT "user_branches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_branches" ADD CONSTRAINT "user_branches_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_branches" ADD CONSTRAINT "user_branches_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permission_code_permissions_code_fk" FOREIGN KEY ("permission_code") REFERENCES "public"."permissions"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_center_id_centers_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_center_at_idx" ON "audit_logs" USING btree ("center_id","at");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "branches_center_name_uq" ON "branches" USING btree ("center_id","name");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_branches_branch_idx" ON "user_branches" USING btree ("branch_id");--> statement-breakpoint
CREATE INDEX "user_branches_center_idx" ON "user_branches" USING btree ("center_id");--> statement-breakpoint
CREATE INDEX "user_permissions_center_idx" ON "user_permissions" USING btree ("center_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_login_uq" ON "users" USING btree (lower("login"));--> statement-breakpoint
CREATE INDEX "users_center_role_idx" ON "users" USING btree ("center_id","role");