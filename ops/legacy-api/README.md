# Legacy API without the retired TMB event importer

The production API still uses the historical .NET backend. Its original source
was removed from this repository, but the deployed image identifies source
revision `0329f2a8a792247e433fc405f9fc28deb7726587` in Git history.

`prepare.py` removes the hourly Hangfire `EventImporter` registration and the
entire `Jobs/EventImporter` directory from that exact revision. It rejects other
source versions and preserves the independent nightly `ProjectImporter`.

The public calendar reads Smart Village events through the content gateway and
does not consume this importer's old local event tables. Existing event records
are retained.

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
  -t ghcr.io/smart-village-solutions/guben-cockpit-api:v0.7.3-no-event-importer.1 \
  --load "$TASK_SOURCE"
```

The original base image is mirrored under `legacy-v0.7.3-base` in the same
registry repository, with the exact original digest
`sha256:9ad1b6293428d6ca5cc969c2576a5ffcc8b29aa010c0ea85c8ff2f8abfbc8e72`.
The image overlays only `Api.dll`, `Api.pdb`, `Jobs.dll`, and `Jobs.pdb` on this
immutable deployed base. The build requires an identical dependency manifest.
All runtime libraries, configuration, and assets remain those of the original
image. Build and verify this image before pushing it.

## Production

Set `LEGACY_API_IMAGE=ghcr.io/smart-village-solutions/guben-cockpit-api` and
`VERSION_API=v0.7.3-no-event-importer.1` in the existing Portainer stack.
Preserve all other environment values, networks, and data volumes. Recreate only
`guben-api-prod`, preserving its Data Protection volume. A restart clears the
original in-memory Hangfire schedule; the patched startup registers only the
project importer. Check the local Hangfire `/hangfire/recurring` page, the active
image digest, public event list/detail, and API logs after the next hourly minute
10. The old event importer type must also be absent from `Jobs.dll`.

Rollback: restore the original `LEGACY_API_IMAGE` and `VERSION_API` values and
redeploy the API. This also re-enables the old importer.
