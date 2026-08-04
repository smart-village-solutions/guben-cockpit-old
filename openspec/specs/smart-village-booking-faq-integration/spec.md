# smart-village-booking-faq-integration Specification

## Purpose
TBD - created by archiving change load-booking-faqs-from-smart-village. Update Purpose after archive.
## Requirements
### Requirement: Server-side Smart Village FAQ retrieval
The content gateway SHALL retrieve Booking FAQs through the existing authenticated Smart Village GraphQL integration by querying `genericItems(genericType: "FAQ")` for `id`, `title`, `genericType`, `payload`, and `contentBlocks.body`. Smart Village credentials and access tokens MUST remain server-side.

#### Scenario: Retrieve FAQs through the gateway
- **WHEN** a client requests Booking FAQs from the public content gateway
- **THEN** the gateway queries Smart Village for Generic Items of type `FAQ` using its server-side OAuth credentials
- **THEN** the client receives no Smart Village credential or access token

### Requirement: Stable public Booking FAQ contract
The gateway SHALL map each valid Smart Village FAQ to a stable public representation containing its string `id`, `question` from `title`, `answer` from the single `contentBlocks[0].body`, `languageCode` from `payload.languageCode`, and numeric `sortWeight` from `payload.sortWeight`. A missing or invalid `sortWeight` MUST be normalized to `0`.

#### Scenario: Map a valid FAQ
- **WHEN** a Generic Item has type `FAQ`, a non-empty title, exactly one content block with a string body, and a language code
- **THEN** the gateway returns the normalized FAQ fields in its public response

#### Scenario: Normalize an absent sort weight
- **WHEN** an otherwise valid FAQ has no numeric `payload.sortWeight`
- **THEN** the gateway returns that FAQ with `sortWeight` equal to `0`

#### Scenario: Reject a malformed upstream collection
- **WHEN** the Smart Village response does not contain a `genericItems` collection
- **THEN** the gateway returns its deterministic invalid-upstream-payload error response

#### Scenario: Isolate an invalid FAQ item
- **WHEN** one FAQ in an otherwise valid collection lacks a required field or does not contain exactly one content block
- **THEN** the gateway excludes that item and continues returning the remaining valid FAQs

### Requirement: Language-specific FAQ selection
The gateway SHALL resolve the requested content language using the established public-content language mechanism and SHALL return only FAQs whose `payload.languageCode`, normalized case-insensitively to a two-letter code, equals the resolved language.

#### Scenario: Return German FAQs
- **WHEN** the resolved request language is `de`
- **THEN** the response contains only valid FAQs with normalized language code `de`

#### Scenario: No FAQs exist for the language
- **WHEN** Smart Village returns valid FAQs but none match the resolved request language
- **THEN** the gateway returns a successful response with an empty FAQ collection

### Requirement: Deterministic FAQ ordering
The gateway SHALL sort FAQs first by numeric `sortWeight` descending. For equal weights, titles beginning with optional whitespace followed by an integer and a period SHALL precede unnumbered titles and SHALL be ordered by that integer ascending. Equal-weight unnumbered titles SHALL be ordered alphabetically ascending using deterministic German-aware comparison, and remaining ties SHALL be resolved by title and then `id`.

#### Scenario: Higher weights precede lower weights
- **WHEN** FAQs have different `sortWeight` values
- **THEN** the FAQ with the higher weight appears first

#### Scenario: Numbered titles share a weight
- **WHEN** equal-weight FAQ titles begin with `2.` and `10.`
- **THEN** the title beginning with `2.` appears before the title beginning with `10.`

#### Scenario: Numbered and unnumbered titles share a weight
- **WHEN** numbered and unnumbered FAQ titles have the same weight
- **THEN** all numbered titles appear before all unnumbered titles

#### Scenario: Unnumbered titles share a weight
- **WHEN** equal-weight FAQ titles do not begin with an integer followed by a period
- **THEN** they appear in deterministic alphabetical ascending order

### Requirement: Public FAQ endpoint
The content gateway SHALL expose the normalized language-specific collection through `GET /api/content/booking/faqs`, accepting the established `lang` query parameter and returning responses validated against the shared public FAQ contract.

#### Scenario: Explicit language request
- **WHEN** a client requests `GET /api/content/booking/faqs?lang=pl`
- **THEN** the endpoint returns the sorted normalized Polish FAQ collection

