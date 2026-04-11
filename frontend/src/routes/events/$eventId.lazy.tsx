import { createLazyFileRoute } from '@tanstack/react-router'

import { GatewayEventDetailPage } from '@/components/public-content/GatewayEventDetailPage'

export const Route = createLazyFileRoute('/events/$eventId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { eventId } = Route.useParams()

  return <GatewayEventDetailPage eventId={eventId} />
}
