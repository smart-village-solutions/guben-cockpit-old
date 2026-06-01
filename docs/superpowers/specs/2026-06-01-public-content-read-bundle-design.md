# Public Content Read Bundle Design

Date: 2026-06-01

## Goal

Provide one read-only API endpoint that exposes all locally structured public Guben cockpit content relevant to the current requirement:

- homepage cards and related homepage public content
- "Mein Guben" entries for featured projects, schools, and businesses

The endpoint is designed for structured extraction, not for page-specific UI composition or write operations.

## Scope

In scope:
- Add one new gateway endpoint for bundled public content reads
- Include only content that is already locally structured through PostgREST-backed sources
- Include homepage card data from dashboard dropdowns, tabs, and information cards
- Include "Mein Guben" content from local project data
- Mark project-like entries with explicit category metadata so one response can be filtered client-side
- Keep the endpoint strictly read-only

Out of scope:
- Events
- Event details
- Booking tenants
- Booking objects or occupancy data
- Any write, sync, publish, or editorial mutation path
- Replacing existing `/api/content/home` or `/api/content/projects` consumers in this step

## Constraints

- The solution must fit the existing `content-gateway -> PostgREST -> public_content` architecture.
- The browser must continue to see only gateway endpoints.
- The payload must be easy to consume for structured exports and downstream processing.
- The contract must prefer one normalized read shape over many specialized endpoints.
- Existing content endpoints remain intact for compatibility.

## Current State

The current gateway already exposes the relevant source content, but split across page-oriented endpoints:

- `GET /api/content/home`
  - resolves homepage page metadata and dashboard dropdown data
- `GET /api/content/projects`
  - resolves featured projects, schools, and paged businesses

The source data already exists locally in PostgREST-facing views:

- `public_content.projects`
- `public_content.dashboard_dropdowns`
- `public_content.dashboard_tabs`
- `public_content.information_cards`
- `public_content.dropdown_links`
- `public_content.pages`

Two problems remain for the new use case:

1. Consumers that want a complete structured export must call multiple endpoints and merge responses themselves.
2. The current projects response is optimized for page rendering, not for one-pass extraction of all records.

## Recommended API Shape

Add one new endpoint:

- `GET /api/content/public`

This endpoint returns a bundled, read-only snapshot of the relevant local public content.

### Response outline

```json
{
  "home": {
    "page": {},
    "cards": [],
    "dropdowns": []
  },
  "projects": {
    "page": {},
    "items": []
  }
}
```

The endpoint is intentionally explicit and narrow:

- `home` contains the structured homepage content relevant to extraction
- `projects.items` contains all featured projects, schools, and businesses in one normalized list

No paging is required on this new endpoint because the use case is complete structured read access rather than incremental page rendering.

## Contract Design

### `home`

`home` contains:

- `page`
  - existing localized page hero and SEO metadata derived from the home page row
- `dropdowns`
  - the existing dashboard hierarchy with dropdowns, tabs, links, and cards preserved
- `cards`
  - a flattened list of all homepage information cards for easy extraction without traversing the dropdown tree

Recommended `cards` shape:

```json
{
  "id": "card-id",
  "dropdownId": "dropdown-id",
  "dropdownTitle": "Leben",
  "tabId": "tab-id",
  "tabTitle": "Freizeit",
  "sequence": 1,
  "title": "Card title",
  "description": "Card text",
  "imageUrl": "/path/or/url",
  "imageAlt": "Alt text",
  "button": {
    "title": "Mehr",
    "url": "/target",
    "openInNewTab": false
  }
}
```

The flattened `cards` list avoids forcing downstream readers to reconstruct cards from nested dashboard data.

### `projects`

`projects` contains:

- `page`
  - existing localized page hero and SEO metadata derived from the projects page row
- `items`
  - one normalized list containing all featured projects, schools, and businesses

Recommended `items` shape:

```json
{
  "id": "project-id",
  "category": "featured",
  "type": 1,
  "title": "Project title",
  "description": "Short description",
  "fullText": "Long text",
  "imageCaption": "Caption",
  "imageUrl": "/path/or/url",
  "imageCredits": "Credits",
  "published": true
}
```

`category` is the primary consumer-facing discriminator:

- `featured`
- `school`
- `business`

The existing numeric `type` remains in the payload for traceability to source data, but client integrations use `category` as the primary discriminator.

Items are filtered to the same publication rules already used by the current gateway:

- include only `published = true`
- exclude `deleted = true`

## Mapping Rules

### Homepage mapping

- Reuse the existing dashboard mapping path that already builds dropdowns, tabs, links, and information cards.
- Add a lightweight flattening step that emits `home.cards` from the mapped dropdown/tab/card tree.
- Do not expose booking-related or event-related dashboard additions through this contract.

### Project mapping

- Reuse the existing project mapping path from `public_content.projects`.
- Map source `type` values into stable categories:
  - `1 -> featured`
  - `2 -> school`
  - `0 -> business`
- Exclude unknown project types from the bundle unless a new explicit category is designed.

## Repository and Routing Changes

### Routing

Add one new Fastify route in the gateway:

- `GET /api/content/public`

Supported query parameters:

- `lang`

No paging parameters are supported on this endpoint.

### Repository interface

Add one new read method to the public content repository contract:

- `getPublicContent(language: string)`

This method assembles both content groups in one call path and returns the new bundled contract.

### PostgREST-backed implementation

The PostgREST repository:

1. load the home page row
2. load dashboard rows needed for homepage cards
3. load the projects page row
4. load project rows
5. map and flatten the data into the new response shape

This can reuse the existing mapper logic rather than introducing a separate source system.

## Error Handling

The new endpoint uses the same standardized gateway error contract as the existing public content endpoints.

Expected behavior:

- PostgREST timeout or upstream failure
  - return the existing upstream error shape
- missing page content for Home or Projects
  - return `NOT_FOUND`
- invalid mapped payload
  - return `INVALID_UPSTREAM_PAYLOAD`

No endpoint-specific custom error format is introduced.

## Testing

Add gateway-focused tests for:

- successful `GET /api/content/public` response with localized home and projects content
- flattening of homepage cards from nested dashboard data
- project category mapping from numeric `type`
- exclusion of unpublished or deleted project rows
- standardized error behavior when required source content is missing

Shared contract tests validate the new bundled schema separately from existing `home` and `projects` schemas.

## Recommendation

Implement a single bundled read endpoint at `GET /api/content/public`.

This keeps the public API small, matches the actual extraction use case, and stays aligned with the current architecture:

- one browser-facing gateway endpoint
- one locally backed source of truth
- no additional write surface
- no event or booking scope creep
- no proliferation of specialized endpoints
