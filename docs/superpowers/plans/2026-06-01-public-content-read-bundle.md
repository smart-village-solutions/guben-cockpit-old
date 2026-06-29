# Public Content Read Bundle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one read-only `GET /api/content/public` endpoint that returns all locally structured homepage and "Mein Guben" content in a single normalized bundle, excluding events and booking data.

**Architecture:** Extend the existing shared public-content contract layer with a new bundled schema, then thread that contract through the gateway repository interface and the PostgREST-backed implementation. Reuse the current dashboard and project mappers, adding only a small flattening step for homepage cards and a category normalization step for project items.

**Tech Stack:** TypeScript, Fastify, Zod, Vitest, PostgREST-backed content gateway

---

## File Structure

- Modify: `shared/public-content/contracts.ts`
  - add the new bundle schemas and exported types
- Modify: `shared/public-content/contracts.test.ts`
  - validate the new bundle contract and keep existing contract coverage intact
- Modify: `content-gateway/src/content/mock-data.ts`
  - add a reusable mock payload for the new bundle response
- Modify: `content-gateway/src/content/content-repository.ts`
  - extend the repository contract and mock repository with `getPublicContent`
- Modify: `content-gateway/src/content/smart-village-postgrest-content-repository.ts`
  - delegate `getPublicContent` to the PostgREST-backed repository
- Modify: `content-gateway/src/content/postgrest-content-repository.ts`
  - compose the new response from existing page, dashboard, and project reads
- Modify: `content-gateway/src/content/postgrest-content-mapper.ts`
  - add a focused flattening helper for homepage cards and a project category helper
- Modify: `content-gateway/src/app.ts`
  - register `GET /api/content/public`
- Modify: `content-gateway/test/content-repository.test.ts`
  - cover mock repository and smart-village wrapper wiring for the new method
- Modify: `content-gateway/test/postgrest-content-repository.test.ts`
  - cover bundle composition, category mapping, flattened cards, and filtering
- Modify: `content-gateway/test/app.test.ts`
  - cover the new public bundle route and error handling path

### Task 1: Add the Shared Public Bundle Contract

**Files:**
- Modify: `shared/public-content/contracts.ts`
- Modify: `shared/public-content/contracts.test.ts`

- [ ] **Step 1: Write the failing shared contract test**

Add this test to `shared/public-content/contracts.test.ts` and import the new schema from `./contracts.js`:

```ts
import {
  eventDetailContentSchema,
  eventsContentSchema,
  gatewayErrorSchema,
  homeContentSchema,
  projectsContentSchema,
  publicContentBundleSchema,
} from "./contracts.js";

it("accepts a valid bundled public content payload", () => {
  const payload = {
    home: {
      page: {
        id: "Home",
        title: "Startseite",
        description: "Willkommen",
        seo: {
          title: "Startseite",
          description: "Willkommen",
          canonical: "https://example.com/",
          indexable: true,
        },
      },
      dropdowns: [],
      cards: [
        {
          id: "card-1",
          dropdownId: "dropdown-1",
          dropdownTitle: "Leben",
          tabId: "tab-1",
          tabTitle: "Mobilitaet",
          sequence: 1,
          title: "Bus und Bahn",
          description: "Alles zur Mobilitaet",
          imageUrl: null,
          imageAlt: null,
          button: {
            title: "Mehr",
            url: "https://example.com/mobilitaet",
            openInNewTab: true,
          },
        },
      ],
    },
    projects: {
      page: {
        id: "Projects",
        title: "Mein Guben",
        description: "Alle Inhalte",
        seo: {
          title: "Mein Guben",
          description: "Alle Inhalte",
          canonical: "https://example.com/projects",
          indexable: true,
        },
      },
      items: [
        {
          id: "project-1",
          category: "featured",
          type: 1,
          title: "Innenstadt beleben",
          description: "Kurztext",
          fullText: "Langtext",
          imageCaption: null,
          imageUrl: null,
          imageCredits: null,
          published: true,
        },
      ],
    },
  };

  expect(publicContentBundleSchema.parse(payload)).toEqual(payload);
});
```

- [ ] **Step 2: Run the shared contract test to verify it fails**

Run:

```bash
npm --prefix shared test -- public-content/contracts.test.ts
```

Expected:

