## MODIFIED Requirements

### Requirement: Mainserver fields preserve the public Project contract
The gateway SHALL map the GenericItem ID to a namespaced `featured:` public project ID, use constant type `1`, map `title`, use an empty description, map the first content block body to `fullText`, map the first valid HTTP(S) media URL to `imageUrl`, and map `payload.imageCaption` and `payload.imageCredits`. It SHALL return the same Mainserver content for DE, EN, and PL.

#### Scenario: Complete Featured Project is mapped
- **WHEN** a valid published GenericItem contains content, media, caption, and credits
- **THEN** the Project response contains a `featured:` ID derived from its Mainserver ID and the corresponding mapped fields

#### Scenario: Optional content is absent
- **WHEN** a valid published GenericItem has no content block or valid media
- **THEN** the project remains available with empty full text and a null image URL

#### Scenario: External ID is absent
- **WHEN** a valid published GenericItem has an internal Mainserver ID but no external ID
- **THEN** the project remains independently available through its namespaced Mainserver ID

#### Scenario: Non-German locale is requested
- **WHEN** the browser requests English or Polish Featured Projects
- **THEN** the gateway returns the same unmodified Mainserver text as for German

### Requirement: Existing Featured Project URLs remain stable
The browser SHALL use `/projects/:projectId` with a namespaced Mainserver GenericItem ID for newly generated Featured Project links. The gateway SHALL continue resolving an unprefixed legacy GenericItem `externalId` when it identifies exactly one public record.

#### Scenario: Generated project link is opened
- **WHEN** a user follows a slider link containing a `featured:` project ID
- **THEN** the detail page loads the exact Smart Village GenericItem represented by that ID

#### Scenario: Existing unambiguous project link is opened
- **WHEN** a user opens a pre-migration `/projects/:projectId` URL whose external ID has exactly one public match
- **THEN** the detail page loads that Smart Village Featured Project without changing the visible URL

#### Scenario: Project does not exist
- **WHEN** neither a namespaced Mainserver ID nor an unprefixed external ID identifies a valid public Featured Project
- **THEN** the gateway returns a not-found error

### Requirement: Duplicate external IDs remain independently available
The gateway MUST return every valid public Featured Project even when multiple records have the same `externalId`. It MUST use each record's Mainserver GenericItem ID for generated public identity and MUST NOT merge or discard records because of a repeated external ID.

#### Scenario: Duplicate external IDs exist in the list
- **WHEN** two public Featured Projects have the same external ID and distinct Mainserver IDs
- **THEN** both records appear in the ordered list with distinct `featured:` public IDs

#### Scenario: Each duplicate opens independently
- **WHEN** a user opens each generated slider link for records sharing an external ID
- **THEN** each link loads the exact corresponding Mainserver record

#### Scenario: Ambiguous legacy detail identity exists
- **WHEN** an unprefixed legacy detail query returns multiple public records for the requested external ID
- **THEN** the detail request fails with an invalid-upstream error instead of selecting a record
