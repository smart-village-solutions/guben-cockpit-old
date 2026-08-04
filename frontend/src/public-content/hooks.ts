import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import {
  bookingFaqsContentSchema,
  bookingTenantsContentSchema,
  eventDetailContentSchema,
  eventsContentSchema,
  featuredProjectsContentSchema,
  footerContentSchema,
  homeContentSchema,
  mapContentSchema,
  projectsContentSchema,
  poiDetailContentSchema,
  poisContentSchema,
  type FeaturedProjectsContent,
  type Poi,
  type PoiDetailContent,
  type PoiFilters,
  type Project,
  type ProjectsContent,
} from "@shared/public-content/contracts";
import { fetchGatewayJson } from "./client";
import { isGatewayPublicContentEnabled } from "./source";

const localSchoolImageByTitle: Array<[match: (title: string) => boolean, imageUrl: string]> = [
  [
    (title) => title.startsWith("Corona-Schröter Grundschule"),
    "/images/Corona-Schroeter Grundschule Eingang.JPG",
  ],
  [
    (title) => title.startsWith("Europaschule"),
    "/images/Europaschule.JPG",
  ],
  [
    (title) => title.startsWith("Friedensschule"),
    "/images/Friedensschule vorne.JPG",
  ],
];

const withLocalSchoolImage = (project: Project): Project => {
  if (project.type !== 2) {
    return project;
  }

  const override = localSchoolImageByTitle.find(([matches]) => matches(project.title));
  if (!override) {
    return project;
  }

  return {
    ...project,
    imageUrl: override[1],
  };
};

const withLocalSchoolImages = (content: ProjectsContent): ProjectsContent => ({
  ...content,
  schools: content.schools.map(withLocalSchoolImage),
});

export type GatewayProjectDetailResult =
  | { kind: "featured"; project: Project; seo: FeaturedProjectsContent["seo"] }
  | { kind: "poi"; poi: Poi; seo: PoiDetailContent["seo"] };

export const loadGatewayProjectDetailContent = async (
  language: string,
  id: string,
  fetcher: (path: string, schema: any, searchParams?: Record<string, string | number | undefined>) => Promise<any> = fetchGatewayJson,
): Promise<GatewayProjectDetailResult> => {
  if (id.startsWith("poi:")) {
    const detail = await fetcher(
      `/api/content/pois/${encodeURIComponent(id)}`,
      poiDetailContentSchema,
      { lang: language },
    ) as PoiDetailContent;
    return { kind: "poi", poi: detail.poi, seo: detail.seo };
  }

  const data = await fetcher("/api/content/featured-projects", featuredProjectsContentSchema, {
    lang: language,
  }) as FeaturedProjectsContent;
  const project = data.featuredProjects.find((entry) => entry.id === id);
  if (!project) throw new Error(`Project with ID ${id} not found`);
  return { kind: "featured", project, seo: data.seo };
};

const useContentLanguage = () => {
  const { i18n } = useTranslation();
  return i18n.language.slice(0, 2).toLowerCase();
};

export const useGatewayHomeContent = () => {
  const language = useContentLanguage();
  return useQuery({
    queryKey: ["gateway-content", "home", language],
    enabled: isGatewayPublicContentEnabled,
    queryFn: () =>
      fetchGatewayJson("/api/content/home", homeContentSchema, {
        lang: language,
      }),
  });
};

export const useGatewayProjectsContent = (pageNumber: number, pageSize: number) => {
  const language = useContentLanguage();
  return useQuery({
    queryKey: ["gateway-content", "projects", language, pageNumber, pageSize],
    enabled: isGatewayPublicContentEnabled,
    queryFn: () =>
      fetchGatewayJson("/api/content/projects", projectsContentSchema, {
        lang: language,
        pageNumber,
        pageSize,
      }).then(withLocalSchoolImages),
  });
};

export const useGatewayFeaturedProjectsContent = () => {
  const language = useContentLanguage();
  return useQuery({
    queryKey: ["gateway-content", "featured-projects", language],
    enabled: isGatewayPublicContentEnabled,
    queryFn: () => fetchGatewayJson("/api/content/featured-projects", featuredProjectsContentSchema, { lang: language }),
  });
};

export const useGatewayPoisContent = (filters: PoiFilters) => {
  const language = useContentLanguage();
  return useQuery({
    queryKey: ["gateway-content", "pois", language, filters],
    enabled: isGatewayPublicContentEnabled,
    retry: false,
    queryFn: () => fetchGatewayJson("/api/content/pois", poisContentSchema, {
      lang: language,
      search: filters.search,
      categoryIds: filters.categoryIds.length > 0 ? filters.categoryIds.join(",") : undefined,
      location: filters.location,
      radius: filters.radius,
      sort: filters.sort,
      direction: filters.direction,
      pageNumber: filters.pageNumber,
      pageSize: filters.pageSize,
    }),
  });
};

export const useGatewayProjectDetailContent = (id: string) => {
  const language = useContentLanguage();
  return useQuery({
    queryKey: ["gateway-content", "projects", "detail", language, id],
    enabled: isGatewayPublicContentEnabled && id.length > 0,
    queryFn: () => loadGatewayProjectDetailContent(language, id),
  });
};

export const useGatewayEventsContent = (
  searchParams: Record<string, string | number | undefined>,
) => {
  const language = useContentLanguage();
  return useQuery({
    queryKey: ["gateway-content", "events", language, searchParams],
    enabled: isGatewayPublicContentEnabled,
    queryFn: () =>
      fetchGatewayJson("/api/content/events", eventsContentSchema, {
        lang: language,
        ...searchParams,
      }),
    retry: false,
  });
};

export const useGatewayEventDetailContent = (id: string) => {
  const language = useContentLanguage();
  return useQuery({
    queryKey: ["gateway-content", "events", "detail", language, id],
    enabled: isGatewayPublicContentEnabled && id.length > 0,
    queryFn: () =>
      fetchGatewayJson(`/api/content/events/${id}`, eventDetailContentSchema, {
        lang: language,
      }),
  });
};

export const useGatewayMapContent = () => {
  const language = useContentLanguage();
  return useQuery({
    queryKey: ["gateway-content", "map", language],
    enabled: isGatewayPublicContentEnabled,
    queryFn: () =>
      fetchGatewayJson("/api/content/map", mapContentSchema, {
        lang: language,
      }),
  });
};

export const useGatewayFooterContent = () =>
  useQuery({
    queryKey: ["gateway-content", "footer"],
    enabled: isGatewayPublicContentEnabled,
    queryFn: () => fetchGatewayJson("/api/content/footer", footerContentSchema),
  });

export const useGatewayBookingTenants = () =>
  useQuery({
    queryKey: ["gateway-content", "booking-tenants"],
    enabled: isGatewayPublicContentEnabled,
    queryFn: () =>
      fetchGatewayJson("/api/content/booking-tenants", bookingTenantsContentSchema),
  });

export const useGatewayBookingFaqs = () => {
  const language = useContentLanguage();
  return useQuery({
    queryKey: ["gateway-content", "booking-faqs", language],
    enabled: isGatewayPublicContentEnabled,
    queryFn: () =>
      fetchGatewayJson("/api/content/booking/faqs", bookingFaqsContentSchema, { lang: language }),
    retry: false,
  });
};