```text
FAIL  public-content/contracts.test.ts
ReferenceError or export error for publicContentBundleSchema
```

- [ ] **Step 3: Add the new schemas and exports**

Add these definitions to `shared/public-content/contracts.ts` after the existing dashboard and project schemas:

```ts
export const publicContentHomeCardSchema = z.object({
  id: z.string(),
  dropdownId: z.string(),
  dropdownTitle: z.string(),
  tabId: z.string(),
  tabTitle: z.string(),
  sequence: z.number().int(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  imageAlt: z.string().nullable(),
  button: buttonSchema.nullable(),
});

export const publicContentProjectCategorySchema = z.enum(["featured", "school", "business"]);

export const publicContentProjectItemSchema = projectSchema.extend({
  category: publicContentProjectCategorySchema,
});

export const publicContentBundleSchema = z.object({
  home: z.object({
    page: pageHeroSchema,
    dropdowns: z.array(dashboardDropdownSchema),
    cards: z.array(publicContentHomeCardSchema),
  }),
  projects: z.object({
    page: pageHeroSchema,
    items: z.array(publicContentProjectItemSchema),
  }),
});
```

Export the new inferred types at the bottom of the file:

```ts
export type PublicContentHomeCard = z.infer<typeof publicContentHomeCardSchema>;
export type PublicContentProjectCategory = z.infer<typeof publicContentProjectCategorySchema>;
export type PublicContentProjectItem = z.infer<typeof publicContentProjectItemSchema>;
export type PublicContentBundle = z.infer<typeof publicContentBundleSchema>;
```

- [ ] **Step 4: Re-run the shared contract test**

Run:

```bash
npm --prefix shared test -- public-content/contracts.test.ts
```

Expected:

```text
PASS  public-content/contracts.test.ts
```

- [ ] **Step 5: Commit the contract change**

Run:

```bash
git add shared/public-content/contracts.ts shared/public-content/contracts.test.ts
git commit -m "feat: add public content bundle contract"
```

### Task 2: Wire the New Contract Through Repository Interfaces and Mocks

**Files:**
- Modify: `content-gateway/src/content/mock-data.ts`
- Modify: `content-gateway/src/content/content-repository.ts`
- Modify: `content-gateway/src/content/smart-village-postgrest-content-repository.ts`
- Modify: `content-gateway/test/content-repository.test.ts`

- [ ] **Step 1: Write the failing repository glue tests**

Extend `content-gateway/test/content-repository.test.ts` with assertions for the new bundle method:

```ts
import {
  eventDetailContentSchema,
  eventsContentSchema,
  publicContentBundleSchema,
} from "../../shared/public-content/contracts.js";

import {
  mockDashboardContent,
  mockEventDetail,
  mockEventsContent,
  mockFooterContent,
  mockHomeContent,
  mockMapContent,
  mockProjectsContent,
  mockPublicContentBundle,
} from "../src/content/mock-data.js";
```

In the mock repository test:

```ts
await expect(repository.getPublicContent()).resolves.toEqual(mockPublicContentBundle);
```

In the smart-village wrapper test setup:

```ts
const postgrestRepository = {
  getHome: vi.fn(async () => mockHomeContent),
  getProjects: vi.fn(async () => mockProjectsContent),
  getPublicContent: vi.fn(async () => mockPublicContentBundle),
  getDashboard: vi.fn(async () => mockDashboardContent),
  getMap: vi.fn(async () => mockMapContent),
  getFooter: vi.fn(async () => mockFooterContent),
  getBookingTenants: vi.fn(async () => ({
    tenants: mockEventsContent.events.bookingTenants,
  })),
};
```

Add the assertion:

```ts
const publicContent = await repository.getPublicContent("de");
expect(publicContent).toEqual(publicContentBundleSchema.parse(mockPublicContentBundle));
expect(postgrestRepository.getPublicContent).toHaveBeenCalledWith("de");
```

- [ ] **Step 2: Run the repository glue test to verify it fails**

Run:

```bash
npm --prefix content-gateway test -- test/content-repository.test.ts
```

Expected:

```text
FAIL  test/content-repository.test.ts
Property 'getPublicContent' does not exist
```

- [ ] **Step 3: Add the mock payload and interface method**

In `content-gateway/src/content/mock-data.ts`, add:

