## ADDED Requirements

### Requirement: Featured Projects use the Smart Village GenericItem API
The content gateway SHALL retrieve Featured Projects through its server-side OAuth integration using Smart Village `genericItems` with `genericType: "FeaturedProject"` and `order: id_ASC`. It MUST NOT expose credentials to the browser or use PostgREST project rows as content fallback.

#### Scenario: Featured Projects are requested
- **WHEN** the Cockpit requests the Featured Projects list
- **THEN** the gateway returns GraphQL-backed Featured Projects in ascending Smart Village ID order

#### Scenario: Mainserver request fails
- **WHEN** the Featured Project GraphQL request fails or returns a structurally invalid collection
- **THEN** the gateway returns an upstream error and does not return PostgREST projects

### Requirement: Only public Featured Projects are returned
The gateway SHALL return only structurally valid GenericItems whose `visible` field is true and whose payload contains `published: true`. It SHALL skip malformed individual records with an operational warning.

#### Scenario: Hidden or unpublished record exists
- **WHEN** a GenericItem is not visible or its payload is not published
- **THEN** that record is absent from the public Featured Projects response

#### Scenario: Malformed record exists beside valid records
- **WHEN** one record lacks a required identity, title, or valid payload while other records are valid
- **THEN** the malformed record is skipped with a warning and the valid records remain available

### Requirement: Mainserver fields preserve the public Project contract
The gateway SHALL map `externalId` to the public project ID, use constant type `1`, map `title`, use an empty description, map the first content block body to `fullText`, map the first valid HTTP(S) media URL to `imageUrl`, and map `payload.imageCaption` and `payload.imageCredits`. It SHALL return the same Mainserver content for DE, EN, and PL.

#### Scenario: Complete Featured Project is mapped
- **WHEN** a valid published GenericItem contains content, media, caption, and credits
- **THEN** the existing Project response contains the corresponding mapped fields without changing its shape

#### Scenario: Optional content is absent
- **WHEN** a valid published GenericItem has no content block or valid media
- **THEN** the project remains available with empty full text and a null image URL

#### Scenario: Non-German locale is requested
- **WHEN** the browser requests English or Polish Featured Projects
- **THEN** the gateway returns the same unmodified Mainserver text as for German

### Requirement: Existing Featured Project URLs remain stable
The browser SHALL continue to use `/projects/:projectId`, where `projectId` is the GenericItem `externalId`. The gateway SHALL provide a typed detail read that resolves that external ID directly through GraphQL.

#### Scenario: Existing project link is opened
- **WHEN** a user opens a pre-migration `/projects/:projectId` URL
- **THEN** the detail page loads the matching Smart Village Featured Project without changing the visible URL

#### Scenario: Project does not exist
- **WHEN** no valid public Featured Project matches the requested external ID
- **THEN** the gateway returns a not-found error

### Requirement: Duplicate external IDs are rejected
The gateway MUST treat multiple public Featured Projects with the same `externalId` as invalid upstream state and MUST NOT automatically select, merge, or deduplicate those records.

#### Scenario: Duplicate list identity exists
- **WHEN** the Featured Projects list contains a repeated mapped external ID
- **THEN** the list request fails with an invalid-upstream error

#### Scenario: Duplicate detail identity exists
- **WHEN** a detail query returns multiple public records for the requested external ID
- **THEN** the detail request fails with an invalid-upstream error

### Requirement: Featured Projects remain independent from POIs
The `/projects` page SHALL continue loading Featured Projects and POIs independently and SHALL preserve their existing presentation and visible error states.

#### Scenario: Featured Projects fail while POIs succeed
- **WHEN** the Featured Project request fails and the POI request succeeds
- **THEN** the slider section shows its error and the POI filters and results remain usable

#### Scenario: Entire Mainserver is unavailable
- **WHEN** both Featured Project and POI requests fail
- **THEN** both sections show their error states and no PostgREST project content is displayed
