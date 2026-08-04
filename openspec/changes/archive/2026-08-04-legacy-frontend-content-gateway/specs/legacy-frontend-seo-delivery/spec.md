## ADDED Requirements

### Requirement: Public Legacy Routes Are Crawlable
The system SHALL deliver crawlable HTML for defined public routes using a prerender or SSR-compatible strategy while preserving the existing frontend codebase.

#### Scenario: Public route includes server-delivered content
- **WHEN** a crawler requests a configured public route
- **THEN** the initial HTML contains route content and metadata without requiring client-side API execution

### Requirement: SEO Metadata Comes From Gateway-Mapped Content
The system MUST render route-level metadata (title, description, canonical, and indexability where configured) from normalized gateway content contracts.

#### Scenario: Metadata fallback behavior
- **WHEN** CMS metadata is missing for a route
- **THEN** the route renders with configured fallback metadata values instead of empty tags
