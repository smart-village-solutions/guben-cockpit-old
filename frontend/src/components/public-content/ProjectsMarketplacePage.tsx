import { useEffect, useState } from "react";
import ProjectCard from "@/components/projects/projectCard";
import { PaginationContainer } from "@/components/DataDisplay/PaginationContainer";
import { Skeleton } from "@/components/ui/skeleton";
import { usePagination } from "@/hooks/usePagination";
import { useGatewayProjectsContent } from "@/public-content/hooks";
import { isGatewayPublicContentEnabled } from "@/public-content/source";
import { useRouteMetadata } from "@/public-content/useRouteMetadata";
import { PublicContentErrorState } from "./PublicContentErrorState";
import { PublicContentDisabledState } from "./PublicContentDisabledState";
import type { ProjectsContent } from "@shared/public-content/contracts";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export const ProjectsMarketplacePage = () => {
  const pagination = usePagination();
  const query = useGatewayProjectsContent(pagination.page, pagination.pageSize);
  useRouteMetadata(query.data?.seo);

  if (!isGatewayPublicContentEnabled) {
    return <PublicContentDisabledState />;
  }

  useEffect(() => {
    if (query.data) {
      pagination.setTotal(query.data.businesses.totalCount);
      pagination.setPageCount(query.data.businesses.pageCount);
    }
  }, [query.data]);

  if (query.isPending) {
    return (
      <main className="w-full h-full flex flex-col items-center">
        <div className="max-w-7xl mx-auto px-4 w-full space-y-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </main>
    );
  }

  if (query.error || !query.data) {
    return <PublicContentErrorState error={query.error} onRetry={() => void query.refetch()} />;
  }

  return (
    <main className="w-full h-full flex flex-1 flex-col items-center">
      <Breadcrumb items={[
        { label: 'Startseite', href: '/' },
        { label: 'Projekte', href: '/projects' },
        { label: 'Marktplatz', href: '/projects/marketplace' }
      ]} />
      <article className="max-w-7xl mx-auto px-4 w-full pb-5">
        <div className="flex gap-3 flex-col">
          <h1 className="text-gubenAccent font-poppins text-h1 font-bold">
            Marktplatz
          </h1>
          <p className="text-base text-gray-700">
            Übersicht der Marktplatzangebote in Guben
          </p>
        </div>
      </article>
      <section className="max-w-7xl mx-auto px-4 w-full">
        <PaginationContainer
          nextPage={pagination.nextPage}
          previousPage={pagination.previousPage}
          setPageIndex={pagination.setPageIndex}
          setPageSize={pagination.setPageSize}
          total={pagination.total}
          pageCount={pagination.pageCount}
          pageSize={pagination.pageSize}
          page={pagination.page}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-4 auto-rows-fr">
            {query.data?.businesses?.results && query.data.businesses.results.length > 0 ? (
              query.data.businesses.results.map((project: ProjectsContent["businesses"]["results"][number]) => (
                <ProjectCard key={project.id} project={project} />
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500">Keine Marktplatz-Angebote verfügbar</p>
            )}
          </div>
        </PaginationContainer>
      </section>
    </main>
  );
};
