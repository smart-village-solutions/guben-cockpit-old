## ADDED Requirements

### Requirement: API-backed Booking FAQ rendering
The Booking FAQ component SHALL request FAQs from the public content gateway for the active content language and SHALL render the returned question and answer values using the FAQ item's stable `id` as its UI identity.

#### Scenario: API FAQs are available
- **WHEN** the FAQ endpoint returns one or more FAQs for the active language
- **THEN** the Booking page renders those FAQs in the order returned by the gateway
- **THEN** the local FAQ items are not rendered

#### Scenario: Active language changes
- **WHEN** the user changes the active language
- **THEN** the component requests and renders FAQs for the new language

### Requirement: Safe mixed text and HTML answers
The Booking FAQ component SHALL support answer bodies containing either plaintext or HTML. It MUST sanitize every API-provided answer before inserting HTML into the document and MUST preserve readable plaintext and supported safe formatting.

#### Scenario: Plaintext answer
- **WHEN** an API FAQ answer contains plaintext
- **THEN** the component renders the text as readable answer content

#### Scenario: Safe HTML answer
- **WHEN** an API FAQ answer contains supported safe HTML formatting
- **THEN** the component renders that formatting after sanitization

#### Scenario: Unsafe HTML answer
- **WHEN** an API FAQ answer contains scripts, event-handler attributes, or other disallowed markup
- **THEN** the unsafe content is removed before the answer is inserted into the document

### Requirement: Language-specific local fallback
The Booking FAQ component SHALL retain the existing localized FAQ items and SHALL render the items for the active language when the FAQ request fails, its response violates the public contract, or its successful response contains no FAQs. Loading state alone MUST NOT replace already available fallback content with an empty FAQ area.

#### Scenario: Gateway request fails
- **WHEN** the FAQ endpoint cannot be reached or returns an error
- **THEN** the component renders the existing local FAQ items for the active language

#### Scenario: Gateway response is empty
- **WHEN** the FAQ endpoint successfully returns no FAQs for the active language
- **THEN** the component renders the existing local FAQ items for that language

#### Scenario: Gateway response is invalid
- **WHEN** the endpoint response fails shared-contract validation
- **THEN** the component renders the existing local FAQ items for the active language

### Requirement: Existing FAQ interaction behavior
The API-backed FAQ display SHALL preserve the existing two-line collapsed presentation, overflow-dependent expand control, localized show-more/show-less labels, single expanded item behavior, and overflow recalculation when rendered FAQ content or viewport dimensions change.

#### Scenario: Long answer is collapsed
- **WHEN** a rendered answer exceeds two visible lines
- **THEN** it is initially clamped to two lines and displays the localized expand control

#### Scenario: FAQ content source changes
- **WHEN** the displayed FAQs change from fallback content to API content
- **THEN** overflow measurements are recalculated for the newly rendered answers
