## MODIFIED Requirements

### Requirement: Domain validation protects the last good response
Every opt-in cached content query MUST provide query-specific validation, and the cache SHALL promote only a response that passes that validation. Duplicate Featured Project external IDs SHALL be accepted as independent domain-valid records.

#### Scenario: Valid empty collection
- **WHEN** a query returns the expected collection as an empty array and its domain contract permits an empty result
- **THEN** the empty response is stored as the latest successful value

#### Scenario: Invalid collection response
- **WHEN** a response omits its required collection or returns it with an invalid shape
- **THEN** the response does not replace the previous successful cache entry

#### Scenario: Duplicate Featured Project external IDs
- **WHEN** a structurally valid Featured Project collection contains multiple public records with one external ID
- **THEN** the response remains eligible for caching and all records remain available to repository mapping

#### Scenario: Query-specific contract violation
- **WHEN** a response violates another invariant that fails its repository request
- **THEN** the response does not replace the previous successful cache entry

#### Scenario: Detail content was deleted upstream
- **WHEN** a detail refresh returns a domain-valid absent result such as `null` or an empty detail collection
- **THEN** the absent result replaces the previous successful cache entry and the repository applies its existing `NOT_FOUND` behavior instead of returning stale deleted content

#### Scenario: Skippable malformed individual record
- **WHEN** an expected collection is valid but contains an individual record that the repository contract intentionally skips with a warning
- **THEN** the collection remains eligible for caching and existing record-level handling is preserved
