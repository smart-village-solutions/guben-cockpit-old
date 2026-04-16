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
    return <Skeleton className="min-h-[28rem] flex-1 w-full rounded-none" />;
  }

  if (query.error || !query.data) {
    return <PublicContentErrorState error={query.error} onRetry={() => void query.refetch()} />;
  }

  return (
    <div className="relative min-h-[28rem] flex-1 p-0">
      <iframe
        className="absolute inset-0 h-full w-full overflow-hidden border-none"
        title="Gateway map"
        src={query.data.map.embedUrl}
      />
    </div>
  );
}
