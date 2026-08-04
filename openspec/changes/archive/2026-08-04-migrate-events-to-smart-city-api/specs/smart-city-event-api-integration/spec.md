## ADDED Requirements

### Requirement: Frontend loads event data only from verified Smart City Booking JSON endpoints
The frontend SHALL switch event flows to the Smart City Booking JSON API only after the required live endpoints have been verified to satisfy the event UI contract.

#### Scenario: Verified event endpoints exist
- **WHEN** live Smart City Booking endpoints for event list and the required detail data are verified to provide the fields needed by the event UI
- **THEN** the frontend loads event data from those JSON endpoints
- **AND THEN** it removes the corresponding legacy HTML event scraping logic

#### Scenario: Event contract is not yet sufficient
- **WHEN** the implementation has not verified a sufficient live JSON contract for event list or required detail data
- **THEN** event migration work remains blocked from rollout
- **AND THEN** the missing contract is documented explicitly in the change artifacts

### Requirement: Frontend maps event payloads into stable internal event models
The frontend SHALL transform Smart City Booking event payloads into explicit internal `BookingEvent`, `EventDetails`, and event-ticket models before storing or rendering them.

#### Scenario: Map required Event fields
- **WHEN** the frontend receives a valid event list payload
- **THEN** each mapped `BookingEvent` contains `title`, `date`, `organizer`, `contactName`, `contactPhone`, `contactEmail`, `teaser`, `bkid`, and `imgUrl`
- **AND THEN** optional fields such as `flags`, `details`, and `coordinates` are normalized consistently

#### Scenario: Map required Event ticket fields
- **WHEN** the frontend derives event tickets from valid event detail payloads
- **THEN** each mapped event ticket contains `title`, `prices`, `bookingUrl`, `bkid`, and `imgUrl`
- **AND THEN** optional fields such as `description`, `location`, `type`, `flags`, and `autoCommitNote` use deterministic safe defaults
