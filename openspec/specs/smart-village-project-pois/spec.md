# smart-village-project-pois Specification

## Purpose
TBD - created by archiving change migrate-projects-to-smart-village-pois. Update Purpose after archive.
## Requirements
### Requirement: Projects page combines Featured Projects and Smart Village POIs
The `/projects` page SHALL retain its existing introduction and Featured Projects slider from the existing local source. It SHALL render one unified Smart Village POI catalogue below the slider and MUST NOT render the former Schools and Marketplace navigation tiles.

#### Scenario: Projects page loads successfully
- **WHEN** a user opens `/projects`
- **THEN** the page shows the existing Featured Projects slider followed by the red POI filter bar and unified POI list

#### Scenario: No Featured Projects exist
- **WHEN** the local source contains no Featured Projects
- **THEN** the POI filter bar and list remain available without an empty slider placeholder

### Requirement: Smart Village is the authoritative POI source
The content gateway SHALL retrieve schools, businesses, and all other public POIs through the Smart Village GraphQL `PointOfInterest` API using the existing server-side OAuth integration. The browser MUST NOT receive Smart Village credentials or access tokens, and Featured Projects MUST continue to use their existing source.

#### Scenario: Unified POI list is requested
- **WHEN** a client requests POI content for the projects page
- **THEN** the gateway returns public Smart Village POIs without local PostgREST school or business records

#### Scenario: Featured Projects are requested
- **WHEN** the projects page requests Featured Projects
- **THEN** the gateway returns them from the existing source without changing their slider contract

### Requirement: Schools and businesses are POI categories
The public POI model MUST NOT classify records as separate School or Business project types. Schools, businesses, and any additional upstream classifications SHALL be represented through the POI category collection and exposed as category filter options keyed by category ID.

#### Scenario: School and business categories exist
- **WHEN** Smart Village returns POIs assigned to School and Business categories
- **THEN** both categories appear alongside other POI categories in the same filter and their records use the same list contract

#### Scenario: A new POI category is added upstream
- **WHEN** a valid public POI uses a category not previously known to the frontend
- **THEN** that category becomes available without adding a new route, tile, or project type

### Requirement: Public POIs are validated and normalized
The gateway SHALL expose only active and visible Points of Interest with a nonempty ID and name. It SHALL normalize agreed POI fields into an explicit public contract and MUST NOT expose the raw GraphQL object or uncontracted `payload` to the browser.

#### Scenario: Valid public POI is mapped
- **WHEN** a POI is active, visible, and contains a nonempty ID and name
- **THEN** the gateway returns its normalized list fields and any valid optional detail fields

#### Scenario: Hidden POI is present upstream
- **WHEN** a POI is inactive or not visible
- **THEN** it is absent from POI lists, filter metadata, counts, and public detail responses

#### Scenario: Individual POI is malformed
- **WHEN** one POI lacks a usable ID or name or contains malformed nested optional data
- **THEN** the gateway skips or isolates the invalid portion, logs a safe diagnostic, and continues returning other valid POIs

### Requirement: POI list preserves the existing card foundation
The POI list SHALL use the existing responsive card grid, pagination, loading state, error state, empty state, and basic `GenericCard` presentation. A card SHALL show the POI name and SHALL show its primary image only when a valid image exists.

#### Scenario: POI has a primary image
- **WHEN** the list renders a POI with a valid primary image
- **THEN** the existing card presentation shows that image and the POI name

#### Scenario: POI has no image
- **WHEN** the list renders a valid POI without media
- **THEN** the card remains usable without an empty or broken image placeholder

### Requirement: POI details are loaded directly
The gateway SHALL provide a dedicated POI detail read that resolves the selected Smart Village POI without scanning paginated list pages. The public route structure SHALL remain `/projects/:projectId`, while the identifier contract MUST distinguish POIs from Featured Projects.

#### Scenario: POI card is opened
- **WHEN** a user selects a POI card
- **THEN** the frontend uses the typed POI identifier to load the corresponding POI detail with a Projects breadcrumb

#### Scenario: Featured Project and POI identifiers collide
- **WHEN** an upstream POI ID has the same textual value as a local Featured Project ID
- **THEN** the identifier contract routes each request to its correct data source without ambiguity

### Requirement: Optional POI information is shown only when available
The POI detail view SHALL preserve the existing title, description, media, navigation, and layout foundation. It SHALL additionally render valid available address, contact methods, web links, opening hours, categories, and additional media in clearly separated sections, and MUST omit empty sections.

#### Scenario: POI contains extended information
- **WHEN** a POI detail contains valid address, contact, web link, opening-hour, category, or media data
- **THEN** each available information group is rendered in an appropriate detail section

#### Scenario: POI contains only required fields
- **WHEN** a POI detail contains only an ID and name
- **THEN** the page remains valid and renders no empty headings or invented fallback values

#### Scenario: Description contains HTML
- **WHEN** a POI description contains HTML
- **THEN** the frontend sanitizes it before rendering

### Requirement: Legacy category routes migrate to the unified list
The former `/projects/schools` and `/projects/marketplace` routes MUST NOT render independent result lists. They SHALL redirect to `/projects`; a corresponding category filter SHALL be included only when a unique stable mapping to verified Smart Village category IDs exists.

#### Scenario: Legacy School mapping is verified
- **WHEN** a user opens `/projects/schools` and the School category mapping is unambiguous
- **THEN** the user is redirected to `/projects` with the School category selected

#### Scenario: Legacy category mapping is ambiguous
- **WHEN** a legacy route has no unique verified category mapping
- **THEN** the user is redirected to the unfiltered `/projects` POI list rather than an inferred category

### Requirement: POI failures remain isolated and visible
The gateway MUST treat an unreachable Smart Village service or structurally invalid POI collection as an upstream failure and MUST NOT silently substitute local school or business projects. A POI-section failure MUST NOT remove an independently loaded Featured Projects slider.

#### Scenario: Smart Village list read fails
- **WHEN** the POI GraphQL request fails while Featured Projects are available
- **THEN** the slider remains visible and the POI section shows its retriable error state

#### Scenario: Code rollback is required
- **WHEN** the POI cutover is rolled back before local data cleanup
- **THEN** the previous tiles and local School/Business paths can be restored without reconstructing deleted data

