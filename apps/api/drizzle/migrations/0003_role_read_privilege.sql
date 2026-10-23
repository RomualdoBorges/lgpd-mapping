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
    'GRANT SELECT (id, code) ON TABLE public.roles TO %I',
    runtime_role
  );
END $$;
