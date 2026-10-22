BEGIN;

LOCK TABLE public.memberships IN ACCESS EXCLUSIVE MODE;

DO $$
DECLARE
  runtime_role text := current_setting('lgpd.membership_runtime_role', true);
  migration_role text := current_setting('lgpd.membership_migration_role', true);
  runtime_role_valid boolean;
  migration_role_valid boolean;
  bootstrap_role_valid boolean;
  memberships_owner text;
  auth_private_owner text;
  rls_enabled boolean;
  rls_forced boolean;
BEGIN
  IF runtime_role IS NULL OR runtime_role = '' OR runtime_role = current_user THEN
    RAISE EXCEPTION 'Separate runtime role required';
  END IF;
  IF migration_role IS NULL OR migration_role = '' OR migration_role = current_user
     OR migration_role = runtime_role THEN
    RAISE EXCEPTION 'Separate migration role required';
  END IF;

  SELECT rolcanlogin AND NOT rolsuper AND NOT rolbypassrls
         AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolinherit
    INTO runtime_role_valid
  FROM pg_catalog.pg_roles
  WHERE rolname = runtime_role;
  IF runtime_role_valid IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Restricted runtime role required';
  END IF;

  SELECT rolcanlogin AND NOT rolsuper AND NOT rolbypassrls
         AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolinherit
    INTO migration_role_valid
  FROM pg_catalog.pg_roles
  WHERE rolname = migration_role;
  IF migration_role_valid IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Restricted migration role required';
  END IF;

  SELECT NOT rolcanlogin AND NOT rolsuper AND NOT rolbypassrls
         AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolinherit
    INTO bootstrap_role_valid
  FROM pg_catalog.pg_roles
  WHERE rolname = 'lgpd_membership_bootstrap';
  IF bootstrap_role_valid IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Valid lgpd_membership_bootstrap role required';
  END IF;
  IF pg_catalog.pg_has_role(runtime_role, 'lgpd_membership_bootstrap', 'MEMBER') THEN
    RAISE EXCEPTION 'Runtime must not be a member of lgpd_membership_bootstrap';
  END IF;
  IF pg_catalog.pg_has_role(migration_role, 'lgpd_membership_bootstrap', 'MEMBER') THEN
    RAISE EXCEPTION 'Migrator must not be a member of lgpd_membership_bootstrap';
  END IF;
  IF NOT pg_catalog.pg_has_role(current_user, 'lgpd_membership_bootstrap', 'SET') THEN
    RAISE EXCEPTION 'Administrative executor cannot SET ROLE to lgpd_membership_bootstrap';
  END IF;

  SELECT c.relrowsecurity, c.relforcerowsecurity,
         pg_catalog.pg_get_userbyid(c.relowner)
    INTO rls_enabled, rls_forced, memberships_owner
  FROM pg_catalog.pg_class AS c
  JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'memberships'
    AND c.relkind IN ('r', 'p');
  IF rls_enabled IS DISTINCT FROM true OR rls_forced IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'memberships must have ENABLE and FORCE ROW LEVEL SECURITY';
  END IF;
  IF memberships_owner IS NULL THEN
    RAISE EXCEPTION 'memberships table required';
  END IF;
  IF memberships_owner = 'lgpd_membership_bootstrap' THEN
    RAISE EXCEPTION 'Bootstrap role must not own memberships';
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_policy AS p
    JOIN pg_catalog.pg_class AS c ON c.oid = p.polrelid
    JOIN pg_catalog.pg_namespace AS n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'memberships'
      AND p.polname = 'tenant_isolation' AND p.polcmd = '*'
      AND p.polpermissive AND p.polqual IS NOT NULL
      AND p.polwithcheck IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Expected memberships tenant_isolation policy required';
  END IF;

  SELECT pg_catalog.pg_get_userbyid(n.nspowner)
    INTO auth_private_owner
  FROM pg_catalog.pg_namespace AS n
  WHERE n.nspname = 'auth_private';
  IF auth_private_owner IS DISTINCT FROM 'lgpd_auth_persistence' THEN
    RAISE EXCEPTION 'Expected auth_private owned by lgpd_auth_persistence';
  END IF;
END $$;

DO $$
DECLARE runtime_role text := current_setting('lgpd.membership_runtime_role', true);
BEGIN
  EXECUTE pg_catalog.format(
    'ALTER POLICY tenant_isolation ON public.memberships TO %I',
    runtime_role
  );
END $$;

DROP POLICY IF EXISTS membership_bootstrap_select ON public.memberships;
CREATE POLICY membership_bootstrap_select
ON public.memberships
FOR SELECT
TO lgpd_membership_bootstrap
USING (
  active = true
  AND user_id = nullif(current_setting('lgpd.bootstrap_user_id', true), '')::uuid
  AND organization_id = nullif(current_setting('lgpd.bootstrap_organization_id', true), '')::uuid
);

REVOKE ALL PRIVILEGES ON TABLE public.memberships FROM lgpd_membership_bootstrap;
REVOKE ALL PRIVILEGES (id, organization_id, user_id, active, created_at, updated_at)
  ON TABLE public.memberships FROM lgpd_membership_bootstrap;
