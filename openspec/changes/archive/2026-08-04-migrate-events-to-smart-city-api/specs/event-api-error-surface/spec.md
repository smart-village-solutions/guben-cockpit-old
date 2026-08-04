## ADDED Requirements

### Requirement: Frontend shows explicit errors when event API requests fail
The frontend SHALL render explicit error states when the Smart City Booking event API is unreachable, returns non-success HTTP responses, produces invalid payloads, or is misconfigured.

#### Scenario: Event API base URL is missing or invalid
- **WHEN** the frontend runtime configuration required for event API access is missing or malformed
- **THEN** event views render a deterministic configuration error state
- **AND THEN** the frontend does not silently keep using legacy HTML endpoints as an implicit fallback

#### Scenario: Event list request fails
- **WHEN** the event list request fails due to transport, HTTP, or payload-validation reasons
- **THEN** the event list renders an explicit error state
- **AND THEN** it does not render the same UI used for a valid empty result

#### Scenario: Event detail request fails after list data loaded
- **WHEN** event teaser or list data loaded successfully but a narrower event detail or ticket request fails
- **THEN** the frontend keeps the successfully loaded higher-level event data visible
- **AND THEN** it renders an explicit detail-specific error state for the affected event area only

#### Scenario: Retry is available for transient failures
- **WHEN** an event request failed due to a retryable transport or HTTP condition
- **THEN** the affected event view exposes an explicit retry action
- **AND THEN** retrying does not invoke legacy HTML endpoints
