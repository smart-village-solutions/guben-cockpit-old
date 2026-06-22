import { createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy } from "react";
import Markdown from "react-markdown";

import { PublicContentErrorState } from "@/components/public-content/PublicContentErrorState";
import { useGatewayHomeContent } from "@/public-content/hooks";
import { useRouteMetadata } from "@/public-content/useRouteMetadata";
import { Skeleton } from "@/components/ui/skeleton";

const DashboardDropdownTabs = lazy(() =>
  import("@/components/home/DashboardDropdownNav").then((module) => ({
    default: module.DashboardDropdownTabs,
  })),
);

export const Route = createFileRoute("/")({
  component: GatewayHomeRoute,
  validateSearch: (search) => ({
    selectedTabId: typeof search.selectedTabId === "string" ? search.selectedTabId : undefined,
  }),
});

export function GatewayHomeRoute() {
  const query = useGatewayHomeContent();
  useRouteMetadata(query.data?.seo);

  if (query.isPending) {
    return (
      <main className="w-full h-full flex flex-1 flex-col items-center">
        <article className="max-w-7xl mx-auto px-4 w-full pb-5 space-y-3">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-2/3" />
        </article>
        <section className="max-w-7xl mx-auto px-4 w-full">
          <Skeleton className="h-[36rem] w-full" />
        </section>
      </main>
    );
  }

  if (query.error || !query.data) {
    return <PublicContentErrorState error={query.error} onRetry={() => void query.refetch()} />;
  }

  return (
    <main className="w-full h-full flex flex-1 flex-col items-center">
      <article className="max-w-7xl mx-auto px-4 w-full pb-5">
        <div className="flex gap-3 flex-col">
          <h1 className="text-gubenAccent font-poppins text-h1 font-bold">
            {query.data.page.title}
          </h1>
          <Markdown>{query.data.page.description}</Markdown>
        </div>
      </article>
      <section className="max-w-7xl mx-auto px-4 w-full">
        <Suspense fallback={<Skeleton className="h-[36rem] w-full" />}>
          <DashboardDropdownTabs dropdowns={query.data.dashboard.dropdowns} />
        </Suspense>
      </section>
    </main>
  );
}
