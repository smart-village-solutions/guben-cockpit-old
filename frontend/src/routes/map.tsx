import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Skeleton } from '@/components/ui/skeleton';
import { PublicContentErrorState } from '@/components/public-content/PublicContentErrorState';
import { useGatewayMapContent } from '@/public-content/hooks';
import { useRouteMetadata } from '@/public-content/useRouteMetadata';

export const Route = createFileRoute('/map')({
  component: MapComponent,
})

function MapComponent() {
  return <GatewayMapRoute />;
}

function GatewayMapRoute() {
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
