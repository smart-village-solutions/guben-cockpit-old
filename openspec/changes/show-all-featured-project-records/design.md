## Context

Featured Project list entries currently expose `externalId` as `Project.id`, and the repository validates that mapped IDs are unique. Real Mainserver imports can legitimately contain multiple independently maintained GenericItems with the same external ID. Because the slider uses `Project.id` for both its React identity and route, rejecting duplicates was the only way the old model avoided ambiguous details.

POIs already establish the repository convention of namespaced public IDs. Featured Projects can use the same pattern without changing the shared `Project` response shape.

## Goals / Non-Goals

**Goals:**

- Display every structurally valid, visible, published Featured Project in Mainserver `id_ASC` order.
- Give every slider item and generated detail URL an unambiguous stable identity.
- Continue resolving an existing external-ID URL when it has exactly one public match.
- Keep invalid-record isolation, source authority, localization, and POI behavior unchanged.

**Non-Goals:**

- Merge or otherwise reconcile Mainserver records.
- Change Mainserver data or import workflows.
- Introduce a PostgREST fallback or redesign the slider.
- Choose an arbitrary record for an ambiguous legacy URL.

## Decisions

### Namespace the internal GenericItem ID

Mapped list entries use `featured:<encoded GenericItem id>` as `Project.id`. This provides a collision-free React key, distinguishes Featured Projects from `poi:` routes, and makes every generated slider link unambiguous without expanding the shared Project schema. A raw internal ID was rejected because it could collide with a legacy external ID or another project kind.

### Resolve generated IDs from the authoritative collection

The detail repository recognizes the `featured:` namespace, loads the validated ordered Featured Project collection, and selects the exact internal GenericItem ID. Reusing the collection query avoids assuming an unsupported GraphQL ID-filter argument and shares the process-local read cache with the slider.

### Retain legacy external-ID lookup only when unambiguous

Unprefixed detail IDs continue through the existing `externalId` query. One public result resolves successfully, no public result returns `NOT_FOUND`, and multiple public results return `INVALID_UPSTREAM_PAYLOAD`. This preserves old links without silently choosing among duplicates.

### Validate collection shape, not external-ID uniqueness

Collection cache validation continues to require a `genericItems` array. Duplicate external IDs are valid independent records and no longer invalidate or prevent caching the collection. Malformed, hidden, and unpublished individual records retain their existing skip behavior.

## Risks / Trade-offs

- [Public IDs emitted by the slider change] → Keep the route shape unchanged and retain unprefixed external-ID resolution for existing links.
- [A Mainserver internal ID changes] → Treat GenericItem IDs as the authoritative immutable identity; no reliable distinct identity exists otherwise.
- [Namespaced detail lookup reads the collection] → Reuse the existing cached collection query, preserving normal request cost after the first load.
- [An old duplicate external-ID URL remains ambiguous] → Return the explicit invalid-upstream error; new slider links remain independently usable.

## Migration Plan

Deploy gateway and frontend together, then verify that the live list containing duplicate external ID `513` returns successfully and every generated card opens the matching detail. Roll back both components together if route handling is incompatible; no persistent data migration is required.

## Open Questions

None.
