#!/bin/sh
set -eu

db_uri="${PGRST_DB_URI:?PGRST_DB_URI is required}"

echo "Waiting for postgres ..."
until pg_isready -d "$db_uri" >/dev/null 2>&1; do
  sleep 2
done

echo "Applying PostgREST role/schema/view bootstrap ..."
psql "$db_uri" -v ON_ERROR_STOP=1 -f /sql/001_create_role.sql
psql "$db_uri" -v ON_ERROR_STOP=1 -f /sql/002_create_schema_and_views.sql
psql "$db_uri" -v ON_ERROR_STOP=1 -f /sql/003_grants.sql
psql "$db_uri" -v ON_ERROR_STOP=1 -f /checks/verify_permissions.sql

echo "PostgREST bootstrap complete."
