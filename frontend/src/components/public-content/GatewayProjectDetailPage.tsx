import { useNavigate } from "@tanstack/react-router";
import { ReactNode } from "react";
import sanitizeHtml from "sanitize-html";

import { DetailPageLayout } from "@/components/ui/DetailPageLayout";
import { useGatewayProjectDetailContent } from "@/public-content/hooks";
import { isGatewayPublicContentEnabled } from "@/public-content/source";
import { useRouteMetadata } from "@/public-content/useRouteMetadata";
import { isNullOrUndefinedOrWhiteSpace } from "@/utilities/nullabilityUtils";
import type { Project } from "@shared/public-content/contracts";

import { PublicContentErrorState } from "./PublicContentErrorState";
import { PublicContentDisabledState } from "./PublicContentDisabledState";

export const GatewayProjectDetailPage = ({ projectId }: { projectId: string }) => {
  const navigate = useNavigate();
  const query = useGatewayProjectDetailContent(projectId);
  useRouteMetadata(query.data?.seo);

  if (!isGatewayPublicContentEnabled) {
    return <PublicContentDisabledState />;
  }

  // Show error only if query failed, not just loading
  if (query.error && !query.data) {
    return <PublicContentErrorState error={query.error} onRetry={() => void query.refetch()} />;
  }

  const project = query.data?.results?.[0] as Project | undefined;
  const category = (query.data as any)?._category as string | undefined;

  if (!query.isPending && !project) {
    return <PublicContentErrorState error={query.error} />;
  }

  // Build breadcrumb items based on project category
  const getBreadcrumbItems = () => {
    const baseBreadcrumbs = [
      { label: 'Startseite', href: '/' },
      { label: 'Projekte', href: '/projects' },
    ];

    if (category === 'schools') {
      return [
        ...baseBreadcrumbs,
        { label: 'Schulen', href: '/projects/schools' },
        { label: project!.title, href: `/projects/${projectId}` },
      ];
    } else if (category === 'marketplace') {
      return [
        ...baseBreadcrumbs,
        { label: 'Marktplatz', href: '/projects/marketplace' },
        { label: project!.title, href: `/projects/${projectId}` },
      ];
    } else {
      // For featured projects, just show basic path
      return [
        ...baseBreadcrumbs,
        { label: project!.title, href: `/projects/${projectId}` },
      ];
    }
  };

  return (
    <DetailPageLayout
      heroImage={project?.imageUrl ?? undefined}
      heroAlt={project?.title ?? undefined}
      title={project?.title || "Projekt"}
      breadcrumbItems={project ? getBreadcrumbItems() : undefined}
      metadata={
        project ? (
          <div className="space-y-3">
            {!isNullOrUndefinedOrWhiteSpace(project.description) && (
              <div>
                <p className="text-xs text-neutral-500 font-semibold mb-1">ÜBERSICHT</p>
                {/* Check if description contains HTML */}
                {project.description.includes('<') && project.description.includes('>') ? (
                  <div
                    className="prose prose-sm max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(project.description),
                    }}
                  />
                ) : (
                  <p className="text-sm text-gray-700 leading-relaxed">{project.description}</p>
                )}
              </div>
            )}
          </div>
        ) : undefined
      }
      onBack={() => navigate({ to: "/projects" })}
      backLabel="Zurück zu Projekten"
    >
      <div className="space-y-8">
        {/* Full Text Content */}
        {!isNullOrUndefinedOrWhiteSpace(project?.fullText) && (
          <div>
            <h2 className="font-bold text-xl mb-4">Projektdetails</h2>
            <div
              className="prose max-w-none text-neutral-700 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(project!.fullText!),
              }}
            />
          </div>
        )}
      </div>
    </DetailPageLayout>
  );
};
