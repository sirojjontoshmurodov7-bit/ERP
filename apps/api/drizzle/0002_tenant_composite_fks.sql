-- Kompozit (id, center_id) FK'lar: bog'lovchi jadvallarda boshqa markaz yozuviga havola qilishni bazaning o'zi rad etadi
-- (RLS faqat o'z qatorini tekshiradi, havola qilinayotgan qatorni emas). UNIQUE'lar FK'lardan oldin bo'lishi shart.
ALTER TABLE "branches" ADD CONSTRAINT "branches_id_center_uq" UNIQUE("id","center_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_id_center_uq" UNIQUE("id","center_id");--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_center_fk" FOREIGN KEY ("user_id","center_id") REFERENCES "public"."users"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_branches" ADD CONSTRAINT "user_branches_branch_center_fk" FOREIGN KEY ("branch_id","center_id") REFERENCES "public"."branches"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_branches" ADD CONSTRAINT "user_branches_user_center_fk" FOREIGN KEY ("user_id","center_id") REFERENCES "public"."users"("id","center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_center_fk" FOREIGN KEY ("user_id","center_id") REFERENCES "public"."users"("id","center_id") ON DELETE no action ON UPDATE no action;
