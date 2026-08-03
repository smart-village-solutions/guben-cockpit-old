import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import {
  bookingFaqsContentSchema,
  bookingTenantsContentSchema,
  eventDetailContentSchema,
  eventsContentSchema,
  footerContentSchema,
  homeContentSchema,
  mapContentSchema,
  projectsContentSchema,
  type Project,
  type ProjectsContent,
} from "@shared/public-content/contracts";
import { fetchGatewayJson } from "./client";
import { isGatewayPublicContentEnabled } from "./source";

type ProjectCategory = "featured" | "schools" | "marketplace";
type ProjectFetcher = (
  path: string,
  schema: typeof projectsContentSchema,
  searchParams?: Record<string, string | number | undefined>,
) => Promise<ProjectsContent>;

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

export type GatewayProjectDetailResult = {
  results: [Project & { _category: ProjectCategory }];
  _category: ProjectCategory;
  seo: ProjectsContent["seo"];
};

const withCategory = (projects: Project[], category: ProjectCategory) =>
  projects.map((project) => ({
    ...project,
    _category: category,
  }));

export const loadGatewayProjectDetailContent = async (
  language: string,
  id: string,
  fetcher: ProjectFetcher = fetchGatewayJson,
): Promise<GatewayProjectDetailResult> => {
  const firstData = withLocalSchoolImages(
    await fetcher("/api/content/projects", projectsContentSchema, {
      lang: language,
      pageNumber: 1,
      pageSize: 100,
    }),
  );

  const firstPageProjects = [
    ...withCategory(firstData.featuredProjects, "featured"),
    ...withCategory(firstData.schools, "schools"),
    ...withCategory(firstData.businesses.results, "marketplace"),
  ];

  const firstPageMatch = firstPageProjects.find((entry) => entry.id === id);

  if (firstPageMatch) {
    return {
      results: [firstPageMatch],
      _category: firstPageMatch._category,
      seo: firstData.seo,
    };
  }

  let pageNumber = 2;
  let pageCount = firstData.businesses.pageCount;

  while (pageNumber <= pageCount) {
    const data = await fetcher("/api/content/projects", projectsContentSchema, {
      lang: language,
      pageNumber,
      pageSize: 100,
    });

    const project = withCategory(withLocalSchoolImages(data).businesses.results, "marketplace").find(
      (entry) => entry.id === id,
    );

    if (project) {
      return {
        results: [project],
        _category: project._category,
        seo: firstData.seo,
      };
    }

    pageCount = data.businesses.pageCount;
    pageNumber += 1;
  }

  throw new Error(`Project with ID ${id} not found`);
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
