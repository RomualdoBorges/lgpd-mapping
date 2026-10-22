#!/bin/sh
set -eu
# psql quoting protects identifiers/literals; do not print credentials.
psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --set=ON_ERROR_STOP=1 \
  --set=runtime_user="$DB_RUNTIME_USER" --set=runtime_password="$DB_RUNTIME_PASSWORD" \
  --set=migration_user="$DB_MIGRATION_USER" --set=migration_password="$DB_MIGRATION_PASSWORD" \
  --set=db_name="$POSTGRES_DB" <<'SQL'
CREATE ROLE :"runtime_user" LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS PASSWORD :'runtime_password';
CREATE ROLE :"migration_user" LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS PASSWORD :'migration_password';
CREATE ROLE lgpd_auth_persistence NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
CREATE ROLE lgpd_membership_bootstrap NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOINHERIT;
REVOKE ALL ON DATABASE :"db_name" FROM PUBLIC;
GRANT CONNECT ON DATABASE :"db_name" TO :"runtime_user", :"migration_user";
GRANT CREATE ON DATABASE :"db_name" TO :"migration_user";
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO :"runtime_user";
GRANT USAGE, CREATE ON SCHEMA public TO :"migration_user";
SQL
