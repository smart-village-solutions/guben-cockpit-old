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

export const eventContactSchema = z.object({
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
});

export const eventPriceSchema = z.object({
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  amount: z.number().nullable().optional(),
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
  registrationRequired: z.boolean().optional(),
  maximumAttendees: z.number().int().positive().optional(),
  organizerName: z.string().nullable().optional(),
  contact: eventContactSchema.nullable().optional(),
  priceInformations: z.array(eventPriceSchema).optional(),
  dataProviderName: z.string().nullable().optional(),
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

export const featuredProjectsContentSchema = z.object({
  page: pageHeroSchema,
  featuredProjects: z.array(projectSchema),
  seo: seoMetadataSchema,
});

export const featuredProjectDetailContentSchema = z.object({
  project: projectSchema,
  seo: seoMetadataSchema,
});

export const poiCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  parentId: z.string().nullable(),
  parentName: z.string().nullable(),
});

export const poiLocationOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});

export const poiMediaSchema = z.object({
  url: z.string(),
  description: z.string().nullable(),
  copyright: z.string().nullable(),
});

export const poiAddressSchema = z.object({
  street: z.string().nullable(),
  addition: z.string().nullable(),
  zip: z.string().nullable(),
  city: z.string().nullable(),
});

export const poiContactSchema = z.object({
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  fax: z.string().nullable(),
});

export const poiWebUrlSchema = z.object({
  url: z.string(),
  description: z.string().nullable(),
});

export const poiOpeningHourSchema = z.object({
  weekday: z.string().nullable(),
  timeFrom: z.string().nullable(),
  timeTo: z.string().nullable(),
  description: z.string().nullable(),
  open: z.boolean().nullable(),
  sortNumber: z.number().nullable(),
});

export const poiSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  imageUrl: z.string().nullable(),
  updatedAt: z.string().nullable(),
  categories: z.array(poiCategorySchema),
  locationValue: z.string().nullable(),
  locationLabel: z.string().nullable(),
  coordinates: coordinatesSchema,
  media: z.array(poiMediaSchema),
  address: poiAddressSchema.nullable(),
  contact: poiContactSchema.nullable(),
  webUrls: z.array(poiWebUrlSchema),
  openingHours: z.array(poiOpeningHourSchema),
  operatingCompany: z.string().nullable(),
  dataProvider: z.string().nullable(),
});

export const poiSortFieldSchema = z.enum(["name", "updatedAt"]);
export const poiSortDirectionSchema = z.enum(["asc", "desc"]);

export const poiFiltersSchema = z.object({
  search: z.string().optional(),
  categoryIds: z.array(z.string()).default([]),
  location: z.string().optional(),
  radius: z.number().positive().optional(),
  sort: poiSortFieldSchema.default("name"),
  direction: poiSortDirectionSchema.default("asc"),
  pageNumber: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(12),
});

export const poisContentSchema = z.object({
  pageNumber: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalCount: z.number().int().nonnegative(),
  pageCount: z.number().int().positive(),
  results: z.array(poiSchema),
  categories: z.array(poiCategorySchema),
  locations: z.array(poiLocationOptionSchema),
});

export const poiDetailContentSchema = z.object({
  poi: poiSchema,
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

export const bookingFaqItemSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
  languageCode: z.string().regex(/^[a-z]{2}$/),
  sortWeight: z.number(),
});

export const bookingFaqsContentSchema = z.object({
  items: z.array(bookingFaqItemSchema),
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
export type BookingFaqItem = z.infer<typeof bookingFaqItemSchema>;
export type BookingFaqsContent = z.infer<typeof bookingFaqsContentSchema>;
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
export type FeaturedProjectsContent = z.infer<typeof featuredProjectsContentSchema>;
export type FeaturedProjectDetailContent = z.infer<typeof featuredProjectDetailContentSchema>;
export type Poi = z.infer<typeof poiSchema>;
export type PoiCategory = z.infer<typeof poiCategorySchema>;
export type PoiFilters = z.infer<typeof poiFiltersSchema>;
export type PoisContent = z.infer<typeof poisContentSchema>;
export type PoiDetailContent = z.infer<typeof poiDetailContentSchema>;
export type PublicContentBundle = z.infer<typeof publicContentBundleSchema>;
export type PublicContentHomeCard = z.infer<typeof publicContentHomeCardSchema>;
export type PublicContentProjectCategory = z.infer<typeof publicContentProjectCategorySchema>;
export type PublicContentProjectItem = z.infer<typeof publicContentProjectItemSchema>;
export type SeoMetadata = z.infer<typeof seoMetadataSchema>;
