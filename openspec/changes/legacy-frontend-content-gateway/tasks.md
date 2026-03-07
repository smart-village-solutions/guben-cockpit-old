## 1. Gateway Foundation

- [ ] 1.1 Create a new TypeScript content-gateway service folder with build, lint, and test setup.
- [ ] 1.2 Implement runtime configuration loading and startup validation for `CMS_GRAPHQL_URL`, `CMS_API_KEY`, and timeout values.
- [ ] 1.3 Add gateway health endpoint and structured request/error logging.

## 2. PostgREST Read Facade

- [ ] 2.1 Add PostgREST service configuration for local/dev/prod deployment profiles.
- [ ] 2.2 Create dedicated PostgREST database role with least-privilege read-only grants.
- [ ] 2.3 Define and grant approved schema objects (preferably views) for public content access.
- [ ] 2.4 Add tests/checks proving non-approved objects and write operations are denied.

## 3. Secure CMS Client

- [ ] 3.1 Implement a server-only GraphQL CMS client that injects the API key only in upstream requests.
- [ ] 3.2 Add timeout and retry policy for CMS requests with clear error classification.
- [ ] 3.3 Add tests verifying that secrets are never included in gateway responses or browser-facing payloads.

## 4. Content Adapter Contracts

- [ ] 4.1 Define stable gateway response contracts for home, projects, events, map, dashboard, and footer endpoints.
- [ ] 4.2 Implement adapter mappers from CMS and/or PostgREST payloads to the stable view-model contracts.
- [ ] 4.3 Add validation logic that rejects malformed/missing required upstream fields and maps them to standardized errors.
- [ ] 4.4 Add contract tests for all adapter endpoints and error mapping paths.

## 5. Outage Response Contract

- [ ] 5.1 Define a single error response schema for upstream timeout, upstream unavailable, and invalid upstream payload cases.
- [ ] 5.2 Implement consistent HTTP status mapping and error codes across all public gateway endpoints.
- [ ] 5.3 Add integration tests that simulate CMS and PostgREST failures and verify deterministic gateway outage responses.

## 6. Legacy Frontend Integration

- [ ] 6.1 Replace legacy frontend public-content data access to use gateway endpoints.
- [ ] 6.2 Implement frontend error-state rendering based on the standardized outage response contract.
- [ ] 6.3 Remove direct public-content dependency on the legacy internal .NET CMS backend.

## 7. SEO Delivery for Public Routes

- [ ] 7.1 Implement prerender or SSR-compatible delivery for defined public routes in the legacy frontend deployment path.
- [ ] 7.2 Bind route metadata (title, description, canonical, indexability) to gateway-mapped content with fallback values.
- [ ] 7.3 Add verification checks ensuring crawlers receive content/metadata in initial HTML.

## 8. CI, Deployment, and Rollout

- [ ] 8.1 Extend CI to build, lint, and test the gateway service and run frontend integration checks against gateway contracts.
- [ ] 8.2 Add deployment configuration and secret management wiring for gateway and PostgREST runtime variables.
- [ ] 8.3 Add monitoring and alerting for gateway latency and CMS/PostgREST upstream failures.
- [ ] 8.4 Execute staged rollout with feature flag/fallback path and document rollback procedure.
