# PostgREST Public Content Facade

This folder contains the read-only PostgREST setup for public content consumed by the `content-gateway`.

## Profiles

- `local.env` is intended for local Docker Compose.
- `dev.env.example` is the staging/development template.
- `prod.env.example` is the production template.

All profiles expose only the `public_content` schema and use the dedicated anonymous role `guben_public_content_reader`.

## Database prerequisites

The source application schema `Guben` and its existing tables/data must already exist. The scripts below create roles, the `public_content` read schema and views; they do not install the former application database or import content. Starting the optional local PostgreSQL service alone is insufficient. Use a suitably privileged database role for initial provisioning and verify the permissions afterward.

Local Compose runs `bootstrap.sh` automatically before PostgREST. `stack.prod.yml` does not run SQL bootstrap; normal production image updates reuse the provisioned schema. Back up the database before initial provisioning.

## Database bootstrap

Apply the SQL files in `sql/` against PostgreSQL in this order:

1. `001_create_role.sql`
2. `002_create_schema_and_views.sql`
3. `003_grants.sql`

## Permission checks

Run `checks/verify_permissions.sql` as a role that can `SET ROLE guben_public_content_reader`.
The script succeeds only when:

- approved views are queryable,
- direct access to non-approved objects is denied,
- write operations through the exposed view surface are denied.
