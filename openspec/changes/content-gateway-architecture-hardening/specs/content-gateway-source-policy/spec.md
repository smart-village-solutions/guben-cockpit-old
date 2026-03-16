## ADDED Requirements

### Requirement: Active source mode defines required configuration
The content gateway SHALL validate runtime configuration only for the selected content source mode.

#### Scenario: PostgREST mode does not require CMS settings
- **WHEN** `CONTENT_SOURCE_MODE=postgrest` and all required PostgREST settings are present while CMS settings are absent
- **THEN** the gateway starts successfully and serves requests without requiring CMS configuration

#### Scenario: Mock mode does not require external upstream settings
- **WHEN** `CONTENT_SOURCE_MODE=mock`
- **THEN** the gateway starts successfully without requiring PostgREST or CMS connectivity

#### Scenario: Missing required settings fail startup
- **WHEN** the selected content source mode is missing required configuration for its active dependencies
- **THEN** the gateway fails startup before accepting HTTP traffic

### Requirement: Active source mode is visible in health and readiness signals
The content gateway MUST expose the active source mode and the readiness state of its required dependencies through its health interface.

#### Scenario: PostgREST readiness reflects active dependency state
- **WHEN** `CONTENT_SOURCE_MODE=postgrest` and PostgREST is unavailable
- **THEN** the gateway health interface reports the service as not ready for traffic

#### Scenario: Mock mode has no external readiness dependency
- **WHEN** `CONTENT_SOURCE_MODE=mock`
- **THEN** the gateway health interface reports readiness without requiring any external upstream check
