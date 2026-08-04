## Context

`GET /api/content/featured-projects` currently combines Projects page metadata with PostgREST rows of type `1`. The `/projects` frontend loads that endpoint independently from the Smart Village POI catalogue and finds Featured Project details by scanning the returned list. The live Smart Village API exposes the same content as `FeaturedProject` GenericItems with stable source identifiers in `externalId`, long-form HTML in the first content block, one media item, image metadata in `payload`, and an explicit `id_ASC` order. The live source initially contains duplicate imports whose cleanup is handled separately in the Mainserver.

## Goals / Non-Goals

**Goals:**
- Make Smart Village GraphQL authoritative for Featured Project list and detail content.
- Preserve the existing public project IDs, routes, slider order, rendering, and independent POI loading.
- Keep Smart Village credentials in the gateway and expose only validated shared contracts.
- Fail visibly without substituting PostgREST projects.

**Non-Goals:**
- Redesigning the slider or detail page.
- Adding fields that the current presentation does not use.
- Translating Mainserver content or enriching it with PostgREST translations.
- Automatically reconciling or deduplicating upstream records.
- Moving Projects page metadata and SEO away from PostgREST.

## Decisions

### Use a dedicated Smart Village repository

A `SmartVillageFeaturedProjectRepository` will own the list/detail queries, validation, mapping, and warnings, following the existing FAQ, Cards, Events, and POI repository boundary. A generic GenericItem framework was rejected because it would couple unrelated, already stable content mappings.

### Preserve the shared Project model

The mapper uses `externalId` as `Project.id`, constant type `1`, an empty description, the first content block as `fullText`, the first valid HTTP(S) media URL as `imageUrl`, and payload image caption/credits. This keeps browser URLs and UI components stable. The same Mainserver text is returned for every requested Cockpit language because the live type has neither a language argument nor language metadata.

### Keep metadata local but content authoritative

The hybrid repository obtains page metadata and SEO from the existing PostgREST Featured Projects result, replaces its project array with the Smart Village list, and never returns the local project array. This avoids a broader page-metadata migration without creating an invisible content fallback.

### Add a dedicated detail read

The gateway resolves `/api/content/featured-projects/:id` through `genericItems(externalId: $externalId, genericType: "FeaturedProject")`, avoiding a browser-side list scan. Zero published records produces `NOT_FOUND`; multiple records for one external ID produce an invalid-upstream error.

### Treat duplicate identities as invalid upstream state

The list validates uniqueness of mapped `externalId` values and fails the collection when duplicates remain. It does not select, merge, or suppress a record. This prevents unstable React keys or ambiguous details without making upstream cleanup part of this implementation.

### Preserve independent frontend failures

Featured Projects and POIs retain separate requests and error states. A Featured Project failure does not discard an already successful POI response, while a complete Mainserver outage produces visible errors in both sections and no local content.

## Risks / Trade-offs

- [Mainserver has one text for all locales] → Return it unchanged for DE, EN, and PL and document the intentional loss of PostgREST translation enrichment.
- [Duplicate imports block the slider] → Surface the invalid upstream state; manual cleanup remains outside this change.
- [Local metadata remains a dependency] → Keep the dependency explicit and limited to `page`/`seo`; do not treat its project rows as fallback data.
- [GraphQL shape drifts] → Validate collections and mapped responses, skip malformed individual records with warnings, and surface structural failures as typed gateway errors.

## Migration Plan

1. Release the gateway and frontend together so the new detail endpoint and caller remain compatible.
2. Smoke-test the slider order, an existing `/projects/:projectId` link, all three Cockpit locales, POI independence, and failure behavior.
3. Roll back both images to the preceding release if GraphQL content or routing is incorrect; do not activate a runtime PostgREST fallback.

## Open Questions

None.
