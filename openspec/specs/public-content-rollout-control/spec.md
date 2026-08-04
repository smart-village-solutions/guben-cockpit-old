# public-content-rollout-control Specification

## Purpose
TBD - created by archiving change content-gateway-architecture-hardening. Update Purpose after archive.
## Requirements
### Requirement: Gateway-backed public content is configuration controlled
The frontend SHALL allow deployments to enable or disable gateway-backed public content routes through configuration instead of source code changes.

#### Scenario: Gateway-backed routes are enabled
- **WHEN** the public content source configuration enables gateway usage
- **THEN** gateway-backed routes request their content from the configured gateway endpoint

#### Scenario: Gateway-backed routes are disabled
- **WHEN** the public content source configuration disables gateway usage
- **THEN** gateway-backed routes do not issue gateway requests

### Requirement: Disabled routes render a deterministic disabled state
The frontend MUST render a defined disabled state for public content routes that are switched off by rollout control.

#### Scenario: Disabled route shows the configured fallback state
- **WHEN** a user opens a public content route while gateway usage is disabled for that route
- **THEN** the frontend renders the configured disabled-state UI instead of attempting content loading

#### Scenario: Disabled state can be activated without rebuilding route logic
- **WHEN** an operator changes the public content source configuration for a deployment
- **THEN** the disabled state takes effect without source edits to the affected route components