```ts
import type {
  DashboardDropdown,
  Event,
  FooterContent,
  HomeContent,
  MapContent,
  ProjectsContent,
  PublicContentBundle,
  SeoMetadata,
} from "../../../shared/public-content/contracts.js";
```

Then define and export the bundle payload near `mockHomeContent` and `mockProjectsContent`:

```ts
export const mockPublicContentBundle: PublicContentBundle = {
  home: {
    page: mockHomeContent.page,
    dropdowns: sharedDropdowns,
    cards: [
      {
        id: "c7fd6f6c-8975-4eac-b69e-6ef89f8ea5f6",
        dropdownId: "1d4d8ba8-82a9-4b93-a8ff-ec8b6da08a8e",
        dropdownTitle: "Stadtleben",
        tabId: "60bbd0df-2cf4-4ed7-a128-9e6c26f095f9",
        tabTitle: "Mobilität",
        sequence: 1,
        title: "Bus und Bahn",
        description: "Verbindungen, Haltestellen und barrierearme Zugänge.",
        imageUrl: null,
        imageAlt: null,
        button: {
          title: "Fahrplan öffnen",
          url: "https://www.guben.de/fahrplan",
          openInNewTab: true,
        },
      },
    ],
  },
  projects: {
    page: mockProjectsContent.page,
    items: [
      {
        ...mockProjectsContent.featuredProjects[0]!,
        category: "featured",
      },
      {
        ...mockProjectsContent.schools[0]!,
        category: "school",
      },
      {
        ...mockProjectsContent.businesses.results[0]!,
        category: "business",
      },
    ],
  },
};
```

In `content-gateway/src/content/content-repository.ts`, add the new contract import and interface method:

```ts
import {
  BookingTenantsContent,
  DashboardContent,
  EventDetailContent,
  EventsContent,
  FooterContent,
  HomeContent,
  MapContent,
  ProjectsContent,
  PublicContentBundle,
  bookingTenantsContentSchema,
  dashboardContentSchema,
  eventDetailContentSchema,
  eventsContentSchema,
  footerContentSchema,
  homeContentSchema,
  mapContentSchema,
  projectsContentSchema,
  publicContentBundleSchema,
} from "../../../shared/public-content/contracts.js";
```

```ts
export interface PublicContentRepository {
  getHome(language: string): Promise<HomeContent>;
  getProjects(language: string, pageNumber: number, pageSize: number): Promise<ProjectsContent>;
  getPublicContent(language: string): Promise<PublicContentBundle>;
  getEvents(language: string, filters: EventFilters): Promise<EventsContent>;
  // ...
}
```

Add the mock implementation:

```ts
public async getPublicContent(): Promise<PublicContentBundle> {
  return publicContentBundleSchema.parse(mockPublicContentBundle);
}
```

In `content-gateway/src/content/smart-village-postgrest-content-repository.ts`, add:

```ts
import type {
  BookingTenantsContent,
  DashboardContent,
  EventDetailContent,
  EventsContent,
  FooterContent,
  HomeContent,
  MapContent,
  ProjectsContent,
  PublicContentBundle,
} from "../../../shared/public-content/contracts.js";
```

```ts
public getPublicContent(language: string): Promise<PublicContentBundle> {
  return this.options.postgrestRepository.getPublicContent(language);
}
```

- [ ] **Step 4: Re-run the repository glue test**

Run:

```bash
npm --prefix content-gateway test -- test/content-repository.test.ts
```

Expected:

```text
PASS  test/content-repository.test.ts
```

- [ ] **Step 5: Commit the repository contract wiring**

Run:

```bash
git add content-gateway/src/content/mock-data.ts content-gateway/src/content/content-repository.ts content-gateway/src/content/smart-village-postgrest-content-repository.ts content-gateway/test/content-repository.test.ts
git commit -m "feat: wire public content bundle through repositories"
```

### Task 3: Implement Bundle Composition in the PostgREST Repository

**Files:**
- Modify: `content-gateway/src/content/postgrest-content-mapper.ts`
- Modify: `content-gateway/src/content/postgrest-content-repository.ts`
- Modify: `content-gateway/test/postgrest-content-repository.test.ts`

- [ ] **Step 1: Write the failing PostgREST repository test**

