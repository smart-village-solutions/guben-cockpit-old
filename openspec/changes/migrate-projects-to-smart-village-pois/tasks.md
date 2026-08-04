## 1. Read-only POI Contract Verification

- [x] 1.1 Query the live Guben POI collection read-only and record counts for active/visible records, category IDs/names/hierarchy, data providers, locations/addresses, coordinates, media, contact details, opening hours, IDs, and external IDs without exposing credentials or personal secrets.
- [x] 1.2 Verify how Schools, Businesses, and additional POI groups are represented; decide the category hierarchy presentation and only define legacy School/Marketplace route prefilters when mappings are unique and stable.
- [x] 1.3 Decide and document the location-field priority and any safe legacy School/Business detail-ID aliases; update design/specs before product code if verified data differs from assumptions.
- [x] 1.4 Add representative sanitized fixtures for complete, minimal, school-category, business-category, additional-category, hidden, malformed, coordinate-free, hierarchical-category, and duplicate-category-name POIs.

## 2. Shared Featured Project and POI Contracts

- [x] 2.1 Separate the stable Featured Project/page metadata contract from the former local `schools` and `businesses` projections without changing carousel fields or behavior.
- [x] 2.2 Add explicit shared schemas and types for POI cards, details, categories, locations, contact methods, web links, opening hours, and media without exposing raw GraphQL payloads.
- [x] 2.3 Add a shared validated POI filter/sort contract for search, multiple category IDs, radius, location, sort field/direction, page, and page size, excluding an image-presence filter.
- [x] 2.4 Add contract tests for Featured Project compatibility, minimal/complete POIs, omitted optional groups, category/filter metadata, deterministic sort values, and malformed payload rejection.

## 3. Smart Village POI Repository

- [x] 3.1 Add focused repository tests for `pointsOfInterest` and `pointOfInterest(id: ID!)`, authenticated variables, public-status rules, malformed-item isolation, and structural upstream errors.
- [x] 3.2 Implement the narrow POI list/detail queries and mapper for identity, descriptions, categories, primary/additional media, address, coordinates, contact, web links, opening hours, operator, and provider fields required by the verified contract.
- [x] 3.3 Implement normalized category and location facets keyed by stable values, preserving School, Business, additional, hierarchical, and distinct equal-named categories according to the verified presentation contract.
- [x] 3.4 Implement case-insensitive name/description search, OR-based multiple categories, normalized location and Guben-radius filtering, shared deterministic sorting, counts, and pagination in the specified order.
- [x] 3.5 Add repository caching and safe diagnostics, and verify that filters/facets/counts remain consistent without relying on an unavailable GraphQL total count.

## 4. Gateway API and Source Separation

- [x] 4.1 Extend the public repository contract with independent Featured Project/page metadata and POI list/detail reads; remove active reliance on local School/Business project projections.
- [x] 4.2 Wire the Smart Village POI repository into the hybrid runtime without silently falling back to local Schools or Businesses, while leaving Featured Projects on PostgREST.
- [x] 4.3 Add `GET /api/content/pois` with strict filter validation and `GET /api/content/pois/:id` with typed POI identifier decoding and correct not-found/upstream errors.
- [x] 4.4 Replace paginated project scanning in POI detail loading with the direct detail endpoint and prove that Featured Project/POI ID collisions route unambiguously.
- [x] 4.5 Add API, composite-repository, server-wiring, partial-failure, error-mapping, readiness/metrics, and rollback-compatibility tests.

## 5. Unified `/projects` Experience

- [x] 5.1 Keep the existing breadcrumb, introduction, Featured Projects query, slider presentation, links, and empty-slider behavior on `/projects`.
- [x] 5.2 Remove `CategoryTiles` from the projects page and remove the former School and Marketplace tiles from the active UI.
- [x] 5.3 Add validated TanStack Router search parameters on `/projects` for search, category IDs, radius, location, sort, direction, page, and page size, including safe defaults and reload/share restoration tests.
- [x] 5.4 Add an independent POI query hook whose cache key includes normalized filter state and whose search input is debounced without delaying other filter changes.
- [x] 5.5 Render the red filter bar directly below the slider with search, multi-category, radius, location, and compact Events-style sorting controls in one row, explicitly omitting reset and image-presence filters.
- [x] 5.6 Render the paginated POI list below the filter bar with the existing `GenericCard` grid foundation, totals, loading/error/empty states, and image-optional behavior.
- [x] 5.7 Reset page 1 after content-filter changes and use results, counts, category options, and location options from the same POI response.
- [x] 5.8 Add accessible labels, keyboard behavior, per-control clear behavior, active-state feedback, and German/English/Polish translations for the unified POI area.

## 6. Legacy Routes and POI Details

- [x] 6.1 Replace `/projects/schools` and `/projects/marketplace` list rendering with redirects to `/projects`, applying only read-only-verified category prefilters and otherwise redirecting unfiltered.
- [x] 6.2 Extend `/projects/:projectId` to dispatch typed POI identifiers to the POI detail hook while leaving Featured Project details unchanged and removing School/Business type branching.
- [x] 6.3 Render available sanitized description/media, address, linked phone/e-mail/web contact, opening hours, categories, and agreed operator/provider information in optional POI detail sections without empty placeholders.
- [x] 6.4 Add routing and frontend tests for legacy redirects, filter restoration, Featured Project details, minimal/complete POIs, missing images/coordinates, HTML sanitization, external-link safety, and Projects breadcrumb/back navigation.

## 7. Validation and Cutover Evidence

- [x] 7.1 Run focused shared-contract, POI repository, gateway API/composition, routing, frontend hook/component, accessibility, type-check, lint, and production-build validations.
- [x] 7.2 Validate the OpenSpec change strictly and reconcile every completed task with implementation and test evidence.
- [ ] 7.3 Deploy through the existing protected release process without deleting local School/Business data, then verify the slider, absent category tiles, red filter bar, all POI categories, combined filters, descending sort, URL restoration, pagination, legacy redirects, direct details, optional sections, and POI-only failure state live.
- [x] 7.4 Record rollback evidence and leave local School/Business cleanup, unsupported legacy aliases, and later upstream count/facet optimization as separate follow-up decisions.
