## Why

The Featured Projects slider currently rejects the complete Mainserver collection when two public records share an `externalId`, making otherwise valid content unavailable. Every visible and published Mainserver record must remain independently addressable and visible.

## What Changes

- Return every valid public `FeaturedProject` record even when `externalId` values repeat.
- Use the immutable Mainserver GenericItem ID as the unique list identity and as the unambiguous detail lookup for slider links.
- Preserve existing `/projects/:externalId` links when an external ID identifies exactly one public record.
- Treat ambiguous legacy external-ID detail links as invalid instead of choosing an arbitrary record.
- Update focused gateway and frontend tests for duplicate display, unique routes, and legacy URL compatibility.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `smart-village-featured-projects`: Change Featured Project identity, duplicate handling, list rendering, and detail lookup while preserving unambiguous legacy URLs.
- `resilient-smart-village-read-cache`: Remove duplicate external IDs from the set of domain-invalid Featured Project responses.

## Impact

The shared public-content project contract, Smart Village Featured Project repository/querying, frontend project route encoding and dispatch, tests, and the documented read contract are affected. No credentials, PostgREST fallback, or POI behavior changes.
