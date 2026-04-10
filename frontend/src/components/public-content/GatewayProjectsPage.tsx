import { useEffect } from "react";

import { FeaturedCarousel } from "@/components/projects/FeaturedCarousel";
import { CategoryTiles } from "@/components/projects/CategoryTiles";
import { Skeleton } from "@/components/ui/skeleton";
import { useGatewayProjectsContent } from "@/public-content/hooks";
import { isGatewayPublicContentEnabled } from "@/public-content/source";
import { useRouteMetadata } from "@/public-content/useRouteMetadata";
import { PublicContentErrorState } from "./PublicContentErrorState";
import { PublicContentDisabledState } from "./PublicContentDisabledState";
import type { ProjectsContent } from "@shared/public-content/contracts";

export const GatewayProjectsPage = () => {
  const query = useGatewayProjectsContent(1, 1);
  useRouteMetadata(query.data?.seo);

  if (!isGatewayPublicContentEnabled) {
    return <PublicContentDisabledState />;
  }

  // Show error only if query failed, not just loading
  if (query.error && !query.data) {
    return <PublicContentErrorState error={query.error} onRetry={() => void query.refetch()} />;
  }

  const featuredProjects = query.data?.featuredProjects ?? [];

  return (
    <main className="w-full h-full flex flex-1 flex-col items-center">
      {/* Progressive loading: show carousel if data available, skeleton otherwise */}
      {query.isPending ? (
        <div className="max-w-7xl mx-auto px-4 w-full space-y-6">
          <Skeleton className="h-80 w-full rounded-lg" />
          <Skeleton className="h-14 w-56" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      ) : (
        <>
          {featuredProjects.length > 0 && (
            <FeaturedCarousel
              slides={featuredProjects.map((project) => ({
                id: project.id,
                image: project.imageUrl ?? "",
                icon: "/images/guben-logo.jpg",
                iconColor: "66a120",
                title: project.title,
                description: project.description,
                link: `/projects/${project.id}`,
              }))}
            />
          )}
          <CategoryTiles />
        </>
      )}
    </main>
  );
};
