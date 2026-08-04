# legacy-frontend-content-adapter Specification

## Purpose
TBD - created by archiving change legacy-frontend-content-gateway. Update Purpose after archive.
## Requirements
### Requirement: Gateway Normalizes CMS Data To Stable View Models
The gateway MUST transform external GraphQL CMS responses into stable endpoint-specific view models consumed by the legacy frontend.

#### Scenario: Projects endpoint returns normalized shape
- **WHEN** the frontend requests project content from the gateway
- **THEN** the response matches the documented project view-model contract regardless of upstream field naming

#### Scenario: Footer endpoint returns normalized shape
- **WHEN** the frontend requests footer content from the gateway
- **THEN** the response matches the documented footer view-model contract regardless of upstream nesting

### Requirement: Invalid Upstream Payload Is Rejected
The gateway SHALL validate required upstream fields before mapping and MUST return the outage/error contract when required CMS data is missing or malformed.

#### Scenario: Required CMS field missing
- **WHEN** the CMS response omits a required field used by a mapped route
- **THEN** the gateway responds with a standardized error contract instead of partial invalid data

