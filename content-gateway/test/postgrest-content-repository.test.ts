import { describe, expect, it } from "vitest";

import { PostgrestContentRepository } from "../src/content/postgrest-content-repository.js";
import type { Config } from "../src/config.js";
import type { PageRow, ProjectRow } from "../src/content/postgrest-content-types.js";

const config: Config = {
  PORT: 5100,
  LOG_LEVEL: "silent",
  PUBLIC_BASE_URL: "http://localhost:3000",
  MASTERPORTAL_URL: "http://masterportal",
  CONTENT_SOURCE_MODE: "postgrest",
  DEFAULT_LANGUAGE: "de",
  FALLBACK_LANGUAGE: "de",
  SV_GRAPHQL_URL: "https://smart-village.example.com/graphql",
  SV_OAUTH_TOKEN_URL: "https://smart-village.example.com/oauth/token",
  SV_CLIENT_ID: "test-client-id",
  SV_CLIENT_SECRET: "test-client-secret",
  POSTGREST_URL: "http://postgrest",
  POSTGREST_TIMEOUT_MS: 100,
  POSTGREST_SCHEMA: "public_content",
};

const projectsPage: PageRow = {
  id: "Projects",
  translations: {
    de: {
      Title: "Projekte",
      Description: "Projektuebersicht",
    },
  },
};

const projectRow = (overrides: Partial<ProjectRow>): ProjectRow => ({
  id: "project-default",
  type: 0,
  title: "Projekt",
  image_caption: null,
  image_url: null,
  image_credits: null,
  published: true,
  deleted: false,
  translations: {
    de: {
      Description: "Kurzbeschreibung",
      FullText: "Langbeschreibung",
    },
  },
  ...overrides,
});

