# smart-city-booking-api-integration Specification

## Purpose
TBD - created by archiving change migrate-booking-to-smart-city-api. Update Purpose after archive.
## Requirements
### Requirement: Frontend loads booking data from Smart City Booking JSON API
The frontend SHALL load public booking resources and booking availability exclusively from the Smart City Booking JSON API and SHALL NOT depend on HTML responses from legacy booking pages for booking flows.

#### Scenario: Load public bookables for a tenant
- **WHEN** the booking overview needs bookables for a tenant returned by the existing public-content contracts
- **THEN** the frontend requests the configured `VITE_BOOKING_API_URL` using the tenant-specific public bookables endpoint
- **AND THEN** the frontend validates the JSON response before using it in the UI

#### Scenario: Load occupancy for a bookable
- **WHEN** a booking view requires availability information for a specific bookable and time range
- **THEN** the frontend requests the tenant-specific occupancy endpoint on the configured `VITE_BOOKING_API_URL`
- **AND THEN** it validates the occupancy payload before rendering availability state

#### Scenario: Legacy HTML booking endpoints are not used
- **WHEN** the booking overview, booking detail, or booking availability flow requests booking data
- **THEN** the frontend does not request `/api/booking/html/*` or `backend.booking.guben.de` for that booking flow
- **AND THEN** the frontend does not parse booking HTML with `DOMParser`

### Requirement: Frontend maps booking payloads into a stable internal booking model
The frontend SHALL transform Smart City Booking API payloads into explicit internal `Booking` and `Ticket` models before storing or rendering them.

#### Scenario: Map required Booking fields
- **WHEN** the frontend receives a valid public bookables payload
- **THEN** each mapped `Booking` contains `title`, `description`, `location`, `type`, `imgUrl`, `bookingUrl`, `prices`, and `category`
- **AND THEN** components consume the mapped model instead of raw API objects

#### Scenario: Map optional Booking fields with safe defaults
- **WHEN** a valid bookable payload omits optional fields such as `flags`, `autoCommitNote`, `price`, `tickets`, `bookings`, or `bkid`
- **THEN** the frontend still renders the bookable using deterministic safe defaults
- **AND THEN** no legacy HTML lookup is attempted to fill the gap

#### Scenario: Map required Ticket fields
- **WHEN** the frontend derives ticket models from valid booking API data
- **THEN** each mapped `Ticket` contains `title`, `description`, `location`, `type`, `prices`, `bookingUrl`, `bkid`, and `imgUrl`
- **AND THEN** optional fields such as `flags` and `autoCommitNote` are normalized consistently

### Requirement: Booking rollout is gated on verified frontend connectivity
The frontend SHALL only roll out booking flows against the Smart City Booking API after direct browser access to the configured booking API base URL has been verified in target environments.

#### Scenario: Connectivity verification succeeds
- **WHEN** local development and at least one deployed target environment can reach the configured `VITE_BOOKING_API_URL`
- **THEN** the booking migration may proceed to rollout
- **AND THEN** deployment documentation records the verified configuration

#### Scenario: Connectivity verification is missing or fails
- **WHEN** direct browser access to the configured `VITE_BOOKING_API_URL` has not been verified or is known to fail
- **THEN** the rollout remains blocked
- **AND THEN** the issue is treated as a release gate rather than an implementation detail

