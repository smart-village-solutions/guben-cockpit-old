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

const buildplaceMapOverviewUrl =
  "https://public.buildplace.io/_/stadt-guben/portfolio/-/overview/map?geodataview=Q0eIRLhq8q7PXzRujP7sv&layerOrder=geoDataLayer,xPlanLayer&mapview=13.67/51.951171/14.702273/0.00/0.00&sidemode=portfolioGeoData&activeLocation=no-location";

const createSeo = (path: string, title: string, description: string): SeoMetadata => ({
  title,
  description,
  canonical: `http://localhost:3000${path}`,
  indexable: true,
});

const sharedDropdowns: DashboardDropdown[] = [
  {
    id: "1d4d8ba8-82a9-4b93-a8ff-ec8b6da08a8e",
    title: "Stadtleben",
    rank: 1,
    isLink: false,
    links: [],
    tabs: [
      {
        id: "60bbd0df-2cf4-4ed7-a128-9e6c26f095f9",
        title: "Mobilität",
        sequence: 1,
        mapUrl: buildplaceMapOverviewUrl,
        informationCards: [
          {
            id: "c7fd6f6c-8975-4eac-b69e-6ef89f8ea5f6",
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
    ],
  },
  {
    id: "6b1f6538-b73e-4705-a6a3-d559ed2cda3e",
    title: "Service",
    rank: 2,
    isLink: true,
    tabs: [],
    links: [
      {
        id: "fa7f5fb8-befa-4634-a292-c0fffb07ec1f",
        title: "Bürgerdienste",
        link: "https://www.guben.de/service",
        sequence: 1,
      },
    ],
  },
];

export const mockProjectsContent: ProjectsContent = {
  page: {
    id: "Projects",
    title: "Projekte in Guben",
    description: "Aktuelle Projekte, Schulen und Marktplatz-Angebote aus Guben.",
    seo: createSeo("/projects", "Projekte in Guben", "Aktuelle Projekte, Schulen und Marktplatz-Angebote aus Guben."),
  },
  featuredProjects: [
    {
      id: "project-1",
      type: 1,
      title: "Innenstadt beleben",
      description: "Maßnahmen zur stärkeren Nutzung der Innenstadt.",
      fullText: "Ein langfristiges Stadtentwicklungsprojekt mit Fokus auf Begegnung und Handel.",
      imageCaption: null,
      imageUrl: "/images/stadt-guben.jpg",
      imageCredits: null,
      published: true,
    },
  ],
  schools: [
    {
      id: "school-1",
      type: 2,
      title: "Grundschule Süd",
      description: "Lernangebote und offene Projekte der Grundschule Süd.",
      fullText: "Ganztagsangebote, Kooperationen und Elternarbeit auf einen Blick.",
      imageCaption: null,
      imageUrl: "/images/stadt-guben.jpg",
      imageCredits: null,
      published: true,
    },
  ],
  businesses: {
    pageNumber: 1,
    pageSize: 12,
    totalCount: 1,
    pageCount: 1,
    results: [
      {
        id: "business-1",
        type: 0,
        title: "Regionaler Markt",
        description: "Lokale Anbieter aus Handel und Dienstleistung.",
        fullText: "Vorstellung regionaler Unternehmen mit Kontaktmöglichkeiten.",
        imageCaption: null,
        imageUrl: "/images/stadt-guben.jpg",
        imageCredits: null,
        published: true,
      },
    ],
  },
  seo: createSeo("/projects", "Projekte in Guben", "Aktuelle Projekte, Schulen und Marktplatz-Angebote aus Guben."),
};

const mockEvents: Event[] = [
  {
    id: "9c77a613-6085-41fc-baa7-68a5ec8b4a07",
    eventId: "EV-100",
    terminId: "TERM-100",
    title: "Frühlingsmarkt",
    description: "Ein Wochenende mit regionalen Ausstellern und Bühnenprogramm.",
    startDate: "2026-04-10T09:00:00.000Z",
    endDate: "2026-04-10T17:00:00.000Z",
    location: {
      id: "2b537e99-3f6d-4d55-9b03-f53e4750f345",
      name: "Marktplatz Guben",
      city: "Guben",
      street: "Markt 1",
      telephoneNumber: null,
      fax: null,
      email: null,
      website: null,
      zip: "03172",
    },
    coordinates: {
      latitude: 51.9499,
      longitude: 14.715,
    },
    urls: [
      {
        link: "https://www.guben.de/fruehlingsmarkt",
        description: "Mehr Informationen",
      },
    ],
    categories: [
      {
        id: "9f2dc033-c236-44df-9af0-321baf7c306a",
        name: "Kultur",
      },
    ],
    images: [
      {
        thumbnailUrl: "/images/stadt-guben.jpg",
        previewUrl: "/images/stadt-guben.jpg",
        originalUrl: "/images/stadt-guben.jpg",
      },
    ],
    published: true,
  },
];

export const mockHomeContent: HomeContent = {
  page: {
    id: "Home",
    title: "Willkommen in Guben",
    description: "Öffentliche Inhalte werden serverseitig über das Content Gateway ausgeliefert.",
    seo: createSeo("/", "Willkommen in Guben", "Öffentliche Inhalte werden serverseitig über das Content Gateway ausgeliefert."),
  },
  dashboard: {
    dropdowns: sharedDropdowns,
  },
  seo: createSeo("/", "Willkommen in Guben", "Öffentliche Inhalte werden serverseitig über das Content Gateway ausgeliefert."),
};

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

export const mockEventsContent = {
  page: {
    id: "Events",
    title: "Veranstaltungen",
    description: "Alle öffentlichen Veranstaltungen an einem Ort.",
    seo: createSeo("/events", "Veranstaltungen", "Alle öffentlichen Veranstaltungen an einem Ort."),
  },
  events: {
    pageNumber: 1,
    pageSize: 25,
    totalCount: mockEvents.length,
    pageCount: 1,
    results: mockEvents,
    categories: [
      {
        id: "9f2dc033-c236-44df-9af0-321baf7c306a",
        name: "Kultur",
      },
    ],
    bookingTenants: [
      {
        id: "1a13f4c2-e58f-487a-819f-3aee420e64ef",
        tenantId: "public-demo-tenant",
      },
    ],
  },
  seo: createSeo("/events", "Veranstaltungen", "Alle öffentlichen Veranstaltungen an einem Ort."),
};

export const mockMapContent: MapContent = {
  page: {
    id: "Map",
    title: "Stadtkarte",
    description: "Die öffentliche Karte mit Themen und Standorten.",
    seo: createSeo("/map", "Stadtkarte", "Die öffentliche Karte mit Themen und Standorten."),
  },
  map: {
    embedUrl: buildplaceMapOverviewUrl,
  },
  seo: createSeo("/map", "Stadtkarte", "Die öffentliche Karte mit Themen und Standorten."),
};

export const mockFooterContent: FooterContent = {
  items: [
    {
      id: "25b2096c-9c31-494d-bd7f-88ef4c0e340b",
      name: "Impressum",
      content: "<p>Stadt Guben, Gasstraße 4, 03172 Guben</p>",
    },
    {
      id: "43b87c66-8cbb-426e-a45f-a53ba50cbca2",
      name: "Datenschutz",
      content: "<p>Datenschutzhinweise für das öffentliche Portal.</p>",
    },
    {
      id: "7c3f8e2d-1a5b-4c9e-b3f7-d9e8c7b6a5f4",
      name: "Kontakt",
      content: "<p>Kontaktieren Sie uns unter: info@guben.de oder +49 (0) 3561 6000</p>",
    },
  ],
};

export const mockDashboardContent = {
  dropdowns: sharedDropdowns,
  seo: createSeo("/", "Dashboard", "Thematische Übersicht der öffentlichen Inhalte."),
};

export const mockEventDetail = {
  event: mockEvents[0],
  seo: createSeo("/events/9c77a613-6085-41fc-baa7-68a5ec8b4a07", "Frühlingsmarkt", "Ein Wochenende mit regionalen Ausstellern und Bühnenprogramm."),
};
