CREATE TABLE "processing_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"business_unit_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "processing_activities_name_not_blank" CHECK (translate("processing_activities"."name", U&'\0009\000A\000B\000C\000D\0020\0085\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000', '') <> '')
);
--> statement-breakpoint
ALTER TABLE "processing_activities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "processing_activities" ADD CONSTRAINT "processing_activities_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processing_activities" ADD CONSTRAINT "processing_activities_business_unit_tenant_fk" FOREIGN KEY ("organization_id","business_unit_id") REFERENCES "public"."business_units"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "processing_activities_business_unit_idx" ON "processing_activities" USING btree ("organization_id","business_unit_id");
--> statement-breakpoint
ALTER TABLE "processing_activities" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$
DECLARE
  runtime_role text := pg_catalog.current_setting('lgpd.migration_runtime_role', true);
BEGIN
  IF runtime_role IS NULL OR runtime_role = '' OR runtime_role = current_user THEN
    RAISE EXCEPTION 'Separate runtime role required';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_roles
    WHERE rolname = runtime_role AND rolcanlogin
      AND NOT rolsuper AND NOT rolbypassrls AND NOT rolcreatedb
      AND NOT rolcreaterole AND NOT rolinherit
  ) THEN
    RAISE EXCEPTION 'Restricted runtime role required';
  END IF;
  EXECUTE pg_catalog.format(
    'CREATE POLICY tenant_isolation ON public.processing_activities FOR SELECT TO %I USING (organization_id = nullif(current_setting(''lgpd.organization_id'', true), '''')::uuid)',
    runtime_role
  );
  EXECUTE pg_catalog.format(
    'GRANT SELECT (id, organization_id, business_unit_id, name, created_at, updated_at) ON TABLE public.processing_activities TO %I',
    runtime_role
  );
END $$;
