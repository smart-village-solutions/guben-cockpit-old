## 1. Shared FAQ Contract

- [x] 1.1 Add shared schemas and TypeScript types for normalized Booking FAQ items and the FAQ response envelope.
- [x] 1.2 Add contract tests covering valid responses, required fields, numeric normalized weights, and invalid response rejection.

## 2. Smart Village FAQ Repository

- [x] 2.1 Add Smart Village Generic Item FAQ upstream types and the authenticated `genericItems(genericType: "FAQ")` GraphQL query.
- [x] 2.2 Implement item validation and mapping for ID, title/question, the single content-block body/answer, language code, and `sortWeight` with invalid or missing weights normalized to `0`.
- [x] 2.3 Implement invalid-item isolation with safe structured diagnostics while treating a malformed collection envelope as an upstream payload error.
- [x] 2.4 Implement normalized language filtering and deterministic sorting by descending weight, numbered-title precedence, ascending numeric prefix, German-aware title, and ID.
- [x] 2.5 Add focused repository tests for successful mapping, language selection, empty-language results, malformed envelopes, isolated malformed items, missing weights, and every comparator tier.

## 3. Content-Gateway Endpoint

- [x] 3.1 Extend the public content repository contract and composite repository to provide language-specific Booking FAQs through the Smart Village repository path.
- [x] 3.2 Add `GET /api/content/booking/faqs` using the established content-language resolution and shared response validation.
- [x] 3.3 Add endpoint tests for explicit and header-derived languages, valid sorted output, successful empty output, and deterministic upstream errors.
- [x] 3.4 Extend gateway documentation and operational endpoint coverage without adding new secrets or a second OAuth configuration.

## 4. Frontend Integration

- [x] 4.1 Add a public-content FAQ query hook keyed by the active content language and validated with the shared FAQ response schema.
- [x] 4.2 Refactor `BookingFaq` to prefer non-empty API results while retaining the existing localized `faq.items` for request-error, invalid-response, and successful-empty fallbacks.
- [x] 4.3 Render every API answer through the established HTML sanitizer, preserving readable plaintext and supported safe formatting while rejecting unsafe markup.
- [x] 4.4 Preserve stable item identity, two-line clamping, single-item expansion, localized controls, and overflow remeasurement after content or viewport changes.
- [x] 4.5 Add hook and component tests for API success, language changes, all fallback paths, plaintext, safe and unsafe HTML, stable ordering consumption, and overflow/expand behavior.

## 5. Verification and Rollout

- [x] 5.1 Run focused shared-contract, content-gateway, frontend hook, Booking FAQ component, type-check, and production-build validation.
- [x] 5.2 Verify the deployed endpoint and Booking page for German, English, and Polish content and ordering. The current production dataset contains no HTML-formatted answer; safe HTML rendering remains covered by the sanitizer and component tests from task 4.5.
- [x] 5.3 Verify local FAQ fallback behavior against a controlled FAQ endpoint failure and document the rollback to local-only FAQ rendering.
