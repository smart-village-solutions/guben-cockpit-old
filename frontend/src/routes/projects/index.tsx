import { createFileRoute } from "@tanstack/react-router";

export type ProjectsSearch = {
  search?: string;
  categoryIds: string[];
  location?: string;
  radius?: number;
  sort: "name" | "updatedAt";
  direction: "asc" | "desc";
  page: number;
  pageSize: number;
};

const positiveInt = (value: unknown, fallback: number, max = Number.MAX_SAFE_INTEGER) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 && number <= max ? number : fallback;
};

const optionalText = (value: unknown) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const optionalLocation = (value: unknown) =>
  optionalText(value)?.normalize("NFKC").replace(/\s+/g, " ").toLocaleLowerCase("de");

export const validateProjectsSearch = (search: Record<string, unknown>): ProjectsSearch => {
  const rawCategories = Array.isArray(search.categoryIds)
    ? search.categoryIds
    : typeof search.categoryIds === "string"
      ? search.categoryIds.split(",")
      : [];
  const categoryIds = Array.from(new Set(rawCategories.map(String).map((value) => value.trim()).filter(Boolean)));
  const radiusNumber = Number(search.radius);
  const radius = [1, 5, 10, 20, 30, 40].includes(radiusNumber) ? radiusNumber : undefined;

  return {
    search: optionalText(search.search),
    categoryIds,
    location: optionalLocation(search.location),
    radius,
    sort: search.sort === "updatedAt" ? "updatedAt" : "name",
    direction: search.direction === "desc" ? "desc" : "asc",
    page: positiveInt(search.page, 1),
    pageSize: positiveInt(search.pageSize, 12, 100),
  };
};

export const Route = createFileRoute("/projects/")({
  validateSearch: validateProjectsSearch,
});
