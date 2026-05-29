# Featured Carousel CTA Design

## Goal

Add a localized CTA link below each headline in the featured projects slider while keeping the headline itself clickable.

## Scope

- Featured projects slider on the public projects overview
- Localized CTA text in supported frontend locales
- Test coverage for the new link behavior

## Non-Goals

- Redesigning the slider layout beyond the added CTA row
- Changing destination routes or slider data contracts
- Reworking other project cards or detail pages

## Design

Each featured project slide keeps two separate links to the same project detail page:

- the headline remains clickable
- a second CTA link appears directly below the headline

The CTA text is localized via a dedicated generic translation key in the `common` namespace. The trailing `>` remains in component markup so translators only own the phrase itself.

The description remains visible but is no longer wrapped by the headline link. This keeps the interaction model explicit and avoids one oversized mixed-content link.

## Testing

Add a focused frontend test that verifies:

- the headline renders as a link
- the CTA renders as a second localized link
- both links target the same project URL

## Recommendation

Implement this as a small `FeaturedCarousel` change plus locale updates. This keeps the behavior explicit, localized, and easy to verify.
