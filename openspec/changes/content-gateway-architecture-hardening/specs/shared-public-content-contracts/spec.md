## ADDED Requirements

### Requirement: Public content contracts have a single authoritative source
The system SHALL define the public content schemas and types in one shared module that is imported by the content gateway, the frontend, and contract verification tooling.

#### Scenario: Gateway uses the shared contracts
- **WHEN** the gateway validates or returns a public content payload
- **THEN** it uses the shared contract module rather than a gateway-local duplicate definition

#### Scenario: Frontend uses the shared contracts
- **WHEN** the frontend validates or consumes a public content payload
- **THEN** it uses the same shared contract module rather than a frontend-local duplicate definition

### Requirement: Contract drift is blocked by automated verification
The system MUST fail automated verification when public content contract changes are not adopted consistently by all contract consumers.

#### Scenario: Shared contract change requires dependent updates
- **WHEN** a shared public content contract changes without corresponding updates to dependent gateway or frontend code
- **THEN** automated verification fails before release

#### Scenario: No duplicate authoritative contract copies remain
- **WHEN** contract verification runs
- **THEN** it verifies the shared contract source instead of comparing multiple copied contract definitions
