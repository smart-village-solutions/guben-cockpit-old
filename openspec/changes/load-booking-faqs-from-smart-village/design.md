## Context

`BookingFaq` currently reads all questions and answers synchronously from the `booking` i18n resources. The content gateway already owns Smart Village OAuth tokens and an authenticated GraphQL client for Event Records, while the browser consumes stable, validated public-content endpoints. Smart Village now provides the Booking FAQs as Generic Items of type `FAQ`; every item has exactly one answer content block, `payload.languageCode`, and optionally a numeric `payload.sortWeight`. Answer bodies are normally plaintext but may contain HTML.

The change crosses shared contracts, the content gateway, and the frontend. It must preserve the current FAQ interaction and localized files as an operational fallback without exposing Smart Village credentials to the browser.

## Goals / Non-Goals

**Goals:**

- Make Smart Village the preferred source for Booking FAQ content.
- Reuse the existing server-side OAuth and GraphQL infrastructure.
- Expose a small, stable, language-specific public FAQ contract.
- Apply deterministic server-side filtering and sorting.
- Render plaintext and sanitized HTML safely.
- Preserve the current localized FAQs as a resilient fallback.

**Non-Goals:**

- Editing FAQs from the Cockpit.
- Adding pagination, search, categories, visibility state, or a new authentication mechanism.
- Removing the existing FAQ translations.
- Generalizing the endpoint into a public arbitrary-Generic-Item proxy.
- Changing the Booking page's established FAQ layout or expand/collapse behavior.

## Decisions

### Route FAQ reads through the content gateway

The frontend will call `GET /api/content/booking/faqs?lang=<language>`. The repository path will use the existing `SmartVillageGraphQLClient`, so OAuth client credentials and bearer tokens remain server-side. A direct browser-to-GraphQL request was rejected because it would duplicate upstream coupling and risk exposing privileged authentication material.

### Introduce a narrow shared FAQ response contract

The shared public-content contracts will define an envelope containing normalized FAQ items with `id`, `question`, `answer`, `languageCode`, and `sortWeight`. Both gateway output and frontend input will validate this contract. Returning the upstream Generic Item unchanged was rejected because `payload` is weakly typed and would leak upstream schema details into the UI.

### Validate the collection while isolating malformed items

A missing or structurally invalid `genericItems` collection is an upstream contract failure. Within a valid collection, malformed individual items will be skipped with the repository's diagnostic warning mechanism so one bad editorial record does not remove every FAQ. Exactly one content block is required by the confirmed contract. Missing or nonnumeric `sortWeight` becomes `0`.

### Filter language and sort in the gateway

The resolved request language is normalized to a lowercase two-letter code and compared to `payload.languageCode` using the same normalization. Filtering and ordering belong in the gateway so all clients see one deterministic result.

The comparator applies these keys in order:

1. numeric `sortWeight`, descending;
2. presence of a leading `^\\s*(\\d+)\\.` sequence, numbered before unnumbered;
3. parsed leading number, ascending, when both titles are numbered;
4. German-aware title comparison with stable options;
5. string `id` as the final tie-breaker.

Treating missing weights as `0` keeps such content visible while making its position predictable. Lexicographic comparison of numeric prefixes was rejected because it would place `10.` before `2.`.

### Prefer API data and retain local content as fallback

The FAQ hook will request the active language. A non-empty valid API result replaces local FAQ items. Request errors, invalid payloads, and successful empty results select the existing `faq.items` for the active language. This keeps the Booking page usable during Smart Village outages and while a translation set is incomplete. The local files remain deployment-controlled fallback data rather than being removed after cutover.

### Sanitize all API answer bodies before HTML rendering

Because an answer can be plaintext or HTML, the frontend will use its established HTML sanitization utility before rendering the answer markup. Applying sanitization unconditionally avoids unreliable markup detection and keeps the security boundary simple. The component must attach measurement refs to a clamp-compatible container so the existing overflow and expand/collapse behavior continues for formatted HTML.

### Use the existing Smart Village readiness model

The FAQ query will share the configured Smart Village upstream and its operational availability with Event reads. No second OAuth client or new deployment secret is introduced. FAQ request failures remain isolated to the FAQ endpoint and are masked in the Booking UI by local fallback content.

## Risks / Trade-offs

- [The generic FAQ query returns all languages on every request] → Filter immediately in the gateway and keep the response narrow; consider upstream filtering only if a verified GraphQL argument becomes available.
- [A malformed item is silently absent to end users] → Emit structured server-side diagnostics containing only safe item context and test invalid-item isolation.
- [Sanitization removes editorial formatting] → Use the project's established allowlist and cover supported formatting with rendering tests.
- [Fallback content can drift from Smart Village] → Treat local content explicitly as emergency fallback and document that editorial truth lives in Smart Village.
- [Equal titles and weights could otherwise reorder] → Use the stable item ID as the final comparator key.
- [HTML containers can change clamp measurement behavior] → Retain resize/content remeasurement and add component tests for formatted answers and overflow transitions.

## Migration Plan

1. Add and test the shared FAQ contracts.
2. Add the Smart Village FAQ repository/query, mapping, language filtering, sorting, and diagnostics.
3. Add the public gateway route and endpoint tests without changing the frontend source.
4. Add the frontend hook and switch `BookingFaq` to API-preferred rendering with the existing local items as fallback.
5. Run focused gateway, shared-contract, frontend hook, component, type, and production-build validation.
6. Deploy through the existing content-gateway/frontend rollout and verify `de`, `en`, and `pl`, an HTML answer, ordering, and fallback behavior.

Rollback consists of reverting the frontend consumption change so `BookingFaq` reads only local translations. The additive gateway endpoint and shared contract can remain deployed safely or be removed in the same rollback.

## Open Questions

Keine. The upstream shape, single-content-block rule, mixed plaintext/HTML behavior, language field, FAQ scope, visibility behavior, sorting rules, and missing-weight behavior are confirmed for this change.
