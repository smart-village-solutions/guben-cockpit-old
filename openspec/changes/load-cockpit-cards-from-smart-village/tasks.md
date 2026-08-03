## 1. Smart Village Cockpit Card Repository

- [x] 1.1 Extend the Smart Village Generic Item types for categories, media, and web URLs used by Cockpit Cards.
- [x] 1.2 Add focused repository tests for the GraphQL query, language filtering, optional fields, diagnostics, and deterministic sorting.
- [x] 1.3 Implement the `COCKPIT_CARD` query and normalization into the internal category-aware card contract.

## 2. Hybrid Dashboard Composition

- [x] 2.1 Add focused composition tests for normalized category matching, unknown categories, full-source fallback, authoritative API replacement, and immutability.
- [x] 2.2 Implement a shared dashboard enrichment helper that preserves structure and replaces only `informationCards` when usable API cards exist.
- [x] 2.3 Apply enrichment consistently to home, dashboard, and public-content reads and rebuild flattened public cards from enriched tabs.

## 3. Runtime Wiring and Verification

- [x] 3.1 Wire the Cockpit Card repository into PostgREST runtime mode with safe warning and fallback logging.
- [x] 3.2 Update server/composite repository tests to cover the new dependency and fallback behavior.
- [x] 3.3 Run focused content-gateway tests, type checking, shared contract tests, and the production build.
- [x] 3.4 Document deployment verification and confirm OpenSpec task/spec validation.
