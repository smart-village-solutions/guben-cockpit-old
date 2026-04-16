import { createLazyFileRoute } from '@tanstack/react-router'

import { PublicContentErrorState } from '@/components/public-content/PublicContentErrorState';
import { useGatewayMapContent } from '@/public-content/hooks';
import { useRouteMetadata } from '@/public-content/useRouteMetadata';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createLazyFileRoute('/map')({
  component: MapComponent,
})

export function MapComponent() {
  const query = useGatewayMapContent();
  useRouteMetadata(query.data?.seo);

  if (query.isPending) {
    return <Skeleton className="h-[calc(100dvh-8.5rem)] w-full rounded-none" />;
  }

  if (query.error || !query.data) {
    return <PublicContentErrorState error={query.error} onRetry={() => void query.refetch()} />;
  }

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 p-0">
      <iframe
        className="h-full w-full overflow-hidden border-none"
        src={query.data.map.embedUrl}
      />
    </div>
  );
}
