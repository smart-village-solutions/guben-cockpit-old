import { createLazyFileRoute } from '@tanstack/react-router'

import { GatewayEventDetailPage } from '@/components/public-content/GatewayEventDetailPage'

export const Route = createLazyFileRoute('/events/$eventId')({
  component: RouteComponent,
})

export function EventDetailRoute({ eventId }: { eventId: string }) {
  return <GatewayEventDetailPage eventId={eventId} />
}

export function RouteComponent() {
  const { eventId } = Route.useParams()

  return <EventDetailRoute eventId={eventId} />
}
