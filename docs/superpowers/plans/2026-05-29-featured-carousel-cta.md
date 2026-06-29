# Featured Carousel CTA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a localized `Mehr erfahren >` style CTA below featured project headlines in the public projects slider while keeping the headline link.

**Architecture:** Extend the existing `FeaturedCarousel` content block rather than introducing a new project-card abstraction. Keep localization in the `common` namespace and verify behavior with a focused component test.

**Tech Stack:** React, Vitest, Testing Library, i18next, Swiper

---

### Task 1: Cover the CTA behavior with a failing component test

**Files:**
- Create: `frontend/src/components/projects/FeaturedCarousel.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
render(
  <FeaturedCarousel
    slides={[
      {
        id: "project-1",
        image: "/project.jpg",
        icon: "/icon.jpg",
        iconColor: "66a120",
        title: "Projekt 1",
        description: "Kurzbeschreibung",
        link: "/projects/project-1",
      },
    ]}
  />,
);

expect(screen.getByRole("link", { name: "Projekt 1" })).toHaveAttribute("href", "/projects/project-1");
expect(screen.getByRole("link", { name: "Mehr erfahren >" })).toHaveAttribute("href", "/projects/project-1");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- FeaturedCarousel.test.tsx`
Expected: FAIL because the CTA link is not rendered yet

- [ ] **Step 3: Write minimal implementation**

```tsx
const { t } = useTranslation("common");
...
<a href={slide.link}>{slide.title}</a>
<p>{slide.description}</p>
<a href={slide.link}>{t("ReadMore")} &gt;</a>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- FeaturedCarousel.test.tsx`
Expected: PASS

### Task 2: Add localization entries

**Files:**
- Modify: `frontend/src/assets/locales/de/common.json`
- Modify: `frontend/src/assets/locales/en/common.json`
- Modify: `frontend/src/assets/locales/pl/common.json`
- Modify: `frontend/src/utilities/i18n/@types/resources.d.ts`

- [ ] **Step 1: Add the new translation key**

```json
"ReadMore": "Mehr erfahren"
```

- [ ] **Step 2: Add translated variants**

```json
"ReadMore": "Learn more"
"ReadMore": "Dowiedz się więcej"
```

- [ ] **Step 3: Update resource typing**

```ts
"ReadMore": "Mehr erfahren",
```

### Task 3: Verify integration coverage still holds

**Files:**
- Modify: `frontend/src/components/public-content/GatewayProjectsPage.test.tsx`

- [ ] **Step 1: Keep the existing description-stripping assertion valid**

```tsx
expect(markup).toContain("Ein wichtiger Text");
```

- [ ] **Step 2: Re-run relevant tests**

Run: `npm test -- FeaturedCarousel.test.tsx GatewayProjectsPage.test.tsx`
Expected: PASS
