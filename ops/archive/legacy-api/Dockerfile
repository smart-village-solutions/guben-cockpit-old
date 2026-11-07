# Historical build context after ops/archive/legacy-api/prepare.py.
# Keep the deployed runtime, dependencies, and assets; remove obsolete Jobs config.
ARG LEGACY_API_BASE=ghcr.io/smart-village-solutions/guben-cockpit-api@sha256:9ad1b6293428d6ca5cc969c2576a5ffcc8b29aa010c0ea85c8ff2f8abfbc8e72
FROM ${LEGACY_API_BASE} AS deployed

FROM mcr.microsoft.com/dotnet/sdk:9.0@sha256:07ed28d9e7279248fcea27334880f6c415b42c631c39b8bc5b3caf13ec6fdaa2 AS build
WORKDIR /src
COPY . .
RUN dotnet publish Api/Api.csproj -c Release -o /app/publish /p:UseAppHost=false
COPY --from=deployed /app/Api.deps.json /tmp/deployed.deps.json
# Both changed assemblies must run against the exact existing dependency graph.
RUN cmp /tmp/deployed.deps.json /app/publish/Api.deps.json

FROM deployed AS final
ARG CHANGE_REVISION
LABEL org.opencontainers.image.source="https://github.com/smart-village-solutions/guben-cockpit-old" \
      org.opencontainers.image.revision="${CHANGE_REVISION}" \
      org.opencontainers.image.version="v0.7.3-no-importers.1" \
      de.guben.cockpit.legacy-source-revision="0329f2a8a792247e433fc405f9fc28deb7726587" \
      de.guben.cockpit.event-importer="removed" \
      de.guben.cockpit.project-importer="removed"
COPY --from=build /app/publish/Api.dll /app/publish/Api.pdb /app/publish/Jobs.dll /app/publish/Jobs.pdb /app/publish/appsettings.json /app/
