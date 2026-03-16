## ADDED Requirements

### Requirement: Legacy Frontend Uses Gateway Content Endpoints
The system SHALL keep `frontend/` as the primary UI and MUST retrieve public content via gateway endpoints backed by CMS and/or PostgREST instead of direct CMS, direct database, or legacy internal CMS content dependencies.

#### Scenario: Route content is loaded through gateway
- **WHEN** a user opens a public content route (home, projects, events, map, dashboard, or footer-containing page)
- **THEN** the frontend requests content from the content gateway endpoint for that route

#### Scenario: Frontend does not call PostgREST directly
- **WHEN** public content data originates from PostgreSQL via PostgREST
- **THEN** the browser still consumes the gateway contract endpoint and does not call PostgREST directly

#### Scenario: Legacy internal CMS dependency is removed for public pages
- **WHEN** the public frontend content integration is configured for production mode
- **THEN** no public page content request is sent from the browser to the legacy internal CMS backend