Add this test to `content-gateway/test/postgrest-content-repository.test.ts`:

```ts
it("builds a normalized public content bundle from local home and project sources", async () => {
  const repository = new PostgrestContentRepository(config, {
    select: async () => [],
  } as never);

  (repository as any).source = {
    getPage: async (id: string) => {
      if (id === "Home") {
        return [
          {
            id: "Home",
            translations: {
              de: {
                Title: "Willkommen in Guben",
                Description: "Startseite",
              },
            },
          },
        ];
      }

      return [projectsPage];
    },
    getDashboardRows: async () => ({
      dropdownRows: [
        {
          id: "dropdown-1",
          rank: 1,
          is_link: false,
          translations: { de: { Title: "Stadtleben" } },
        },
      ],
      tabRows: [
        {
          id: "tab-1",
          dropdown_id: "dropdown-1",
          sequence: 1,
          map_url: "https://masterportal.example.com/map",
          translations: { de: { Title: "Mobilitaet" } },
        },
      ],
      cardRows: [
        {
          id: "card-1",
          dashboard_tab_id: "tab-1",
          sequence: 1,
          image_url: null,
          translations: {
            de: {
              Title: "Bus und Bahn",
              Description: "Alles zur Mobilitaet",
              ImageAlt: "Bus icon",
            },
          },
          button_translations: {
            de: {
              Title: "Mehr",
              Url: "https://example.com/mobilitaet",
            },
          },
          button_open_in_new_tab: true,
        },
      ],
      linkRows: [],
    }),
    getProjects: async () => [
      projectRow({ id: "featured-1", type: 1, title: "Featured" }),
      projectRow({ id: "school-1", type: 2, title: "School" }),
      projectRow({ id: "business-1", type: 0, title: "Business" }),
      projectRow({ id: "hidden-1", type: 0, title: "Hidden", published: false }),
    ],
  };

  const result = await repository.getPublicContent("de");

  expect(result.home.cards).toEqual([
    {
      id: "card-1",
      dropdownId: "dropdown-1",
      dropdownTitle: "Stadtleben",
      tabId: "tab-1",
      tabTitle: "Mobilitaet",
      sequence: 1,
      title: "Bus und Bahn",
      description: "Alles zur Mobilitaet",
      imageUrl: null,
      imageAlt: "Bus icon",
      button: {
        title: "Mehr",
        url: "https://example.com/mobilitaet",
        openInNewTab: true,
      },
    },
  ]);
  expect(result.projects.items.map((item) => [item.id, item.category])).toEqual([
    ["featured-1", "featured"],
    ["school-1", "school"],
    ["business-1", "business"],
  ]);
  expect(result.projects.page.seo.canonical).toBe("http://localhost:3000/projects");
});
```

- [ ] **Step 2: Run the PostgREST repository test to verify it fails**

Run:

```bash
npm --prefix content-gateway test -- test/postgrest-content-repository.test.ts
```

Expected:

```text
FAIL  test/postgrest-content-repository.test.ts
TypeError: repository.getPublicContent is not a function
```

- [ ] **Step 3: Add mapper helpers for project categories and flattened home cards**

In `content-gateway/src/content/postgrest-content-mapper.ts`, add the new imports:

```ts
import {
  DashboardContent,
  DashboardDropdown,
  Event,
  EventDetailContent,
  MapContent,
  PageHero,
  Project,
  PublicContentHomeCard,
  PublicContentProjectItem,
  dashboardContentSchema,
  dashboardDropdownSchema,
  eventDetailContentSchema,
  eventsContentSchema,
  mapContentSchema,
  pageHeroSchema,
  projectSchema,
} from "../../../shared/public-content/contracts.js";
```

Add these two methods to `PostgrestContentMapper`:

