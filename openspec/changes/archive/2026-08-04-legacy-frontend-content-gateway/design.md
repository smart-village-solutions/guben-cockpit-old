## Context

The project keeps the existing `frontend/` (Vite + React) as the primary user interface. Public content will be sourced from an external GraphQL CMS, but the CMS API key must never be exposed in the browser. At the same time, database-backed read paths should be exposed through a controlled API surface that can be consumed by the new backend stack.

The current architecture therefore needs a small server-side gateway for upstream composition and a PostgREST facade for PostgreSQL read access. The gateway returns stable JSON view models to the legacy frontend and can aggregate CMS and PostgREST data where required.

This change affects multiple parts of the system: a new TypeScript gateway service, frontend data-access updates, CI changes, and runtime operations for secrets and monitoring.

## Goals / Non-Goals

**Goals:**
- Keep `frontend/` as the active UI without forcing a full frontend rewrite.
- Introduce a server-side content gateway that is the only component allowed to call the external CMS.
- Introduce PostgREST as a read-only facade for selected PostgreSQL data used by public frontend routes.
- Protect `CMS_API_KEY` and related CMS configuration from client-side exposure.
- Provide stable content endpoints for home, projects, events, map, dashboard, and footer.
- Define deterministic outage behavior so frontend rendering remains predictable during upstream failures.
- Improve SEO delivery for public routes via prerender/SSR-compatible output strategy.

**Non-Goals:**
- Replacing the entire legacy frontend with a new framework.
- Recreating all former .NET domain behavior in the new gateway.
- Introducing CMS write/backoffice operations in this phase.
- Solving private/authenticated route SEO beyond public content pages.

## Decisions

### 1. Deploy a dedicated TypeScript content gateway service
The system will add a separate gateway service (Node.js/TypeScript) that exposes internal/public REST endpoints for frontend consumption.

Rationale:
- Isolates external CMS concerns and secrets.
- Avoids coupling frontend release cadence to CMS schema details.
- Keeps migration scope focused while preserving old UI.

Alternatives considered:
- Direct browser-to-CMS GraphQL calls: rejected because API key exposure risk is unacceptable.
- Extending legacy .NET backend for this concern: rejected for now to reduce scope in the new target architecture and keep ownership within frontend-focused stack.

### 2. Add PostgREST as database read facade
The system will run PostgREST in front of PostgreSQL for public, read-only data access, limited to a dedicated role and explicit schema objects (preferably views) exposed to the API.

Rationale:
- Rapidly exposes relational data through a standardized REST interface without handwritten CRUD controllers.
- Enables frontend-to-new-backend integration through a documented, queryable API surface.
- Keeps direct SQL and connection credentials out of the browser.

Alternatives considered:
- Building all read endpoints manually in Node.js first: rejected due to higher initial implementation cost.
- Exposing raw DB access from frontend: rejected for security and operability reasons.

### 3. Use server-only environment variables for CMS access
`CMS_GRAPHQL_URL`, `CMS_API_KEY`, and timeout/retry settings will exist only in gateway runtime configuration and deployment secrets.

Rationale:
- Enforces confidentiality by architecture.
- Simplifies auditability and rotation procedures.

Alternatives considered:
- Obfuscated key in frontend bundle: rejected because it is not secure.

### 4. Introduce an adapter/mapping layer in the gateway
Gateway responses will map CMS GraphQL payloads into stable view models per endpoint.

For PostgREST-backed resources, the gateway can either pass through whitelisted fields or apply additional mapping to keep frontend contracts stable when DB schema or view design evolves.

Rationale:
- Shields frontend from CMS schema churn.
- Provides a stable contract for tests and outage handling.

Alternatives considered:
- Passing GraphQL response through unchanged: rejected because it leaks upstream schema complexity and increases break risk in frontend.

### 5. Standardize outage response contract
Gateway will emit consistent non-2xx JSON errors (for example `503` with a typed error body) for upstream timeouts, invalid payloads, and availability failures.

The same contract applies to PostgREST unavailability and query failures.

Rationale:
- Frontend can deterministically render outage states.
- Enables alerting based on uniform error codes/categories.

Alternatives considered:
- Letting each endpoint fail ad hoc: rejected due to inconsistent UX and harder operations diagnostics.

### 6. Adopt SEO-compatible delivery for public routes
Public pages in `frontend/` will be delivered through a build/runtime path that can produce crawlable HTML (prerender or SSR-hosted output), while still using gateway data.

Rationale:
- Keeps legacy app while meeting search-indexing requirements.
- Avoids immediate full platform migration.

Alternatives considered:
- Pure client-side rendering only: rejected due to weaker SEO outcomes for public content pages.

## Risks / Trade-offs

- [Gateway adds one network hop] -> Mitigation: co-locate services, add short timeouts, and instrument p95 latency.
- [Schema mismatch between CMS/PostgREST and adapter] -> Mitigation: runtime validation and contract tests for mapped view models.
- [PostgREST exposes too much surface by default] -> Mitigation: dedicated DB role, explicit grants, limited schema, and preferred view-based exposure.
- [SEO strategy increases build/runtime complexity] -> Mitigation: limit scope to selected public routes and document deployment profile.
- [Single gateway as failure point] -> Mitigation: health checks, autoscaling policy, and graceful frontend outage UI.
- [Operational secret misconfiguration] -> Mitigation: startup validation with explicit errors and pre-deploy config checks.

## Migration Plan

1. Implement gateway skeleton with health endpoint and secure CMS client.
2. Add PostgREST service, DB read role, and restricted schema/view grants for public read paths.
3. Add endpoint adapters for home, projects, events, map, dashboard, and footer using CMS and/or PostgREST data with contract tests.
4. Switch legacy frontend data fetches from old internal content sources to gateway endpoints behind a feature flag.
5. Enable standardized outage rendering in frontend for gateway error contract.
6. Roll out SEO delivery strategy for public routes and validate with crawler checks.
7. Enable production traffic gradually (or by environment) and monitor latency, error rate, and cache effectiveness.

Rollback strategy:
- Keep feature-flagged fallback to existing content source path until gateway stabilization is complete.
- If severe regression appears, route frontend back to prior content source and disable gateway-backed endpoints.

## Open Questions

- Which SEO mechanism is preferred for the existing deployment target: static prerender pipeline, SSR host, or hybrid per route?
- Should gateway responses include cache headers and ETag support from phase one?
- What SLOs (latency/error budget) are required for public content endpoints?
- Is authentication required for any dashboard-related public blocks, or are all selected blocks fully public?
- Which DB objects are exposed directly via PostgREST views versus fully mapped in the gateway layer?