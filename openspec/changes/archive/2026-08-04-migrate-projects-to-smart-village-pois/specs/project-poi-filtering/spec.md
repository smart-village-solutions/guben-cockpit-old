## ADDED Requirements

### Requirement: Projects page provides a red POI filter bar
The projects page SHALL render a visually red filter bar directly below the Featured Projects slider and directly above the unified POI results. The bar SHALL present free-text search, multi-category selection, radius selection, and location selection in the same five-column row pattern as Events, with location taking the date control's place. Sorting SHALL use the same compact icon-triggered dropdown interaction as Events, with POI-specific fields and the shared ascending/descending choices. The bar MUST NOT provide a separate reset or `only with image` filter.

#### Scenario: Filter controls are displayed
- **WHEN** `/projects` has loaded its POI filter metadata
- **THEN** a red bar displays search, categories, radius, location, and compact sorting controls in one row before the POI list

#### Scenario: Sorting is opened
- **WHEN** the user activates the compact sorting icon
- **THEN** a dropdown offers POI sort fields and ascending or descending order using the Events sorting interaction

### Requirement: Search covers POI text
Search SHALL match POI names and descriptions case-insensitively after trimming the entered search term. Search input SHALL be debounced before issuing a new network request.

#### Scenario: Search matches the name
- **WHEN** the normalized search term occurs in a POI name with different letter casing
- **THEN** the POI remains in the result set

#### Scenario: Search matches the description
- **WHEN** the normalized search term occurs only in a POI description
- **THEN** the POI remains in the result set

#### Scenario: User types continuously
- **WHEN** the user enters multiple characters within the debounce interval
- **THEN** the frontend does not issue one POI request per keystroke

### Requirement: Multiple categories use OR semantics
Category filtering SHALL accept zero or more category IDs. A POI SHALL match when it belongs to at least one selected category. Category options MUST be keyed and deduplicated by category ID rather than category name and SHALL include Schools, Businesses, and all other valid upstream POI categories.

#### Scenario: School and Business are selected
- **WHEN** a user selects the School category and a Business category
- **THEN** POIs assigned to either category or both are included

#### Scenario: Categories share a display name
- **WHEN** two categories have different IDs but the same name
- **THEN** both remain distinct filter options

#### Scenario: Additional category exists
- **WHEN** Smart Village supplies another valid POI category
- **THEN** it appears in the same category selection without a frontend code change

### Requirement: Location filtering uses stable normalized values
The gateway SHALL derive nonempty location options from the agreed POI location/address priority and SHALL expose a stable option value separately from its user-facing label. Selecting a location SHALL include only POIs assigned to that normalized location.

#### Scenario: Location is selected
- **WHEN** a user selects a location option
- **THEN** only POIs with the corresponding normalized location value remain eligible

#### Scenario: POI has no usable location label
- **WHEN** a POI contains no value accepted by the location priority
- **THEN** it creates no empty location option but remains eligible when no location filter is active

### Requirement: Radius is measured from Guben
Radius filtering SHALL use the established Guben reference coordinates and geodesic distance to each POI's valid coordinates. A positive radius SHALL exclude POIs without valid coordinates; no radius SHALL retain those POIs.

#### Scenario: POI lies inside radius
- **WHEN** the distance from the Guben reference point to a POI is less than or equal to the selected radius
- **THEN** the POI remains eligible

#### Scenario: POI has no coordinates with radius active
- **WHEN** a positive radius is selected and a POI has no valid coordinates
- **THEN** the POI is excluded from the filtered result

#### Scenario: No radius is active
- **WHEN** no positive radius is selected
- **THEN** POIs without coordinates remain eligible

### Requirement: Filter facets remain stable
Category and location options SHALL be derived from the valid unfiltered POI set rather than the current filtered page. Active filters MUST NOT make unrelated available options disappear.

#### Scenario: Category filter is active
- **WHEN** a category is selected and the result set contains only that category
- **THEN** the category control still offers all categories from the valid POI set

#### Scenario: Current page changes
- **WHEN** the user navigates between result pages
- **THEN** category and location options remain unchanged for the same upstream dataset

### Requirement: Sorting is shared and deterministic
Frontend and gateway SHALL use one shared set of sorting values and directions. The default SHALL be name ascending, supported alternatives SHALL be explicitly enumerated, and equal primary sort values MUST be resolved by POI ID.

#### Scenario: Descending sorting is selected
- **WHEN** the frontend selects a supported field and descending direction
- **THEN** the gateway applies descending order rather than silently using ascending order

#### Scenario: Two POIs have equal names
- **WHEN** two matching POIs have the same normalized name
- **THEN** their relative order is stable according to their IDs

### Requirement: Filtering and pagination use one result set
The gateway SHALL apply public-status validation, user filters, sorting, total calculation, and pagination in that order to one normalized POI result set. It SHALL return page number, page size, total count, page count, results, category options, and location options that describe that same source snapshot.

#### Scenario: Filter reduces the result count
- **WHEN** active filters match fewer POIs than the unfiltered catalogue
- **THEN** total count, page count, and page results describe the filtered set

#### Scenario: Filter changes on a later page
- **WHEN** the user changes any content filter while viewing a page greater than one
- **THEN** the page resets to one before the filtered request is evaluated

### Requirement: Filter state is URL-stable and validated
Search, category IDs, radius, location, sort field, sort direction, page, and page size SHALL be represented as validated `/projects` route search parameters. Reloading or sharing the URL SHALL restore the same valid filter state, and invalid values SHALL normalize to safe defaults.

#### Scenario: Filtered projects URL is reloaded
- **WHEN** a user reloads `/projects` with valid POI filter parameters
- **THEN** the red filter bar and POI results restore the encoded state while the Featured Projects slider remains available

#### Scenario: URL contains invalid values
- **WHEN** unsupported sort, radius, page, or category parameter shapes are supplied
- **THEN** the frontend and gateway reject or normalize them without crashing or widening access
