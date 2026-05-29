# Detail Media Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move detail-page images out of the header and into a shared responsive media block beside the description, with slider and fullscreen support across booking, event, project, and booking-room details.

**Architecture:** Keep `DetailPageLayout` focused on breadcrumb, title, and metadata. Introduce one dedicated detail-media component that owns text/media layout, multi-image state, and fullscreen dialog behavior. Each detail page maps its own image data into a small shared UI shape and renders the shared component as its first content section.

**Tech Stack:** React 18, TypeScript, Vitest, Testing Library, Tailwind CSS, Radix Dialog, existing project carousel primitives.

---

## File Structure

- Create: `frontend/src/components/ui/detailMediaSection.tsx`
  - Shared description-plus-media layout with single-image, slider, and fullscreen behavior
- Create: `frontend/src/components/ui/detailMediaSection.test.tsx`
  - Unit coverage for `0/1/n` image states and fullscreen interaction
- Modify: `frontend/src/components/booking/bookingComponent.tsx`
  - Replace local description/image grid with shared media section and stop using header image
- Modify: `frontend/src/components/booking/bookingComponent.test.tsx`
  - Verify booking detail uses content media instead of header media
- Modify: `frontend/src/components/booking/bookingRoom.tsx`
  - Replace custom hero banner with standard detail-page header plus shared media section
- Modify: `frontend/src/components/booking/bookingRoom.test.tsx`
  - Verify booking-room detail keeps room listing and moves image below header
- Modify: `frontend/src/components/public-content/GatewayEventDetailPage.tsx`
  - Move event images into shared media section and stop using the header image
- Create: `frontend/src/components/public-content/GatewayEventDetailPage.test.tsx`
  - Verify event detail description/media placement and multi-image rendering
- Modify: `frontend/src/components/public-content/GatewayProjectDetailPage.tsx`
  - Move project image into shared media section and remove duplicated top description text
- Create: `frontend/src/components/public-content/GatewayProjectDetailPage.test.tsx`
  - Verify project detail uses content media and keeps detailed text below

### Task 1: Lock Down Shared Media Behavior with Failing Tests

**Files:**
- Create: `frontend/src/components/ui/detailMediaSection.test.tsx`

- [ ] **Step 1: Write the failing shared-component tests**

Cover the three required render paths and fullscreen activation.

```tsx
it("renders only the text column when no images are available", () => {
  render(
    <DetailMediaSection
      heading="Beschreibung"
      body={<p>Nur Text</p>}
      images={[]}
    />,
  );

  expect(screen.getByText("Nur Text")).toBeTruthy();
  expect(screen.queryByRole("button", { name: /bild/i })).toBeNull();
});

it("renders slider controls when multiple images are provided", async () => {
  render(
    <DetailMediaSection
      heading="Beschreibung"
      body={<p>Mit Bildern</p>}
      images={[
        { src: "/one.jpg", alt: "Bild 1" },
        { src: "/two.jpg", alt: "Bild 2" },
      ]}
    />,
  );

  expect(screen.getByText("1 / 2")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: /next image/i }));
  expect(screen.getByText("2 / 2")).toBeTruthy();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- --run src/components/ui/detailMediaSection.test.tsx`
Expected: FAIL because the shared component does not exist yet.

- [ ] **Step 3: Implement the minimal shared detail-media component**

Create a focused component that accepts a small image array and a text body, uses one local selected-index state, and reuses the existing `Dialog` primitive for fullscreen.

```tsx
export type DetailMediaImage = {
  src: string;
  alt?: string;
  caption?: string;
};

export function DetailMediaSection({ heading, body, images }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const hasImages = images.length > 0;
  const hasMultipleImages = images.length > 1;
  const currentImage = images[selectedIndex];

  return (
    <section className={cn("grid gap-8", hasImages && "lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]")}>
      <div>
        <h2 className="font-bold text-xl mb-4">{heading}</h2>
        {body}
      </div>
      {hasImages ? (
        <div>{/* image, controls, dialog */}</div>
      ) : null}
    </section>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- --run src/components/ui/detailMediaSection.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/detailMediaSection.tsx frontend/src/components/ui/detailMediaSection.test.tsx
git commit -m "feat: add shared detail media section"
```

### Task 2: Migrate Booking Details to the Shared Media Section

**Files:**
- Modify: `frontend/src/components/booking/bookingComponent.tsx`
- Modify: `frontend/src/components/booking/bookingComponent.test.tsx`
- Modify: `frontend/src/components/booking/bookingRoom.tsx`
- Modify: `frontend/src/components/booking/bookingRoom.test.tsx`

- [ ] **Step 1: Write the failing booking detail tests**

Update booking detail tests so they assert the shared component path rather than the old local image grid or room hero banner.

```tsx
it("passes booking images through the shared media section instead of the header image", () => {
  hydrationState.booking = {
    title: "Fahrradbox",
    description: "Beschreibung",
    imgUrl: "/bike-box.jpg",
    tickets: [],
  };

  render(<BookingComponent />);

  expect(screen.getByRole("img", { name: "Fahrradbox" })).toBeTruthy();
  expect(screen.queryByTestId("detail-header-image")).toBeNull();
});
```

```tsx
it("renders the booking-room detail with the shared layout and room cards", () => {
  hydrationState.booking = {
    title: "Rathaus",
    description: "Raumbeschreibung",
    imgUrl: "/rooms.jpg",
    bookings: [{ title: "Saal 1" }],
  };

  render(<BookingRoom />);

  expect(screen.getByText("Raumbeschreibung")).toBeTruthy();
  expect(screen.getByText("room-card:Saal 1")).toBeTruthy();
});
```