REVOKE ALL PRIVILEGES ON TABLE public.users FROM lgpd_membership_bootstrap;
REVOKE ALL PRIVILEGES (id, name, email, created_at, updated_at)
  ON TABLE public.users FROM lgpd_membership_bootstrap;
REVOKE ALL PRIVILEGES ON TABLE public.organizations FROM lgpd_membership_bootstrap;
REVOKE ALL PRIVILEGES (id, name, created_at, updated_at)
  ON TABLE public.organizations FROM lgpd_membership_bootstrap;
REVOKE ALL PRIVILEGES ON TABLE public.external_identities FROM lgpd_membership_bootstrap;
REVOKE ALL PRIVILEGES (id, user_id, issuer, subject, created_at, updated_at)
  ON TABLE public.external_identities FROM lgpd_membership_bootstrap;
REVOKE ALL PRIVILEGES ON TABLE public.sessions FROM lgpd_membership_bootstrap;
REVOKE ALL PRIVILEGES (id, user_id, token_digest, created_at, expires_at, revoked_at)
  ON TABLE public.sessions FROM lgpd_membership_bootstrap;
REVOKE ALL ON SCHEMA public FROM lgpd_membership_bootstrap;
REVOKE ALL ON SCHEMA auth_private FROM lgpd_membership_bootstrap;

GRANT USAGE ON SCHEMA public TO lgpd_membership_bootstrap;
GRANT USAGE ON SCHEMA auth_private TO lgpd_membership_bootstrap;
GRANT SELECT (id, organization_id, user_id, active)
  ON TABLE public.memberships TO lgpd_membership_bootstrap;

GRANT CREATE ON SCHEMA auth_private TO lgpd_membership_bootstrap;

SET LOCAL ROLE lgpd_membership_bootstrap;

CREATE OR REPLACE FUNCTION auth_private.resolve_membership(
  authenticated_user_id uuid,
  requested_organization_id uuid
) RETURNS TABLE(
  membership_id uuid,
  organization_id uuid
)
LANGUAGE plpgsql VOLATILE STRICT SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $function$
DECLARE
  previous_user_id text := current_setting('lgpd.bootstrap_user_id', true);
  previous_organization_id text := current_setting('lgpd.bootstrap_organization_id', true);
BEGIN
  PERFORM pg_catalog.set_config(
    'lgpd.bootstrap_user_id',
    authenticated_user_id::text,
    true
  );
  PERFORM pg_catalog.set_config(
    'lgpd.bootstrap_organization_id',
    requested_organization_id::text,
    true
  );

  RETURN QUERY
  SELECT m.id, m.organization_id
  FROM public.memberships AS m
  WHERE m.user_id = authenticated_user_id
    AND m.organization_id = requested_organization_id
    AND m.active = true
  LIMIT 1;

  PERFORM pg_catalog.set_config(
    'lgpd.bootstrap_user_id',
    COALESCE(previous_user_id, ''),
    true
  );
  PERFORM pg_catalog.set_config(
    'lgpd.bootstrap_organization_id',
    COALESCE(previous_organization_id, ''),
    true
  );
EXCEPTION WHEN OTHERS THEN
  PERFORM pg_catalog.set_config(
    'lgpd.bootstrap_user_id',
    COALESCE(previous_user_id, ''),
    true
  );
  PERFORM pg_catalog.set_config(
    'lgpd.bootstrap_organization_id',
    COALESCE(previous_organization_id, ''),
    true
  );
  RAISE;
END
$function$;

RESET ROLE;

REVOKE CREATE ON SCHEMA auth_private FROM lgpd_membership_bootstrap;
REVOKE ALL ON FUNCTION auth_private.resolve_membership(uuid, uuid) FROM PUBLIC;

DO $$
DECLARE
  runtime_role text := current_setting('lgpd.membership_runtime_role', true);
  function_owner text;
BEGIN
  SELECT pg_catalog.pg_get_userbyid(p.proowner)
    INTO function_owner
  FROM pg_catalog.pg_proc AS p
  JOIN pg_catalog.pg_namespace AS n ON n.oid = p.pronamespace
  WHERE n.nspname = 'auth_private'
    AND p.oid = pg_catalog.to_regprocedure(
      'auth_private.resolve_membership(uuid,uuid)'
    );
  IF function_owner IS DISTINCT FROM 'lgpd_membership_bootstrap' THEN
    RAISE EXCEPTION 'resolve_membership must be owned by lgpd_membership_bootstrap';
  END IF;
  IF pg_catalog.has_schema_privilege(
    'lgpd_membership_bootstrap',
    'auth_private',
    'CREATE'
  ) THEN
    RAISE EXCEPTION 'Bootstrap role must not retain CREATE on auth_private';
  END IF;

  EXECUTE pg_catalog.format(
    'REVOKE ALL ON FUNCTION auth_private.resolve_membership(uuid, uuid) FROM %I',
    runtime_role
  );
  EXECUTE pg_catalog.format(
    'GRANT EXECUTE ON FUNCTION auth_private.resolve_membership(uuid, uuid) TO %I',
    runtime_role
  );
END $$;

COMMIT;
