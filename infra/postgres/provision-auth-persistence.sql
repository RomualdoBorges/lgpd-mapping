BEGIN;

DO $$
DECLARE
  runtime_role text := current_setting('lgpd.auth_runtime_role', true);
  migration_role text := current_setting('lgpd.auth_migration_role', true);
  role_valid boolean;
  schema_owner text;
BEGIN
  IF runtime_role IS NULL OR runtime_role = '' OR runtime_role = current_user THEN
    RAISE EXCEPTION 'Separate runtime role required';
  END IF;
  SELECT NOT rolcanlogin AND NOT rolsuper AND NOT rolbypassrls
         AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolinherit
    INTO role_valid
  FROM pg_roles WHERE rolname = 'lgpd_auth_persistence';
  IF role_valid IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Valid lgpd_auth_persistence role required';
  END IF;
  IF pg_has_role(runtime_role, 'lgpd_auth_persistence', 'MEMBER') THEN
    RAISE EXCEPTION 'Runtime must not be a member of lgpd_auth_persistence';
  END IF;
  IF migration_role IS NOT NULL AND migration_role <> ''
     AND pg_has_role(migration_role, 'lgpd_auth_persistence', 'MEMBER') THEN
    RAISE EXCEPTION 'Migrator must not be a member of lgpd_auth_persistence';
  END IF;
  IF to_regnamespace('auth_private') IS NULL THEN
    CREATE SCHEMA auth_private AUTHORIZATION lgpd_auth_persistence;
  ELSE
    SELECT pg_get_userbyid(nspowner) INTO schema_owner
    FROM pg_namespace WHERE nspname = 'auth_private';
    IF schema_owner <> 'lgpd_auth_persistence' THEN
      RAISE EXCEPTION 'auth_private has an unexpected owner';
    END IF;
  END IF;
END $$;

REVOKE ALL ON SCHEMA auth_private FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO lgpd_auth_persistence;
REVOKE ALL ON TABLE public.users FROM lgpd_auth_persistence;
REVOKE ALL ON TABLE public.external_identities FROM lgpd_auth_persistence;
REVOKE ALL ON TABLE public.sessions FROM lgpd_auth_persistence;
GRANT SELECT ON TABLE public.external_identities TO lgpd_auth_persistence;
GRANT SELECT, INSERT, UPDATE ON TABLE public.sessions TO lgpd_auth_persistence;

SET LOCAL ROLE lgpd_auth_persistence;

CREATE OR REPLACE FUNCTION auth_private.resolve_external_identity(
  p_issuer text,
  p_subject text
) RETURNS TABLE(user_id uuid)
LANGUAGE sql STABLE STRICT SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $function$
  SELECT ei.user_id
  FROM public.external_identities AS ei
  WHERE ei.issuer = p_issuer AND ei.subject = p_subject
  LIMIT 1
$function$;

CREATE OR REPLACE FUNCTION auth_private.create_session(
  p_user_id uuid,
  p_token_digest text,
  p_expires_at timestamp with time zone
) RETURNS TABLE(
  session_id uuid,
  created_at timestamp with time zone,
  expires_at timestamp with time zone,
  revoked_at timestamp with time zone
)
LANGUAGE sql VOLATILE STRICT SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $function$
  INSERT INTO public.sessions (user_id, token_digest, expires_at)
  VALUES (p_user_id, p_token_digest, p_expires_at)
  RETURNING id, created_at, expires_at, revoked_at
$function$;

CREATE OR REPLACE FUNCTION auth_private.resolve_session(
  p_token_digest text
) RETURNS TABLE(
  session_id uuid,
  user_id uuid,
  expires_at timestamp with time zone,
  revoked_at timestamp with time zone
)
LANGUAGE sql STABLE STRICT SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $function$
  SELECT s.id, s.user_id, s.expires_at, s.revoked_at
  FROM public.sessions AS s
  WHERE s.token_digest = p_token_digest
  LIMIT 1
$function$;

CREATE OR REPLACE FUNCTION auth_private.revoke_session(
  p_session_id uuid,
  p_revoked_at timestamp with time zone
) RETURNS boolean
LANGUAGE sql VOLATILE STRICT SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $function$
  WITH updated AS (
    UPDATE public.sessions
    SET revoked_at = COALESCE(revoked_at, p_revoked_at)
    WHERE id = p_session_id
    RETURNING true AS revoked
  )
  SELECT COALESCE((SELECT revoked FROM updated), false)
$function$;

RESET ROLE;

REVOKE ALL ON FUNCTION auth_private.resolve_external_identity(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION auth_private.create_session(uuid, text, timestamp with time zone) FROM PUBLIC;
REVOKE ALL ON FUNCTION auth_private.resolve_session(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION auth_private.revoke_session(uuid, timestamp with time zone) FROM PUBLIC;

DO $$
DECLARE runtime_role text := current_setting('lgpd.auth_runtime_role', true);
BEGIN
  EXECUTE format('REVOKE ALL ON SCHEMA auth_private FROM %I', runtime_role);
  EXECUTE format('GRANT USAGE ON SCHEMA auth_private TO %I', runtime_role);
  EXECUTE format('REVOKE ALL ON TABLE public.users, public.external_identities, public.sessions FROM %I', runtime_role);
  EXECUTE format('GRANT EXECUTE ON FUNCTION auth_private.resolve_external_identity(text,text) TO %I', runtime_role);
  EXECUTE format('GRANT EXECUTE ON FUNCTION auth_private.create_session(uuid,text,timestamp with time zone) TO %I', runtime_role);
  EXECUTE format('GRANT EXECUTE ON FUNCTION auth_private.resolve_session(text) TO %I', runtime_role);
  EXECUTE format('GRANT EXECUTE ON FUNCTION auth_private.revoke_session(uuid,timestamp with time zone) TO %I', runtime_role);
END $$;

COMMIT;
