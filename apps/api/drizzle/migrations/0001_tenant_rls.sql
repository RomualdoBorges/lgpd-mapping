ALTER TABLE "organizations" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "organizations" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "organizations" USING (id = nullif(current_setting('lgpd.organization_id', true), '')::uuid) WITH CHECK (id = nullif(current_setting('lgpd.organization_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "business_units" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "business_units" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "business_units" USING (organization_id = nullif(current_setting('lgpd.organization_id', true), '')::uuid) WITH CHECK (organization_id = nullif(current_setting('lgpd.organization_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "memberships" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "memberships" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "memberships" USING (organization_id = nullif(current_setting('lgpd.organization_id', true), '')::uuid) WITH CHECK (organization_id = nullif(current_setting('lgpd.organization_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "role_assignments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "role_assignments" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "role_assignments" USING (organization_id = nullif(current_setting('lgpd.organization_id', true), '')::uuid) WITH CHECK (organization_id = nullif(current_setting('lgpd.organization_id', true), '')::uuid);
--> statement-breakpoint
ALTER TABLE "role_assignment_business_units" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "role_assignment_business_units" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY tenant_isolation ON "role_assignment_business_units" USING (organization_id = nullif(current_setting('lgpd.organization_id', true), '')::uuid) WITH CHECK (organization_id = nullif(current_setting('lgpd.organization_id', true), '')::uuid);
--> statement-breakpoint
-- Role name supplied only by the migration entry point; never a tenant context.
DO $$
DECLARE runtime_role text := current_setting('lgpd.migration_runtime_role', true);
BEGIN
  IF runtime_role IS NULL OR runtime_role = '' OR runtime_role = current_user THEN
    RAISE EXCEPTION 'Separate runtime role required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = runtime_role
      AND NOT rolsuper AND NOT rolbypassrls AND NOT rolcreaterole) THEN
    RAISE EXCEPTION 'Restricted runtime role required';
  END IF;
  EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON organizations, business_units, memberships, role_assignments, role_assignment_business_units TO %I', runtime_role);
  -- Global users/roles are deliberately not granted to runtime here.
END $$;
