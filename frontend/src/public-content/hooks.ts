import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import {
  bookingTenantsContentSchema,
  eventDetailContentSchema,
  eventsContentSchema,
  footerContentSchema,
  homeContentSchema,
  mapContentSchema,
  projectsContentSchema,
} from "@shared/public-content/contracts";
import { fetchGatewayJson } from "./client";
import { isGatewayPublicContentEnabled } from "./source";

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
      }),
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