```ts
public publicProjectFromRow(row: ProjectRow, language: string): PublicContentProjectItem {
  const project = this.projectFromRow(row, language);
  const categoryByType: Record<number, PublicContentProjectItem["category"]> = {
    0: "business",
    1: "featured",
    2: "school",
  };
  const category = categoryByType[row.type];

  if (!category) {
    throw new GatewayError({
      code: "INVALID_UPSTREAM_PAYLOAD",
      message: `Unsupported project type: ${row.type}`,
      statusCode: 502,
      upstream: "postgrest",
      retryable: false,
    });
  }

  return {
    ...project,
    category,
  };
}

public flattenedHomeCards(
  dropdowns: DashboardContent["dropdowns"],
): PublicContentHomeCard[] {
  return dropdowns.flatMap((dropdown) =>
    dropdown.tabs.flatMap((tab) =>
      tab.informationCards.map((card) => ({
        id: card.id,
        dropdownId: dropdown.id,
        dropdownTitle: dropdown.title,
        tabId: tab.id,
        tabTitle: tab.title,
        sequence: tab.sequence,
        title: card.title,
        description: card.description,
        imageUrl: card.imageUrl,
        imageAlt: card.imageAlt,
        button: card.button,
      })),
    ),
  );
}
```

- [ ] **Step 4: Implement `getPublicContent` in the PostgREST repository**

In `content-gateway/src/content/postgrest-content-repository.ts`, import the new type and schema:

```ts
import {
  BookingTenantsContent,
  DashboardContent,
  EventDetailContent,
  EventsContent,
  FooterContent,
  HomeContent,
  MapContent,
  ProjectsContent,
  PublicContentBundle,
  bookingTenantsContentSchema,
  footerContentSchema,
  homeContentSchema,
  projectsContentSchema,
  publicContentBundleSchema,
  eventsContentSchema,
} from "../../../shared/public-content/contracts.js";
```

Add the method:

```ts
public async getPublicContent(language: string): Promise<PublicContentBundle> {
  const [homePages, dashboard, projectPages, rows] = await Promise.all([
    this.source.getPage("Home"),
    this.getDashboard(language),
    this.source.getPage("Projects"),
    this.source.getProjects(),
  ]);

  const homePage = this.mapper.pageFromRow(this.expectSingle(homePages, "Home"), language);
  const projectsPage = this.mapper.pageFromRow(this.expectSingle(projectPages, "Projects"), language);
  const items = rows
    .filter((row) => row.published && !row.deleted)
    .map((row) => this.mapper.publicProjectFromRow(row, language));

  return publicContentBundleSchema.parse({
    home: {
      page: homePage,
      dropdowns: dashboard.dropdowns,
      cards: this.mapper.flattenedHomeCards(dashboard.dropdowns),
    },
    projects: {
      page: projectsPage,
      items,
    },
  });
}
```

- [ ] **Step 5: Re-run the PostgREST repository test**

Run:

```bash
npm --prefix content-gateway test -- test/postgrest-content-repository.test.ts
```

Expected:

```text
PASS  test/postgrest-content-repository.test.ts
```

- [ ] **Step 6: Commit the PostgREST bundle implementation**

Run:

```bash
git add content-gateway/src/content/postgrest-content-mapper.ts content-gateway/src/content/postgrest-content-repository.ts content-gateway/test/postgrest-content-repository.test.ts
git commit -m "feat: compose bundled public content from postgrest"
```

### Task 4: Expose the Bundle Through the Fastify App

**Files:**
- Modify: `content-gateway/src/app.ts`
- Modify: `content-gateway/test/app.test.ts`

- [ ] **Step 1: Write the failing app route tests**

In `content-gateway/test/app.test.ts`, add the bundle import and mock:

```ts
import { mockDashboardContent, mockEventDetail, mockEventsContent, mockFooterContent, mockHomeContent, mockMapContent, mockProjectsContent, mockPublicContentBundle } from "../src/content/mock-data.js";
```

Extend `repositoryStub()`:

```ts
getPublicContent: vi.fn(async () => mockPublicContentBundle),
```

Add a route test:

```ts
it("serves the bundled public content endpoint", async () => {
  const app = createTestApp();

  const response = await app.inject({
    method: "GET",
    url: "/api/content/public",
    headers: {
      "accept-language": "en-GB,en;q=0.8",
    },
  });

  expect(response.statusCode).toBe(200);
  expect(response.json().home.cards).toHaveLength(1);
  expect(response.json().projects.items).toHaveLength(3);
  expect(repository.getPublicContent).toHaveBeenCalledWith("en");
});
```

Add an error-path test:

