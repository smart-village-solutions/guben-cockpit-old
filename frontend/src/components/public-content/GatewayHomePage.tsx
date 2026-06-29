import Markdown from "react-markdown";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardDropdownTabs } from "@/components/home/DashboardDropdownNav";
import { PublicContentErrorState } from "./PublicContentErrorState";
import { PublicContentDisabledState } from "./PublicContentDisabledState";
import { useGatewayHomeContent } from "@/public-content/hooks";
import { isGatewayPublicContentEnabled } from "@/public-content/source";
import { useRouteMetadata } from "@/public-content/useRouteMetadata";

export const GatewayHomePage = () => {
  const query = useGatewayHomeContent();
  useRouteMetadata(query.data?.seo);

  if (!isGatewayPublicContentEnabled) {
    return <PublicContentDisabledState />;
  }

  // Show error only if query failed, not just loading
  if (query.error && !query.data) {
    return <PublicContentErrorState error={query.error} onRetry={() => void query.refetch()} />;
  }

  // Progressive loading: show content immediately if available, skeleton only while loading
  const data = query.data;

  return (
    <main className="w-full h-full flex flex-1 pl-20 pt-5 pr-20 pb-4 flex-col items-center">
      <article className="max-w-[1600px] w-full pb-5 space-y-3">
        {data ? (
          <>
            <h1 className="text-gubenAccent font-poppins text-h1 font-bold">
              {data.page.title}
            </h1>
            <Markdown>{data.page.description}</Markdown>
          </>
        ) : (
          <>
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-2/3" />
          </>
        )}
      </article>
      <section className="max-w-[1600px] w-full">
        {data ? (
          <DashboardDropdownTabs dropdowns={data.dashboard.dropdowns} />
        ) : (
          <Skeleton className="h-96 w-full" />
        )}
      </section>
    </main>
  );
};
