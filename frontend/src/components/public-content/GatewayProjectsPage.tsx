import { ExternalLinkIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { PaginationContainer } from "@/components/DataDisplay/PaginationContainer";
import ProjectCard from "@/components/projects/projectCard";
import ProjectDialog from "@/components/projects/projectDialog";
import PageHeaderLink from "@/components/projects/pageHeader.link";
import { Skeleton } from "@/components/ui/skeleton";
import { usePagination } from "@/hooks/usePagination";
import { useGatewayProjectsContent } from "@/public-content/hooks";
import { isGatewayPublicContentEnabled } from "@/public-content/source";
import { useRouteMetadata } from "@/public-content/useRouteMetadata";
import { PublicContentErrorState } from "./PublicContentErrorState";
import { PublicContentDisabledState } from "./PublicContentDisabledState";
import type { ProjectsContent } from "@shared/public-content/contracts";

export const GatewayProjectsPage = () => {
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

  const [selectedIndex, setSelectedIndex] = useState(0);
  const featuredProjects = query.data?.featuredProjects ?? [];
  const selectedProject = useMemo(
    () => featuredProjects.at(selectedIndex),
    [featuredProjects, selectedIndex],
  );

  const onNext = () =>
    setSelectedIndex((current) => Math.min(featuredProjects.length - 1, current + 1));
  const onPrevious = () => setSelectedIndex((current) => Math.max(0, current - 1));

  if (query.isPending) {
    return (
      <main className="p-6 flex flex-col items-center bg-white h-full">
        <div className="max-w-[120rem] w-full space-y-6">
          <Skeleton className="h-80 w-full rounded-lg" />
          <Skeleton className="h-14 w-56" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </main>
    );
  }

  if (query.error || !query.data) {
    return <PublicContentErrorState error={query.error} onRetry={() => void query.refetch()} />;
  }

  return (
    <main className="p-6 flex flex-col items-center bg-white h-full">
      <div className="max-w-[120rem] w-full">
        <div className="relative rounded-lg overflow-hidden">
          <img
            className="block absolute top-0 left-0 w-full h-full aspect-auto object-cover"
            src="/images/stadt-guben.jpg"
          />
          <div className="block absolute left-0 top-0 w-full h-full bg-[rgba(0,0,0,0.7)]" />

          <div className="w-full grid grid-cols-12 p-8 gap-12">
            <div className="col-span-12 lg:col-span-6 flex flex-col h-full gap-8 text-white z-10">
              <h1 className="text-2xl">{query.data.page.title}</h1>
              <p className="text-md whitespace-pre-wrap">{query.data.page.description}</p>
              <div className="flex flex-col gap-2">
                <PageHeaderLink
                  to="https://www.guben.de/de/service-center-de/item/408-ansprechpartner"
                  text="Ansprechpartnerin oder -partner finden!"
                  newWindow
                />
                <PageHeaderLink
                  to="https://www.guben.de/de/service-center-de/item/267-satzungen"
                  text="Rechtliche Grundlagen und Dokumente"
                  newWindow
                />
                <PageHeaderLink
                  to="https://www.guben.de/de/service-center-de"
                  text="Alle Informationen rund um die Bürgerservices"
                  newWindow
                />
              </div>
            </div>

            <div className="my-auto relative lg:col-span-6 rounded-lg overflow-hidden hidden lg:flex h-min">
              {selectedProject && (
                <ProjectDialog project={selectedProject} className="w-full">
                  <img
                    className="w-full max-h-[380px] min-h-300px object-cover"
                    src={selectedProject.imageUrl ?? ""}
                  />
                  <div className="bg-neutral-900 text-white p-4 text-left text-xl flex gap-4 w-full">
                    <p>{selectedProject.title}</p>
                    <ExternalLinkIcon />
                  </div>
                </ProjectDialog>
              )}

              <div className="absolute top-2 right-2 flex bg-[rgba(0,0,0,.5)] h-min rounded-full px-4 py-2 justify-between items-center gap-8">
                <button className="group" onClick={onPrevious} disabled={selectedIndex === 0}>
                  <ChevronLeft className="size-8 text-white group-hover:text-red-500 group-disabled:text-neutral-500" />
                </button>

                <button
                  className="group"
                  onClick={onNext}
                  disabled={selectedIndex >= featuredProjects.length - 1}
                >
                  <ChevronRight className="size-8 text-white group-hover:text-red-500 group-disabled:text-neutral-500" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-8 flex flex-col gap-4">
          <h1 className="text-4xl text-black">Schools</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4">
            {query.data.schools.map((project: ProjectsContent["schools"][number]) => (
              <ProjectCard key={project.id} project={project} school />
            ))}
          </div>
        </section>

        <section className="mt-8 flex flex-col gap-4">
          <h1 className="text-4xl text-black">Marktplatz</h1>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4">
              {query.data.businesses.results.map((project: ProjectsContent["businesses"]["results"][number]) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </PaginationContainer>
        </section>
      </div>
    </main>
  );
};
