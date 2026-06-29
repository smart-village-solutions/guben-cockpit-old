# Detail Media Layout Design

## Goal

Unify all frontend detail pages so images no longer appear in the header area above the headline. Instead, images render next to the description content on larger screens and below it on smaller screens. If multiple images are available, the same slot renders a slider. Clicking an image opens a fullscreen view.

## Scope

This applies to all current detail pages that expose image content:

- Booking detail pages
- Event detail pages
- Project detail pages, including schools and marketplace offers
- Booking room detail pages

Future detail pages should reuse the same media component instead of introducing page-specific image layouts.

## Non-Goals

- Redesigning breadcrumb, headline, metadata, or page copy
- Introducing a new gallery system outside detail pages
- Changing upstream APIs or data contracts
- Refactoring unrelated project or booking list views

## Existing Situation

The current frontend mixes at least two image patterns:

- `DetailPageLayout` can render a header image above the title and metadata
- Some booking detail content already renders a local description-plus-image two-column block

This leads to inconsistent detail pages and duplicated image layout logic. A standard detail-media component should replace these page-specific patterns while keeping the existing header content intact.

## Proposed Design

### 1. Keep header structure, remove header media usage

`DetailPageLayout` remains responsible for:

- Breadcrumb or back navigation
- Title
- Metadata card wrapper

The header image area is no longer used by detail pages that adopt the new standard. The title and metadata remain at the top in the current structure.

### 2. Introduce a reusable detail-media content block

Add a reusable component dedicated to the first content section below the header:

- Left side: description heading and description body
- Right side: image area
- Mobile: stacked layout with media below text
- No images: render only the text block without an empty media column

This component should stay narrowly scoped to avoid turning into a second page layout system. It should only own:

- responsive text/media arrangement
- image rendering rules
- slider behavior
- fullscreen behavior

It should not own breadcrumbs, page titles, metadata, maps, pricing cards, or other follow-up sections.

### 3. Normalize page-specific image sources into one local shape

Use a shared UI-facing image shape for the media block. The shape should be minimal and derived close to each page:

```ts
type DetailMediaImage = {
  src: string;
  alt?: string;
  caption?: string;
};
```

Source mapping:

- Booking details: `booking.imgUrl` -> single-item array when present
- Booking room details: `booking.imgUrl` -> single-item array when present
- Event details: `event.images` -> mapped array using original-sized sources
- Project details: `project.imageUrl` -> single-item array when present

This keeps upstream contracts untouched and centralizes only the display behavior.

### 4. Image behavior

The media area must support the following cases:

- `0` images: no media block
- `1` image: responsive single image
- `n > 1` images: slider in the same media slot

Rendering requirements:

- Width follows the available column width
- Height follows the source aspect ratio
- No forced fixed-height crop in the detail media block
- Prefer a containment-first presentation to avoid unpredictable clipping

If image credits or captions are available later, the component should support them without structural changes, but the first implementation should not invent placeholder UI when the source data does not provide it consistently.

### 5. Slider behavior

When multiple images are present:

- Render navigation controls in-place
- Keep the slider in the same right-hand slot as the single-image case
- Preserve the currently selected image when entering fullscreen
- Show the current position, such as `2 / 5`

The implementation should prefer existing project UI primitives over introducing a new slider dependency if the current codebase already has suitable carousel building blocks.

### 6. Fullscreen behavior

Use the existing dialog primitives for fullscreen viewing:

- Clicking the image opens a modal-style fullscreen viewer
- The currently selected image opens first
- Multi-image navigation remains available inside fullscreen
- The fullscreen view should prioritize large media display over extra chrome

This keeps modal behavior aligned with the rest of the frontend and avoids a second overlay stack.

## Page Integration

### Booking detail page

- Stop passing the booking image into the header area
- Replace the local ad hoc description/image grid with the reusable detail-media block
- Keep offers and pricing sections unchanged below it

### Event detail page

- Stop passing the first event image into the header area
- Move event images into the reusable detail-media block next to the event details text
- Keep tickets and map sections below it

### Project detail page

- Stop passing the project image into the header area
- Remove description duplication between metadata and main content
- Use the reusable detail-media block for the descriptive text plus image
- Keep full text or further detail content below it

### Booking room detail page

- Replace the page-specific hero banner with the standard detail-page structure
- Keep room listing content below the top description/media section

This is the only page likely to need a slightly larger integration adjustment, but it is necessary to meet the requirement that the layout be standard across all detail pages.

## Complexity Control

To keep the implementation within quality standards:

- Create one focused media component instead of extending multiple pages independently
- Keep the image data adapter small and page-local
- Reuse existing dialog and carousel primitives where possible
- Do not add speculative support for videos, thumbnails, zoom gestures, or external gallery configuration
- Avoid moving non-media layout responsibilities into the new component

If a page has only one image source today, it should still use the shared component rather than a shortcut implementation.

## Accessibility

The media implementation should include:

- Keyboard-accessible open and close behavior for fullscreen
- Accessible previous/next controls with labels
- Meaningful `alt` text where data is available
- Focus handling that follows the existing dialog behavior

If no meaningful alt text exists from the source, the page should at least pass the page title instead of leaving all images unnamed.

## Testing Strategy

Test coverage must be part of the change, not a follow-up task.

### Component-level tests

Add targeted tests for the new media component covering:

- no-image render path
- single-image render path
- multi-image render path
- slider navigation state changes
- fullscreen dialog open behavior
- fullscreen viewer preserving the selected image

These tests should focus on deterministic behavior and avoid brittle assertions tied to exact styling classes unless the class is part of the functional contract.

### Integration tests

Add or update page tests to verify:

- header image output is removed from migrated detail pages
- description text still renders in the expected section
- image content appears in the content area instead of the header
- pages with one image and multiple images both render correctly

Coverage should include at least:

- one booking detail case
- one event detail case
- one project detail case

If booking room detail coverage is practical within the existing test setup, include it as well; otherwise document the gap explicitly in the implementation PR and cover it with manual verification.

### Manual verification

Manual QA should confirm:

- desktop two-column layout
- mobile stacked layout
- fullscreen image open and close behavior
- multi-image navigation in-page and in fullscreen
- no visual regression in the header title and metadata area

## Risks

- Event and project detail pages currently derive image data differently, so sloppy normalization could create inconsistent alt text or missing images
- Booking room detail currently uses a separate hero implementation, so its migration may reveal assumptions not present on other pages
- Reusing an existing carousel component may require minor adaptation for fullscreen state synchronization

## Recommendation

Implement the change as a shared detail-media component plus page-local image normalization. This is the smallest architecture that achieves consistent UX, minimizes duplicated layout logic, and keeps test scope manageable.