- [ ] **Step 2: Run the booking tests to verify they fail**

Run: `npm test -- --run src/components/booking/bookingComponent.test.tsx src/components/booking/bookingRoom.test.tsx`
Expected: FAIL because booking pages still use page-specific image layouts.

- [ ] **Step 3: Replace booking-specific image layouts with the shared component**

Stop passing `heroImage` from booking details, map `imgUrl` to one shared image item, and reuse `DetailPageLayout` for booking-room detail instead of its custom hero.

```tsx
const images = booking.imgUrl ? [{ src: booking.imgUrl, alt: title }] : [];

<DetailPageLayout title={title} metadata={metadata} breadcrumbItems={...}>
  <div className="space-y-8">
    <DetailMediaSection
      heading={t("bookingComponent.description")}
      body={<TranslatedHtml className="prose max-w-none" text={booking.description} />}
      images={images}
    />
    <OffersSection />
  </div>
</DetailPageLayout>
```

- [ ] **Step 4: Run the booking tests to verify they pass**

Run: `npm test -- --run src/components/booking/bookingComponent.test.tsx src/components/booking/bookingRoom.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/booking/bookingComponent.tsx frontend/src/components/booking/bookingComponent.test.tsx frontend/src/components/booking/bookingRoom.tsx frontend/src/components/booking/bookingRoom.test.tsx
git commit -m "feat: unify booking detail media layout"
```

### Task 3: Migrate Event and Project Details to the Shared Media Section

**Files:**
- Modify: `frontend/src/components/public-content/GatewayEventDetailPage.tsx`
- Create: `frontend/src/components/public-content/GatewayEventDetailPage.test.tsx`
- Modify: `frontend/src/components/public-content/GatewayProjectDetailPage.tsx`
- Create: `frontend/src/components/public-content/GatewayProjectDetailPage.test.tsx`

- [ ] **Step 1: Write the failing public-content detail tests**

Add targeted tests for event and project detail pages that verify images render inside the content section and that page-specific follow-up sections remain intact.

```tsx
it("renders event images in the shared content media slot", () => {
  render(<GatewayEventDetailPage eventId="event-1" />);

  expect(screen.getByText("EventDetails")).toBeTruthy();
  expect(screen.getByText("1 / 2")).toBeTruthy();
  expect(screen.queryByTestId("detail-header-image")).toBeNull();
});
```

```tsx
it("renders the project image beside the description and keeps the full text below", () => {
  render(<GatewayProjectDetailPage projectId="project-1" />);

  expect(screen.getByText("Projektdetails")).toBeTruthy();
  expect(screen.getByRole("img", { name: "Projekt 1" })).toBeTruthy();
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- --run src/components/public-content/GatewayEventDetailPage.test.tsx src/components/public-content/GatewayProjectDetailPage.test.tsx`
Expected: FAIL because those detail pages still use header images or duplicated description rendering.

- [ ] **Step 3: Integrate the shared media section into event and project details**

Map each page's image source to `DetailMediaImage[]`, remove `heroImage` usage, and keep tickets/map/full-text sections below the shared media block.

```tsx
const images = data.images.map((image) => ({
  src: image.originalUrl,
  alt: data.title,
}));

<DetailMediaSection
  heading={t("EventDetails")}
  body={(data as any)?.isBookingEvent ? <TranslatedHtml text={data.description} /> : <p>{data.description}</p>}
  images={images}
/>
```

```tsx
const images = project?.imageUrl ? [{ src: project.imageUrl, alt: project.title }] : [];

<DetailMediaSection
  heading="Übersicht"
  body={<ProjectDescription project={project} />}
  images={images}
/>
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- --run src/components/public-content/GatewayEventDetailPage.test.tsx src/components/public-content/GatewayProjectDetailPage.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/public-content/GatewayEventDetailPage.tsx frontend/src/components/public-content/GatewayEventDetailPage.test.tsx frontend/src/components/public-content/GatewayProjectDetailPage.tsx frontend/src/components/public-content/GatewayProjectDetailPage.test.tsx
git commit -m "feat: move public detail media into content area"
```

### Task 4: Full Verification

**Files:**
- Modify: `docs/superpowers/plans/2026-05-29-detail-media-layout.md`

- [ ] **Step 1: Run the targeted frontend tests**

Run: `npm test -- --run src/components/ui/detailMediaSection.test.tsx src/components/booking/bookingComponent.test.tsx src/components/booking/bookingRoom.test.tsx src/components/public-content/GatewayEventDetailPage.test.tsx src/components/public-content/GatewayProjectDetailPage.test.tsx`
Expected: PASS

- [ ] **Step 2: Run typecheck for the frontend**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Record any remaining manual QA notes**

Note the required browser checks:

```md
- Desktop: description left, image right
- Mobile: image stacked below description
- Multi-image slider works inline and fullscreen
- Header no longer shows detail-page image
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/ui/detailMediaSection.tsx frontend/src/components/ui/detailMediaSection.test.tsx frontend/src/components/booking/bookingComponent.tsx frontend/src/components/booking/bookingComponent.test.tsx frontend/src/components/booking/bookingRoom.tsx frontend/src/components/booking/bookingRoom.test.tsx frontend/src/components/public-content/GatewayEventDetailPage.tsx frontend/src/components/public-content/GatewayEventDetailPage.test.tsx frontend/src/components/public-content/GatewayProjectDetailPage.tsx frontend/src/components/public-content/GatewayProjectDetailPage.test.tsx
git commit -m "feat: standardize detail page media layout"
```
