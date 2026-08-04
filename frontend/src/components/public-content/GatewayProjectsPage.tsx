import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { PaginationContainer } from "@/components/DataDisplay/PaginationContainer";
import SortFilter, { SortOrder } from "@/components/events/sortFilter";
import { DistanceFilter } from "@/components/filters/DistanceFilter";
import MultiComboBox from "@/components/inputs/MultiComboBox";
import { FeaturedCarousel } from "@/components/projects/FeaturedCarousel";
import { PoiCard } from "@/components/projects/PoiCard";
import { Combobox } from "@/components/ui/comboBox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback";
import { useGatewayFeaturedProjectsContent, useGatewayPoisContent } from "@/public-content/hooks";
import { isGatewayPublicContentEnabled } from "@/public-content/source";
import { useRouteMetadata } from "@/public-content/useRouteMetadata";
import type { ProjectsSearch } from "@/routes/projects/index";
import { stripHtml } from "@/utilities/html";

import { PublicContentDisabledState } from "./PublicContentDisabledState";
import { PublicContentErrorState } from "./PublicContentErrorState";

const defaultSearch: ProjectsSearch = { categoryIds: [], sort: "name", direction: "asc", page: 1, pageSize: 12 };

export const GatewayProjectsPage = ({
  search = defaultSearch,
  onSearchChange = () => undefined,
}: {
  search?: ProjectsSearch;
  onSearchChange?: (search: ProjectsSearch) => void;
}) => {
  const { t } = useTranslation("projects");
  const [searchInput, setSearchInput] = useState(search.search ?? "");

  const featuredQuery = useGatewayFeaturedProjectsContent();
  const poiQuery = useGatewayPoisContent({
    search: search.search,
    categoryIds: search.categoryIds,
    location: search.location,
    radius: search.radius,
    sort: search.sort,
    direction: search.direction,
    pageNumber: search.page,
    pageSize: search.pageSize,
  });
  useRouteMetadata(featuredQuery.data?.seo);

  useEffect(() => setSearchInput(search.search ?? ""), [search.search]);
  useEffect(() => {
    if (poiQuery.data && poiQuery.data.pageNumber !== search.page) {
      onSearchChange({ ...search, page: poiQuery.data.pageNumber });
    }
  }, [onSearchChange, poiQuery.data, search]);

  const updateSearch = (next: Partial<typeof search>, resetPage = true) => {
    onSearchChange({ ...search, ...next, ...(resetPage ? { page: 1 } : {}) });
  };
  const updateDebouncedSearch = useDebouncedCallback((value: string) => {
    updateSearch({ search: value.trim() || undefined });
  }, 300);

  if (!isGatewayPublicContentEnabled) return <PublicContentDisabledState />;

  const featuredProjects = featuredQuery.data?.featuredProjects ?? [];
  const poiContent = poiQuery.data;
  const duplicateCategoryNames = new Map<string, number>();
  for (const category of poiContent?.categories ?? []) {
    duplicateCategoryNames.set(category.name, (duplicateCategoryNames.get(category.name) ?? 0) + 1);
  }

  return (
    <main className="w-full h-full flex flex-1 flex-col items-center gap-8 pb-8">
      {featuredQuery.isPending ? (
        <div className="max-w-7xl mx-auto px-4 w-full"><Skeleton className="h-80 w-full rounded-lg" /></div>
      ) : featuredQuery.error && !featuredQuery.data ? (
        <div className="max-w-7xl mx-auto px-4 w-full">
          <PublicContentErrorState error={featuredQuery.error} onRetry={() => void featuredQuery.refetch()} />
        </div>
      ) : featuredProjects.length > 0 ? (
        <FeaturedCarousel
          slides={featuredProjects.map((project) => ({
            id: project.id,
            image: project.imageUrl ?? "",
            icon: "/images/guben-logo.jpg",
            iconColor: "66a120",
            title: project.title,
            description: stripHtml(project.description),
            link: `/projects/${project.id}`,
          }))}
        />
      ) : null}

      <section aria-label={t("PoiFilters")} className="max-w-7xl mx-auto px-4 w-full">
        <div className="rounded-lg bg-gubenAccent p-4 text-gubenAccent-foreground shadow-md">
          <div className="flex items-end gap-2">
            <div className="flex-1 grid grid-cols-5 gap-2">
            <div className="flex flex-col gap-2 col-span-2">
              <Label htmlFor="poi-search" className="text-gubenAccent-foreground">{t("PoiSearch")}</Label>
              <Input
                id="poi-search"
                value={searchInput}
                placeholder={t("PoiSearchPlaceholder")}
                className="bg-white text-foreground"
                onChange={(event) => {
                  setSearchInput(event.target.value);
                  updateDebouncedSearch(event.target.value);
                }}
              />
            </div>
            <DistanceFilter
              value={search.radius?.toString()}
              onChange={(radius) => updateSearch({ radius: radius && radius !== "0" ? Number(radius) : undefined })}
            />
            <div className="flex flex-col gap-2">
              <Label className="text-gubenAccent-foreground">{t("PoiCategories")}</Label>
              <MultiComboBox
                options={(poiContent?.categories ?? []).map((category) => ({
                  label: category.parentName
                    ? `${category.parentName} / ${category.name}`
                    : duplicateCategoryNames.get(category.name)! > 1
                      ? `${category.name} (${category.id})`
                      : category.name,
                  value: category.id,
                }))}
                defaultValues={search.categoryIds}
                placeholder={t("PoiCategories")}
                onSelect={(categoryIds) => updateSearch({ categoryIds })}
                isLoading={poiQuery.isPending}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-gubenAccent-foreground">{t("PoiLocation")}</Label>
              <Combobox
                options={(poiContent?.locations ?? []).map((location) => ({ label: location.label, value: location.value }))}
                value={search.location ?? null}
                placeholder={t("PoiAllLocations")}
                onSelect={(location) => updateSearch({ location: location ?? undefined })}
                isLoading={poiQuery.isPending}
              />
            </div>
            </div>
            <SortFilter
              option={search.sort}
              order={search.direction === "desc" ? SortOrder.DESC : SortOrder.ASC}
              options={[
                { value: "name", label: t("PoiSortName") },
                { value: "updatedAt", label: t("PoiSortUpdated") },
              ]}
              includeNone={false}
              ariaLabel={t("PoiSorting")}
              triggerClassName="border-white bg-transparent text-white hover:bg-white/10 hover:text-white"
              onChange={(option, order) => updateSearch({
                sort: option === "updatedAt" ? "updatedAt" : "name",
                direction: order === SortOrder.DESC ? "desc" : "asc",
              })}
            />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 w-full" aria-live="polite">
        {poiQuery.error && !poiContent ? (
          <PublicContentErrorState error={poiQuery.error} onRetry={() => void poiQuery.refetch()} />
        ) : (
          <PaginationContainer
            nextPage={() => updateSearch({ page: Math.min(search.page + 1, poiContent?.pageCount ?? 1) }, false)}
            previousPage={() => updateSearch({ page: Math.max(1, search.page - 1) }, false)}
            setPageIndex={(page) => updateSearch({ page }, false)}
            setPageSize={(pageSize) => updateSearch({ pageSize, page: 1 }, false)}
            total={poiContent?.totalCount ?? 0}
            pageCount={poiContent?.pageCount ?? 1}
            pageSize={search.pageSize}
            page={search.page}
          >
            {poiQuery.isPending && !poiContent ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">{Array.from({ length: search.pageSize }).map((_, index) => <Skeleton key={index} className="h-72 rounded-lg" />)}</div>
            ) : poiContent && poiContent.results.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 auto-rows-fr sm:grid-cols-3">
                {poiContent.results.map((poi) => <PoiCard key={poi.id} poi={poi} />)}
              </div>
            ) : (
              <p className="py-8 text-center text-gray-500">{t("PoiEmpty")}</p>
            )}
          </PaginationContainer>
        )}
      </section>
    </main>
  );
};
