# Legacy API without retired event and project importers

The production API still uses the historical .NET backend. Its original source
was removed from this repository, but the deployed image identifies source
revision `0329f2a8a792247e433fc405f9fc28deb7726587` in Git history.

`prepare.py` removes both Hangfire registrations and all twelve importer/helper
source files from that exact revision. It rejects other source versions and
removes the obsolete `Jobs` configuration section. The empty Jobs project stays
in the dependency graph so existing runtime libraries can remain unchanged.

The current calendar, POI directory, and featured projects read Smart Village
through the content gateway. The old school and marketplace routes redirect to
the POI directory. The known n8n Cockpit POI import is manual, named "einmalig",
and inactive. Old `/api/content/projects` and `/api/content/public` endpoints
still expose the retained local project rows, which will no longer be refreshed
by the nightly import. Existing database records are retained.

## Rebuild

Use a private temporary directory: historical configuration can contain secrets.
Never commit the extracted source or print its configuration.

```sh
TASK_SOURCE=$(mktemp -d)
git archive 0329f2a8a792247e433fc405f9fc28deb7726587 \
  Api Database Domain Jobs Shared.Api Shared.Database Shared.Domain .dockerignore \
  | tar -x -C "$TASK_SOURCE"
python3 ops/legacy-api/prepare.py "$TASK_SOURCE"
docker buildx build --platform linux/amd64 \
  -f ops/legacy-api/Dockerfile \
  --build-arg CHANGE_REVISION="$(git rev-parse HEAD)" \
  -t ghcr.io/smart-village-solutions/guben-cockpit-api:v0.7.3-no-importers.1 \
  --load "$TASK_SOURCE"
```

The original base image is mirrored under `legacy-v0.7.3-base` in the same
registry repository, with the exact original digest
`sha256:9ad1b6293428d6ca5cc969c2576a5ffcc8b29aa010c0ea85c8ff2f8abfbc8e72`.
The image overlays `Api.dll`, `Api.pdb`, `Jobs.dll`, `Jobs.pdb`, and the sanitized
`appsettings.json` on this immutable base. The dependency manifest must remain
identical. Configuration outside `Jobs`, runtime libraries, and assets remain
those of the original image. Verify the image before pushing it.

## Production

Set `LEGACY_API_IMAGE=ghcr.io/smart-village-solutions/guben-cockpit-api` and
`VERSION_API=v0.7.3-no-importers.1` in the existing Portainer stack.
Remove the API environment entry `Jobs:ProjectImporter:BearerToken` and the
obsolete stack variable `ProjectImporterBearerToken`. Preserve all other
environment values, networks, and data volumes. Recreate only `guben-api-prod`,
preserving its Data Protection volume.

A restart clears the original in-memory Hangfire schedule; the patched startup
registers no recurring jobs. Verify an empty local `/hangfire/recurring` page,
absence of both importer types in the active assemblies, and API startup logs.
Check public calendar list/detail, POI list/detail, featured projects, and the
retained local project endpoints. Compare Data Protection hashes, unaffected
container IDs, and the active image digest.

Rollback: restore the privately backed-up stack content/environment and the
previous API image. This also restores the project importer. The original
`v0.7.3` image restores both importers.
