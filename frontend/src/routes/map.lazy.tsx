import { createLazyFileRoute } from '@tanstack/react-router'

import { PublicContentErrorState } from '@/components/public-content/PublicContentErrorState';
import { useGatewayMapContent } from '@/public-content/hooks';
import { useRouteMetadata } from '@/public-content/useRouteMetadata';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createLazyFileRoute('/map')({
  component: MapComponent,
})

function MapComponent() {
  const query = useGatewayMapContent();
  useRouteMetadata(query.data?.seo);

  if (query.isPending) {
    return <Skeleton className="h-[calc(100dvh-8.5rem)] w-full rounded-none" />;
  }

  if (query.error || !query.data) {
    return <PublicContentErrorState error={query.error} onRetry={() => void query.refetch()} />;
  }

  return (
    <div className="p-0 flex-grow relative h-[calc(100dvh-8.5rem)] w-full">
      <iframe
        className="overflow-hidden border-none"
        src={query.data.map.embedUrl}
        style={{ height: '100%', width: '100%' }}
      ></iframe>
    </div>
  );
}
