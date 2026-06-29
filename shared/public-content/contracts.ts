import { z } from "zod";

export const seoMetadataSchema = z.object({
  title: z.string(),
  description: z.string(),
  canonical: z.string(),
  indexable: z.boolean(),
});

export const pageHeroSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  seo: seoMetadataSchema,
});

export const footerItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  content: z.string(),
});

export const buttonSchema = z.object({
  title: z.string(),
  url: z.string(),
  openInNewTab: z.boolean(),
});

export const informationCardSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  imageAlt: z.string().nullable(),
  button: buttonSchema.nullable(),
});

export const dashboardTabSchema = z.object({
  id: z.string(),
  title: z.string(),
  sequence: z.number().int(),
  mapUrl: z.string(),
  informationCards: z.array(informationCardSchema),
});

export const dropdownLinkSchema = z.object({
  id: z.string(),
  title: z.string(),
  link: z.string(),
  sequence: z.number().int(),
});

export const dashboardDropdownSchema = z.object({
  id: z.string(),
  title: z.string(),
  rank: z.number().int(),
  isLink: z.boolean(),
  tabs: z.array(dashboardTabSchema),
  links: z.array(dropdownLinkSchema),
});

export const projectSchema = z.object({
  id: z.string(),
  type: z.number().int(),
  title: z.string(),
  description: z.string(),
  fullText: z.string(),
  imageCaption: z.string().nullable(),
  imageUrl: z.string().nullable(),
  imageCredits: z.string().nullable(),
  published: z.boolean(),
});

export const pagedProjectsSchema = z.object({
  pageNumber: z.number().int(),
  pageSize: z.number().int(),
  totalCount: z.number().int(),
  pageCount: z.number().int(),
  results: z.array(projectSchema),
});

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const locationSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string().nullable(),
  street: z.string().nullable(),
  telephoneNumber: z.string().nullable(),
  fax: z.string().nullable(),
  email: z.string().nullable(),
  website: z.string().nullable(),
  zip: z.string().nullable(),
});

export const coordinatesSchema = z
  .object({
    latitude: z.number(),
    longitude: z.number(),
  })
  .nullable();

export const urlSchema = z.object({
  link: z.string(),
  description: z.string(),
});

export const eventImageSchema = z.object({
  thumbnailUrl: z.string(),
  previewUrl: z.string(),
  originalUrl: z.string(),
});

export const eventSchema = z.object({
  id: z.string(),
  eventId: z.string(),
  terminId: z.string(),
  title: z.string(),
  description: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  location: locationSchema,
  coordinates: coordinatesSchema,
  urls: z.array(urlSchema),
  categories: z.array(categorySchema),
  images: z.array(eventImageSchema),
  published: z.boolean(),
});

export const pagedEventsSchema = z.object({
  pageNumber: z.number().int(),
  pageSize: z.number().int(),
  totalCount: z.number().int(),
  pageCount: z.number().int(),
  results: z.array(eventSchema),
  categories: z.array(categorySchema),
  bookingTenants: z.array(
    z.object({
      id: z.string(),
      tenantId: z.string(),
    }),
  ),
});

export const homeContentSchema = z.object({
  page: pageHeroSchema,
  dashboard: z.object({
    dropdowns: z.array(dashboardDropdownSchema),
  }),
  seo: seoMetadataSchema,
});

export const dashboardContentSchema = z.object({
  dropdowns: z.array(dashboardDropdownSchema),
  seo: seoMetadataSchema,
});

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

export const projectsContentSchema = z.object({
  page: pageHeroSchema,
  featuredProjects: z.array(projectSchema),
  schools: z.array(projectSchema),
  businesses: pagedProjectsSchema,
  seo: seoMetadataSchema,
});

export const eventsContentSchema = z.object({
  page: pageHeroSchema,
  events: pagedEventsSchema,
  seo: seoMetadataSchema,
});

export const eventDetailContentSchema = z.object({
  event: eventSchema,
  seo: seoMetadataSchema,
});

export const mapContentSchema = z.object({
  page: pageHeroSchema,
  map: z.object({
    embedUrl: z.string(),
  }),
  seo: seoMetadataSchema,
});

export const footerContentSchema = z.object({
  items: z.array(footerItemSchema),
});

export const bookingTenantsContentSchema = z.object({
  tenants: z.array(
    z.object({
      id: z.string(),
      tenantId: z.string(),
    }),
  ),
});

export const gatewayErrorSchema = z.object({
  error: z.object({
    code: z.enum([
      "UPSTREAM_TIMEOUT",
      "UPSTREAM_UNAVAILABLE",
      "INVALID_UPSTREAM_PAYLOAD",
      "NOT_FOUND",
      "INTERNAL_ERROR",
    ]),
    message: z.string(),
    upstream: z.enum(["postgrest", "smartvillage", "gateway"]),
    retryable: z.boolean(),
    requestId: z.string(),
  }),
});

export type DashboardDropdown = z.infer<typeof dashboardDropdownSchema>;
export type DashboardContent = z.infer<typeof dashboardContentSchema>;
export type Event = z.infer<typeof eventSchema>;
export type EventDetailContent = z.infer<typeof eventDetailContentSchema>;
export type EventsContent = z.infer<typeof eventsContentSchema>;
export type BookingTenantsContent = z.infer<typeof bookingTenantsContentSchema>;
export type Coordinates = z.infer<typeof coordinatesSchema>;
export type Category = z.infer<typeof categorySchema>;
export type EventImage = z.infer<typeof eventImageSchema>;
export type FooterContent = z.infer<typeof footerContentSchema>;
export type FooterItem = FooterContent["items"][number];
export type GatewayError = z.infer<typeof gatewayErrorSchema>;
export type HomeContent = z.infer<typeof homeContentSchema>;
export type InformationCard = z.infer<typeof informationCardSchema>;
export type MapContent = z.infer<typeof mapContentSchema>;
export type PageHero = z.infer<typeof pageHeroSchema>;
export type Project = z.infer<typeof projectSchema>;
export type ProjectsContent = z.infer<typeof projectsContentSchema>;
export type PublicContentBundle = z.infer<typeof publicContentBundleSchema>;
export type PublicContentHomeCard = z.infer<typeof publicContentHomeCardSchema>;
export type PublicContentProjectCategory = z.infer<typeof publicContentProjectCategorySchema>;
export type PublicContentProjectItem = z.infer<typeof publicContentProjectItemSchema>;
export type SeoMetadata = z.infer<typeof seoMetadataSchema>;
