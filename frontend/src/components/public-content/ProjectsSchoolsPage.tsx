import { useEffect } from "react";
import ProjectCard from "@/components/projects/projectCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useGatewayProjectsContent } from "@/public-content/hooks";
import { isGatewayPublicContentEnabled } from "@/public-content/source";
import { useRouteMetadata } from "@/public-content/useRouteMetadata";
import { PublicContentErrorState } from "./PublicContentErrorState";
import { PublicContentDisabledState } from "./PublicContentDisabledState";
import type { ProjectsContent } from "@shared/public-content/contracts";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export const ProjectsSchoolsPage = () => {
  const query = useGatewayProjectsContent(1, 1);
  useRouteMetadata(query.data?.seo);

  if (!isGatewayPublicContentEnabled) {
    return <PublicContentDisabledState />;
  }

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
        { label: 'Schulen', href: '/projects/schools' }
      ]} />
      <article className="max-w-7xl mx-auto px-4 w-full pb-5">
        <div className="flex gap-3 flex-col">
          <h1 className="text-gubenAccent font-poppins text-h1 font-bold">
            Schulen
          </h1>
          <p className="text-base text-gray-700">
            Übersicht der Schulen in Guben
          </p>
        </div>
      </article>
      <section className="max-w-7xl mx-auto px-4 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-4 auto-rows-fr">
          {query.data?.schools && query.data.schools.length > 0 ? (
            query.data.schools.map((project: ProjectsContent["schools"][number]) => (
              <ProjectCard key={project.id} project={project} school />
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500">Keine Schulen verfügbar</p>
          )}
        </div>
      </section>
    </main>
  );
};