```ts
it("maps bundled public content failures to the standardized outage contract", async () => {
  const failingRepository: PublicContentRepository = {
    ...repository,
    getPublicContent: vi.fn(async () => {
      throw new GatewayError({
        code: "UPSTREAM_TIMEOUT",
        message: "postgrest request timed out",
        statusCode: 503,
        upstream: "postgrest",
        retryable: true,
      });
    }),
  };

  const app = createApp({ config: baseConfig, repository: failingRepository });
  apps.push(app);
  const response = await app.inject({
    method: "GET",
    url: "/api/content/public",
  });

  expect(response.statusCode).toBe(503);
  expect(response.json()).toEqual({
    error: expect.objectContaining({
      code: "UPSTREAM_TIMEOUT",
      upstream: "postgrest",
      retryable: true,
    }),
  });
});
```

- [ ] **Step 2: Run the app test to verify it fails**

Run:

```bash
npm --prefix content-gateway test -- test/app.test.ts
```

Expected:

```text
FAIL  test/app.test.ts
404 for /api/content/public or missing getPublicContent stub
```

- [ ] **Step 3: Register the new route**

In `content-gateway/src/app.ts`, add the route next to the existing content routes:

```ts
  app.get("/api/content/public", async (request) => {
    const query = pageQuerySchema.parse(request.query);
    return options.repository.getPublicContent(
      resolveLanguage(query.lang, request.headers["accept-language"], options.config),
    );
  });
```

- [ ] **Step 4: Re-run the app test**

Run:

```bash
npm --prefix content-gateway test -- test/app.test.ts
```

Expected:

```text
PASS  test/app.test.ts
```

- [ ] **Step 5: Commit the app route**

Run:

```bash
git add content-gateway/src/app.ts content-gateway/test/app.test.ts
git commit -m "feat: expose bundled public content endpoint"
```

### Task 5: Run Focused Verification and the Full Gateway Test Suite

**Files:**
- Test: `shared/public-content/contracts.test.ts`
- Test: `content-gateway/test/content-repository.test.ts`
- Test: `content-gateway/test/postgrest-content-repository.test.ts`
- Test: `content-gateway/test/app.test.ts`

- [ ] **Step 1: Run the focused tests together**

Run:

```bash
npm --prefix shared test -- public-content/contracts.test.ts
npm --prefix content-gateway test -- test/content-repository.test.ts test/postgrest-content-repository.test.ts test/app.test.ts
```

Expected:

```text
PASS  public-content/contracts.test.ts
PASS  test/content-repository.test.ts
PASS  test/postgrest-content-repository.test.ts
PASS  test/app.test.ts
```

- [ ] **Step 2: Run the full content-gateway suite**

Run:

```bash
npm --prefix content-gateway test
```

Expected:

```text
All content-gateway vitest suites PASS
```

- [ ] **Step 3: Run type-checking for the gateway package**

Run:

```bash
npm --prefix content-gateway run typecheck
```

Expected:

```text
No TypeScript errors
```

- [ ] **Step 4: Commit the final verified state**

Run:

```bash
git add shared/public-content/contracts.ts shared/public-content/contracts.test.ts content-gateway/src/content/mock-data.ts content-gateway/src/content/content-repository.ts content-gateway/src/content/smart-village-postgrest-content-repository.ts content-gateway/src/content/postgrest-content-mapper.ts content-gateway/src/content/postgrest-content-repository.ts content-gateway/src/app.ts content-gateway/test/content-repository.test.ts content-gateway/test/postgrest-content-repository.test.ts content-gateway/test/app.test.ts
git commit -m "feat: add bundled public content read endpoint"
```

## Self-Review

- Spec coverage
  - Single read-only bundled endpoint: covered in Tasks 3 and 4
  - Homepage cards plus related homepage structure: covered in Tasks 1 and 3
  - Mein-Guben featured projects, schools, businesses in one normalized list: covered in Tasks 1 and 3
  - No events or booking data in the new contract: enforced by the Task 1 schema and Task 3 repository composition
  - Existing endpoints remain intact: Task 4 adds a route without replacing current handlers
- Placeholder scan
  - No `TODO`, `TBD`, deferred implementation markers, or undefined file paths remain in this plan
- Type consistency
  - Contract names stay aligned across plan steps: `publicContentBundleSchema`, `PublicContentBundle`, `getPublicContent`, `flattenedHomeCards`, `publicProjectFromRow`
