## Why

Featured Projects are the last project content still read from the Cockpit PostgREST database even though the same records are maintained in the SVA Mainserver as `FeaturedProject` GenericItems. Moving the slider and detail reads to GraphQL makes the Mainserver authoritative alongside Cards, FAQ, Events, and POIs.

## What Changes

- Load public Featured Projects through the server-side Smart Village OAuth/GraphQL integration.
- Preserve the existing slider, project detail presentation, public project identifiers, and `/projects/:projectId` routes.
- Add a typed Featured Project detail read resolved by the stable GenericItem `externalId`.
- Retain PostgREST only for the Projects page metadata and SEO returned with the list.
- Do not fall back to PostgREST project records when Smart Village is unavailable or invalid.
- Do not deduplicate duplicate `externalId` records in the Cockpit; upstream cleanup remains an external operational concern.

## Capabilities

### New Capabilities
- `smart-village-featured-projects`: Defines authoritative GraphQL list and detail reads, mapping, identity, ordering, validation, and failure behavior for Featured Projects.

### Modified Capabilities

None.

## Impact

- Content gateway: a dedicated Smart Village Featured Project repository, hybrid repository wiring, and a detail endpoint.
- Shared public-content contracts: a typed Featured Project detail response.
- Frontend: detail loading uses the dedicated endpoint while existing routes and presentation stay stable.
- Operations: duplicate cleanup remains external to this change and is not an implementation gate.
