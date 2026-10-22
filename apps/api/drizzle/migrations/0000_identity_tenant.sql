CREATE TABLE "business_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_units_tenant_id" UNIQUE("organization_id","id")
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"active" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_tenant_id" UNIQUE("organization_id","id"),
	CONSTRAINT "memberships_user_tenant" UNIQUE("organization_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_assignment_business_units" (
	"organization_id" uuid NOT NULL,
	"role_assignment_id" uuid NOT NULL,
	"business_unit_id" uuid NOT NULL,
	"scope" text DEFAULT 'BUSINESS_UNIT' NOT NULL,
	CONSTRAINT "role_assignment_business_units_organization_id_role_assignment_id_business_unit_id_pk" PRIMARY KEY("organization_id","role_assignment_id","business_unit_id"),
	CONSTRAINT "grant_areas_business_unit_scope" CHECK ("role_assignment_business_units"."scope" = 'BUSINESS_UNIT')
);
--> statement-breakpoint
CREATE TABLE "role_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"scope" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "role_assignments_tenant_id" UNIQUE("organization_id","id"),
	CONSTRAINT "role_assignments_tenant_id_scope" UNIQUE("organization_id","id","scope"),
	CONSTRAINT "role_assignments_scope" CHECK ("role_assignments"."scope" in ('ORGANIZATION', 'BUSINESS_UNIT'))
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "business_units" ADD CONSTRAINT "business_units_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_assignment_business_units" ADD CONSTRAINT "grant_areas_assignment_tenant_scope_fk" FOREIGN KEY ("organization_id","role_assignment_id","scope") REFERENCES "public"."role_assignments"("organization_id","id","scope") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_assignment_business_units" ADD CONSTRAINT "grant_areas_business_unit_tenant_fk" FOREIGN KEY ("organization_id","business_unit_id") REFERENCES "public"."business_units"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_membership_tenant_fk" FOREIGN KEY ("organization_id","membership_id") REFERENCES "public"."memberships"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "memberships_user_idx" ON "memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "grant_areas_business_unit_idx" ON "role_assignment_business_units" USING btree ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX "role_assignments_membership_idx" ON "role_assignments" USING btree ("organization_id","membership_id");--> statement-breakpoint
CREATE INDEX "role_assignments_role_idx" ON "role_assignments" USING btree ("role_id");