import { createLazyFileRoute } from '@tanstack/react-router'

import { GatewayEventDetailPage } from '@/components/public-content/GatewayEventDetailPage'

export const Route = createLazyFileRoute('/events/$eventId')({
  component: GatewayEventDetailRoute,
})

function EventDetailRoute({ eventId }: { eventId: string }) {
  return <GatewayEventDetailPage eventId={eventId} />
}

function GatewayEventDetailRoute() {
  const { eventId } = Route.useParams()

  return <EventDetailRoute eventId={eventId} />
}