describe("PostgrestContentRepository", () => {
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

  it("groups project categories and paginates businesses", async () => {
    const repository = new PostgrestContentRepository(config, {
      select: async () => [],
    } as never);

    (repository as any).source = {
      getPage: async () => [projectsPage],
      getProjects: async () => [
        projectRow({ id: "featured-1", type: 1, title: "Featured" }),
        projectRow({ id: "school-1", type: 2, title: "School" }),
        projectRow({ id: "business-1", type: 0, title: "Business 1" }),
        projectRow({ id: "business-2", type: 0, title: "Business 2" }),
        projectRow({ id: "hidden-1", type: 0, title: "Hidden", published: false }),
        projectRow({ id: "deleted-1", type: 0, title: "Deleted", deleted: true }),
      ],
    };

    const result = await repository.getProjects("de", 2, 1);

    expect(result.featuredProjects.map((project) => project.id)).toEqual(["featured-1"]);
    expect(result.schools.map((project) => project.id)).toEqual(["school-1"]);
    expect(result.businesses.totalCount).toBe(2);
    expect(result.businesses.pageCount).toBe(2);
    expect(result.businesses.results.map((project) => project.id)).toEqual(["business-2"]);
    expect(result.page.seo.canonical).toBe("http://localhost:3000/projects");
  });

  it("filters and sorts legacy PostgREST events before pagination", async () => {
    const repository = new PostgrestContentRepository(config, {
      select: async () => [],
    } as never);

    (repository as any).source = {
      getPage: async () => [
        {
          id: "Events",
          translations: {
            de: {
              Title: "Events",
              Description: "Eventuebersicht",
            },
          },
        },
      ],
      getEventsBundle: async () => ({
        eventRows: [
          {
            id: "event-a",
            event_id: "EV-A",
            termin_id: "TERM-A",
            start_date: "2026-02-12T10:00:00.000Z",
            end_date: "2026-02-12T12:00:00.000Z",
            published: true,
            deleted: false,
            location_id: "location-a",
            coordinates: "51.95042;14.7143",
            translations: { de: { Title: "Fest A", Description: "Beschreibung A" } },
          },
          {
            id: "event-b",
            event_id: "EV-B",
            termin_id: "TERM-B",
            start_date: "2026-02-10T10:00:00.000Z",
            end_date: "2026-02-10T12:00:00.000Z",
            published: true,
            deleted: false,
            location_id: "location-b",
            coordinates: "51.95050;14.7144",
            translations: { de: { Title: "Fest B", Description: "Beschreibung B" } },
          },
          {
            id: "event-c",
            event_id: "EV-C",
            termin_id: "TERM-C",
            start_date: "2026-02-11T10:00:00.000Z",
            end_date: "2026-02-11T12:00:00.000Z",
            published: true,
            deleted: false,
            location_id: "location-c",
            coordinates: "52.5200;13.4050",
            translations: { de: { Title: "Fest C", Description: "Beschreibung C" } },
          },
        ],
        locationRows: [
          {
            id: "location-a",
            city: "Guben",
            street: "Markt 1",
            telephone_number: null,
            fax: null,
            email: null,
            website: null,
            zip: "03172",
            translations: { de: { Name: "Marktplatz" } },
          },
          {
            id: "location-b",
            city: "Guben",
            street: "Platz 2",
            telephone_number: null,
            fax: null,
            email: null,
            website: null,
            zip: "03172",
            translations: { de: { Name: "Theater" } },
          },
          {
            id: "location-c",
            city: "Berlin",
            street: "Fernweg 3",
            telephone_number: null,
            fax: null,
            email: null,
            website: null,
            zip: "10115",
            translations: { de: { Name: "Fernort" } },
          },
        ],
        categoryRows: [
          { event_id: "event-a", category_id: "culture", name: "Kultur" },
          { event_id: "event-b", category_id: "culture", name: "Kultur" },
          { event_id: "event-c", category_id: "culture", name: "Kultur" },
        ],
        urlRows: [],
        imageRows: [],
        bookingTenantRows: [{ id: "tenant-1", tenant_id: "bk-1" }],
      }),
    };

    const result = await repository.getEvents("de", {
      pageNumber: 1,
      pageSize: 10,
      title: "Fest",
      category: "culture",
      startDate: "2026-02-10T00:00:00.000Z",
      endDate: "2026-02-12T23:59:59.000Z",
      distance: 5,
      sortBy: "title",
      ordering: "desc",
    });

    expect(result.events.results.map((event) => event.id)).toEqual(["event-b", "event-a"]);
    expect(result.events.totalCount).toBe(2);
    expect(result.events.categories).toEqual([{ id: "culture", name: "Kultur" }]);
    expect(result.events.bookingTenants).toEqual([{ id: "tenant-1", tenantId: "bk-1" }]);
  });

  it("raises not found when a legacy PostgREST event detail is missing", async () => {
    const repository = new PostgrestContentRepository(config, {
      select: async () => [],
    } as never);

    (repository as any).source = {
      getEventDetailBundle: async () => null,
    };

    await expect(repository.getEventById("de", "missing")).rejects.toMatchObject({
      code: "NOT_FOUND",
      statusCode: 404,
    });
  });

  it("augments booking tenants with the smart city booking bike-box tenant", async () => {
    const repository = new PostgrestContentRepository(config, {
      select: async () => [],
    } as never);

    (repository as any).source = {
      getBookingTenantRows: async () => [{ id: "tenant-1", tenant_id: "bk-1" }],
    };

    const result = await repository.getBookingTenants();

    expect(result.tenants).toEqual([
      { id: "tenant-1", tenantId: "bk-1" },
      {
        id: "smart-city-booking-bike-boxes",
        tenantId: "2b12ce76-c513-40d0-bb56-51a597556f9d",
      },
    ]);
  });

  it("deduplicates booking tenants by tenant id when the additional tenant is already present", async () => {
    const repository = new PostgrestContentRepository(config, {
      select: async () => [],
    } as never);

    (repository as any).source = {
      getBookingTenantRows: async () => [
        {
          id: "existing-bike-box-tenant",
          tenant_id: "2b12ce76-c513-40d0-bb56-51a597556f9d",
        },
      ],
    };

    const result = await repository.getBookingTenants();

    expect(result.tenants).toEqual([
      {
        id: "existing-bike-box-tenant",
        tenantId: "2b12ce76-c513-40d0-bb56-51a597556f9d",
      },
    ]);
  });
});
