## 1. Contracts and Fixtures

- [x] 1.1 Add a typed Featured Project detail contract while preserving the existing Project and list response shapes.
- [x] 1.2 Add sanitized Smart Village Featured Project fixtures covering complete, optional, hidden, unpublished, malformed, and duplicate records.

## 2. Smart Village Repository

- [x] 2.1 Implement ordered `FeaturedProject` GenericItem list mapping, public filtering, warnings, and duplicate identity validation.
- [x] 2.2 Implement direct detail lookup by `externalId` with not-found and duplicate handling.
- [x] 2.3 Cover the repository mapping, language behavior, ordering, optional fields, and upstream failures with tests.

## 3. Gateway Integration

- [x] 3.1 Extend the repository contract and hybrid runtime wiring for Smart Village Featured Project list and detail reads.
- [x] 3.2 Keep Projects page metadata and SEO on PostgREST while removing PostgREST project content fallback.
- [x] 3.3 Add and validate the Featured Project detail endpoint and cover list/detail/failure behavior with gateway tests.

## 4. Frontend Integration

- [x] 4.1 Load Featured Project details through the dedicated gateway endpoint while preserving `/projects/:projectId` URLs.
- [x] 4.2 Preserve slider, detail rendering, stable links, and independent Featured Project/POI error states with frontend tests.

## 5. Documentation and Validation

- [x] 5.1 Document the verified Smart Village Featured Project read contract and intentional locale behavior.
- [x] 5.2 Run shared, gateway, frontend, and PostgREST tests plus gateway lint/typecheck, frontend typecheck/build, and strict OpenSpec validation.

## 6. Operational Follow-up

- [x] 6.1 Record live duplicate cleanup as an external operational concern that does not block this implementation.
