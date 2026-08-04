## ADDED Requirements

### Requirement: Frontend shows explicit booking errors when booking API requests fail
The frontend SHALL render explicit error states when the Smart City Booking API is unreachable, returns non-success HTTP responses, produces invalid payloads, or is misconfigured.

#### Scenario: Booking API base URL is missing or invalid
- **WHEN** the frontend runtime configuration for `VITE_BOOKING_API_URL` is missing or malformed
- **THEN** booking views render a deterministic configuration error state
- **AND THEN** no legacy booking endpoint is used as an implicit default

#### Scenario: Booking API is unreachable
- **WHEN** a booking API request fails due to network, DNS, TLS, timeout, or other transport-level errors
- **THEN** the frontend renders an error state indicating that booking data could not be loaded
- **AND THEN** the UI does not degrade into an empty booking list without explanation

#### Scenario: Booking API returns HTTP error response
- **WHEN** a booking API request returns a non-2xx status code
- **THEN** the frontend renders an error state for the affected booking view
- **AND THEN** the error handling records enough normalized context to distinguish HTTP failure from payload validation failure

#### Scenario: Booking API returns invalid payload
- **WHEN** a booking API response body does not satisfy the frontend schema for that endpoint
- **THEN** the frontend treats the response as an error
- **AND THEN** it renders a deterministic invalid-data error state instead of partially rendering unchecked fields

### Requirement: Booking pages distinguish empty results from failure states
The frontend SHALL only render empty booking states when the booking API returns a valid empty result.

#### Scenario: Valid empty result set
- **WHEN** the booking API returns a syntactically valid response with no bookables for the tenant
- **THEN** the booking overview renders its empty-state UI
- **AND THEN** it does not render an error state

#### Scenario: Failed result set
- **WHEN** the booking overview cannot produce a valid mapped result because the request failed or payload validation failed
- **THEN** the booking overview renders its booking-specific error state
- **AND THEN** it does not render the same UI used for a valid empty result

### Requirement: Booking detail and availability failures are scoped to the affected UI surface
The frontend SHALL keep successfully loaded booking overview data visible when a narrower detail or occupancy request fails.

#### Scenario: Occupancy request fails after bookables loaded
- **WHEN** the booking overview data loaded successfully but a follow-up occupancy request fails
- **THEN** the frontend keeps the successfully loaded bookable data visible
- **AND THEN** it renders an explicit availability-specific error state for the affected area only

#### Scenario: Retry is available for transient failures
- **WHEN** a booking request failed due to a retryable transport or HTTP condition
- **THEN** the affected booking view exposes an explicit retry action
- **AND THEN** retrying does not invoke legacy HTML endpoints
