## 1. Safety Net and Compatibility Gates

- [x] 1.1 Repair the current content-gateway test baseline so the existing gateway test suite runs green again.
- [x] 1.2 Add characterization tests for current `/api/content/*` payloads, outage contracts, and source-mode startup behavior.
- [x] 1.3 Add CI verification that blocks regressions in contracts and gateway tests before refactor tasks land.

## 2. Shared Contracts

- [x] 2.1 Create a shared public-content contracts module that contains the authoritative Zod schemas and exported types.
- [x] 2.2 Replace gateway-local contract imports with the shared contracts module.
- [x] 2.3 Replace frontend-local contract imports and verification scripts with the shared contracts module.

## 3. Gateway Source Policy

- [x] 3.1 Reduce gateway startup validation so `mock` and `postgrest` require only their active configuration.
- [x] 3.2 Remove or isolate unused CMS runtime wiring from the current branch runtime path.
- [x] 3.3 Update gateway health/readiness output to report the active source mode and dependency readiness.

## 4. Gateway Internal Refactor

- [x] 4.1 Split the monolithic public content repository into smaller source-adapter, mapper, and composer modules without changing `/api/content/*` contracts.
- [x] 4.2 Introduce direct query paths for detail endpoints so they do not depend on loading broad list responses first.
- [x] 4.3 Add or update focused tests for source adapters, mappers, and endpoint-level contract behavior.

## 5. Frontend Rollout Control

- [x] 5.1 Add configuration-driven source resolution for gateway-backed public content routes.
- [x] 5.2 Implement a deterministic disabled-state UI for routes where gateway usage is turned off.
- [x] 5.3 Ensure disabled routes skip gateway requests and keep route components free of hard-coded source toggles.

## 6. Observability and Documentation

- [x] 6.1 Replace unbounded request-duration storage with bounded Prometheus-compatible latency metrics suitable for alerting.
- [x] 6.2 Keep upstream failure counters and add tests that cover readiness and metrics behavior for active source modes.
- [x] 6.3 Update system and rollout documentation to match the hardened source policy, rollout control, and observability model.
