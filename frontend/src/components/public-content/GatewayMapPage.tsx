import Markdown from "react-markdown";

import { Skeleton } from "@/components/ui/skeleton";
import { useGatewayMapContent } from "@/public-content/hooks";
import { isGatewayPublicContentEnabled } from "@/public-content/source";
import { useRouteMetadata } from "@/public-content/useRouteMetadata";
import { PublicContentErrorState } from "./PublicContentErrorState";
import { PublicContentDisabledState } from "./PublicContentDisabledState";

export const GatewayMapPage = () => {
  const query = useGatewayMapContent();
  useRouteMetadata(query.data?.seo);

  if (!isGatewayPublicContentEnabled) {
    return <PublicContentDisabledState />;
  }

  if (query.isPending) {
    return (
      <main className="w-full h-full flex flex-1 pl-20 pt-5 pr-20 pb-4 flex-col items-center">
        <article className="max-w-[1600px] w-full pb-5 space-y-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-full" />
        </article>
      </main>
    );
  }

  if (query.error || !query.data) {
    return <PublicContentErrorState error={query.error} onRetry={() => void query.refetch()} />;
  }

  return (
    <main className="w-full h-full flex flex-1 pl-20 pt-5 pr-20 pb-4 flex-col items-center">
      <article className="max-w-[1600px] w-full pb-5">
        <div className="flex gap-3 flex-col">
          <h1 className="text-gubenAccent font-poppins text-h1 font-bold">
            {query.data.page.title}
          </h1>
          <Markdown>{query.data.page.description}</Markdown>
        </div>
      </article>
      <section className="max-w-[1600px] w-full h-[calc(100dvh-14rem)]">
        <iframe
          className="overflow-hidden border-none h-full w-full"
          src={query.data.map.embedUrl}
        />
      </section>
    </main>
  );
};
