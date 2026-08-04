## ADDED Requirements

### Requirement: PostgreSQL Read Surface Is Exposed Through PostgREST
The system MUST provide a PostgREST service that exposes only approved read-only PostgreSQL objects for public content use cases.

#### Scenario: Approved object is queryable
- **WHEN** a gateway request targets an approved PostgREST resource
- **THEN** PostgREST returns data for the granted view/table using read-only access

#### Scenario: Non-approved object is blocked
- **WHEN** a request targets a PostgreSQL object that is not granted to the PostgREST role
- **THEN** PostgREST denies access and no data is returned

### Requirement: PostgREST Uses Least-Privilege Database Access
The system SHALL run PostgREST with a dedicated database role that has only `SELECT` privileges on explicitly granted schema objects.

#### Scenario: Write operations are rejected
- **WHEN** a client attempts to create, update, or delete via PostgREST
- **THEN** the request is rejected because the configured role has no write privilege

### Requirement: Gateway Handles PostgREST Failures Through Standard Contract
The gateway MUST map PostgREST unavailability and query failures to the same standardized outage/error contract used for other upstream providers.

#### Scenario: PostgREST unavailable
- **WHEN** PostgREST cannot be reached by the gateway
- **THEN** the gateway responds with the standardized outage contract for the affected endpoint
